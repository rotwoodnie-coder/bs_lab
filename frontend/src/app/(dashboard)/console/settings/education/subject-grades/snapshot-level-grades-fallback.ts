import type { DataSchoolGrade, DataSchoolLevel, LevelGradeSummary, SchoolDimensionSnapshot } from "./page.types";
import { ynToLineActive } from "./page.types";

/** 与 `app/api/edu/edu-dimension-v2-shared.ts` 中默认年级归属一致（仅用于展示层补全）。 */
const PRIMARY_GRADES = new Set(["GRADE_1", "GRADE_2", "GRADE_3", "GRADE_4", "GRADE_5"]);
const JUNIOR_GRADES = new Set(["GRADE_6", "GRADE_7", "GRADE_8", "GRADE_9"]);
const SENIOR_GRADES = new Set(["GRADE_10", "GRADE_11", "GRADE_12"]);

export function inferEffectiveSchoolLevelIdForGrade(
  grade: DataSchoolGrade,
  levels: DataSchoolLevel[],
): string | null {
  const sl = grade.schoolLevelId?.trim();
  if (sl && levels.some((l) => l.levelId === sl)) return sl;
  const gid = grade.gradeId.trim().toUpperCase();
  if (PRIMARY_GRADES.has(gid)) return "STAGE_PRIMARY";
  if (JUNIOR_GRADES.has(gid)) return "STAGE_JUNIOR";
  if (SENIOR_GRADES.has(gid)) return "STAGE_SENIOR";
  const first = [...levels]
    .filter((l) => ynToLineActive(l.status) === 1)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.levelId.localeCompare(b.levelId))[0];
  return first?.levelId ?? null;
}

/**
 * 当 `data_school_grade_subject` 尚无行时，快照中 `levelGrades` / 矩阵为空，
 * 控制台无法展示学段下年级。此处仅按 `data_school_grade` + 默认归属推断
 * **展示用** `levelGrades`，不写库；矩阵有数据后应与后端聚合一致并自动停用本分支。
 */
export function applyLevelGradesWhenMatrixEmpty(snapshot: SchoolDimensionSnapshot): SchoolDimensionSnapshot {
  if (snapshot.gradeSubjectMatrix.length > 0) return snapshot;
  if (snapshot.levelGrades.length > 0) return snapshot;
  if (!snapshot.levels.length || !snapshot.grades.length) return snapshot;

  const levelGrades: LevelGradeSummary[] = [];
  for (const g of snapshot.grades) {
    if (ynToLineActive(g.status) !== 1) continue;
    const levelId = inferEffectiveSchoolLevelIdForGrade(g, snapshot.levels);
    if (!levelId || !snapshot.levels.some((l) => l.levelId === levelId)) continue;
    levelGrades.push({
      linkKey: `${levelId}:${g.gradeId}`,
      levelId,
      gradeId: g.gradeId,
      sortOrder: g.sortOrder,
      lineActive: 1,
    });
  }
  return levelGrades.length ? { ...snapshot, levelGrades } : snapshot;
}
