"use client";

/**
 * 素材库「库内直链」多来自后端 `getDirectUrl`（MinIO path-style），浏览器无法安全访问内网端点。
 *
 * 核心逻辑：
 *   读取 NEXT_PUBLIC_MINIO_ENDPOINT（MinIO 内网端点），
 *   所有命中该端点的 URL 统一走后端 /api/materials/open 代理（带 AccessKey 鉴权），
 *   不区分生产/开发环境。
 */

/** 从环境变量读取 MinIO 内网端点，末尾无斜杠。 */
function minioInternalEndpoint(): string {
  const raw = (process.env.NEXT_PUBLIC_MINIO_ENDPOINT ?? "").trim();
  if (!raw) return "";
  return raw.replace(/\/+$/, "");
}

/** 逗号分隔的额外 host（含端口），需走代理的 MinIO 内网端点。 */
function extraProxyHosts(): string[] {
  const raw = process.env.NEXT_PUBLIC_MATERIAL_ASSET_PROXY_HOSTS?.trim() ?? "";
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim().replace(/^https?:\/\//i, ""))
    .filter(Boolean);
}

/** 将库内 MinIO 直链转为浏览器可访问路径。 */
export function materialStorageBrowserHref(rawUrl: string): string {
  const t = rawUrl.trim();
  if (!t) return "";

  const ep = minioInternalEndpoint();

  // 命中配置的内网 MinIO 端点 → 走后端代理（鉴权）
  if (ep && t.startsWith(ep)) {
    return `/api/materials/open?${new URLSearchParams({ u: t }).toString()}`;
  }

  // 兜底：额外代理列表中的内网地址
  if (t.startsWith("http://") || t.startsWith("https://")) {
    try {
      const u = new URL(t);
      const port = u.port || (u.protocol === "https:" ? "443" : "80");
      const hostPort = `${u.hostname}:${port}`;
      if (extraProxyHosts().some((h) => hostPort === h || u.host === h)) {
        return `/api/materials/open?${new URLSearchParams({ u: t }).toString()}`;
      }
    } catch {
      /* 忽略解析失败的 URL */
    }
  }

  return t;
}
