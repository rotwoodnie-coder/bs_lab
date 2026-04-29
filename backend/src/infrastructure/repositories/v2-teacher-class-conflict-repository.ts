/**
 * 班级-学科冲突查询：在指定班级集合下，查哪些（班级, 学科）已被其他教师占用。
 */
import type { RowDataPacket } from "mysql2/promise";

import { getMysqlPool } from "../mysql/mysql-client.ts";

export type ClassSubjectConflictRow = {
  classOrgId: string;
  subjectId: string;
  conflictTeacherName: string;
};

/**
 * 查询指定班级集合下，除当前教师外，其他教师已占用的（班级, 学科）冲突列表。
 *
 * @param excludeTeacherId - 当前配置的教师 ID，排除其自身记录
 * @param classOrgIds       - 班级的 org_id 列表
 */
export async function getClassSubjectConflicts(
  excludeTeacherId: string,
  classOrgIds: string[],
): Promise<ClassSubjectConflictRow[]> {
  if (classOrgIds.length === 0) return [];

  const pool = getMysqlPool();
  const ph = classOrgIds.map(() => "?").join(",");

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT
       tc.class_org_id AS classOrgId,
       tc.subject_id AS subjectId,
       u.user_name AS conflictTeacherName
     FROM Teacher_Class tc
     INNER JOIN sys_user u ON u.user_id = tc.teacher_id AND u.is_deleted = 0
     WHERE tc.teacher_id != ?
       AND tc.status = 'y'
       AND tc.class_org_id IN (${ph})
     GROUP BY tc.class_org_id, tc.subject_id`,
    [excludeTeacherId, ...classOrgIds],
  );

  return rows.map((r) => ({
    classOrgId: String(r.classOrgId ?? ""),
    subjectId: String(r.subjectId ?? ""),
    conflictTeacherName: String(r.conflictTeacherName ?? ""),
  }));
}
