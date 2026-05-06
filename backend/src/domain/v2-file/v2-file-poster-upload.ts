/**
 * V2 文件资源：前端截帧封面上传（创建封面子行）
 * - 路由：POST /v2/file/:fileId/poster
 * - 约束：仅 JPEG/PNG；体积 <= 500KB
 * - 流程：校验 parent 是主文件 → createFileRecord({ ..., parentFileId, relationType: 'logo', contentSha256 }) → updateMainFileCover
 */
import { randomUUID, createHash } from "node:crypto";
import {
  getFileById,
  createFileRecord,
  findCoverChildByParentId,
  updateMainFileCover,
  validateParentIsMainFile,
} from "../../infrastructure/repositories/v2-file-repository.ts";
import { putObject, createPublicPresignedReadUrl } from "../../infrastructure/storage/s3-storage.ts";

const POSTER_MAX_BYTES = 500 * 1024;

function hasJpegMagic(buf: Buffer): boolean {
  return buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
}

function hasPngMagic(buf: Buffer): boolean {
  return (
    buf.length >= 8 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a
  );
}

export async function persistClientPosterFile(
  fileId: string,
  actorId: string | undefined,
  file: File,
): Promise<{ fileId: string; coverFileId: string; coverFileUrl: string }> {
  const id = fileId.trim();
  if (!id) throw new Error("NOT_FOUND");

  const record = await getFileById(id);
  if (!record) throw new Error("NOT_FOUND");

  const owner = record.ownerUserId ?? null;
  if (owner && owner !== (actorId ?? null)) throw new Error("FORBIDDEN");

  // 校验 parent 是主文件（不允许对封面子行再上传封面）
  try {
    await validateParentIsMainFile(id);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === "PARENT_NOT_FOUND") throw new Error("NOT_FOUND");
    if (msg === "LOGO_CAN_ONLY_ATTACH_TO_MAIN_FILE") throw new Error("LOGO_CAN_ONLY_ATTACH_TO_MAIN_FILE");
    throw e;
  }

  if (file.size > POSTER_MAX_BYTES) throw new Error("POSTER_TOO_LARGE");

  const buf = Buffer.from(await file.arrayBuffer());
  if (buf.length > POSTER_MAX_BYTES) throw new Error("POSTER_TOO_LARGE");

  const isJpeg = hasJpegMagic(buf);
  const isPng = hasPngMagic(buf);
  if (!isJpeg && !isPng) throw new Error("POSTER_BAD_MAGIC");

  const ext = isPng ? "png" : "jpg";
  const contentType = isPng ? "image/png" : "image/jpeg";
  const ownerSegment = (record.ownerUserId ?? actorId ?? "anon").trim() || "anon";
  const key = `v2/${ownerSegment}/poster/${id}-${randomUUID().slice(0, 8)}.${ext}`;

  await putObject(key, buf, contentType);
  const coverFileUrl = await createPublicPresignedReadUrl(key, { action: "view", expiresInSeconds: 3600 });

  // 计算封面 SHA，创建封面子行
  const contentSha256 = createHash("sha256").update(buf).digest("hex");
  let coverRecord;
  try {
    coverRecord = await createFileRecord({
      fileName: `${record.fileName}_封面`,
      fileUrl: key,
      fileTypeId: "FT_Image",
      ownerUserId: record.ownerUserId ?? undefined,
      fileSize: buf.length,
      fileExt: ext,
      contentSha256,
      parentFileId: id,
      relationType: "logo",
    });
  } catch (e) {
    // 唯一约束冲突：已有封面行 → 查出已有行替换
    if (typeof e === "object" && e !== null && "errno" in e && (e as { errno: number }).errno === 1062) {
      console.warn("[v2-file/poster] duplicate cover child, using existing", { fileId: id, error: e });
      const existing = await findCoverChildByParentId(id);
      if (existing) {
        coverRecord = existing;
      } else {
        throw new Error("POSTER_CREATE_FAILED");
      }
    } else {
      throw e;
    }
  }

  // 更新主文件冗余列；失败时 log 但不阻止流程。首次写入预期 null。
  await updateMainFileCover(id, coverRecord.fileId, coverFileUrl, null);

  return { fileId: id, coverFileId: coverRecord.fileId, coverFileUrl };
}
