"use client";

import type { MediaStorageMode } from "./media-upload-destination-copy";

export type MediaUploadXhrPayload = {
  ok: boolean;
  data?: {
    registryId: string;
    assetId: string;
    viewUrl: string;
    reviewStatus: string;
    reused: boolean;
    storageMode?: MediaStorageMode;
    /** V2 `data_file.file_url`，写入材料 `main_pic_url` */
    fileUrl?: string | null;
    registration?: "v1" | "v2";
  };
  error?: {
    message: string;
    code?: string;
    source?: string;
    retryable?: boolean;
    context?: Record<string, unknown>;
    traceId?: string;
  } | string;
};

export type MediaUploadProgressEvent = {
  loaded: number;
  total: number;
  percent: number;
};

const MEDIA_UPLOAD_XHR_TIMEOUT_MS = 120_000;

function normalizeError(error: MediaUploadXhrPayload["error"]): { message: string; code?: string; source?: string; retryable?: boolean; context?: Record<string, unknown>; traceId?: string } {
  if (typeof error === "string") return { message: error };
  return error ?? { message: "上传失败" };
}

export function postMediaUploadForm(
  form: FormData,
  options?: { onProgress?: (e: MediaUploadProgressEvent) => void },
): Promise<MediaUploadXhrPayload> {
  return postMediaUploadFormToUrl("/api/media/upload", form, options);
}

/**
 * 降级路径：直接调用后端 `/v2/file/upload`（跳过 Next.js Route Handler 的 FormData 解析）。
 * 同源转发（Next.js rewrite / Nginx），无跨域问题。
 */
export function postMediaUploadFormDirect(
  form: FormData,
  options?: { onProgress?: (e: MediaUploadProgressEvent) => void },
): Promise<MediaUploadXhrPayload> {
  return postMediaUploadFormToUrl("/v2/file/upload", form, options);
}

/** 内部：向指定 URL 发送 XHR 并映射后端响应格式为前端 MediaUploadXhrPayload */
function postMediaUploadFormToUrl(
  url: string,
  form: FormData,
  options?: { onProgress?: (e: MediaUploadProgressEvent) => void },
): Promise<MediaUploadXhrPayload> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.responseType = "json";
    xhr.timeout = MEDIA_UPLOAD_XHR_TIMEOUT_MS;
    xhr.withCredentials = true;
    xhr.upload.onprogress = (ev) => {
      if (!options?.onProgress || !ev.lengthComputable || ev.total <= 0) return;
      const percent = (ev.loaded / ev.total) * 100;
      options.onProgress({ loaded: ev.loaded, total: ev.total, percent });
    };
    xhr.onload = () => {
      try {
        const raw = typeof xhr.response === "object" && xhr.response !== null ? xhr.response : JSON.parse(xhr.responseText);
        const body = raw as Record<string, unknown>;
        // 后端 /v2/file/upload 返回 { success: true, data: {...}, error: null }
        if (url === "/v2/file/upload") {
          resolve(mapV2ResponseToPayload(body));
          return;
        }
        resolve(body as unknown as MediaUploadXhrPayload);
      } catch {
        reject(new Error("服务返回了无效数据"));
      }
    };
    xhr.onerror = () => reject(new Error("网络异常"));
    xhr.ontimeout = () => reject(new Error("上传请求超时，请稍后重试"));
    xhr.send(form);
  });
}

/** 将后端 V2 响应格式映射为前端 MediaUploadXhrPayload */
function mapV2ResponseToPayload(raw: Record<string, unknown>): MediaUploadXhrPayload {
  const success = raw.success === true;
  if (!success) {
    const err = raw.error as { message?: string; code?: string; source?: string; retryable?: boolean; traceId?: string } | null;
    const code = err?.code ?? "MEDIA_UPLOAD_FAILED";
    return {
      ok: false,
      error: {
        message: err?.message ?? "上传失败",
        code,
        source: err?.source ?? "v2/file/upload",
        retryable: err?.retryable ?? false,
        traceId: err?.traceId ?? `media-upload-${Date.now()}`,
      },
    };
  }

  const d = raw.data as Record<string, unknown> | null;
  if (!d) {
    return { ok: false, error: "服务返回了空数据" };
  }

  const fileId = String(d.fileId ?? "");
  const fileUrl = d.fileUrl ? String(d.fileUrl) : null;
  const status = String(d.status ?? "y");
  const contentDeduped = Boolean(d.contentDeduped);

  return {
    ok: true,
    data: {
      registryId: fileId,
      assetId: fileId,
      viewUrl: fileUrl ?? "",
      reviewStatus: status === "n" ? "ARCHIVED" : "PUBLISHED",
      reused: contentDeduped,
      storageMode: "minio",
      fileUrl,
      registration: "v2",
    },
  };
}

export function extractMediaUploadError(payload: MediaUploadXhrPayload): { message: string; code?: string; source?: string; retryable?: boolean; context?: Record<string, unknown>; traceId?: string } {
  return normalizeError(payload.error);
}
