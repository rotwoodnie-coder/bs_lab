/**
 * V2 学生任务 MySQL 仓库
 * 查询 exp_homework_student JOIN exp_homework JOIN exp_msg
 */
import type { RowDataPacket } from "mysql2/promise";
import { getMysqlPool } from "../mysql/mysql-client.ts";
import type { StudentTaskItem, StudentTaskStatus } from "../../domain/v2-student/v2-student-task-types.ts";

function computeStatus(row: RowDataPacket): StudentTaskStatus {
  if (row.mark_time) return "marked";
  if (row.submit_date) return "submitted";
  return "pending";
}

export async function fetchStudentTasks(
  studentUserId: string,
  page = 1,
  pageSize = 20,
): Promise<StudentTaskItem[]> {
  const pool = await getMysqlPool();
  const offset = (page - 1) * pageSize;
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT s.seq_id, s.work_id, s.exp_id, s.teacher_user_id,
            s.teacher_exp_id, s.student_user_id, s.require_date,
            s.submit_date, s.mark_time, s.mark_result, s.mark_comments,
            h.class_id,
            e.exp_name,
            u.user_name AS teacher_name
     FROM exp_homework_student s
     JOIN exp_homework h ON h.work_id = s.work_id
     LEFT JOIN exp_msg e ON e.exp_id = h.exp_id
     LEFT JOIN sys_user u ON u.user_id = h.teacher_user_id
     WHERE s.student_user_id = ?
     ORDER BY s.submit_date ASC, h.create_time DESC
     LIMIT ? OFFSET ?`,
    [studentUserId, pageSize, offset],
  );

  return rows.map((row) => ({
    seqId: String(row.seq_id),
    workId: String(row.work_id),
    expId: String(row.exp_id),
    teacherExpId: String(row.teacher_exp_id),
    expName: String(row.exp_name ?? ""),
    teacherUserId: String(row.teacher_user_id),
    teacherName: String(row.teacher_name ?? ""),
    classId: String(row.class_id),
    requireDate: row.require_date ? String(row.require_date) : null,
    submitDate: row.submit_date ? String(row.submit_date) : null,
    markResult: row.mark_result ? String(row.mark_result) : null,
    markComments: row.mark_comments ? String(row.mark_comments) : null,
    status: computeStatus(row as RowDataPacket),
  }));
}
