import type { LucideIcon } from "lucide-react";
import {
  Atom,
  Beaker,
  BookOpen,
  Calculator,
  Dumbbell,
  FlaskConical,
  Globe2,
  History,
  Languages,
  Leaf,
  MapPin,
  Music,
  Palette,
  PenLine,
  Rocket,
  Scale,
  ShieldCheck,
  Sprout,
  Video,
} from "@bs-lab/ui/icons";

/**
 * 与产品参考一致的全局学科树图标：`matchIconKey` 的 `discipline.*` / `domain.*` → Lucide。
 * 科学→火箭、物理→原子、化学→烧杯、生物→叶；老师课程→幼苗、学生作品→摄像机。
 */
export function lucideIconForTreeIconKey(iconKey: string | null): LucideIcon | null {
  if (!iconKey) return null;
  if (iconKey.startsWith("discipline.")) {
    if (iconKey.includes("science")) return Rocket;
    if (iconKey.includes("physics")) return Atom;
    if (iconKey.includes("chemistry")) return Beaker;
    if (iconKey.includes("biology")) return Leaf;
    if (iconKey.includes("chinese")) return PenLine;
    if (iconKey.includes("english")) return Languages;
    if (iconKey.includes("math")) return Calculator;
    if (iconKey.includes("geography")) return Globe2;
    if (iconKey.includes("history")) return History;
    if (iconKey.includes("politics")) return Scale;
    if (iconKey.includes("music")) return Music;
    if (iconKey.includes("art")) return Palette;
    if (iconKey.includes("pe")) return Dumbbell;
    return FlaskConical;
  }
  if (iconKey.startsWith("domain.")) {
    if (iconKey.includes("teacherCourses")) return Sprout;
    if (iconKey.includes("studentWorks")) return Video;
    if (iconKey.includes("experiments")) return FlaskConical;
    if (iconKey.includes("standards")) return BookOpen;
    if (iconKey.includes("resources")) return MapPin;
    if (iconKey.includes("rbac")) return ShieldCheck;
    return BookOpen;
  }
  return null;
}

/** 维度树等仅有中文名、无 iconKey 时的兜底（与上表一致） */
export function lucideIconForSubjectLabel(label: string): LucideIcon {
  const t = label.trim();
  if (/科学|自然/.test(t)) return Rocket;
  if (/物理/.test(t)) return Atom;
  if (/化学/.test(t)) return Beaker;
  if (/生物/.test(t)) return Leaf;
  if (/数学|代数|几何/.test(t)) return Calculator;
  if (/语文|文学|阅读/.test(t)) return PenLine;
  if (/英语|外语/.test(t)) return Languages;
  if (/地理/.test(t)) return Globe2;
  if (/历史/.test(t)) return History;
  if (/政治|道德|法治/.test(t)) return Scale;
  if (/音乐/.test(t)) return Music;
  if (/美术|艺术/.test(t)) return Palette;
  if (/体育/.test(t)) return Dumbbell;
  if (/信息|技术|编程|计算机|steam|创客/i.test(t)) return FlaskConical;
  return BookOpen;
}
