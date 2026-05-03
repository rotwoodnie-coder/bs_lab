"use client";

/**
 * 素材库资源链接解析。
 * 后端已对所有 MinIO 私有桶资源下发预签名 URL（presigned URL），前端可直接访问。
 * 本函数仅做空值兜底，不做任何代理重写或 URL 变换。
 * 不再使用 /api/materials/open 代理接口。
 */
export function materialStorageBrowserHref(rawUrl: string): string {
  const t = rawUrl.trim();
  if (!t) return "";
  return t;
}
