import type { ApiActor } from "@/lib/new-core-api";

import type { MediaKind } from "./types";

/** 课标视频等本地存储中引用媒体中台登记的 URI 前缀。 */
export const MEDIA_PLATFORM_REGISTRY_PREFIX = "media-platform://registry/";

export function formatMediaPlatformRegistryRef(registryId: string): string {
  return `${MEDIA_PLATFORM_REGISTRY_PREFIX}${registryId.trim()}`;
}

export function parseMediaPlatformRegistryRef(sourceUrl: string): string | null {
  if (!sourceUrl.startsWith(MEDIA_PLATFORM_REGISTRY_PREFIX)) return null;
  const id = sourceUrl.slice(MEDIA_PLATFORM_REGISTRY_PREFIX.length).trim();
  return id || null;
}

/**
 * 同源代理播放地址；`registryId` 参数名沿用历史，实际可为 **V2 `data_file.file_id`**（由 `/api/media/registry-stream` 转发至 `/v2/file/:id/presigned-url`）。
 * 传入 actor 时附带 org/user，便于与上传登记身份对齐（环境）。
 */
export function mediaRegistryStreamUrl(
  registryId: string,
  action: "view" | "download" = "view",
  actor?: Pick<ApiActor, "orgId" | "userId" | "userName" | "tenantId" | "appId">,
  options?: { variant?: "thumb_sm" },
): string {
  const q = new URLSearchParams({ registryId: registryId.trim(), action });
  if (options?.variant) q.set("variant", options.variant);
  if (actor) {
    if (actor.orgId?.trim()) q.set("orgId", actor.orgId.trim());
    if (actor.userId?.trim()) q.set("userId", actor.userId.trim());
    if (actor.userName?.trim()) q.set("userName", actor.userName.trim());
    if (actor.tenantId?.trim()) q.set("tenantId", actor.tenantId.trim());
    if (actor.appId?.trim()) q.set("appId", actor.appId.trim());
  }
  return `/api/media/registry-stream?${q.toString()}`;
}

/** 将历史 `/v1/media/stream/...` 或同源代理地址规范为 `/api/media/registry-stream`（转发至 `/v2/file/.../presigned-url`）。 */
export function normalizeMediaStreamPathToRegistryProxy(
  pathOrUrl: string | null | undefined,
  actor?: Pick<ApiActor, "orgId" | "userId" | "userName" | "tenantId" | "appId">,
): string | null {
  const t = pathOrUrl?.trim();
  if (!t) return null;
  if (t.includes("/api/media/registry-stream")) return t;
  const m = t.match(/\/v1\/media\/stream\/([^?]+)\?(.*)/);
  if (!m) return null;
  const registryId = decodeURIComponent(m[1]);
  const sp = new URLSearchParams(m[2]);
  const action = (sp.get("action") === "download" ? "download" : "view") as "view" | "download";
  const variant = sp.get("variant") === "thumb_sm" ? ("thumb_sm" as const) : undefined;
  return mediaRegistryStreamUrl(registryId, action, actor, variant ? { variant } : undefined);
}

export function mediaKindToRegistryMediaType(kind: MediaKind): "IMAGE" | "VIDEO" {
  return kind === "video" ? "VIDEO" : "IMAGE";
}
