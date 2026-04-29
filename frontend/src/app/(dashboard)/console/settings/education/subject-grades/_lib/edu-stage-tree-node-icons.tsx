"use client";

import * as React from "react";
import { GraduationCap, Layers, Leaf, Microscope } from "@bs-lab/ui/icons";

/** 将后台相对路径规范为可请求的 URL（与学科图标一致加前导 `/`） */
export function resolveEduIconPublicUrl(iconPath: string | null | undefined): string | null {
  const t = iconPath?.trim();
  if (!t) return null;
  if (t.startsWith("http://") || t.startsWith("https://")) return t;
  return t.startsWith("/") ? t : `/${t}`;
}

/** 学段：有后台 `icon_path` 用图；否则小学/初中/高中用叶、显微镜、学位帽 */
export function EduStageLevelIcon(props: { label: string; levelIconPath?: string | null; className?: string }) {
  const src = resolveEduIconPublicUrl(props.levelIconPath);
  const cls = props.className ?? "size-5";
  if (src) {
    return <img src={src} alt="" className={`${cls} object-contain`} />;
  }
  const lb = props.label;
  if (lb.includes("小学")) return <Leaf className={`${cls} text-primary`} />;
  if (lb.includes("初中")) return <Microscope className={`${cls} text-primary`} />;
  if (lb.includes("高中")) return <GraduationCap className={`${cls} text-primary`} />;
  return <Leaf className={`${cls} text-primary`} />;
}

/**
 * 年级节点默认图标：`Layers`（分层/递进），与学段三套图标区分度高、语义清晰。
 * 若日后 `data_school_grade` 提供 icon_path，可在此扩展为优先读库。
 */
export function EduStageGradeIcon(props: { className?: string }) {
  return <Layers className={props.className ?? "size-3.5 text-muted-foreground"} aria-hidden />;
}
