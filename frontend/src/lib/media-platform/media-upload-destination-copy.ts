export type MediaStorageMode = "local" | "minio";

/** 上传过程中（浏览器 → 应用服务）的简短说明 */
export function mediaUploadProgressHint(percent: number): string {
  const p = Math.max(0, Math.min(100, Math.round(percent)));
  return `${p}%：文件正发往应用服务器；完成后由服务端写入配置的目标存储。`;
}

export function mediaUploadSuccessDescription(
  storageMode?: MediaStorageMode,
  reused?: boolean,
): string {
  const base =
    storageMode === "minio"
      ? "已写入对象存储（MinIO，S3 兼容）。"
      : "已写入应用服务器本地存储目录。";
  if (reused) return `相同内容已存在，已复用已有 data_file，未重复写入存储。${base}`;
  return base;
}
