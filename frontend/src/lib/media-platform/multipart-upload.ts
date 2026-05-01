"use client";

import type { ApiActor } from "@/lib/new-core-api";

/** S3 multipart upload init 响应 */
export type MultipartInitResponse = {
  deduped: boolean;
  /** deduped=true 时，直接返回已存在的文件记录 */
  fileRecord?: MultipartFileRecord;
  uploadId?: string;
  storageKey?: string;
  parts?: { partNumber: number; presignedUrl: string }[];
};

export type MultipartFileRecord = {
  fileId: string;
  fileName: string;
  fileUrl: string;
  fileTypeId: string | null;
  fileTypeName: string | null;
  status: string | null;
  fileSize: number | null;
  fileExt: string | null;
  contentSha256?: string | null;
  contentDeduped?: boolean;
  logoUrl?: string | null;
  coverFileId?: string | null;
  [key: string]: unknown;
};

export type MultipartProgressEvent = {
  loadedBytes: number;
  totalBytes: number;
  percent: number;
  partNumber: number;
  totalParts: number;
};

export type MultipartUploadOptions = {
  /** 文件名（必填） */
  fileName: string;
  /** 显示标题（可选，缺省用 fileName） */
  title?: string;
  /** 素材类型（可选，用于映射 data_file_type） */
  teacherMaterialKind?: string;
  /** 上传进度回调 */
  onProgress?: (event: MultipartProgressEvent) => void;
  /** 分片大小（默认 16MB） */
  chunkSize?: number;
};

/** 计算完整文件的 SHA-256 hex */
async function computeFileSha256(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest))
    .map((n) => n.toString(16).padStart(2, "0"))
    .join("");
}

function buildAuthHeaders(actor: ApiActor): Record<string, string> {
  const h: Record<string, string> = {
    "content-type": "application/json",
    "x-role": actor.role,
    "x-user-id": actor.userId,
    "x-user-name": actor.userName,
    "x-org-id": actor.orgId,
    "x-subject-key": process.env.NEXT_PUBLIC_MEDIA_SUBJECT_KEY ?? "SYSTEM:bootstrap",
  };
  if (actor.tenantId?.trim()) h["x-tenant-id"] = actor.tenantId.trim();
  if (actor.appId?.trim()) h["x-app-id"] = actor.appId.trim();
  return h;
}

function buildApiUrl(path: string): string {
  const base = (process.env.NEXT_PUBLIC_NEW_CORE_API_BASE ?? "").trim().replace(/\/+$/, "");
  if (!base) return path;
  const hostBase = base.replace(/\/v1$/, "");
  if (path.startsWith("/v2/")) return `${hostBase}${path}`;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

type BackendEnvelope<T> = {
  success: boolean;
  data: T;
  error?: { message: string };
};

async function backendPost<T>(path: string, actor: ApiActor, body: unknown): Promise<T> {
  const url = buildApiUrl(path);
  const res = await fetch(url, {
    method: "POST",
    headers: buildAuthHeaders(actor),
    body: JSON.stringify(body),
    credentials: "include",
  });
  const text = await res.text();
  let json: BackendEnvelope<T>;
  try {
    json = JSON.parse(text) as BackendEnvelope<T>;
  } catch {
    throw new Error(res.ok ? "服务返回了无效数据" : `请求失败（HTTP ${res.status}）`);
  }
  if (!json.success) throw new Error(json.error?.message ?? "请求失败");
  return json.data;
}

/**
 * 分片上传文件到 /v2/file/multipart/*
 *
 * 流程：
 * 1. 计算 SHA-256 → POST /v2/file/multipart/init（含去重）
 * 2. 已去重 → 直接返回 fileRecord
 * 3. 未去重 → PUT 各分片到预签名 URL → POST /v2/file/multipart/complete
 * 4. 返回 fileRecord
 */
export async function uploadFileViaMultipart(
  actor: ApiActor,
  file: File,
  options: MultipartUploadOptions,
): Promise<{ reused: boolean; fileRecord: MultipartFileRecord }> {
  const chunkSize = options.chunkSize ?? 16 * 1024 * 1024;
  const totalParts = Math.ceil(file.size / chunkSize);
  const sha256 = await computeFileSha256(file);

  // ── 1. init ──────────────────────────────────────────────
  const init = await backendPost<MultipartInitResponse>("/v2/file/multipart/init", actor, {
    sha256,
    fileName: options.fileName,
    title: options.title,
    teacherMaterialKind: options.teacherMaterialKind,
    totalSize: file.size,
    totalParts,
  });

  if (init.deduped && init.fileRecord) {
    return { reused: true, fileRecord: init.fileRecord };
  }

  if (!init.uploadId || !init.storageKey || !init.parts) {
    throw new Error("分片上传初始化失败：缺少必要字段");
  }

  // ── 2. 上传各分片到预签名 URL ────────────────────────────
  const uploadedParts: { ETag: string; PartNumber: number }[] = [];
  let loadedBytes = 0;

  for (let i = 0; i < totalParts; i++) {
    const partNumber = i + 1;
    const partInfo = init.parts.find((p) => p.partNumber === partNumber);
    if (!partInfo) throw new Error(`缺少第 ${partNumber} 片预签名 URL`);

    const start = i * chunkSize;
    const end = Math.min(file.size, start + chunkSize);
    const blob = file.slice(start, end);

    // 直接 PUT 到预签名 URL
    const putRes = await fetch(partInfo.presignedUrl, {
      method: "PUT",
      body: blob,
    });

    if (!putRes.ok) {
      // 通知后端中止分片上传
      await backendPost("/v2/file/multipart/abort", actor, {
        uploadId: init.uploadId,
        storageKey: init.storageKey,
      }).catch(() => {});
      throw new Error(`第 ${partNumber} 片上传输送失败（HTTP ${putRes.status}）`);
    }

    const etag = putRes.headers.get("etag") ?? "";
    uploadedParts.push({
      ETag: etag.replace(/^"|"$/g, ""),
      PartNumber: partNumber,
    });

    loadedBytes += blob.size;
    options.onProgress?.({
      loadedBytes,
      totalBytes: file.size,
      percent: (loadedBytes / file.size) * 100,
      partNumber,
      totalParts,
    });
  }

  // ── 3. complete ──────────────────────────────────────────
  const complete = await backendPost<{ deduped: boolean; fileRecord: MultipartFileRecord }>(
    "/v2/file/multipart/complete",
    actor,
    {
      uploadId: init.uploadId,
      storageKey: init.storageKey,
      parts: uploadedParts,
      sha256,
      fileName: options.fileName,
      title: options.title,
      teacherMaterialKind: options.teacherMaterialKind,
      totalSize: file.size,
    },
  );

  return { reused: false, fileRecord: complete.fileRecord };
}
