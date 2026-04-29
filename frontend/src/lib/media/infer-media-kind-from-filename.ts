import type { TeacherMaterialKind } from "@/lib/teacher-materials-api";

import type { MediaKind } from "@/lib/media-platform/types";
import {
  IMAGE_FILE_EXTENSIONS,
  inferTeacherMaterialKindFromExtension,
  VIDEO_FILE_EXTENSIONS,
} from "@/lib/media/extension-groups";

export function extFromFilename(name: string): string {
  const base = name.trim();
  const i = base.lastIndexOf(".");
  if (i <= 0) return "";
  return base
    .slice(i + 1)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

export function inferBinaryMediaKindFromExtension(extRaw: string): MediaKind | null {
  const ext = extRaw.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!ext) return null;
  if (VIDEO_FILE_EXTENSIONS.has(ext)) return "video";
  if (IMAGE_FILE_EXTENSIONS.has(ext)) return "image";
  return null;
}

/** 由扩展名推断课件/素材类型；无法识别时返回 null（保留用户选择） */
export function inferTeacherMaterialKindFromFilename(filename: string): TeacherMaterialKind | null {
  return inferTeacherMaterialKindFromExtension(extFromFilename(filename));
}

/**
 * 手选类型与文件名扩展不一致时，以扩展名为准（托底），避免登记到错误的 data_file_type / MIME。
 */
export function reconcileTeacherMaterialKindFromFilename(
  selected: TeacherMaterialKind,
  filename: string,
): TeacherMaterialKind {
  const inferred = inferTeacherMaterialKindFromFilename(filename);
  if (!inferred) return selected;
  return inferred !== selected ? inferred : selected;
}

export function inferBinaryMediaKindFromFilename(filename: string): MediaKind | null {
  return inferBinaryMediaKindFromExtension(extFromFilename(filename));
}

export function reconcileBinaryMediaKindFromFilename(selected: MediaKind, filename: string): MediaKind {
  const inferred = inferBinaryMediaKindFromFilename(filename);
  if (!inferred) return selected;
  return inferred !== selected ? inferred : selected;
}
