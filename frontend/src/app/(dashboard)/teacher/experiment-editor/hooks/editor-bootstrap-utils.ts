import { can, PERMISSIONS } from "@/lib/auth/role-permissions";
import type { AuthUser } from "@/hooks/use-auth";
import type { EducationPhase } from "@/types/subject";
export const EDITOR_ANCHORS = [
  { id: "basic", label: "1. 基础信息" },
  { id: "materials", label: "2. 实验材料" },
  { id: "steps", label: "3. 实验步骤" },
  { id: "result", label: "4. 实验结果" },
  { id: "safety", label: "5. 安全提示" },
  { id: "teachingContext", label: "6. 教学与参考" },
] as const;

export function getRolePermissions(user: AuthUser) {
  const isTeacher = can(user, PERMISSIONS.EXP_CREATE) || can(user, PERMISSIONS.TASK_GRADE);
  const isResearcher = can(user, PERMISSIONS.EXP_PUBLISH) || can(user, PERMISSIONS.SYSTEM_DICT_WRITE);
  const contentEditable = can(user, PERMISSIONS.EXP_EDIT) || can(user, PERMISSIONS.EXP_CREATE);
  return { isTeacher, isResearcher, contentEditable };
}

export function phaseLabelOf(phase: EducationPhase): string {
  if (phase === "primary") return "小学";
  if (phase === "junior") return "初中";
  return "高中";
}

function chineseNumeralToNumber(v: string): number | null {
  const s = v.trim();
  if (!s) return null;
  if (s === "十") return 10;
  if (s === "十一") return 11;
  if (s === "十二") return 12;
  const map: Record<string, number> = {
    一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9,
  };
  if (s in map) return map[s]!;
  return null;
}

function parseGradeLabelToNumber(label: string): number | null {
  const s = label.trim();
  const mNum = s.match(/(\d+)\s*年级/);
  if (mNum) return Number(mNum[1]);
  const mZh = s.match(/([一二三四五六七八九十]{1,3})年级/);
  if (mZh) return chineseNumeralToNumber(mZh[1] ?? "");
  return null;
}

function parseGradeRangeToNumbers(text: string): { start: number; end: number } | null {
  const s = text.trim();
  if (!s) return null;
  const mDigits = s.match(/(\d+)\s*[~\-]\s*(\d+)\s*年级/);
  if (mDigits) {
    const start = Number(mDigits[1]);
    const end = Number(mDigits[2]);
    if (Number.isFinite(start) && Number.isFinite(end)) return { start, end };
  }
  const mZh = s.match(/([一二三四五六七八九十]{1,3})\s*[~\-]\s*([一二三四五六七八九十]{1,3})年级/);
  if (mZh) {
    const start = chineseNumeralToNumber(mZh[1] ?? "");
    const end = chineseNumeralToNumber(mZh[2] ?? "");
    if (start && end) return { start, end };
  }
  return null;
}

export function matchAnySelectedGrade(rowGradeText: string, selectedGradeLabels: string[]): boolean {
  if (selectedGradeLabels.length === 0) return true;
  const t = rowGradeText.trim();
  if (!t) return false;
  for (const label of selectedGradeLabels) {
    if (label && t.includes(label)) return true;
  }
  const range = parseGradeRangeToNumbers(t);
  if (!range) return false;
  const nums = selectedGradeLabels
    .map(parseGradeLabelToNumber)
    .filter((x): x is number => typeof x === "number" && Number.isFinite(x));
  if (nums.length === 0) return false;
  for (const n of nums) {
    if (n >= Math.min(range.start, range.end) && n <= Math.max(range.start, range.end)) return true;
  }
  return false;
}
