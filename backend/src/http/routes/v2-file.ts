/**
 * V2 文件资源 HTTP 路由
 * 前缀：/v2/file/*
 */
import { createHash, randomUUID } from "node:crypto";
import { z } from "zod";
import {
  listFiles,
  getFileById,
  getFilesByIds,
  createFileRecord,
  updateFileRecord,
  softDeleteFile,
  findActiveFileByOwnerAndContentSha,
  resolveDataFileTypeIdByTeacherMaterialKind,
  teacherMaterialKindToDataFileTypeId,
} from "../../infrastructure/repositories/v2-file-repository.ts";
import {
  finalizeDataFileThumbnail,
  looksLikeImage,
  looksLikeVideo,
} from "../../domain/v2-file/data-file-thumbnail-finalize.ts";
import { dataFileHasRenderableLogoUrl } from "../../domain/v2-file/data-file-logo-url.ts";
import { runV2DataFileMetadataRepair } from "../../domain/v2-file/v2-file-data-repair.ts";
import { persistClientPosterFile } from "../../domain/v2-file/v2-file-poster-upload.ts";
import type { DataFileRecord } from "../../domain/v2-file/v2-file-types.ts";
import { putObject, deleteObject, createPresignedReadUrl, getPublicObjectUrl, getStorageKey, getObjectBuffer } from "../../infrastructure/storage/s3-storage.ts";

/** 从 `data_file.file_url` 判断是否为本环境 MinIO 直链，并反解出 S3 object key */
function tryStorageKeyFromFileUrl(fileUrl: string): string | null {
  const raw = fileUrl.trim();
  if (!raw) return null;
  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    try {
      const publicBase = getPublicObjectUrl("__probe_key__").replace(/__probe_key__$/, "");
      if (raw.startsWith(publicBase)) return raw.slice(publicBase.length);
    } catch {
      return null;
    }
    return null;
  }
  return raw.replace(/^\/+/, "") || null;
}

function isHttpUrl(s: string): boolean {
  const t = s.trim();
  return t.startsWith("http://") || t.startsWith("https://");
}

function materializeFileUrl(rawUrl: string): string {
  const raw = rawUrl.trim();
  if (!raw) return raw;
  if (isHttpUrl(raw)) return raw;
  return getPublicObjectUrl(raw);
}

function materializeRecordFileUrls<T extends { fileUrl?: string | null; logoUrl?: string | null }>(record: T): T {
  return {
    ...record,
    fileUrl: typeof record.fileUrl === "string" ? materializeFileUrl(record.fileUrl) : record.fileUrl,
    logoUrl: typeof record.logoUrl === "string" && record.logoUrl.trim() ? materializeFileUrl(record.logoUrl) : record.logoUrl,
  };
}

/** 上传/补封面：优先客户端 MIME，否则用字典名与扩展名推断，避免误判为 octet-stream 导致跳过视频抽帧。 */
function mimeTypeHintForThumbnail(record: DataFileRecord, clientMime?: string): string {
  const cm = (clientMime ?? "").trim();
  if (cm && cm !== "application/octet-stream") return cm;
  const ft = (record.fileTypeName ?? "").toLowerCase();
  if (ft.includes("视频") || ft.includes("video")) return "video/mp4";
  if (ft.includes("图") || ft.includes("image") || ft.includes("图片")) return "image/jpeg";
  const extCol = (record.fileExt ?? "").trim().toLowerCase();
  const videoExts = new Set(["mp4", "webm", "mov", "mkv", "avi", "m4v", "mpeg", "mpg"]);
  if (extCol && videoExts.has(extCol)) return "video/mp4";
  const imgExts = new Set(["jpg", "jpeg", "png", "webp", "gif", "bmp", "tif", "tiff"]);
  if (extCol && imgExts.has(extCol)) return "image/jpeg";
  const name = record.fileName ?? "";
  if (looksLikeVideo("application/octet-stream", name)) return "video/mp4";
  if (looksLikeImage("application/octet-stream", name)) return "image/jpeg";
  return cm || "application/octet-stream";
}

/**
 * 已有行但 `logo_url` 为空时，从对象存储拉回字节再跑 `finalizeDataFileThumbnail`（与「补封面」接口同源逻辑）。
 * 用于：内容去重命中旧行、或历史上传时异步封面失败。
 */
