import type { DictOption } from "@/lib/v2/v2-dict-adapter";
import type { V2SysOrgItem } from "@/lib/v2/v2-sys-api";
import { V2_ORG_TYPE_IDS } from "@/lib/v2/v2-org-type-constants";

import { resolveOrgTypeModeById, resolveOrgTypeUiMode } from "./org-type-ui-mode";

export type GradeOptionWithLevel = DictOption & { levelId: string };

export { V2_ORG_TYPE_IDS as ORG_TYPE_IDS } from "@/lib/v2/v2-org-type-constants";
export type { V2OrgTypeId as OrgTypeId } from "@/lib/v2/v2-org-type-constants";

export const DEFAULT_CLASS_COUNT = 4;

/** 年级数字段（字典） */
export const STAGE_RANGES = {
  primary: { label: "小学", stageName: "小学", from: 1, to: 5 },
  junior: { label: "初中", stageName: "初中", from: 6, to: 9 },
  senior: { label: "高中", stageName: "高中", from: 10, to: 12 },
} as const;

export type StageKey = "primary" | "junior" | "senior";

export type Row = { gradeId: string; offered: boolean; classCount: number };

function typeModeForOrg(org: V2SysOrgItem, orgTypeLabels: Record<string, string>) {
  const name = org.orgTypeId ? orgTypeLabels[org.orgTypeId] : null;
  return resolveOrgTypeModeById(org.orgTypeId) ?? resolveOrgTypeUiMode(name);
}

// ─── 已有导出 ────────────────────────────────────────────

export function isOrgTypeId(value: string | null | undefined): value is string {
  return Object.values(V2_ORG_TYPE_IDS).includes(value as typeof V2_ORG_TYPE_IDS[keyof typeof V2_ORG_TYPE_IDS]);
}

export function countClassLikeChildrenForGrade(
  childOrgs: V2SysOrgItem[],
  gradeId: string,
  orgTypeLabels: Record<string, string>,
): number {
  return childOrgs.filter(
    (c) => c.gradeId === gradeId && typeModeForOrg(c, orgTypeLabels) === "class",
  ).length;
}

export function pickClassOrgTypeId(orgTypeOptions: DictOption[]): string | null {
  const hit = orgTypeOptions.find((t) => t.id === V2_ORG_TYPE_IDS.class || resolveOrgTypeUiMode(t.name) === "class");
  return hit?.id ?? null;
}

export function pickGradeOrgTypeId(orgTypeOptions: DictOption[]): string | null {
  const hit = orgTypeOptions.find((t) => t.id === V2_ORG_TYPE_IDS.grade || resolveOrgTypeUiMode(t.name) === "grade");
  return hit?.id ?? null;
}

export function pickSchoolOrgTypeId(orgTypeOptions: DictOption[]): string | null {
  const hit = orgTypeOptions.find((t) => t.id === V2_ORG_TYPE_IDS.school || resolveOrgTypeUiMode(t.name) === "school");
  return hit?.id ?? null;
}

export function collectClassLikeChildNames(childOrgs: V2SysOrgItem[], orgTypeLabels: Record<string, string>): Set<string> {
  const s = new Set<string>();
  for (const c of childOrgs) {
    if (typeModeForOrg(c, orgTypeLabels) === "class") s.add(c.orgName);
  }
  return s;
}

export function nextClassOrgName(gradeName: string, used: Set<string>): string {
  let n = 1;
  let candidate = `${gradeName}${n}班`;
  while (used.has(candidate)) {
    n += 1;
    candidate = `${gradeName}${n}班`;
  }
  used.add(candidate);
  return candidate;
}

export function levelNameById(levels: DictOption[], levelId: string): string {
  return levels.find((l) => l.id === levelId)?.name ?? "";
}

export function levelKeyFromName(levelName: string): StageKey | null {
  if (levelName.includes("小学")) return "primary";
  if (levelName.includes("初中")) return "junior";
  if (levelName.includes("高中")) return "senior";
  return null;
}

export function levelKeyFromId(levels: DictOption[], levelId: string): StageKey | null {
  return levelKeyFromName(levelNameById(levels, levelId));
}

// ─── 新增：年级/班级 Diff 辅助 ──────────────────────────

