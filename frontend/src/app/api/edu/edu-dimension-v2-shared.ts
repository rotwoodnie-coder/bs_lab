import { randomBytes } from "node:crypto";

/**
 * 与 `0024_v2_full_schema_init.sql` 列注释及 `v2-dict-repository` 一致：
 * `status` — y 启用，n 停用；NULL 视为 y；比较时忽略大小写与首尾空格。
 *
 * @param tableAlias 表别名，如 `sl`、`g`
 */
export function schoolDictStatusEnabledSql(tableAlias: string): string {
  return `(LOWER(TRIM(COALESCE(${tableAlias}.status, 'y'))) = 'y')`;
}

/**
 * `data_school_grade.school_level_id` 在迁移中可能为空。
 * 控制台矩阵需要学段键：当列为空时按 **5-4-3** 默认年级归属推断（与 0003 种子 / GRADE_* 编码一致）。
 * 若使用 6-3-3 等学制，应在库中显式写入 `school_level_id`。
 */
export const EFFECTIVE_SCHOOL_LEVEL_ID_SQL = `COALESCE(
  NULLIF(TRIM(g.school_level_id), ''),
  CASE
    WHEN g.grade_id IN ('GRADE_1','GRADE_2','GRADE_3','GRADE_4','GRADE_5') THEN 'STAGE_PRIMARY'
    WHEN g.grade_id IN ('GRADE_6','GRADE_7','GRADE_8','GRADE_9') THEN 'STAGE_JUNIOR'
    WHEN g.grade_id IN ('GRADE_10','GRADE_11','GRADE_12') THEN 'STAGE_SENIOR'
    ELSE NULL
  END
)`;

/** 将表达式中的 `g.` 替换为指定 `data_school_grade` 表别名（如 `gx`）。 */
export function effectiveSchoolLevelIdSqlForAlias(gradeTableAlias: string): string {
  return EFFECTIVE_SCHOOL_LEVEL_ID_SQL.replace(/\bg\./g, `${gradeTableAlias}.`);
}

/**
 * 仅用于 `/api/edu/dimensions` 快照：推断不到学段时挂到第一个启用学段，避免 `levelSubjects` 等全空。
 * 写入类路由仍用 {@link effectiveSchoolLevelIdSqlForAlias}，避免误归类。
 */
export function snapshotStageIdSqlForGradeAlias(gradeTableAlias: string): string {
  const eff = effectiveSchoolLevelIdSqlForAlias(gradeTableAlias);
  return `COALESCE(
    (${eff}),
    (SELECT lv0.level_id FROM data_school_level lv0
     WHERE ${schoolDictStatusEnabledSql("lv0")}
     ORDER BY lv0.sort_order ASC, lv0.level_id ASC LIMIT 1)
  )`;
}

export function newGradeSubjectSeqId(): string {
  return randomBytes(16).toString("hex");
}
