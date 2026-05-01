"use client";

/**
 * 素材库「库内直链」多来自后端 `getDirectUrl`（MinIO path-style），浏览器无法安全访问内网/localhost 端点。
 * 对命中规则的 URL 走同源 `/api/materials/open`，由服务端校验前缀后从 MinIO **流式直出**（避免 302 二次往返）。
 */

/** 逗号分隔的额外 host（含端口），与 `MINIO_ENDPOINT` 写入库但浏览器需代理时一致，如 `192.168.1.10:9000`。 */
function extraProxyHosts(): string[] {
  const raw = process.env.NEXT_PUBLIC_MATERIAL_ASSET_PROXY_HOSTS?.trim() ?? "";
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim().replace(/^https?:\/\//i, ""))
    .filter(Boolean);
}

/** 是否应走同源代理（避免 img / window.open 直连不可达的 MinIO 内网地址）。 */
export function shouldProxyMaterialStorageUrl(href: string): boolean {
  const t = href.trim();
  if (!t.startsWith("http://") && !t.startsWith("https://")) return false;
  try {
    const u = new URL(t);
    const port = u.port || (u.protocol === "https:" ? "443" : "80");
    const hostPort = `${u.hostname}:${port}`;
    if (u.hostname === "localhost" && port === "9000") return true;
    if (u.hostname === "127.0.0.1" && port === "9000") return true;
    if (u.hostname === "host.docker.internal" && port === "9000") return true;
    // 库内写入的私有桶直链（path-style），含 `v2/{owner}/…`（不限 bucket 名称），走同源代理
    if (u.pathname.includes("/bslab-media") && u.pathname.includes("/v2/")) return true;
    return extraProxyHosts().some((h) => hostPort === h || u.host === h);
  } catch {
    return false;
  }
}

/** 将库内 MinIO 直链转为同源代理路径；其它 URL 原样返回（含 `/` 开头的站内路径）。 */
export function materialStorageBrowserHref(href: string): string {
  const t = href.trim();
  if (!t) return t;
  if (!shouldProxyMaterialStorageUrl(t)) return t;
  return `/api/materials/open?${new URLSearchParams({ u: t }).toString()}`;
}
