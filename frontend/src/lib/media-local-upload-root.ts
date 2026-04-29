import path from "node:path";

/**
 * 与后端 `backend/src/domain/media/persistence/media-local-upload-root.ts` 逻辑保持一致：
 * 相对路径默认落到仓库根 `uploads/`，与核心 API 拉流共用同一磁盘目录。
 */
export function resolveMediaLocalUploadRoot(): string {
  const raw = (process.env.MEDIA_LOCAL_UPLOAD_ROOT ?? "uploads").trim().replace(/\/+$/, "") || "uploads";
  if (path.isAbsolute(raw)) {
    return raw;
  }
  const cwd = process.cwd();
  const normalized = cwd.replace(/\\/g, "/");
  const repoRoot =
    /[/\\]frontend$/i.test(normalized) || /[/\\]backend$/i.test(normalized)
      ? path.resolve(cwd, "..")
      : cwd;
  return path.resolve(repoRoot, raw);
}
