/** 同源代理视频地址不能作为 `<img src>`（302 后为 MP4，解码失败易黑屏） */
function isRegistryStreamVideoProxy(u: string): boolean {
  return u.includes("/api/media/registry-stream");
}

/** 可作为封面 `<img src>`：明显图片后缀，或站内非 registry-stream 路径，或 materials/open */
function isLikelyRasterPosterUrl(u: string): boolean {
  const t = u.trim();
  if (!t) return false;
  if (isRegistryStreamVideoProxy(t)) return false;
  if (/\.(png|jpe?g|gif|webp|bmp|ico|avif)(\?|#|$)/i.test(t)) return true;
  if (t.startsWith("/api/materials/open")) return true;
  if (t.startsWith("/") && !t.startsWith("//")) return true;
  return false;
}

/**
 * 列表/卡片：仅透传「已是栅格图」的显式 poster；其余交给 ExpVideoPlayer 客户端抽帧。
 */
export function resolvePosterHrefFromStreamSrc(_videoSrc: string, explicitPoster?: string | null): string {
  void _videoSrc;
  const ex = explicitPoster?.trim() ?? "";
  if (ex && isLikelyRasterPosterUrl(ex)) return ex;
  return "";
}

/** @alias 产品文档中的 getVideoPoster */
export { resolvePosterHrefFromStreamSrc as getVideoPoster };
