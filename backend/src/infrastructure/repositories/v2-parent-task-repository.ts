/**
 * V2 家长任务 MySQL 仓库
 * 查询家长已绑定孩子（audit_status='Y'）的作业任务
 * JOIN: sys_parent_student_rel → exp_homework_student → exp_homework → exp_msg → sys_user
 */
import type { RowDataPacket } from "mysql2/promise";
import { getMysqlPool } from "../mysql/mysql-client.ts";
import type { ParentTaskItem, ParentTaskStatus } from "../../domain/v2-parent/v2-parent-task-types.ts";

function computeStatus(row: RowDataPacket): ParentTaskStatus {
  if (row.mark_time) return "marked";
  if (row.submit_date) return "submitted";
  return "pending";
}

export async function fetchParentTasks(parentUserId: string): Promise<ParentTaskItem[]> {
  const pool = await getMysqlPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT s.seq_id, s.work_id, s.exp_id, s.teacher_user_id,
            s.teacher_exp_id, s.student_user_id, s.require_date,
            s.submit_date, s.mark_time, s.mark_result, s.mark_comments,
            h.class_id,
            e.exp_name,
            t.user_name AS teacher_name,
            stu.user_name AS student_name,
            co.org_name AS class_name
     FROM exp_homework_student s
     JOIN exp_homework h ON h.work_id = s.work_id AND h.is_deleted = 0
     LEFT JOIN exp_msg e ON e.exp_id = h.exp_id
     LEFT JOIN sys_user t ON t.user_id = h.teacher_user_id
     LEFT JOIN sys_user stu ON stu.user_id = s.student_user_id
     LEFT JOIN sys_org co ON co.org_id = h.class_id
     WHERE s.student_user_id IN (
       SELECT r.student_user_id
       FROM sys_parent_student_rel r
       WHERE r.parent_user_id = ?
         AND r.audit_status = 'Y'
     )
     ORDER BY s.submit_date ASC, h.create_time DESC`,
    [parentUserId],
  );

  return rows.map((row) => ({
    seqId: String(row.seq_id),
    workId: String(row.work_id),
    expId: String(row.exp_id),
    teacherExpId: String(row.teacher_exp_id),
    expName: String(row.exp_name ?? ""),
    teacherUserId: String(row.teacher_user_id),
    teacherName: String(row.teacher_name ?? ""),
    studentUserId: String(row.student_user_id),
    studentName: String(row.student_name ?? ""),
    classId: String(row.class_id),
    className: String(row.class_name ?? ""),
    requireDate: row.require_date ? String(row.require_date) : null,
    submitDate: row.submit_date ? String(row.submit_date) : null,
    markResult: row.mark_result ? String(row.mark_result) : null,
    markComments: row.mark_comments ? String(row.mark_comments) : null,
    status: computeStatus(row as RowDataPacket),
  }));
}
