/**
 * `data_school_grade_subject` 学段学科表：年级与学科的关联映射。
 */
import type { RowDataPacket } from "mysql2/promise";

import { getMysqlPool } from "../mysql/mysql-client.ts";

/**
 * 获取全部年级-学科映射：`grade_id → [subject_id, ...]`。
 * 前端用于：1) 根据教师可选学科筛选可配年级；2) 根据选中年级筛选显示哪些学科。
 */
export async function fetchAllGradeSubjectMap(): Promise<Record<string, string[]>> {
  const pool = getMysqlPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT dgs.grade_id AS gradeId, dgs.subject_id AS subjectId
     FROM data_school_grade_subject dgs
     ORDER BY dgs.grade_id, dgs.subject_id`,
  );

  const map: Record<string, string[]> = {};
  for (const r of rows) {
    const gid = String(r.gradeId ?? "");
    const sid = String(r.subjectId ?? "");
    if (!gid || !sid) continue;
    if (!map[gid]) map[gid] = [];
    map[gid]!.push(sid);
  }
  return map;
}
