import { runQuery } from "@/lib/server/mysql";

import type {
  DataSchoolGrade,
  DataSchoolLevel,
  DataSchoolSubject,
  GradeSubjectMatrixRow,
  LevelGradeSummary,
  LevelSubjectSummary,
  SchoolDimensionSnapshot,
} from "@/app/(dashboard)/console/settings/education/subject-grades/page.types";

import { schoolDictStatusEnabledSql, snapshotStageIdSqlForGradeAlias } from "./edu-dimension-v2-shared";

type V2LevelRow = {
  level_id: string;
  level_name: string;
  comments: string | null;
  status: string | null;
  sort_order: number | null;
};

type V2SubjectRow = {
  subject_id: string;
  subject_name: string;
  comments: string | null;
  status: string | null;
  sort_order: number | null;
};

type V2GradeRow = {
  grade_id: string;
  grade_name: string;
  school_level_id: string | null;
  comments: string | null;
  status: string | null;
  sort_order: number | null;
};

type V2MatrixRow = {
  id: string;
  stage_id: string;
  subject_id: string;
  grade_id: string;
  level_status: string | null;
  grade_status: string | null;
  subject_status: string | null;
  subject_sort: number | null;
  grade_sort: number | null;
};

function v2Active(status: string | null | undefined): boolean {
  const v = (status ?? "y").trim().toLowerCase();
  return v !== "n";
}

function mapLevels(rows: V2LevelRow[]): DataSchoolLevel[] {
  return rows.map((row) => ({
    levelId: String(row.level_id),
    levelName: String(row.level_name),
    comments: row.comments == null ? null : String(row.comments),
    status: (row.status ?? "y").trim().toLowerCase() === "n" ? "n" : "y",
    sortOrder: row.sort_order ?? 0,
    iconPath: null,
  }));
}

function mapSubjects(rows: V2SubjectRow[]): DataSchoolSubject[] {
  return rows.map((row) => ({
    subjectId: String(row.subject_id),
    subjectName: String(row.subject_name),
    comments: row.comments == null ? null : String(row.comments),
    status: (row.status ?? "y").trim().toLowerCase() === "n" ? "n" : "y",
    sortOrder: row.sort_order ?? 0,
    iconPath: null,
  }));
}

function mapGrades(rows: V2GradeRow[]): DataSchoolGrade[] {
  return rows.map((row) => ({
    gradeId: String(row.grade_id),
    gradeName: String(row.grade_name),
    schoolLevelId:
      row.school_level_id == null || String(row.school_level_id).trim() === ""
        ? null
        : String(row.school_level_id),
    comments: row.comments == null ? null : String(row.comments),
    status: (row.status ?? "y").trim().toLowerCase() === "n" ? "n" : "y",
    sortOrder: row.sort_order ?? 0,
  }));
}

function mergeLevelSubjects(rows: V2MatrixRow[]): LevelSubjectSummary[] {
  const m = new Map<string, { levelId: string; subjectId: string; lineActive: 0 | 1; sortOrder: number }>();
  for (const r of rows) {
    const levelId = String(r.stage_id);
    const subjectId = String(r.subject_id);
    const key = `${levelId}:${subjectId}`;
    const active =
      v2Active(r.level_status) && v2Active(r.grade_status) && v2Active(r.subject_status) ? 1 : 0;
    const sort = r.subject_sort ?? 0;
    const prev = m.get(key);
    if (!prev) {
      m.set(key, { levelId, subjectId, lineActive: active as 0 | 1, sortOrder: sort });
      continue;
    }
    prev.sortOrder = Math.min(prev.sortOrder, sort);
    prev.lineActive = Math.max(prev.lineActive, active) as 0 | 1;
  }
  return [...m.entries()].map(([linkKey, v]) => ({
    linkKey,
    levelId: v.levelId,
    subjectId: v.subjectId,
    sortOrder: v.sortOrder,
    lineActive: v.lineActive,
  }));
}

