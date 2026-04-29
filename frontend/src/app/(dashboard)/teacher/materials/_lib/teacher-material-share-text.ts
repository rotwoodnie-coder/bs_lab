import type { TeacherMaterialItem } from "@/lib/teacher-materials-api";

import { materialKindLabelZh } from "./material-preview.utils";

/** 复制到剪贴板用的结构化分享文案（含入口路径与素材编号）。 */
export function buildTeacherMaterialShareText(item: TeacherMaterialItem): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const lines: string[] = [
    "【课件素材分享】",
    `名称：${item.title}`,
    `类型：${materialKindLabelZh(item.kind)}`,
    `更新日期：${item.updatedAt}`,
  ];
  if (item.linkedExperimentTitle?.trim()) {
    lines.push(`关联实验：${item.linkedExperimentTitle.trim()}`);
  }
  if (item.experimentId?.trim()) {
    lines.push(`关联实验ID：${item.experimentId.trim()}`);
  }
  if (item.originalFilename?.trim()) {
    lines.push(`原始文件：${item.originalFilename.trim()}`);
  }
  lines.push(`素材编号：${item.materialId}`);
  if (origin) {
    lines.push(`实验素材库：${origin}/teacher/materials`);
  }
  return lines.join("\n");
}
