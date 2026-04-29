import { runLegacyQuery } from "@/lib/server/mysql";

import type {
  DataSchoolGrade,
  DataSchoolLevel,
  DataSchoolSubject,
  GradeSubjectMatrixRow,
  LevelGradeSummary,
  LevelSubjectSummary,
  SchoolDimensionSnapshot,
} from "@/app/(dashboard)/console/settings/education/subject-grades/page.types";

type MatrixRow = {
  id: number;
  stage_id: number;
  subject_id: number;
  grade_id: number;
  edition_id: number;
  status: number;
  sort_order: number;
};

type NamedRow = {
  id: number;
  code: string;
  name: string;
  icon_path: string | null;
  sort_order: number;
  status: number;
};

type GradeRow = Omit<NamedRow, "icon_path">;

function asId(value: number): string {
  return String(value);
}

function numStatusToYn(status: number): "y" | "n" {
  return status === 1 ? "y" : "n";
}

/** 旧库 bs_lab_data：edu_* / edu_path_matrix → 与 V2 相同的 `SchoolDimensionSnapshot` 形状（便于前端单一模型）。 */
export async function fetchEduSnapshotLegacy(): Promise<SchoolDimensionSnapshot> {
  const stages = await runLegacyQuery<NamedRow>(
    "SELECT id, code, name, icon_path, sort_order, status FROM bs_lab_data.edu_stages ORDER BY sort_order ASC, id ASC",
  );
  const subjects = await runLegacyQuery<NamedRow>(
    "SELECT id, code, name, icon_path, sort_order, status FROM bs_lab_data.edu_subjects ORDER BY sort_order ASC, id ASC",
  );
  const grades = await runLegacyQuery<GradeRow>(
    "SELECT id, code, name, sort_order, status FROM bs_lab_data.edu_grades ORDER BY sort_order ASC, id ASC",
  );
  const matrix = await runLegacyQuery<MatrixRow>(
    "SELECT id, stage_id, subject_id, grade_id, edition_id, status, sort_order FROM bs_lab_data.edu_path_matrix WHERE edition_id = 1",
  );

  const stageIdToLevelKey = new Map<string, string>();
  for (const s of stages) {
    stageIdToLevelKey.set(asId(s.id), s.code || asId(s.id));
  }

  const levelSubjects = Array.from(
    matrix
      .reduce<Map<string, { levelId: string; subjectId: string; lineActive: 0 | 1; sortOrder: number }>>((map, row) => {
        const levelId = stageIdToLevelKey.get(asId(row.stage_id)) ?? asId(row.stage_id);
        const subjectRow = subjects.find((s) => s.id === row.subject_id);
        const subjectKey = subjectRow?.code ?? asId(row.subject_id);
        const key = `${levelId}:${subjectKey}`;
        const prev = map.get(key);
        const line: 0 | 1 = row.status === 1 ? 1 : 0;
        if (!prev) {
          map.set(key, { levelId, subjectId: subjectKey, lineActive: line, sortOrder: row.sort_order });
          return map;
        }
        prev.sortOrder = Math.min(prev.sortOrder, row.sort_order);
        prev.lineActive = (Math.max(prev.lineActive, line) as 0 | 1);
        return map;
      }, new Map())
      .entries(),
  ).map(([linkKey, v]) => ({
    linkKey,
    levelId: v.levelId,
    subjectId: v.subjectId,
    sortOrder: v.sortOrder,
    lineActive: v.lineActive,
  }));

  const levelGrades = Array.from(
    matrix
      .reduce<Map<string, { levelId: string; gradeId: string; lineActive: 0 | 1; sortOrder: number }>>((map, row) => {
        const levelId = stageIdToLevelKey.get(asId(row.stage_id)) ?? asId(row.stage_id);
        const gradeRow = grades.find((g) => g.id === row.grade_id);
        const gradeKey = gradeRow?.code ?? asId(row.grade_id);
        const key = `${levelId}:${gradeKey}`;
        const prev = map.get(key);
        const line: 0 | 1 = row.status === 1 ? 1 : 0;
        if (!prev) {
          map.set(key, { levelId, gradeId: gradeKey, lineActive: line, sortOrder: row.sort_order });
          return map;
        }
        prev.sortOrder = Math.min(prev.sortOrder, row.sort_order);
        prev.lineActive = (Math.max(prev.lineActive, line) as 0 | 1);
        return map;
      }, new Map())
      .entries(),
  ).map(([linkKey, v]) => ({
    linkKey,
    levelId: v.levelId,
    gradeId: v.gradeId,
    sortOrder: v.sortOrder,
    lineActive: v.lineActive,
  }));

  const gradeSubjectMatrix: GradeSubjectMatrixRow[] = matrix.map((row) => {
    const levelId = stageIdToLevelKey.get(asId(row.stage_id)) ?? asId(row.stage_id);
    const subjectRow = subjects.find((s) => s.id === row.subject_id);
    const gradeRow = grades.find((g) => g.id === row.grade_id);
    return {
      seqId: `${row.stage_id}:${row.subject_id}:${row.grade_id}`,
      levelId,
      subjectId: subjectRow?.code ?? asId(row.subject_id),
      gradeId: gradeRow?.code ?? asId(row.grade_id),
      sortOrder: row.sort_order,
      lineActive: (row.status === 1 ? 1 : 0) as 0 | 1,
    };
  });

  const levels: DataSchoolLevel[] = stages.map((row) => ({
    levelId: row.code || asId(row.id),
    levelName: row.name,
    comments: null,
    status: numStatusToYn(row.status),
    sortOrder: row.sort_order,
    iconPath: row.icon_path,
  }));

  const subs: DataSchoolSubject[] = subjects.map((row) => ({
    subjectId: row.code || asId(row.id),
    subjectName: row.name,
    comments: null,
    status: numStatusToYn(row.status),
    sortOrder: row.sort_order,
    iconPath: row.icon_path,
  }));

  const gr: DataSchoolGrade[] = grades.map((row) => ({
    gradeId: row.code || asId(row.id),
    gradeName: row.name,
    schoolLevelId: null,
    comments: null,
    status: numStatusToYn(row.status),
    sortOrder: row.sort_order,
  }));

  return {
    levels,
    subjects: subs,
    grades: gr,
    levelSubjects,
    levelGrades,
    gradeSubjectMatrix,
  };
}
