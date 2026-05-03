/**
 * 响应层递归预签名工具
 *
 * 在 server.ts 层面统一处理，确保所有返回前端的 JSON 响应中
 * 白名单字段的 MinIO URL 都经过 presignPublicUrl() 签名。
 *
 * 白名单集中管理，新增 URL 字段只需在此文件加一行。
 */
import { presignPublicUrl } from "../infrastructure/storage/s3-storage.ts";

/**
 * 已知 MinIO URL 字段白名单（camelCase，与 rowTo* 后的字段名一致）
 *
 * 新增实体时若包含 MinIO 文件 URL，必须在此登记。
 * 命名来自对应 DB 列的 camelCase 映射（如 `logo_url` → `logoUrl`）。
 */
const MINIO_URL_FIELDS = new Set<string>([
  // ── exp_msg（实验主表）──
  "simulatorUrl", "logoUrl", "coverVideoUrl",

  // ── exp_video / exp_pic / exp_material（实验子表）──
  "videoUrl", "picUrl", "mainPicUrl",

  // ── data_file（文件管理）──
  "fileUrl", "ownerAvatarUrl",

  // ── sys_user（用户）──
  "userLogo",

  // ── social（评价）──
  "evaluateUrl",

  // ── feedback（反馈图片）──
  "feedbackPicUrl",
]);

/**
 * 递归遍历响应对象，找到白名单中的 URL 字段并执行预签名。
 *
 * @param obj - 待处理的响应 data（可以是对象、数组、基本类型）
 * @returns 预签名完成后的新对象（不修改原始对象）
 */
export async function deepPresignResponse<T>(obj: T): Promise<T> {
  if (!obj || typeof obj !== "object") return obj;

  if (Array.isArray(obj)) {
    return Promise.all(obj.map((item) => deepPresignResponse(item))) as unknown as T;
  }

  const result = { ...obj } as Record<string, unknown>;
  const tasks: Promise<void>[] = [];

  for (const key of Object.keys(result)) {
    const val = result[key];

    // 精确匹配白名单字段
    if (MINIO_URL_FIELDS.has(key) && typeof val === "string") {
      const urlStr = val as string;
      tasks.push(
        (async () => {
          result[key] = await presignPublicUrl(urlStr, 3600);
        })(),
      );
    } else if (typeof val === "object" && val !== null) {
      // 递归处理嵌套对象
      tasks.push(
        (async () => {
          result[key] = await deepPresignResponse(val);
        })(),
      );
    }
  }

  await Promise.all(tasks);
  return result as T;
}
