import type { TreeNodeMeta } from "@/types/tree";

export type IconMatchResult = {
  iconKey: string;
  reason: string;
};

function includesAny(text: string, keywords: readonly string[]) {
  return keywords.some((k) => text.includes(k));
}

/**
 * Generic icon matcher for arbitrary trees.
 * - Prefers explicit meta.iconKey or node.iconKey in app layer.
 * - Falls back to keyword-based matching for broad scenarios.
 */
export function matchIconKey(label: string, meta?: TreeNodeMeta, nodeIconKey?: string): IconMatchResult | null {
  const explicitNode = nodeIconKey?.trim();
  if (explicitNode) return { iconKey: explicitNode, reason: "node.iconKey" };

  const explicit = (meta?.iconKey as string | undefined)?.trim();
  if (explicit) return { iconKey: explicit, reason: "meta.iconKey" };

  const t = label.trim();
  if (!t) return null;

  if (includesAny(t, ["小学", "幼儿"])) return { iconKey: "phase.primary", reason: "phase(primary)" };
  if (includesAny(t, ["初中"])) return { iconKey: "phase.junior", reason: "phase(junior)" };
  if (includesAny(t, ["高中"])) return { iconKey: "phase.senior", reason: "phase(senior)" };

  if (includesAny(t, ["科学", "自然"])) return { iconKey: "discipline.science", reason: "discipline(science)" };
  if (includesAny(t, ["物理"])) return { iconKey: "discipline.physics", reason: "discipline(physics)" };
  if (includesAny(t, ["化学"])) return { iconKey: "discipline.chemistry", reason: "discipline(chemistry)" };
  if (includesAny(t, ["生物"])) return { iconKey: "discipline.biology", reason: "discipline(biology)" };

  if (includesAny(t, ["数学", "代数", "几何"])) return { iconKey: "discipline.math", reason: "discipline(math)" };
  if (includesAny(t, ["语文", "文学", "阅读"])) return { iconKey: "discipline.chinese", reason: "discipline(chinese)" };
  if (includesAny(t, ["英语", "外语"])) return { iconKey: "discipline.english", reason: "discipline(english)" };
  if (includesAny(t, ["地理"])) return { iconKey: "discipline.geography", reason: "discipline(geography)" };
  if (includesAny(t, ["历史"])) return { iconKey: "discipline.history", reason: "discipline(history)" };
  if (includesAny(t, ["政治", "道德", "法治"])) return { iconKey: "discipline.politics", reason: "discipline(politics)" };
  if (includesAny(t, ["音乐"])) return { iconKey: "discipline.music", reason: "discipline(music)" };
  if (includesAny(t, ["美术", "艺术"])) return { iconKey: "discipline.art", reason: "discipline(art)" };
  if (includesAny(t, ["体育"])) return { iconKey: "discipline.pe", reason: "discipline(pe)" };

  if (includesAny(t, ["老师课程", "教师课程"])) return { iconKey: "domain.teacherCourses", reason: "domain(teacherCourses)" };
  if (includesAny(t, ["学生作品"])) return { iconKey: "domain.studentWorks", reason: "domain(studentWorks)" };

  if (includesAny(t, ["课标", "标准"])) return { iconKey: "domain.standards", reason: "domain(standards)" };
  if (includesAny(t, ["实验", "任务"])) return { iconKey: "domain.experiments", reason: "domain(experiments)" };
  if (includesAny(t, ["资源", "材料"])) return { iconKey: "domain.resources", reason: "domain(resources)" };
  if (includesAny(t, ["用户", "权限", "角色"])) return { iconKey: "domain.rbac", reason: "domain(rbac)" };

  if (includesAny(t, ["一年级", "二年级", "三年级", "四年级", "五年级", "六年级", "七年级", "八年级", "九年级"])) {
    return { iconKey: "grade.k12", reason: "grade(k12)" };
  }
  if (includesAny(t, ["十年级", "十一年级", "十二年级"])) return { iconKey: "grade.k12", reason: "grade(k12)" };

  return null;
}

