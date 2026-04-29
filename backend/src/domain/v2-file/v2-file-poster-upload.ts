/**
 * V2 文件资源：前端截帧封面上传（写入 data_file.logo_url）
 * - 路由：POST /v2/file/:fileId/poster
 * - 约束：仅 JPEG/PNG；体积 <= 500KB
 */
import { randomUUID } from "node:crypto";
import { getFileById, updateFileRecord } from "../../infrastructure/repositories/v2-file-repository.ts";
import { getPublicObjectUrl, putObject } from "../../infrastructure/storage/s3-storage.ts";

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
): Promise<{ fileId: string; logoUrl: string }> {
  const id = fileId.trim();
  if (!id) throw new Error("NOT_FOUND");

  const record = await getFileById(id);
  if (!record) throw new Error("NOT_FOUND");

  const owner = record.ownerUserId ?? null;
  if (owner && owner !== (actorId ?? null)) throw new Error("FORBIDDEN");

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
  const logoUrl = getPublicObjectUrl(key);
  await updateFileRecord(id, { logoUrl });

  return { fileId: id, logoUrl };
}

