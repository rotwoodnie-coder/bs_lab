/**
 * 库内媒体直链（如 MinIO path-style）→ 浏览器可加载地址的统一入口。
 * 默认恒等；宿主应用通过 `setDefaultMediaDisplaySrcResolver` 注入同源代理等逻辑。
 */

let defaultResolver: (url: string) => string = (u) => u;

export function setDefaultMediaDisplaySrcResolver(fn: (url: string) => string): void {
  defaultResolver = fn;
}

/** 对 `src` / `posterSrc` 等在展示前调用（`MediaPreview`、表单缩略图等） */
export function resolveMediaDisplaySrc(url: string): string {
  if (url == null || typeof url !== "string") return "";
  const t = url.trim();
  if (!t) return "";
  return defaultResolver(t);
}