export function gradeNumberFromId(gradeId: string): number | null {
  const m = String(gradeId).match(/(\d{1,2})$/);
  if (!m) return null;
  const n = Number.parseInt(m[1]!, 10);
  return Number.isFinite(n) ? n : null;
}

export function gradeNumberFromName(name: string): number | null {
  const n = name.trim();
  if (/预备/.test(n)) return 6;
  if (/(^|[^a-zA-Z0-9])初一/.test(n)) return 7;
  if (/(^|[^a-zA-Z0-9])初二/.test(n)) return 8;
  if (/(^|[^a-zA-Z0-9])初三/.test(n)) return 9;
  if (/(^|[^a-zA-Z0-9])高一/.test(n)) return 10;
  if (/(^|[^a-zA-Z0-9])高二/.test(n)) return 11;
  if (/(^|[^a-zA-Z0-9])高三/.test(n)) return 12;
  const arabic = n.match(/(\d{1,2})/);
  if (arabic) {
    const v = Number.parseInt(arabic[1]!, 10);
    return Number.isFinite(v) ? v : null;
  }
  if (n.includes("十一")) return 11;
  if (n.includes("十二")) return 12;
  const map: Record<string, number> = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10 };
  if (n.includes("十")) return 10;
  for (const [k, v] of Object.entries(map)) {
    if (n.includes(k)) return v;
  }
  return null;
}

export function stageOwnsGrade(stage: StageKey, grade: GradeOptionWithLevel | undefined, gradeName: string): boolean {
  if (!grade) return false;
  const { from, to } = STAGE_RANGES[stage];
  const n = gradeNumberFromId(grade.id) ?? gradeNumberFromName(gradeName);
  if (n == null) return false;
  return n >= from && n <= to;
}

export function isClassNode(n: V2SysOrgItem, classTypeId: string): boolean {
  return Boolean(n.gradeId) && n.orgTypeId === classTypeId;
}

export function isGradeNode(n: V2SysOrgItem, gradeTypeId: string): boolean {
  return Boolean(n.gradeId) && n.orgTypeId === gradeTypeId;
}

export function pickGradeNodeWithClasses(
  childOrgs: V2SysOrgItem[],
  gradeId: string,
  classTypeId: string,
): V2SysOrgItem | undefined {
  const withClasses = childOrgs.find(
    (n) => n.gradeId === gradeId && childOrgs.some((c) => c.parentOrgId === n.orgId && c.orgTypeId === classTypeId),
  );
  return withClasses ?? childOrgs.find((n) => n.gradeId === gradeId);
}

export function sortGrades(rows: GradeOptionWithLevel[]): GradeOptionWithLevel[] {
  return [...rows].sort((a, b) => ((a.sortOrder ?? 0) - (b.sortOrder ?? 0)) || a.name.localeCompare(b.name, "zh-CN"));
}

export function groupRowsByStage(
  rows: Row[],
  gradeInfoById: Map<string, GradeOptionWithLevel>,
  gradeLabels: Record<string, string>,
  levelOptions: DictOption[],
): { primary: Row[]; junior: Row[]; senior: Row[]; other: Row[] } {
  const primary: Row[] = [];
  const junior: Row[] = [];
  const senior: Row[] = [];
  const other: Row[] = [];
  for (const r of rows) {
    const g = gradeInfoById.get(r.gradeId);
    const gradeName = String(gradeLabels[r.gradeId] ?? g?.name ?? "");
    const n = g ? gradeNumberFromId(g.id) ?? gradeNumberFromName(gradeName) : null;
    if (n != null) {
      if (n >= 1 && n <= 5) primary.push(r);
      else if (n >= 6 && n <= 9) junior.push(r);
      else if (n >= 10 && n <= 12) senior.push(r);
      else other.push(r);
      continue;
    }
    const levelName = g ? String(levelOptions.find((l) => l.id === String(g.levelId))?.name ?? "") : "";
    const key = levelKeyFromName(levelName);
    if (key === "primary") primary.push(r);
    else if (key === "junior") junior.push(r);
    else if (key === "senior") senior.push(r);
    else other.push(r);
  }
  return { primary, junior, senior, other };
}
