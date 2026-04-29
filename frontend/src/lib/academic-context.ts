/** 学年上下文常量与工具（无业务依赖，供 unified-mock / data-management 共用） */

export const INITIAL_MOCK_ACADEMIC_YEAR = "2025-2026";

/** 浏览器内派发：教研端等订阅新学年 */
export const ACADEMIC_YEAR_CHANGED_EVENT = "bs-lab:academic-year-changed";

export type AcademicYearChangedDetail = {
  academicYear: string;
  previousYear: string;
};

/** 将「2025-2026」推进为「2026-2027」 */
export function nextAcademicYearLabel(current: string): string {
  const m = /^(\d{4})-(\d{4})$/.exec(current.trim());
  if (!m) return current;
  const a = Number(m[1]);
  const b = Number(m[2]);
  if (!Number.isFinite(a) || !Number.isFinite(b) || b !== a + 1) return current;
  return `${a + 1}-${b + 1}`;
}