function scheduleThumbnailFinalizeFromStorageIfNoLogo(record: DataFileRecord, clientMime?: string): void {
  if (dataFileHasRenderableLogoUrl(record.logoUrl)) return;
  const fileUrl = record.fileUrl?.trim();
  if (!fileUrl) return;
  const mime = mimeTypeHintForThumbnail(record, clientMime);
  if (!looksLikeVideo(mime, record.fileName) && !looksLikeImage(mime, record.fileName)) return;
  const storageKey = tryStorageKeyFromFileUrl(fileUrl);
  if (!storageKey) return;
  void (async () => {
    try {
      const buffer = await getObjectBuffer(storageKey);
      await finalizeDataFileThumbnail({
        fileId: record.fileId,
        fileUrl,
        buffer,
        mimeType: mime,
        fileName: record.fileName,
        ownerSegment: record.ownerUserId ?? "anon",
      });
    } catch (e) {
      console.error("[v2/file] thumbnail backfill from storage", record.fileId, e);
    }
  })();
}

function ok(data: unknown): Response {
  return Response.json({ success: true, data, error: null });
}
function fail(msg: string, status = 400): Response {
  return Response.json({ success: false, data: null, error: { message: msg } }, { status });
}

function isMysqlDuplicateKey(err: unknown): boolean {
  return typeof err === "object" && err !== null && "errno" in err && (err as { errno: number }).errno === 1062;
}

