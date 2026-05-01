"use client";

/**
 * 素材库「库内直链」多来自后端 `getDirectUrl`（MinIO path-style），浏览器无法安全访问内网端点。
 *
 * 核心逻辑：
 *   1. 读取 NEXT_PUBLIC_MINIO_ENDPOINT（MinIO 内网端点，开发=localhost，生产=内网 IP）
 *   2. 读取 NEXT_PUBLIC_MINIO_PUBLIC_URL（生产环境公网域名，开发环境为空）
 *   3. 命中内网端点时：
 *      - 有 PUBLIC_URL → 截取相对路径 /桶名/...，Nginx 直连 MinIO
 *      - 无 PUBLIC_URL → 原样返回，浏览器直接访问 MinIO 端点（开发环境）
 *   4. 其他内网 MinIO 地址走 /api/materials/open 后端代理兜底
 */

/** 从环境变量读取 MinIO 内网端点，末尾无斜杠。开发 / 生产通用。 */
function minioInternalEndpoint(): string {
  const raw = (process.env.NEXT_PUBLIC_MINIO_ENDPOINT ?? "").trim();
  if (!raw) return "";
  return raw.replace(/\/+$/, "");
}

/** 生产环境公网域名，有值说明有 Nginx 代理 MinIO，浏览器不应直连内网 IP。 */
function minioPublicUrl(): string {
  return (process.env.NEXT_PUBLIC_MINIO_PUBLIC_URL ?? "").trim();
}

/** 逗号分隔的额外 host（含端口），与 `MINIO_ENDPOINT` 写入库但浏览器需代理时一致。 */
function extraProxyHosts(): string[] {
  const raw = process.env.NEXT_PUBLIC_MATERIAL_ASSET_PROXY_HOSTS?.trim() ?? "";
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim().replace(/^https?:\/\//i, ""))
    .filter(Boolean);
}

/**
 * 检测 URL 是否指向不可直连的 MinIO 内网地址。
 * 匹配规则：
 *   - 以 NEXT_PUBLIC_MINIO_ENDPOINT 开头（内网端点已在配置中登记）
 *   - 或命中 extraProxyHosts 列表中的 host:port
 */
export function shouldProxyMaterialStorageUrl(href: string): boolean {
  const t = href.trim();
  if (!t.startsWith("http://") && !t.startsWith("https://")) return false;

  const ep = minioInternalEndpoint();
  if (ep && t.startsWith(ep)) return true;

  try {
    const u = new URL(t);
    const port = u.port || (u.protocol === "https:" ? "443" : "80");
    const hostPort = `${u.hostname}:${port}`;
    return extraProxyHosts().some((h) => hostPort === h || u.host === h);
  } catch {
    return false;
  }
}

/** 将库内 MinIO 直链转为同源可访问路径；其它 URL 原样返回（含 `/` 开头的站内路径）。 */
export function materialStorageBrowserHref(rawUrl: string): string {
  const t = rawUrl.trim();
  if (!t) return "";

  const ep = minioInternalEndpoint();
  if (!ep) {
    // 无 MinIO 端点配置，无法判断是否需代理
    return t;
  }

  // 命中内网端点
  if (t.startsWith(ep)) {
    const publicUrl = minioPublicUrl();
    if (publicUrl) {
      // 生产环境：有公网域名，截取相对路径由 Nginx 直连 MinIO
      return t.slice(ep.length); // → /桶名/剩余路径
    }
    // 开发环境：浏览器可直接访问 MinIO 端点
    return t;
  }

  // 兜底：其他内网 MinIO 地址走后端代理
  if (shouldProxyMaterialStorageUrl(t)) {
    return `/api/materials/open?${new URLSearchParams({ u: t }).toString()}`;
  }

  return t;
}
