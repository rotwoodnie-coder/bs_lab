/**
 * 教师可教学科查询：通过 `subject_group_member` → `subject_group` 推导。
 *
 * 一位教师可加入多个课题组（教研组），每个课题组绑定一个学科（`subject_group.subject_id`），
 * 教师的可教学科即其所有已加入课题组的学科并集。
 */
import type { RowDataPacket } from "mysql2/promise";

import { getMysqlPool } from "../mysql/mysql-client.ts";

export type TeacherSubjectRow = {
  subjectId: string;
  subjectName: string;
};

/**
 * 查询指定教师在 `subject_group` 中已加入且启用的可教学科。
 */
export async function getTeacherSubjects(teacherId: string): Promise<TeacherSubjectRow[]> {
  const pool = getMysqlPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT DISTINCT
       sg.subject_id AS subjectId,
       s.subject_name AS subjectName
     FROM subject_group_member sgm
     INNER JOIN subject_group sg ON sg.group_id = sgm.group_id
     INNER JOIN data_school_subject s ON s.subject_id = sg.subject_id
     WHERE sgm.user_id = ?
       AND sgm.status IN ('Y', 'JOINED')
       AND sg.status IN ('Y', 'NORMAL')
       AND s.status = 'y'
     ORDER BY s.sort_order ASC, s.subject_name ASC`,
    [teacherId],
  );
  return rows.map((r) => ({
    subjectId: String(r.subjectId ?? ""),
    subjectName: String(r.subjectName ?? ""),
  }));
}
