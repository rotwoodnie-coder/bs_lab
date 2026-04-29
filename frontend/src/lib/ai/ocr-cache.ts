import type { MediaCoverOcrResult } from "./media-ocr";

const OCR_CACHE_KEY_PREFIX = "bs_ocr_cache_";

/**
 * URL 规范化，用作缓存 key：仅取 scheme + host + path，忽略 search / hash。
 * 同一资源的不同查询参数视为同一视频。
 */
function normalizeCacheKey(videoUrl: string): string {
  try {
    const u = new URL(videoUrl);
    return `${u.protocol}//${u.host}${u.pathname}`;
  } catch {
    return videoUrl.trim();
  }
}

/** 将 OCR 结果写入 localStorage。每 10 个 URL 独立缓存。 */
export function setOcrCache(videoUrl: string, result: MediaCoverOcrResult): void {
  try {
    const key = OCR_CACHE_KEY_PREFIX + normalizeCacheKey(videoUrl);
    const payload = { ...result, _cachedAt: Date.now() };
    localStorage.setItem(key, JSON.stringify(payload));
  } catch {
    // localStorage 满或禁用时静默忽略
  }
}

/** 读取 OCR 缓存，超时返回 null。默认缓存 24 小时。 */
export function getOcrCache(videoUrl: string, ttlMs = 86_400_000): MediaCoverOcrResult | null {
  try {
    const key = OCR_CACHE_KEY_PREFIX + normalizeCacheKey(videoUrl);
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as MediaCoverOcrResult & { _cachedAt?: number };
    if (parsed._cachedAt && Date.now() - parsed._cachedAt > ttlMs) {
      localStorage.removeItem(key);
      return null;
    }
    const { _cachedAt: _, ...rest } = parsed;
    return rest;
  } catch {
    return null;
  }
}

/**
 * 删除指定 videoUrl 的 OCR 缓存。
 * 多视频场景：用户重新选择视频时主动清除旧缓存，触发重新识别。
 */
export function removeOcrCache(videoUrl: string): void {
  try {
    const key = OCR_CACHE_KEY_PREFIX + normalizeCacheKey(videoUrl);
    localStorage.removeItem(key);
  } catch {
    // 静默忽略
  }
}
