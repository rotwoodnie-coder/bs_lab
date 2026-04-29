/**
 * V2 学生成长足迹 MySQL 仓库
 * 查询 exp_homework_student 中有提交记录的数据（已提交 / 已批改）
 */
import type { RowDataPacket } from "mysql2/promise";
import { getMysqlPool } from "../mysql/mysql-client.ts";
import type { StudentFootprintItem, FootprintStatus } from "../../domain/v2-student/v2-student-footprints-types.ts";

function computeStatus(row: RowDataPacket): FootprintStatus {
  if (row.mark_time) return "completed";
  if (row.submit_date) return "pending_review";
  // submit_date IS NULL — check deadline for in_progress
  if (!row.require_date || new Date(String(row.require_date)) > new Date()) {
    return "in_progress";
  }
  // deadline passed but not submitted
  return "pending_review";
}

export async function fetchStudentFootprints(
  studentUserId: string,
  page = 1,
  pageSize = 20,
): Promise<StudentFootprintItem[]> {
  const pool = await getMysqlPool();
  const offset = (page - 1) * pageSize;
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT s.seq_id, s.exp_id, s.submit_date,
            s.mark_time, s.mark_result, s.mark_comments,
            s.require_date,
            e.exp_name,
            u.user_name AS teacher_name
     FROM exp_homework_student s
     JOIN exp_homework h ON h.work_id = s.work_id
     LEFT JOIN exp_msg e ON e.exp_id = h.exp_id
     LEFT JOIN sys_user u ON u.user_id = h.teacher_user_id
     WHERE s.student_user_id = ?
     ORDER BY COALESCE(s.submit_date, s.require_date, h.create_time) DESC
     LIMIT ? OFFSET ?`,
    [studentUserId, pageSize, offset],
  );

  return rows.map((row) => ({
    seqId: String(row.seq_id),
    expId: String(row.exp_id),
    expName: String(row.exp_name ?? ""),
    teacherName: String(row.teacher_name ?? ""),
    submitDate: row.submit_date ? String(row.submit_date) : null,
    markResult: row.mark_result ? String(row.mark_result) : null,
    markComments: row.mark_comments ? String(row.mark_comments) : null,
    status: computeStatus(row as RowDataPacket),
  }));
}