function mergeLevelGrades(rows: V2MatrixRow[]): LevelGradeSummary[] {
  const m = new Map<string, { levelId: string; gradeId: string; lineActive: 0 | 1; sortOrder: number }>();
  for (const r of rows) {
    const levelId = String(r.stage_id);
    const gradeId = String(r.grade_id);
    const key = `${levelId}:${gradeId}`;
    const active =
      v2Active(r.level_status) && v2Active(r.grade_status) && v2Active(r.subject_status) ? 1 : 0;
    const sort = r.grade_sort ?? 0;
    const prev = m.get(key);
    if (!prev) {
      m.set(key, { levelId, gradeId, lineActive: active as 0 | 1, sortOrder: sort });
      continue;
    }
    prev.sortOrder = Math.min(prev.sortOrder, sort);
    prev.lineActive = Math.max(prev.lineActive, active) as 0 | 1;
  }
  return [...m.entries()].map(([linkKey, v]) => ({
    linkKey,
    levelId: v.levelId,
    gradeId: v.gradeId,
    sortOrder: v.sortOrder,
    lineActive: v.lineActive,
  }));
}

function mapGradeSubjectMatrix(rows: V2MatrixRow[]): GradeSubjectMatrixRow[] {
  return rows.map((r) => {
    const line =
      v2Active(r.level_status) && v2Active(r.grade_status) && v2Active(r.subject_status) ? 1 : 0;
    const sort = (r.subject_sort ?? 0) * 1000 + (r.grade_sort ?? 0);
    return {
      seqId: String(r.id),
      levelId: String(r.stage_id),
      subjectId: String(r.subject_id),
      gradeId: String(r.grade_id),
      sortOrder: sort,
      lineActive: line as 0 | 1,
    };
  });
}

/**
 * 主库：`data_school_level` / `data_school_grade` / `data_school_subject` /
 * `data_school_grade_subject` → `SchoolDimensionSnapshot`。
 */
export async function fetchEduSnapshotV2(): Promise<SchoolDimensionSnapshot> {
  const levels = await runQuery<V2LevelRow>(
    `SELECT sl.level_id, sl.level_name, sl.comments, sl.status, sl.sort_order
     FROM data_school_level sl
     WHERE ${schoolDictStatusEnabledSql("sl")}
     ORDER BY sl.sort_order ASC, sl.level_id ASC`,
  );
  const subjects = await runQuery<V2SubjectRow>(
    `SELECT sj.subject_id, sj.subject_name, sj.comments, sj.status, sj.sort_order
     FROM data_school_subject sj
     WHERE ${schoolDictStatusEnabledSql("sj")}
     ORDER BY sj.sort_order ASC, sj.subject_id ASC`,
  );
  const grades = await runQuery<V2GradeRow>(
    `SELECT g.grade_id, g.grade_name, g.school_level_id, g.comments, g.status, g.sort_order
     FROM data_school_grade g
     WHERE ${schoolDictStatusEnabledSql("g")}
     ORDER BY CAST(SUBSTRING(g.grade_id, 7) AS UNSIGNED) ASC, g.sort_order ASC`,
  );
  const snapStage = snapshotStageIdSqlForGradeAlias("g");
  const matrix = await runQuery<V2MatrixRow>(
    `SELECT gs.seq_id AS id,
            (${snapStage}) AS stage_id,
            gs.subject_id AS subject_id,
            gs.grade_id AS grade_id,
            lv.status AS level_status,
            g.status AS grade_status,
            s.status AS subject_status,
            s.sort_order AS subject_sort,
            g.sort_order AS grade_sort
     FROM data_school_grade_subject gs
     INNER JOIN data_school_grade g ON g.grade_id = gs.grade_id
     INNER JOIN data_school_subject s ON s.subject_id = gs.subject_id
     INNER JOIN data_school_level lv ON lv.level_id = (${snapStage})
     WHERE (${snapStage}) IS NOT NULL
       AND ${schoolDictStatusEnabledSql("lv")}
       AND ${schoolDictStatusEnabledSql("g")}
       AND ${schoolDictStatusEnabledSql("s")}
     ORDER BY lv.sort_order ASC, CAST(SUBSTRING(g.grade_id, 7) AS UNSIGNED) ASC, g.sort_order ASC, s.sort_order ASC, gs.seq_id ASC`,
  );

  return {
    levels: mapLevels(levels),
    subjects: mapSubjects(subjects),
    grades: mapGrades(grades),
    levelSubjects: mergeLevelSubjects(matrix),
    levelGrades: mergeLevelGrades(matrix),
    gradeSubjectMatrix: mapGradeSubjectMatrix(matrix),
  };
}
