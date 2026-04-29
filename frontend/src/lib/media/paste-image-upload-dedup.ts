"use client";

/**
 * Word / 剪贴板图片上传：按内容 SHA-256 在浏览器侧合并「已成功的同一字节」后续请求（与后端 content_sha256 去重互补）。
 * 典型场景：多次粘贴同一张截图、或 Word 中多处引用同一图块时避免重复打上传接口。
 */

const completed = new Map<string, string>();
const MAX_COMPLETED = 200;

function trimCompleted(): void {
  while (completed.size > MAX_COMPLETED) {
    const first = completed.keys().next().value;
    if (first === undefined) break;
    completed.delete(first);
  }
}

async function sha256Hex(buffer: ArrayBuffer): Promise<string | null> {
  try {
    if (typeof crypto === "undefined" || !crypto.subtle) return null;
    const hash = await crypto.subtle.digest("SHA-256", buffer);
    return Array.from(new Uint8Array(hash))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  } catch {
    return null;
  }
}

/**
 * 若近期已成功上传相同字节，直接返回缓存 URL；否则执行 `run()` 并缓存成功结果。
 */
export async function uploadImageBytesWithContentDedup(
  buffer: ArrayBuffer,
  run: () => Promise<string | null>,
): Promise<string | null> {
  const hex = await sha256Hex(buffer);
  if (!hex) return run();

  const cached = completed.get(hex);
  if (cached) return cached;

  const url = await run();
  if (url) {
    completed.set(hex, url);
    trimCompleted();
  }
  return url;
}

/** 大图跳过指纹计算，直接上传。 */
const DEDUP_MAX_BYTES = 40 * 1024 * 1024;

export async function uploadBlobWithContentDedup(blob: Blob, run: () => Promise<string | null>): Promise<string | null> {
  if (blob.size > DEDUP_MAX_BYTES) return run();
  const buffer = await blob.arrayBuffer();
  return uploadImageBytesWithContentDedup(buffer, run);
}
