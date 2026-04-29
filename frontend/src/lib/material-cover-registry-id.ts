import { parseMediaPlatformRegistryRef } from "@/lib/media-platform/registry-ref";

/** 从材料照片 URL（代理流地址或 media-platform 引用）解析封面登记 ID，用于写入主档 `cover_registry_id`。 */
export function parseCoverRegistryIdFromPhotoUrl(photoUrl: string): string | null {
  const t = photoUrl.trim();
  if (!t) return null;
  const fromRef = parseMediaPlatformRegistryRef(t);
  if (fromRef) return fromRef;
  try {
    const base = typeof window !== "undefined" ? window.location.origin : "https://placeholder.local";
    const u = new URL(t, base);
    const id = u.searchParams.get("registryId");
    if (id?.trim()) return id.trim();
  } catch {
    return null;
  }
  return null;
}
