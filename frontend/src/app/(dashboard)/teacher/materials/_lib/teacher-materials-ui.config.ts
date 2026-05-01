/**
 * 实验素材库：侧栏筛选与新建表单共用的展示配置（单一来源）。
 */
import type { TeacherMaterialKind } from "@/lib/teacher-materials-api";

import type { KindFilterId } from "./material-filters";

export type TeacherMaterialsKindFilterRow = {
  id: "all" | string;
  label: string;
  iconKey: "all" | "word" | "ppt" | "pdf" | "image" | "video" | "audio" | "spreadsheet";
};

/** 侧栏「类型」：首项为「全部」，其余顺序即筛选按钮顺序 */
export const TEACHER_MATERIALS_KIND_FILTER: readonly TeacherMaterialsKindFilterRow[] = [
  { id: "all", label: "全部", iconKey: "all" },
  { id: "word", label: "Word", iconKey: "word" },
  { id: "ppt", label: "PPT", iconKey: "ppt" },
  { id: "pdf", label: "PDF", iconKey: "pdf" },
  { id: "image", label: "图片", iconKey: "image" },
  { id: "video", label: "视频", iconKey: "video" },
  { id: "audio", label: "音频", iconKey: "audio" },
  { id: "spreadsheet", label: "Excel", iconKey: "spreadsheet" },
] as const;

/** 新建素材：侧栏为「全部类型」时的默认类型 */
export const TEACHER_MATERIALS_DEFAULT_CREATE_KIND: TeacherMaterialKind = "word";

/** 表单内「素材类型」下拉（不含「全部」） */
export const TEACHER_MATERIALS_KIND_FORM_OPTIONS: { value: TeacherMaterialKind; label: string }[] =
  TEACHER_MATERIALS_KIND_FILTER.filter((row) => row.id !== "all").map((row) => ({
    value: row.id as TeacherMaterialKind,
    label: row.label,
  }));

export function isKnownKindFilterId(id: unknown): id is KindFilterId {
  return typeof id === "string" && id.trim().length > 0;
}

/** 与 `material_msg.status` 注释一致：y 启用，n 停用，t 草稿 */
export const TEACHER_MATERIAL_MSG_STATUS_FORM_OPTIONS: { value: string; label: string }[] = [
  { value: "t", label: "草稿（t）" },
  { value: "y", label: "启用（y）" },
  { value: "n", label: "停用（n）" },
];

export function materialMsgStatusLabel(raw: string | null | undefined): string {
  const v = (raw ?? "").trim().toLowerCase();
  if (v === "t") return "草稿";
  if (v === "y") return "启用";
  if (v === "n") return "停用";
  return raw?.trim() ? raw.trim() : "—";
}

/** 状态对应的 Badge variant */
export function materialMsgStatusVariant(raw: string | null | undefined): "secondary" | "default" | "outline" | "destructive" {
  const v = (raw ?? "").trim().toLowerCase();
  if (v === "t") return "secondary";
  if (v === "y") return "default";
  if (v === "n") return "destructive";
  return "outline";
}
