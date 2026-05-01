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
  softDeleteFileWithChildrenInTx,
  findActiveFileByContentSha,
  countActiveFilesByContentSha,
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
import { putObject, deleteObject, createPresignedReadUrl, getPublicObjectUrl, getStorageKey, getObjectBuffer, tryStorageKeyFromFileUrl } from "../../infrastructure/storage/s3-storage.ts";
import {
  s3CreateMultipartUpload,
  s3PresignUploadPartUrl,
  s3CompleteMultipartUpload,
  s3AbortMultipartUpload,
} from "../../infrastructure/storage/s3-multipart.ts";

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

function normalizeStoredOrPublicUrl(rawUrl: string | null | undefined): string | null {
  const raw = (rawUrl ?? "").trim();
  if (!raw) return null;
  return materializeFileUrl(raw);
}

function materializeRecordFileUrls<T extends { fileUrl?: string | null; logoUrl?: string | null }>(record: T): T {
  return {
    ...record,
    fileUrl: normalizeStoredOrPublicUrl(record.fileUrl),
    logoUrl: normalizeStoredOrPublicUrl(record.logoUrl),
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
function isRetryableStorageReadError(err: unknown): boolean {
  const code = typeof err === "object" && err !== null && "code" in err ? String((err as { code?: unknown }).code ?? "") : "";
  const name = typeof err === "object" && err !== null && "name" in err ? String((err as { name?: unknown }).name ?? "") : "";
  const message = err instanceof Error ? err.message : String(err);
  return code === "ECONNRESET" || name === "TimeoutError" || /ECONNRESET|socket hang up|timed? out/i.test(message);
}

function storageReadErrorContext(source: string, recordId: string, storageKey: string, err: unknown) {
  const code = typeof err === "object" && err !== null && "code" in err ? String((err as { code?: unknown }).code ?? "") : "";
  const name = typeof err === "object" && err !== null && "name" in err ? String((err as { name?: unknown }).name ?? "") : "";
  const message = err instanceof Error ? err.message : String(err);
  return {
    source,
    fileId: recordId,
    storageKey,
    code,
    name,
    message,
    retryable: isRetryableStorageReadError(err),
  };
}

function logStorageReadError(source: string, recordId: string, storageKey: string, err: unknown): void {
  console.error(`[v2/file] ${source} storage read failed`, {
    ...storageReadErrorContext(source, recordId, storageKey, err),
    error: err,
  });
}

function scheduleThumbnailFinalizeFromStorageIfNoLogo(record: DataFileRecord, clientMime?: string): void {
  if (dataFileHasRenderableLogoUrl(record.logoUrl)) return;
  const fileUrl = record.fileUrl?.trim();
  if (!fileUrl) return;
  const mime = mimeTypeHintForThumbnail(record, clientMime);
  if (!looksLikeVideo(mime, record.fileName) && !looksLikeImage(mime, record.fileName)) return;
  const storageKey = tryStorageKeyFromFileUrl(fileUrl);
  if (!storageKey) return;
  console.info("[v2/file] thumbnail backfill scheduled", {
    fileId: record.fileId,
    storageKey,
    ownerUserId: record.ownerUserId ?? "anon",
    fileName: record.fileName,
    mime,
  });
  void (async () => {
    try {
      const buffer = await getObjectBuffer(storageKey);
      console.info("[v2/file] thumbnail backfill storage read ok", {
        fileId: record.fileId,
        storageKey,
        bytes: buffer.length,
      });
      await finalizeDataFileThumbnail({
        fileId: record.fileId,
        fileUrl,
        buffer,
        mimeType: mime,
        fileName: record.fileName,
        ownerSegment: record.ownerUserId ?? "anon",
      });
    } catch (e) {
      logStorageReadError("thumbnail backfill", record.fileId, storageKey, e);
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
  /** 1/true 时不过滤 file_type_id IS NULL 的私有资源 */
  includePrivate: z.coerce.boolean().optional(),
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

// ── 分片上传 schema ─────────────────────────────────
const multipartInitSchema = z.object({
  sha256: z.string().length(64),
  fileName: z.string().min(1),
  title: z.string().optional(),
  teacherMaterialKind: z.string().optional(),
  totalSize: z.number().int().positive().max(2 * 1024 * 1024 * 1024),
  totalParts: z.number().int().min(1).max(1000),
});

const multipartPartSchema = z.object({
  ETag: z.string().min(1),
  PartNumber: z.number().int().min(1),
});

const multipartCompleteSchema = z.object({
  uploadId: z.string().min(1),
  storageKey: z.string().min(1),
  parts: z.array(multipartPartSchema).min(1),
  sha256: z.string().length(64),
  fileName: z.string().min(1),
  title: z.string().optional(),
  teacherMaterialKind: z.string().optional(),
  totalSize: z.number().int().positive().max(2 * 1024 * 1024 * 1024),
});

const multipartAbortSchema = z.object({
  uploadId: z.string().min(1),
  storageKey: z.string().min(1),
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
      if (file.size > 2 * 1024 * 1024 * 1024) return fail("文件大小不能超过 2GB");

      const buffer = Buffer.from(await file.arrayBuffer());
      const contentSha256 = createHash("sha256").update(buffer).digest("hex");

      const fileExt = file.name.includes(".") ? file.name.split(".").pop()! : "";
      // 用户输入的标题优先，空则用原始文件名
      const displayName = (formData.get("title") as string | null)?.trim() || file.name;
      const teacherKindRaw = (formData.get("teacherMaterialKind") as string | null)?.trim().toLowerCase() || "";
      const fileTypeId = teacherKindRaw
        ? (await resolveDataFileTypeIdByTeacherMaterialKind(teacherKindRaw)) ?? undefined
        : undefined;

      // 全库去重：同一 contentSha256 已有启用行，不传 S3，仅建新行（owner 为当前用户）
      const dup = await findActiveFileByContentSha(contentSha256);
      if (dup) {
        const record = await createFileRecord({
          fileName: displayName,
          fileUrl: dup.fileUrl,
          fileExt: fileExt || undefined,
          fileSize: file.size,
          ownerUserId: actorId,
          fileTypeId,
          contentSha256,
        });
        scheduleThumbnailFinalizeFromStorageIfNoLogo(dup, file.type || "");
        return ok({ ...materializeRecordFileUrls(record), contentDeduped: true, existingFileId: dup.fileId });
      }

      // 全新文件：上传到 S3 并创建行
      const storageKey = getStorageKey(`v2/${actorId ?? "anon"}/${randomUUID()}${fileExt ? `.${fileExt}` : ""}`);
      await putObject(storageKey, buffer, file.type || "application/octet-stream");

      let record;
      try {
        record = await createFileRecord({
          fileName: displayName,
          fileUrl: storageKey,
          fileExt: fileExt || undefined,
          fileSize: file.size,
          ownerUserId: actorId,
          fileTypeId,
          contentSha256,
        });
      } catch (e) {
        await deleteObject(storageKey).catch(() => {});
        if (isMysqlDuplicateKey(e)) {
          const again = await findActiveFileByContentSha(contentSha256);
          if (again) {
            // 并发写入冲突：另一请求已创建相同 SHA 的行
            scheduleThumbnailFinalizeFromStorageIfNoLogo(again, file.type || "");
            return ok({ ...materializeRecordFileUrls(again), contentDeduped: true });
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

    // ── 分片上传：init ───────────────────────────────────
    if (req.method === "POST" && path === "/v2/file/multipart/init") {
      const body = multipartInitSchema.parse(await req.json());

      // SHA-256 去重检查
      const dup = await findActiveFileByContentSha(body.sha256);
      if (dup) {
        return ok({ deduped: true, fileRecord: materializeRecordFileUrls(dup) });
      }

      const fileExt = (body.fileName.includes(".") ? body.fileName.split(".").pop()! : "").toLowerCase();
      const storageKey = getStorageKey(`v2/${actorId ?? "anon"}/${randomUUID()}${fileExt ? `.${fileExt}` : ""}`);
      const { uploadId } = await s3CreateMultipartUpload(storageKey, `application/octet-stream`);

      // 为每个分片预签名 URL（批量生成）
      const parts: { partNumber: number; presignedUrl: string }[] = [];
      for (let i = 1; i <= body.totalParts; i++) {
        const presignedUrl = await s3PresignUploadPartUrl(storageKey, uploadId, i);
        parts.push({ partNumber: i, presignedUrl });
      }

      return ok({ deduped: false, uploadId, storageKey, parts });
    }

    // ── 分片上传：complete ──────────────────────────────
    if (req.method === "POST" && path === "/v2/file/multipart/complete") {
      const body = multipartCompleteSchema.parse(await req.json());

      await s3CompleteMultipartUpload(body.storageKey, body.uploadId, body.parts);

      const fileExt = (body.fileName.includes(".") ? body.fileName.split(".").pop()! : "").toLowerCase();
      const teacherKindRaw = (body.teacherMaterialKind ?? "").trim().toLowerCase();
      const fileTypeId = teacherKindRaw
        ? (await resolveDataFileTypeIdByTeacherMaterialKind(teacherKindRaw)) ?? undefined
        : undefined;

      const record = await createFileRecord({
        fileName: body.title || body.fileName,
        fileUrl: body.storageKey,
        fileExt: fileExt || undefined,
        fileSize: body.totalSize,
        ownerUserId: actorId,
        fileTypeId,
        contentSha256: body.sha256,
      });

      // 异步触发缩略图
      void (async () => {
        try {
          const mimeType = mimeTypeHintForThumbnail(record, "");
          const buf = await getObjectBuffer(body.storageKey);
          await finalizeDataFileThumbnail({
            fileId: record.fileId,
            fileUrl: record.fileUrl,
            buffer: buf,
            mimeType,
            fileName: body.fileName,
            ownerSegment: actorId ?? "anon",
          });
        } catch (err) {
          console.error("[v2/file/multipart/complete] thumbnail finalize", record.fileId, err);
        }
      })();

      return ok({ deduped: false, fileRecord: materializeRecordFileUrls(record) });
    }

    // ── 分片上传：abort ─────────────────────────────────
    if (req.method === "POST" && path === "/v2/file/multipart/abort") {
      const body = multipartAbortSchema.parse(await req.json());
      await s3AbortMultipartUpload(body.storageKey, body.uploadId);
      return ok({ ok: true });
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
        if (msg === "LOGO_CAN_ONLY_ATTACH_TO_MAIN_FILE") return fail("封面只能附加于主文件", 400);
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
        const record = await getFileById(fileId);
        if (!record) return fail("未找到该文件", 404);

        // 不能删除封面行本身（只能删主文件触发递归）
        if (record.relationType) {
          return fail("请删除主文件以级联清理附属资源", 400);
        }

        const ownerUserId = record.ownerUserId?.trim();
        const currentUserId = (actorId ?? "").trim();
        if (ownerUserId && currentUserId && ownerUserId !== currentUserId) {
          return fail("你无权删除该文件（非你的引用）", 403);
        }

        // 事务内软删主+子所有行，提交后再异步清理 S3
        let txResult: Awaited<ReturnType<typeof softDeleteFileWithChildrenInTx>>;
        try {
          txResult = await softDeleteFileWithChildrenInTx(fileId);
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          if (msg === "NOT_FOUND") return fail("未找到该文件", 404);
          throw e;
        }

        // 异步清理 S3（引用归零判断在外层执行）
        void (async () => {
          const traceId = randomUUID().slice(0, 12);
          try {
            // 子行 S3 清理
            for (const child of txResult.childrenToCleanS3) {
              const childSha = child.contentSha256?.trim() ?? "";
              if (childSha) {
                const childRef = await countActiveFilesByContentSha(childSha);
                if (childRef > 0) continue;
              }
              // content_sha256 IS NULL（存量迁移数据）或引用归零 → 删 S3
              const childKey = tryStorageKeyFromFileUrl(child.fileUrl);
              if (childKey) {
                await deleteObject(childKey).catch((e) =>
                  console.error("[v2/file] async S3 delete failed", {
                    traceId,
                    fileId: child.fileId,
                    storageKey: childKey,
                    source: "child",
                    error: e instanceof Error ? e.message : String(e),
                  })
                );
              }
            }

            // 主文件 S3 清理
            const mainSha = txResult.mainFileSha ?? "";
            const mainRefCount = mainSha ? await countActiveFilesByContentSha(mainSha) : 0;
            if (mainRefCount === 0 && mainSha) {
              const mainKey = tryStorageKeyFromFileUrl(txResult.mainFileUrl);
              if (mainKey) {
                await deleteObject(mainKey).catch((e) =>
                  console.error("[v2/file] async S3 delete failed", {
                    traceId,
                    fileId,
                    storageKey: mainKey,
                    source: "main",
                    error: e instanceof Error ? e.message : String(e),
                  })
                );
              }
            }
            console.info("[v2/file] async S3 cleanup completed", {
              traceId,
              fileId,
              childrenCount: txResult.childrenCount,
              mainScheduled: !!mainSha && mainRefCount === 0,
            });
          } catch (e) {
            console.error("[v2/file] async S3 cleanup unexpected error", {
              traceId,
              fileId,
              error: e instanceof Error ? e.message : String(e),
            });
          }
        })();

        return ok({
          fileId,
          deleted: true,
          s3CleanupScheduled: true,
          childrenCleaned: txResult.childrenCount,
        });
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
      let readErr: unknown;
      try {
        buffer = await getObjectBuffer(storageKey);
        console.info("[v2/file/thumbnail/ensure] storage read ok", {
          fileId,
          storageKey,
          bytes: buffer.length,
        });
      } catch (e) {
        readErr = e;
        logStorageReadError("thumbnail/ensure", fileId, storageKey, e);
      }
      if (!buffer) {
        return fail("从 S3 读取源文件失败，无法生成封面", isRetryableStorageReadError(readErr) ? 503 : 400);
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
