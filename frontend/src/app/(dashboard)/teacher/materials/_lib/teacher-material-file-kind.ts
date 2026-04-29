import type { TeacherMaterialKind } from "@/lib/teacher-materials-api";

export function fileStableKey(file: File): string {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

function ext(name: string): string {
  const i = name.lastIndexOf(".");
  if (i < 0) return "";
  return name.slice(i + 1).toLowerCase();
}

export function inferKindFromFile(file: File): TeacherMaterialKind | null {
  const mime = file.type.toLowerCase();
  const suffix = ext(file.name);
  if (
    mime.startsWith("audio/") ||
    suffix === "mp3" ||
    suffix === "wav" ||
    suffix === "m4a" ||
    suffix === "aac" ||
    suffix === "ogg" ||
    suffix === "flac"
  ) {
    return "audio";
  }
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("image/")) return "image";
  if (mime === "application/pdf" || suffix === "pdf") return "pdf";
  if (
    mime.includes("presentation") ||
    suffix === "ppt" ||
    suffix === "pptx"
  ) {
    return "ppt";
  }
  if (
    mime.includes("spreadsheet") ||
    suffix === "xls" ||
    suffix === "xlsx" ||
    suffix === "csv"
  ) {
    return "spreadsheet";
  }
  if (
    mime.includes("wordprocessingml") ||
    mime.includes("msword") ||
    suffix === "doc" ||
    suffix === "docx"
  ) {
    return "word";
  }
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
