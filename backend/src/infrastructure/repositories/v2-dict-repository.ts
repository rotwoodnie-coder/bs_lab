/**
 * V2 字典数据仓库（只读）
 * 对应表：data_* 系列基础字典表（21张）
 */
import type { RowDataPacket } from "mysql2/promise";
import { getMysqlPool } from "../mysql/mysql-client.ts";

export interface DictItem {
  id: string;
  name: string;
  comments?: string | null;
  sortOrder?: number | null;
  [key: string]: unknown;
}

async function querySimpleDict(
  table: string,
  idCol: string,
  nameCol: string,
  opts?: { statusValues?: string[] },
): Promise<DictItem[]> {
  const pool = getMysqlPool();
  const statusValues = opts?.statusValues ?? ["y"];
  const placeholders = statusValues.map(() => "?").join(",");
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT ${idCol} AS id, ${nameCol} AS name, comments, sort_order AS sortOrder
     FROM ${table} WHERE UPPER(COALESCE(status, 'Y')) IN (${placeholders}) ORDER BY sort_order ASC, ${idCol} ASC`,
    statusValues.map((v) => String(v).trim().toUpperCase()),
  );
  return rows as DictItem[];
}

export async function getSchoolLevels(): Promise<DictItem[]> {
  return querySimpleDict("data_school_level", "level_id", "level_name", { statusValues: ["Y"] });
}

export async function getSchoolGrades(): Promise<DictItem[]> {
  const pool = getMysqlPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT grade_id AS id, grade_name AS name, school_level_id AS levelId,
            comments, sort_order AS sortOrder
     FROM data_school_grade WHERE UPPER(COALESCE(status, 'Y')) = 'Y'
     ORDER BY sort_order ASC, grade_id ASC`,
  );
  return rows as DictItem[];
}

export async function getSchoolSubjects(): Promise<DictItem[]> {
  return querySimpleDict("data_school_subject", "subject_id", "subject_name", { statusValues: ["Y"] });
}

export async function getGradeSubjects(): Promise<DictItem[]> {
  const pool = getMysqlPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT seq_id AS id, subject_id AS subjectId, grade_id AS gradeId
     FROM data_school_grade_subject`,
  );
  return rows as DictItem[];
}

export async function getMaterialTypes(): Promise<DictItem[]> {
  const pool = getMysqlPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT type_id AS id, type_name AS name, comments,
            sort_order AS sortOrder, status AS status
     FROM data_material_type WHERE COALESCE(status, 'y') = 'y'
     ORDER BY sort_order ASC, type_id ASC`,
  );
  return rows as DictItem[];
}

export async function getMaterialProps(): Promise<DictItem[]> {
  return querySimpleDict("data_material_prop", "prop_id", "prop_name");
}

export async function getMaterialUnits(): Promise<DictItem[]> {
  return querySimpleDict("data_material_unit", "unit_id", "unit_name");
}

export async function getMaterialSecurities(): Promise<DictItem[]> {
  const pool = getMysqlPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT security_id AS id, security_name AS name, comments,
            sort_order AS sortOrder, security_level AS securityLevel
     FROM data_material_security WHERE COALESCE(status, 'y') = 'y'
     ORDER BY security_level ASC, sort_order ASC`,
  );
  return rows as DictItem[];
}

/**
 * `data_file_type`（素材类别）：与 `data_file.file_type_id` 外键一致。
 * - 默认仅返回启用行（供下拉/筛选）。
 * - `includeInactive: true` 时返回全量行（控制台只读目录）。
 */
export async function getFileTypes(opts?: { includeInactive?: boolean }): Promise<DictItem[]> {
  const pool = getMysqlPool();
  const where = opts?.includeInactive ? "" : "WHERE COALESCE(status, 'y') = 'y'";
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT type_id AS id, type_name AS name, comments,
            sort_order AS sortOrder, logo_class AS logoClass, status AS status
     FROM data_file_type ${where}
     ORDER BY COALESCE(sort_order, 0) ASC, type_id ASC`,
  );
  return rows as DictItem[];
}

export async function getOrgTypes(): Promise<DictItem[]> {
  return querySimpleDict("data_org_type", "type_id", "type_name");
}

export async function getRoles(): Promise<DictItem[]> {
  return querySimpleDict("data_role", "role_id", "role_name");
}

export async function getPrefTitles(): Promise<DictItem[]> {
  return querySimpleDict("data_pref_title", "title_id", "title_name");
}

export async function getRatingScales(): Promise<DictItem[]> {
  return querySimpleDict("data_rating_scale", "scale_id", "scale_name");
}

export async function getExpDifficulties(): Promise<DictItem[]> {
  return querySimpleDict("data_exp_difficulty", "difficulty_id", "difficulty_name");
}

export async function getDifficultyTypes(): Promise<DictItem[]> {
  return querySimpleDict("data_difficulty_type", "type_id", "type_name");
}

export async function getQuestionTypes(): Promise<DictItem[]> {
  return querySimpleDict("data_question_type", "type_id", "type_name");
}

export async function getQuestionCapacities(): Promise<DictItem[]> {
  return querySimpleDict("data_question_capacity", "capacity_id", "capacity_name");
}

export async function getMsgTypes(): Promise<DictItem[]> {
  return querySimpleDict("data_msg_type", "type_id", "type_name");
}
