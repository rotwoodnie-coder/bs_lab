import type { TeacherMaterialKind } from "@/lib/teacher-materials-api";

export function fileStableKey(file: File): string {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

function ext(name: string): string {
  const i = name.lastIndexOf(".");
  if (i < 0) return "";
  return name.slice(i + 1).toLowerCase();
}

/** 常见图片扩展名（MIME 不可用时兜底） */
const IMG_EXTS = new Set(["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg", "ico", "tif", "tiff", "avif", "heic", "heif"]);
/** 常见视频扩展名 */
const VID_EXTS = new Set(["mp4", "webm", "mov", "mkv", "avi", "m4v", "flv", "wmv", "mpeg", "mpg"]);
/** 常见音频扩展名 */
const AUD_EXTS = new Set(["mp3", "wav", "m4a", "aac", "ogg", "flac", "wma", "opus"]);

export function inferKindFromFile(file: File): TeacherMaterialKind | null {
  const mime = file.type.toLowerCase();
  const suffix = ext(file.name);

  // MIME 优先
  if (mime.startsWith("audio/")) return "audio";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("image/")) return "image";
  if (mime === "application/pdf") return "pdf";
  if (mime.includes("presentation")) return "ppt";
  if (mime.includes("spreadsheet")) return "spreadsheet";
  if (mime.includes("wordprocessingml") || mime.includes("msword")) return "word";

  // MIME 不可用时以扩展名兜底
  if (IMG_EXTS.has(suffix)) return "image";
  if (VID_EXTS.has(suffix)) return "video";
  if (AUD_EXTS.has(suffix)) return "audio";
  if (suffix === "pdf") return "pdf";
  if (suffix === "ppt" || suffix === "pptx") return "ppt";
  if (suffix === "xls" || suffix === "xlsx" || suffix === "csv") return "spreadsheet";
  if (suffix === "doc" || suffix === "docx") return "word";

  return null;
}

export function inferUniformKind(files: File[]): TeacherMaterialKind | null {
  const kinds = new Set<TeacherMaterialKind>();
  for (const file of files) {
    const kind = inferKindFromFile(file);
    if (!kind) return null;
    kinds.add(kind);
    if (kinds.size > 1) return null;
  }
  return kinds.values().next().value ?? null;
}
