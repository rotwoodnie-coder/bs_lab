/**
 * `data_file_type` 宪法级常量 — 与后端 `FILE_KIND_MAP` 保持 100% 同步。
 *
 * 真源：`backend/src/infrastructure/repositories/v2-file-repository.ts`
 * 迁移：`database/migrations/0050_normalize_data_file_type.sql`
 *
 * 前端所有引用教师素材 kind 的地方应优先导入本模块，
 * 避免硬编码字符串导致的隐性漂移。
 */

/** 与后端 `FILE_KIND_MAP` 的 key 完全一致 */
export const FILE_KIND_KEYS = [
  "word",
  "ppt",
  "pdf",
  "image",
  "video",
  "audio",
  "spreadsheet",
] as const;

export type FileKind = (typeof FILE_KIND_KEYS)[number];

/** kind → FT_ 映射（值仅供参考，禁止当路由参数 / API 请求体使用 `FT_` 值） */
export const FILE_KIND_MAP: Record<FileKind, string> = {
  word: "FT_Document",
  ppt: "FT_Ppt",
  pdf: "FT_Pdf",
  image: "FT_Image",
  video: "FT_Video",
  audio: "FT_Audio",
  spreadsheet: "FT_Spreadsheet",
} as const;

/** FileKind 集合，用于运行时检查 */
export const FILE_KIND_SET = new Set<string>(FILE_KIND_KEYS);

/** 判断字符串是否为合法的 FileKind */
export function isFileKind(v: string): v is FileKind {
  return FILE_KIND_SET.has(v);
}
