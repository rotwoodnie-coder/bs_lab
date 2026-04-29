import type { V2DictGradeItem, V2DictItem } from "@/lib/v2/v2-exp-api";

export function resolveExpTaxonomyIds(input: {
  disciplineLabel: string;
  selectedGradeCodes: string[];
  gradeOptions: readonly { code: string; label: string }[];
  subjects: V2DictItem[];
  grades: V2DictGradeItem[];
}): { subject_id: string | null; school_level_id: string | null; grade_id: string | null } {
  const dLabel = input.disciplineLabel.trim();
  const subject_id = input.subjects.find((s) => String(s.name ?? "").trim() === dLabel)?.id?.trim().slice(0, 32) ?? null;
  const primaryCode = input.selectedGradeCodes[0];
  const gradeLabel = primaryCode ? input.gradeOptions.find((g) => g.code === primaryCode)?.label?.trim() : undefined;
  const gradeRow = gradeLabel ? input.grades.find((g) => String(g.name ?? "").trim() === gradeLabel) : undefined;
  const grade_id = gradeRow?.id?.trim().slice(0, 32) ?? null;
  const levelRaw = gradeRow && "levelId" in gradeRow ? String((gradeRow as V2DictGradeItem).levelId ?? "").trim() : "";
  const school_level_id = levelRaw ? levelRaw.slice(0, 32) : null;
  return { subject_id, school_level_id, grade_id };
}
