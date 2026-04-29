import type { CurriculumStandardRow } from "@/types/curriculum-standard";

/** 与 `GRADE_OPTIONS` 文案一致，用于树节点与筛选 */
export const GRADES_BY_PHASE: Record<"小学" | "初中" | "高中", readonly string[]> = {
  小学: ["一年级", "二年级", "三年级", "四年级", "五年级"],
  初中: ["六年级", "七年级", "八年级", "九年级"],
  高中: ["十年级", "十一年级", "十二年级"],
} as const;

export const PHASE_ROOTS = ["小学", "初中", "高中"] as const;

export const PHASE_UNSPECIFIED = "未填学段";

const CN_DIGIT: Record<string, number> = {
  一: 1,
  二: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  七: 7,
  八: 8,
  九: 9,
  十: 10,
};

const GRADE_LABEL_TO_NUM: Record<string, number> = {
  一年级: 1,
  二年级: 2,
  三年级: 3,
  四年级: 4,
  五年级: 5,
  六年级: 6,
  七年级: 7,
  八年级: 8,
  九年级: 9,
  十年级: 10,
  十一年级: 11,
  十二年级: 12,
  // Back-compat aliases (旧数据/文本仍可能出现)
  高一: 10,
  高二: 11,
  高三: 12,
};

export function gradeLabelToOrdinal(label: string): number | null {
  return GRADE_LABEL_TO_NUM[label] ?? null;
}

export function phaseForOrdinal(n: number): "小学" | "初中" | "高中" | null {
  if (n >= 1 && n <= 5) return "小学";
  if (n >= 6 && n <= 9) return "初中";
  if (n >= 10 && n <= 12) return "高中";
  return null;
}

function addGradesFromText(text: string, into: Set<number>): void {
  if (!text) return;
  const t = text.trim();
  if (!t) return;

  if (/十年级/.test(t) || /高一/.test(t)) into.add(10);
  if (/十一年级/.test(t) || /高二/.test(t)) into.add(11);
  if (/十二年级/.test(t) || /高三/.test(t)) into.add(12);

  for (const [label, n] of Object.entries(GRADE_LABEL_TO_NUM)) {
    if (label === "高一" || label === "高二" || label === "高三") continue;
    if (t.includes(label)) into.add(n);
  }

  let m: RegExpExecArray | null;
  const rangeNum = /(\d+)\s*~\s*(\d+)年级/g;
  while ((m = rangeNum.exec(t)) !== null) {
    const a = Number.parseInt(m[1], 10);
    const b = Number.parseInt(m[2], 10);
    if (!Number.isFinite(a) || !Number.isFinite(b)) continue;
    const lo = Math.min(a, b);
    const hi = Math.max(a, b);
    for (let i = lo; i <= hi; i++) {
      if (i >= 1 && i <= 12) into.add(i);
    }
  }

  const rangeCn = /([一二三四五六七八九])\s*~\s*([一二三四五六七八九])年级/g;
  while ((m = rangeCn.exec(t)) !== null) {
    const lo = CN_DIGIT[m[1]!];
    const hi = CN_DIGIT[m[2]!];
    if (lo == null || hi == null) continue;
    const a = Math.min(lo, hi);
    const b = Math.max(lo, hi);
    for (let i = a; i <= b; i++) into.add(i);
  }

  const rangeCn10 = /(十|十一|十二)\s*~\s*(十|十一|十二)年级/g;
  while ((m = rangeCn10.exec(t)) !== null) {
    const map: Record<string, number> = { 十: 10, 十一: 11, 十二: 12 };
    const lo = map[m[1]!];
    const hi = map[m[2]!];
    if (lo == null || hi == null) continue;
    const a = Math.min(lo, hi);
    const b = Math.max(lo, hi);
    for (let i = a; i <= b; i++) into.add(i);
  }

  const singleNum = /(\d{1,2})年级/g;
  while ((m = singleNum.exec(t)) !== null) {
    const n = Number.parseInt(m[1], 10);
    if (n >= 1 && n <= 12) into.add(n);
  }
}

/** 从条目的建议年级 / 适用年级标签解析为 1–12 学年序号 */
export function rowGradeOrdinals(row: CurriculumStandardRow): Set<number> {
  const into = new Set<number>();
  const parts = [row.suggestedGradeRange, ...(row.applicableGrades ?? [])].filter(Boolean) as string[];
  for (const part of parts) {
    addGradesFromText(part, into);
  }
  return into;
}

function rowExplicitPhase(row: CurriculumStandardRow): string | null {
  const p = row.phase?.trim();
  return p || null;
}

function inferredPhaseFromOrdinals(ords: Set<number>): "小学" | "初中" | "高中" | null {
  if (ords.size === 0) return null;
  const arr = [...ords];
  const allPrimary = arr.every((n) => n >= 1 && n <= 5);
  const allJunior = arr.every((n) => n >= 6 && n <= 9);
  const allSenior = arr.every((n) => n >= 10 && n <= 12);
  if (allPrimary) return "小学";
  if (allJunior) return "初中";
  if (allSenior) return "高中";
  return null;
}

export type PhaseGradeTreeSelection =
  | null
  | {
      phase: string;
      /** `GRADE_OPTIONS` 的 value，如「一年级」「高一」 */
      grade?: string;
    };

export function rowMatchesPhaseGradeSelection(
  row: CurriculumStandardRow,
  selection: PhaseGradeTreeSelection,
): boolean {
  if (selection == null) return true;

  const explicit = rowExplicitPhase(row);
  const ordinals = rowGradeOrdinals(row);
  const { phase: selPhase, grade: selGrade } = selection;
  const targetOrdinal = selGrade ? gradeLabelToOrdinal(selGrade) : null;
  if (selGrade && targetOrdinal == null) return false;

  if (!selGrade) {
    if (selPhase === PHASE_UNSPECIFIED) {
      return !explicit;
    }
    if (explicit) {
      return explicit === selPhase;
    }
    const inf = inferredPhaseFromOrdinals(ordinals);
    return inf === selPhase;
  }

  if (!ordinals.has(targetOrdinal!)) return false;

  if (explicit) {
    return explicit === selPhase;
  }
  return phaseForOrdinal(targetOrdinal!) === selPhase;
}

export function countRowsByPhaseGradeTree(rows: CurriculumStandardRow[]): {
  phaseCounts: Map<string, number>;
  phaseGradeCounts: Map<string, number>;
} {
  const phaseCounts = new Map<string, number>();
  const phaseGradeCounts = new Map<string, number>();

  const phases: string[] = [...PHASE_ROOTS, PHASE_UNSPECIFIED];
  for (const phase of phases) {
    phaseCounts.set(phase, rows.filter((r) => rowMatchesPhaseGradeSelection(r, { phase })).length);
  }

  for (const phase of PHASE_ROOTS) {
    for (const grade of GRADES_BY_PHASE[phase]) {
      const key = `${phase}\0${grade}`;
      phaseGradeCounts.set(
        key,
        rows.filter((r) => rowMatchesPhaseGradeSelection(r, { phase, grade })).length,
      );
    }
  }

  return { phaseCounts, phaseGradeCounts };
}

export function phaseGradeCountKey(phase: string, grade: string): string {
  return `${phase}\0${grade}`;
}
