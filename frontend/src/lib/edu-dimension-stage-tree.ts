import { buildSubjectIconPath } from "@/app/(dashboard)/console/settings/education/subject-grades/page.constants";
import type { SchoolDimensionSnapshot, SchoolLevelTreeNode } from "@/app/(dashboard)/console/settings/education/subject-grades/page.types";

function subjectIconPath(subject: { iconPath?: string | null } | undefined, fallbackCode: string): string {
  return subject?.iconPath || buildSubjectIconPath(fallbackCode);
}

function levelEnabled(status: string): boolean {
  return String(status ?? "y").trim().toLowerCase() !== "n";
}

/** 按年级展开：`data_school_level` → 年级 → 学科（与矩阵一致）。 */
export function buildStageTreeByGrade(snapshot: SchoolDimensionSnapshot): SchoolLevelTreeNode[] {
  const gradeMap = new Map(snapshot.grades.map((g) => [g.gradeId, g]));
  const subjectMap = new Map(snapshot.subjects.map((s) => [s.subjectId, s]));
  const levelSubjectSort = new Map(
    snapshot.levelSubjects.map((item) => [`${item.levelId}:${item.subjectId}`, item.sortOrder]),
  );

  const gradeChildrenMap = new Map<string, SchoolLevelTreeNode[]>();
  for (const row of snapshot.gradeSubjectMatrix.filter((item) => item.lineActive === 1)) {
    const subject = subjectMap.get(row.subjectId);
    if (!subject) continue;
    const key = `${row.levelId}:${row.gradeId}`;
    const children = gradeChildrenMap.get(key) ?? [];
    children.push({
      id: `grade-subject-${row.seqId}`,
      label: subject.subjectName,
      nodeType: "subject",
      levelId: row.levelId,
      gradeId: row.gradeId,
      subjectId: row.subjectId,
      relationId: `${row.levelId}:${row.subjectId}`,
      subjectIconPath: subjectIconPath(subject, row.subjectId),
      sortOrder: levelSubjectSort.get(`${row.levelId}:${row.subjectId}`) ?? row.sortOrder,
    });
    gradeChildrenMap.set(key, children);
  }

  const gradesByLevel = new Map<string, SchoolLevelTreeNode[]>();
  for (const lg of snapshot.levelGrades.filter((item) => item.lineActive === 1)) {
    const grade = gradeMap.get(lg.gradeId);
    if (!grade) continue;
    const gradeChildren = (gradeChildrenMap.get(`${lg.levelId}:${lg.gradeId}`) ?? []).sort(
      (a, b) => a.sortOrder - b.sortOrder,
    );
    const lid = lg.levelId;
    const arr = gradesByLevel.get(lid) ?? [];
    arr.push({
      id: `grade-${lg.linkKey}`,
      label: grade.gradeName,
      nodeType: "grade",
      levelId: lid,
      gradeId: grade.gradeId,
      sortOrder: lg.sortOrder,
      children: gradeChildren,
    });
    gradesByLevel.set(lid, arr);
  }

  return [...snapshot.levels]
    .filter((l) => levelEnabled(l.status))
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((level) => ({
      id: `level-${level.levelId}`,
      label: level.levelName,
      nodeType: "level",
      levelId: level.levelId,
      sortOrder: level.sortOrder,
      levelIconPath: level.iconPath ?? null,
      children: (gradesByLevel.get(level.levelId) ?? []).sort((a, b) => a.sortOrder - b.sortOrder),
    }));
}

/** 按学科展开：`data_school_level` → 学科 → 年级。 */
export function buildStageTreeBySubject(snapshot: SchoolDimensionSnapshot): SchoolLevelTreeNode[] {
  const gradeMap = new Map(snapshot.grades.map((g) => [g.gradeId, g]));
  const subjectGradeChildrenMap = new Map<string, SchoolLevelTreeNode[]>();

  for (const row of snapshot.gradeSubjectMatrix.filter((item) => item.lineActive === 1)) {
    const grade = gradeMap.get(row.gradeId);
    if (!grade) continue;
    const key = `${row.levelId}:${row.subjectId}`;
    const children = subjectGradeChildrenMap.get(key) ?? [];
    children.push({
      id: `subject-grade-${row.seqId}`,
      label: grade.gradeName,
      nodeType: "grade",
      levelId: row.levelId,
      subjectId: row.subjectId,
      gradeId: row.gradeId,
      sortOrder: row.sortOrder,
    });
    subjectGradeChildrenMap.set(key, children);
  }

  const subjectsByLevel = new Map<string, SchoolLevelTreeNode[]>();
  for (const rel of snapshot.levelSubjects.filter((item) => item.lineActive === 1)) {
    const subject = snapshot.subjects.find((s) => s.subjectId === rel.subjectId);
    if (!subject) continue;
    const children = (subjectGradeChildrenMap.get(`${rel.levelId}:${rel.subjectId}`) ?? []).sort(
      (a, b) => a.sortOrder - b.sortOrder,
    );
    const lid = rel.levelId;
    const arr = subjectsByLevel.get(lid) ?? [];
    arr.push({
      id: `subject-${rel.linkKey}`,
      label: subject.subjectName,
      nodeType: "subject",
      levelId: lid,
      subjectId: rel.subjectId,
      subjectIconPath: subjectIconPath(subject, rel.subjectId),
      relationId: rel.linkKey,
      sortOrder: rel.sortOrder,
      children,
    });
    subjectsByLevel.set(lid, arr);
  }

  return [...snapshot.levels]
    .filter((l) => levelEnabled(l.status))
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((level) => ({
      id: `level-${level.levelId}`,
      label: level.levelName,
      nodeType: "level",
      levelId: level.levelId,
      sortOrder: level.sortOrder,
      levelIconPath: level.iconPath ?? null,
      children: (subjectsByLevel.get(level.levelId) ?? []).sort((a, b) => a.sortOrder - b.sortOrder),
    }));
}
