"use client";

/**
 * 素材库资源链接解析。
 * 后端已对所有 MinIO 私有桶资源下发预签名 URL（presigned URL），前端可直接访问。
 * 本层无需再做代理重写，仅做空值兜底。
 */
export function materialStorageBrowserHref(rawUrl: string): string {
  const t = rawUrl.trim();
  if (!t) return "";
  return t;
}
