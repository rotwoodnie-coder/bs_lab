"use client";

import type { ApiActor } from "@/lib/new-core-api";

export type MultipartUploadInitResponse = {
  ok: boolean;
  uploadId?: string;
  objectKey?: string;
  bucket?: string;
  error?: string;
};

export type MultipartUploadCompletePart = {
  ETag: string;
  PartNumber: number;
};

export type MultipartUploadProgressEvent = {
  loadedBytes: number;
  totalBytes: number;
  percent: number;
  partNumber: number;
  totalParts: number;
};

export type MultipartUploadResult = {
  uploadId: string;
  objectKey: string;
  bucket?: string;
};

const DEFAULT_CHUNK_SIZE = 16 * 1024 * 1024;
const DEFAULT_PART_RETRY = 2;

function isTransientError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  return msg.includes("network") || msg.includes("timeout") || msg.includes("abort") || msg.includes("fetch");
}

async function retryable<T>(fn: () => Promise<T>, retries = DEFAULT_PART_RETRY): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < retries && isTransientError(error)) continue;
      break;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("multipart_upload_failed");
}

async function jsonPost<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as T;
  if (!res.ok) throw new Error((data as { error?: string })?.error ?? `request_failed_${res.status}`);
  return data;
}

export async function initMultipartUpload(input: { filename: string; contentType: string }): Promise<MultipartUploadResult> {
  const payload = await jsonPost<MultipartUploadInitResponse>("/api/media/upload/multipart/init", input);
  if (!payload.ok || !payload.uploadId || !payload.objectKey) throw new Error(payload.error ?? "multipart_init_failed");
  return { uploadId: payload.uploadId, objectKey: payload.objectKey, bucket: payload.bucket };
}

export async function uploadMultipartChunk(input: {
  uploadId: string;
  objectKey: string;
  partNumber: number;
  body: Blob;
}): Promise<MultipartUploadCompletePart> {
  return retryable(async () => {
    const res = await fetch("/api/media/upload/multipart/chunk", {
      method: "PUT",
      headers: {
        "x-upload-id": input.uploadId,
        "x-object-key": input.objectKey,
        "x-part-number": String(input.partNumber),
      },
      body: input.body,
    });
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; etag?: string; error?: string };
    if (!res.ok || !data.ok || !data.etag) throw new Error(data.error ?? `chunk_upload_failed_${input.partNumber}`);
    return { ETag: data.etag, PartNumber: input.partNumber };
  });
}

export async function completeMultipartUpload(input: {
  uploadId: string;
  objectKey: string;
  parts: MultipartUploadCompletePart[];
}): Promise<void> {
  const payload = await jsonPost<{ ok: boolean; error?: string }>("/api/media/upload/multipart/complete", input);
  if (!payload.ok) throw new Error(payload.error ?? "multipart_complete_failed");
}

export async function abortMultipartUpload(input: { uploadId: string; objectKey: string }): Promise<void> {
  await jsonPost<{ ok: boolean; error?: string }>("/api/media/upload/multipart/abort", input).catch(() => void 0);
}

export async function uploadBlobAsMultipart(
  file: File,
  options?: { chunkSize?: number; onProgress?: (e: MultipartUploadProgressEvent) => void },
): Promise<MultipartUploadResult & { parts: MultipartUploadCompletePart[] }> {
  const chunkSize = options?.chunkSize ?? DEFAULT_CHUNK_SIZE;
  const init = await initMultipartUpload({ filename: file.name, contentType: file.type || "application/octet-stream" });
  const totalParts = Math.ceil(file.size / chunkSize);
  const parts: MultipartUploadCompletePart[] = [];
  let loadedBytes = 0;
  try {
    for (let i = 0; i < totalParts; i++) {
      const partNumber = i + 1;
      const start = i * chunkSize;
      const end = Math.min(file.size, start + chunkSize);
      const blob = file.slice(start, end);
      const part = await uploadMultipartChunk({ uploadId: init.uploadId, objectKey: init.objectKey, partNumber, body: blob });
      parts.push(part);
      loadedBytes += blob.size;
      options?.onProgress?.({ loadedBytes, totalBytes: file.size, percent: (loadedBytes / file.size) * 100, partNumber, totalParts });
    }
    await completeMultipartUpload({ uploadId: init.uploadId, objectKey: init.objectKey, parts });
    return { ...init, parts };
  } catch (error) {
    await abortMultipartUpload({ uploadId: init.uploadId, objectKey: init.objectKey });
    throw error;
  }
}
