/**
 * 历史入口：本地 Minio 等环境不支持云厂商 URL 截帧参数，此处不再拼接任何查询串。
 * 列表封面改由 `video-frame-capture.ts` 客户端抽帧 + sessionStorage 缓存。
 */
export function inferPosterFromVideoUrl(_src: string): string {
  void _src;
  return "";
}
