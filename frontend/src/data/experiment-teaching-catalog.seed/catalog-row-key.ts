import type { CurriculumStandardRow } from "@/types/curriculum-standard";
export type CatalogPhaseGradeKey = `grade-${number}`;
export function rowCatalogKey(row: Pick<CurriculumStandardRow, "suggestedGradeRange">): CatalogPhaseGradeKey {
  const s = (row.suggestedGradeRange ?? "").trim();
  const m = s.match(/(\d+)\s*[-~～]\s*(\d+)/);
  if (m) return `grade-${Math.min(Number(m[1]), Number(m[2]))}` as CatalogPhaseGradeKey;
  const n = s.match(/(\d+)/);
  return `grade-${n ? Number(n[1]) : 1}` as CatalogPhaseGradeKey;
}
