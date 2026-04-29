import type { SchoolDimensionSnapshot } from "../education/subject-grades/page.types";
import { ynToLineActive } from "../education/subject-grades/page.types";

/** 当前学段（`level_id`）+ 学科下可选年级：以 `gradeSubjectMatrix` 为准；若无矩阵则退化为学段-年级关系。 */
export function eligibleGradeIdsForCatalog(snapshot: SchoolDimensionSnapshot, levelId: string, subjectId: string): string[] {
  const matrix = snapshot.gradeSubjectMatrix.filter(
    (r) => r.levelId === levelId && r.subjectId === subjectId && r.lineActive === 1,
  );
  const gradeSet = new Set<string>();
  if (matrix.length > 0) {
    for (const r of matrix) gradeSet.add(r.gradeId);
  } else {
    for (const r of snapshot.levelGrades) {
      if (r.levelId === levelId && r.lineActive === 1) gradeSet.add(r.gradeId);
    }
  }
  return snapshot.grades
    .filter((g) => gradeSet.has(g.gradeId) && ynToLineActive(g.status) === 1)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((g) => g.gradeId);
}

/**
 * 学段或学科切换后：保留仍在新矩阵内的年级 id；对其余已选年级按 `grade_id` 或展示名称在新可选列表中做对齐，
 * 避免仅因 id 不同但业务上同一「年级」被清空。
 */
export function reconcileCatalogGradeIds(
  snapshot: SchoolDimensionSnapshot,
  prevGradeIds: string[],
  levelId: string,
  subjectId: string,
): string[] {
  const elig = eligibleGradeIdsForCatalog(snapshot, levelId, subjectId);
  const eligSet = new Set(elig);
  const gradeById = new Map(snapshot.grades.map((g) => [g.gradeId, g]));
  const chosen = new Set<string>();

  for (const id of prevGradeIds) {
    if (eligSet.has(id)) chosen.add(id);
  }

  for (const pid of prevGradeIds) {
    if (chosen.has(pid)) continue;
    const pg = gradeById.get(pid);
    if (!pg) continue;
    const pn = pg.gradeName.trim();
    for (const eid of elig) {
      if (chosen.has(eid)) continue;
      const eg = gradeById.get(eid);
      if (!eg) continue;
      const codeMatch = pg.gradeId === eg.gradeId;
      const nameMatch = pn.length > 0 && pn === eg.gradeName.trim();
      if (codeMatch || nameMatch) {
        chosen.add(eid);
        break;
      }
    }
  }

  return elig.filter((id) => chosen.has(id));
}