const fileQuerySchema = z.object({
  keyword: z.string().optional(),
  fileTypeId: z.string().optional(),
  ownerUserId: z.string().optional(),
  status: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

const updateFileSchema = z.object({
  fileName: z.string().optional(),
  logoUrl: z.union([z.string(), z.null()]).optional(),
  /** 禁止直接传入 fileTypeId；由 teacherMaterialKind 经静态映射解析 */
  status: z.string().optional(),
  /** 业务意图 → 由后端 `FILE_KIND_MAP` 静态解析为 FT_ 物理 ID */
  teacherMaterialKind: z.string().optional(),
});

const ensureThumbSchema = z.object({
  force: z.coerce.boolean().optional(),
});

const fileLookupSchema = z.object({
  fileIds: z.array(z.string().min(1)).min(1).max(80),
});

/** 去掉末尾 `/`，避免 `GET /v2/file/` 与 `GET /v2/file` 不一致导致整链 404 → NOT_FOUND */
function normalizeApiPathname(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) return pathname.replace(/\/+$/, "");
  return pathname;
}

export async function routeV2File(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const path = normalizeApiPathname(url.pathname);
    const actorId = req.headers.get("x-user-id") ?? undefined;

    if (!path.startsWith("/v2/file")) return new Response(null, { status: 404 });

    // ── 上传 ─────────────────────────────────────────────
    if (req.method === "POST" && path === "/v2/file/upload") {
      const contentType = req.headers.get("content-type") ?? "";
      if (!contentType.includes("multipart/form-data")) {
        return fail("请使用 multipart/form-data 上传文件");
      }
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      if (!file) return fail("缺少 file 字段");
      if (file.size > 500 * 1024 * 1024) return fail("文件大小不能超过 500MB");

      const buffer = Buffer.from(await file.arrayBuffer());
      const contentSha256 = createHash("sha256").update(buffer).digest("hex");

      const dup = await findActiveFileByOwnerAndContentSha(actorId, contentSha256);
      if (dup) {
        scheduleThumbnailFinalizeFromStorageIfNoLogo(dup, file.type || "");
        return ok({ ...materializeRecordFileUrls(dup), contentDeduped: true });
      }

      const fileExt = file.name.includes(".") ? file.name.split(".").pop()! : "";
      const storageKey = getStorageKey(`v2/${actorId ?? "anon"}/${randomUUID()}${fileExt ? `.${fileExt}` : ""}`);
      await putObject(storageKey, buffer, file.type || "application/octet-stream");

      const fileUrl = storageKey;
      const teacherKindRaw = (formData.get("teacherMaterialKind") as string | null)?.trim().toLowerCase() || "";
      const fileTypeId = teacherKindRaw
        ? (await resolveDataFileTypeIdByTeacherMaterialKind(teacherKindRaw)) ?? undefined
        : undefined;

      let record;
      try {
        record = await createFileRecord({
          fileName: file.name,
          fileUrl,
          fileExt: fileExt || undefined,
          fileSize: file.size,
          ownerUserId: actorId,
          fileTypeId,
          contentSha256,
        });
      } catch (e) {
        await deleteObject(storageKey).catch(() => {});
        if (isMysqlDuplicateKey(e)) {
          const again = await findActiveFileByOwnerAndContentSha(actorId, contentSha256);
          if (again) {
            scheduleThumbnailFinalizeFromStorageIfNoLogo(again, file.type || "");
            return ok({ ...again, contentDeduped: true });
          }
        }
        throw e;
      }
      /** 与补封面/去重回填一致：octet-stream 时结合 `data_file_type`、file_ext 推断，否则会静默跳过视频抽帧 */
      const mimeType = mimeTypeHintForThumbnail(record, file.type || "");
      void finalizeDataFileThumbnail({
        fileId: record.fileId,
        fileUrl: record.fileUrl,
        buffer,
        mimeType,
        fileName: file.name,
        ownerSegment: actorId ?? "anon",
      }).catch((err) => {
        console.error("[v2/file/upload] thumbnail finalize", record.fileId, err);
      });
      return ok({ ...materializeRecordFileUrls(record), contentDeduped: false });
    }

    // ── 列表 ─────────────────────────────────────────────
    if (req.method === "GET" && path === "/v2/file") {
      const params = Object.fromEntries(url.searchParams.entries());
      const query = fileQuerySchema.parse(params);
      const result = await listFiles(query);
      return ok(result);
    }

    // ── 前端截帧封面上传 ─────────────────────────────────
    const posterMatch = path.match(/^\/v2\/file\/([^/]+)\/poster$/);
    if (posterMatch && req.method === "POST") {
      const fileId = decodeURIComponent(posterMatch[1]!);
      const ct = req.headers.get("content-type") ?? "";
      if (!ct.toLowerCase().includes("multipart/form-data")) {
        return fail("请使用 multipart/form-data 上传封面");
      }
      try {
        const form = await req.formData();
        const f = (form.get("file") ?? form.get("poster")) as File | null;
        if (!f || typeof (f as File).arrayBuffer !== "function") {
          return fail("缺少 file 字段", 400);
        }
        const out = await persistClientPosterFile(fileId, actorId, f as File);
        return ok(out);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (msg === "NOT_FOUND") return fail("未找到该文件", 404);
        if (msg === "FORBIDDEN") return fail("无权更新该文件", 403);
        if (msg === "POSTER_TOO_LARGE") return fail("封面文件不能超过 500KB", 400);
        if (msg === "POSTER_BAD_MAGIC") return fail("仅支持 JPEG/PNG 图片", 400);
        console.error("[v2/file/poster]", fileId, e);
        return fail("封面上传失败", 500);
      }
    }

    // ── 元数据补齐（空 content_sha256 / 空 file_type_id）── 须在 `/v2/file/:id` 单条之前匹配
    const dataRepairMatch = path.match(/^\/v2\/file\/([^/]+)\/data-repair$/);
    if (dataRepairMatch && req.method === "POST") {
      const fileId = decodeURIComponent(dataRepairMatch[1]!);
      const out = await runV2DataFileMetadataRepair(fileId, actorId);
      if (out.skipped === "not_found") return fail("未找到该文件", 404);
      if (out.skipped === "forbidden") return fail("无权修补该文件", 403);
      /** 读对象失败仍 200，便于前端静默忽略（仅不落库） */
      return ok(out);
    }

    // ── 批量按 file_id 取行（含 data_file_type）── 须在 `/v2/file/:id` 之前，避免 id=lookup 误匹配
    if (req.method === "POST" && path === "/v2/file/lookup") {
      const body = await req.json();
      const { fileIds } = fileLookupSchema.parse(body);
      const items = await getFilesByIds(fileIds);
      return ok({ items });
    }

    // ── 单条 ─────────────────────────────────────────────
    const fileMatch = path.match(/^\/v2\/file\/([^/]+)$/);
    if (fileMatch) {
      const fileId = decodeURIComponent(fileMatch[1]!);

      if (req.method === "GET") {
        const record = await getFileById(fileId);
        if (!record) return fail("未找到该文件", 404);
        return ok(materializeRecordFileUrls(record));
      }

      if (req.method === "PUT" || req.method === "PATCH") {
        const body = await req.json();
        const input = updateFileSchema.parse(body);
        // 契约收口：只接受 teacherMaterialKind（业务意图），由静态映射转为 fileTypeId
        const patch: Record<string, unknown> = {};
        if (input.fileName !== undefined) patch.fileName = input.fileName;
        if (input.logoUrl !== undefined) patch.logoUrl = input.logoUrl;
        if (input.status !== undefined) patch.status = input.status;
        if (input.teacherMaterialKind !== undefined) {
          const ft = teacherMaterialKindToDataFileTypeId(input.teacherMaterialKind);
          if (ft) patch.fileTypeId = ft;
        }
        const record = await updateFileRecord(fileId, patch);
        return ok(materializeRecordFileUrls(record));
      }

      if (req.method === "DELETE") {
        await softDeleteFile(fileId);
        return ok({ fileId, deleted: true });
      }
    }

    // ── 首次加载补封面 ────────────────────────────────────
    const ensureThumbMatch = path.match(/^\/v2\/file\/([^/]+)\/thumbnail\/ensure$/);
    if (ensureThumbMatch && req.method === "POST") {
      const fileId = decodeURIComponent(ensureThumbMatch[1]!);
      const record = await getFileById(fileId);
      if (!record) return fail("未找到该文件", 404);
      const body = (await req.json().catch(() => ({}))) as unknown;
      const { force } = ensureThumbSchema.parse(body);
      if (!force && dataFileHasRenderableLogoUrl(record.logoUrl)) {
        return ok({ fileId, scheduled: false, alreadyHasLogo: true });
      }
      const fileUrl = record.fileUrl.trim();
      if (!fileUrl) return fail("data_file.file_url 为空", 400);
      const storageKey = tryStorageKeyFromFileUrl(fileUrl);
      if (!storageKey) {
        return fail("data_file.file_url 不在当前 S3 存储中，无法读取源文件生成封面", 400);
      }
      let buffer: Buffer | null = null;
      try {
        buffer = await getObjectBuffer(storageKey);
      } catch (e) {
        console.error("[v2/file/thumbnail/ensure] read object failed", fileId, e);
      }
      if (!buffer) {
        return fail("从 S3 读取源文件失败，无法生成封面", 400);
      }
      const ensureMime = mimeTypeHintForThumbnail(record, "");
      void finalizeDataFileThumbnail({
        fileId: record.fileId,
        fileUrl: record.fileUrl,
        buffer,
        mimeType: ensureMime,
        fileName: record.fileName,
        ownerSegment: record.ownerUserId ?? "anon",
      }).catch((err) => {
        console.error("[v2/file/thumbnail/ensure] finalize failed", fileId, err);
      });
      return ok({ fileId, scheduled: true, alreadyHasLogo: false });
    }

    // ── 预签名下载 URL ────────────────────────────────────
    const presignMatch = path.match(/^\/v2\/file\/([^/]+)\/presigned-url$/);
    if (presignMatch && req.method === "GET") {
      const fileId = decodeURIComponent(presignMatch[1]!);
      const record = await getFileById(fileId);
      if (!record) return fail("未找到该文件", 404);

      const fileUrl = record.fileUrl.trim();
      if (!fileUrl) return fail("data_file.file_url 为空", 400);

      const action = (url.searchParams.get("action") as "view" | "download") ?? "view";

      const storageKey = tryStorageKeyFromFileUrl(fileUrl);
      if (!storageKey) {
        return fail("data_file.file_url 不在当前 S3 存储中，无法生成预签名下载链接", 400);
      }
      const presignedUrl = await createPresignedReadUrl(storageKey, { action });
      return ok({ fileId, presignedUrl, action });
    }

    return new Response(null, { status: 404 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return fail(`参数校验失败：${err.errors[0]?.message ?? "未知字段"}`, 400);
    }
    console.error("[v2-file]", err);
    return fail("服务内部错误", 500);
  }
}
