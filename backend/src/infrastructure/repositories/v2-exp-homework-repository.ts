/**
 * exp_homework 写操作（课程任务分发，对应 bs_exp_data.sql 中的 exp_homework 表）
 */
import type { RowDataPacket } from "mysql2/promise";
import { V2_ORG_TYPE_IDS } from "../../domain/v2-sys/v2-org-type-constants.ts";
import { getMysqlPool } from "../mysql/mysql-client.ts";
import { allocateUniqueMysqlVarchar32Id } from "../ids/identifiable-varchar32.ts";

export interface InsertExpHomeworkInput {
  expId: string;
  teacherUserId: string;
  classId: string;
  requireDate?: string | null;
}

export interface ExpHomeworkRecord {
  workId: string;
  expId: string;
  teacherUserId: string;
  classId: string;
  requireDate: string | null;
  createUserId: string | null;
  createTime: string | null;
  isDeleted: 0 | 1;
}

function rowToRecord(row: RowDataPacket): ExpHomeworkRecord {
  return {
    workId: String(row.work_id),
    expId: String(row.exp_id),
    teacherUserId: String(row.teacher_user_id),
    classId: String(row.class_id),
    requireDate: row.require_date ? String(row.require_date) : null,
    createUserId: row.create_user_id ? String(row.create_user_id) : null,
    createTime: row.create_time ? String(row.create_time) : null,
    isDeleted: (Number(row.is_deleted) as 0 | 1) ?? 0,
  };
}

/** 教师须在 sys_user_role 中绑定该班级（org_id 为班级节点） */
export async function assertTeacherClassRelation(teacherId: string, classId: string): Promise<void> {
  const pool = getMysqlPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    `
    SELECT 1 AS ok
    FROM sys_user_role ur
    INNER JOIN sys_org o ON o.org_id = ur.org_id
    WHERE ur.user_id = ?
      AND ur.org_id = ?
      AND o.is_deleted = 0
      AND o.org_type_id = ?
    LIMIT 1
    `,
    [teacherId, classId, V2_ORG_TYPE_IDS.class],
  );
  if (rows.length === 0) throw new Error("该教师与目标班级不存在有效，无法布置作业");
}

export async function insertExpHomework(input: InsertExpHomeworkInput, actorId?: string): Promise<ExpHomeworkRecord> {
  const pool = getMysqlPool();
  const workId = await allocateUniqueMysqlVarchar32Id(pool, {
    table: "exp_homework",
    column: "work_id",
    label: `hw_${input.teacherUserId}_${input.classId}`,
  });

  await pool.query(
    `INSERT INTO exp_homework
       (work_id, exp_id, teacher_user_id, class_id, require_date,
        create_user_id, create_time, update_user_id, update_time, is_deleted)
     VALUES (?, ?, ?, ?, ?, ?, NOW(), ?, NOW(), 0)`,
    [
      workId,
      input.expId,
      input.teacherUserId,
      input.classId,
      input.requireDate ?? null,
      actorId ?? null,
      actorId ?? null,
    ],
  );

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM exp_homework WHERE work_id = ? LIMIT 1`,
    [workId],
  );
  if (rows.length === 0) throw new Error("EXP_HOMEWORK_CREATE_FAILED");
  return rowToRecord(rows[0]!);
}
