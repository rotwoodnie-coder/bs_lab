/**
 * V2 作业模块 MySQL 仓库
 * 对应表：exp_homework / exp_homework_student
 */
import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import { allocateUniqueMysqlVarchar32Id, resolveVarchar32PrimaryKey } from "../ids/identifiable-varchar32.ts";
import { getMysqlPool } from "../mysql/mysql-client.ts";
import type {
  ExpHomeworkRecord,
  ExpHomeworkStudentRecord,
  HomeworkListQuery,
  HomeworkStudentListQuery,
  CreateExpHomeworkInput,
  MarkHomeworkInput,
} from "../../domain/v2-homework/v2-homework-types.ts";

export interface HomeworkListItem extends ExpHomeworkRecord {
  expName: string;
  studentTotal: number;
  submittedCount: number;
  pendingMarkCount: number;
}

function nowStr(): string {
  return new Date().toISOString().replace("T", " ").slice(0, 19);
}

function rowToHomework(row: RowDataPacket): ExpHomeworkRecord {
  return {
    workId: String(row.work_id),
    expId: String(row.exp_id),
    teacherUserId: String(row.teacher_user_id),
    classId: String(row.class_id),
    requireDate: row.require_date ? String(row.require_date) : null,
    createUserId: row.create_user_id ? String(row.create_user_id) : null,
    createTime: row.create_time ? String(row.create_time) : null,
    updateUserId: row.update_user_id ? String(row.update_user_id) : null,
    updateTime: row.update_time ? String(row.update_time) : null,
    isDeleted: Number(row.is_deleted ?? 0) as 0 | 1,
  };
}

function rowToStudent(row: RowDataPacket): ExpHomeworkStudentRecord {
  return {
    seqId: String(row.seq_id),
    workId: String(row.work_id),
    expId: String(row.exp_id),
    teacherUserId: String(row.teacher_user_id),
    teacherExpId: String(row.teacher_exp_id),
    studentUserId: String(row.student_user_id),
    requireDate: row.require_date ? String(row.require_date) : null,
    submitDate: row.submit_date ? String(row.submit_date) : null,
    markUserId: row.mark_user_id ? String(row.mark_user_id) : null,
    markTime: row.mark_time ? String(row.mark_time) : null,
    markResult: row.mark_result ? String(row.mark_result) : null,
    markComments: row.mark_comments ? String(row.mark_comments) : null,
  };
}

export async function listHomework(
  query: HomeworkListQuery = {},
): Promise<{ items: HomeworkListItem[]; total: number }> {
  const pool = await getMysqlPool();
  const { teacherUserId, classId, expId, page = 1, pageSize = 20 } = query;

  const conditions: string[] = ["h.is_deleted = 0"];
  const params: unknown[] = [];

  if (teacherUserId) { conditions.push("h.teacher_user_id = ?"); params.push(teacherUserId); }
  if (classId) { conditions.push("h.class_id = ?"); params.push(classId); }
  if (expId) { conditions.push("h.exp_id = ?"); params.push(expId); }

  const where = conditions.join(" AND ");
  const offset = (page - 1) * pageSize;

  const [countRows] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS cnt FROM exp_homework h WHERE ${where}`,
    params,
  );
  const total = Number((countRows[0] as RowDataPacket)?.cnt ?? 0);

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT h.*,
       COALESCE(e.exp_name, '') AS exp_name,
       COUNT(s.seq_id) AS student_total,
       SUM(s.submit_date IS NOT NULL) AS submitted_count,
       SUM(s.submit_date IS NOT NULL AND s.mark_time IS NULL) AS pending_mark_count
     FROM exp_homework h
     LEFT JOIN exp_msg e ON e.exp_id = h.exp_id
     LEFT JOIN exp_homework_student s ON s.work_id = h.work_id
     WHERE ${where}
     GROUP BY h.work_id
     ORDER BY h.create_time DESC
     LIMIT ? OFFSET ?`,
    [...params, pageSize, offset],
  );

  const items: HomeworkListItem[] = rows.map((row) => ({
    ...rowToHomework(row as RowDataPacket),
    expName: String((row as RowDataPacket).exp_name ?? ""),
    studentTotal: Number((row as RowDataPacket).student_total ?? 0),
    submittedCount: Number((row as RowDataPacket).submitted_count ?? 0),
    pendingMarkCount: Number((row as RowDataPacket).pending_mark_count ?? 0),
  }));

  return { items, total };
}

export async function getHomeworkById(workId: string): Promise<ExpHomeworkRecord | null> {
  const pool = await getMysqlPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT * FROM exp_homework WHERE work_id = ? AND is_deleted = 0",
    [workId],
  );
  if (rows.length === 0) return null;
  return rowToHomework(rows[0] as RowDataPacket);
}

export async function createHomework(input: CreateExpHomeworkInput): Promise<ExpHomeworkRecord> {
  const pool = await getMysqlPool();
  const workId = await resolveVarchar32PrimaryKey(pool, {
    table: "exp_homework",
    column: "work_id",
    label: `hw_${input.expId}_${input.teacherUserId}_${input.classId}`,
    explicit: input.workId,
  });
  const now = nowStr();

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    await connection.execute<ResultSetHeader>(
      `INSERT INTO exp_homework
         (work_id, exp_id, teacher_user_id, class_id, require_date,
          create_user_id, create_time, update_user_id, update_time, is_deleted)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [workId, input.expId, input.teacherUserId, input.classId,
       input.requireDate ?? null, input.teacherUserId, now, input.teacherUserId, now],
    );

    for (const studentUserId of (input.studentUserIds ?? [])) {
      const seqId = await allocateUniqueMysqlVarchar32Id(connection, {
        table: "exp_homework_student",
        column: "seq_id",
        label: `hws_${workId}_${studentUserId}`,
      });
      const studentExpId = await allocateUniqueMysqlVarchar32Id(connection, {
        table: "exp_homework_student",
        column: "exp_id",
        label: `stu_exp_${input.expId}_${studentUserId}_${workId}`,
      });
      await connection.execute<ResultSetHeader>(
        `INSERT INTO exp_homework_student
           (seq_id, work_id, exp_id, teacher_user_id, teacher_exp_id, student_user_id, require_date)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [seqId, workId, studentExpId, input.teacherUserId, input.expId, studentUserId, input.requireDate ?? null],
      );
    }

    await connection.commit();
    connection.release();

    const created = await getHomeworkById(workId);
    return created!;
  } catch (err) {
    await connection.rollback();
    connection.release();
    throw err;
  }
}

export async function listHomeworkStudents(
  query: HomeworkStudentListQuery = {},
): Promise<ExpHomeworkStudentRecord[]> {
  const pool = await getMysqlPool();
  const { workId, studentUserId, submitted, marked } = query;
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (workId) { conditions.push("work_id = ?"); params.push(workId); }
  if (studentUserId) { conditions.push("student_user_id = ?"); params.push(studentUserId); }
  if (submitted === true) conditions.push("submit_date IS NOT NULL");
  if (submitted === false) conditions.push("submit_date IS NULL");
  if (marked === true) conditions.push("mark_time IS NOT NULL");
  if (marked === false) conditions.push("mark_time IS NULL");

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM exp_homework_student ${where} ORDER BY seq_id`,
    params,
  );
  return rows.map(rowToStudent);
}

export async function getHomeworkStudentById(seqId: string): Promise<ExpHomeworkStudentRecord | null> {
  const pool = await getMysqlPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT * FROM exp_homework_student WHERE seq_id = ?",
    [seqId],
  );
  if (rows.length === 0) return null;
  return rowToStudent(rows[0] as RowDataPacket);
}

export async function submitHomeworkStudent(seqId: string): Promise<void> {
  const pool = await getMysqlPool();
  const [result] = await pool.execute<ResultSetHeader>(
    "UPDATE exp_homework_student SET submit_date = NOW() WHERE seq_id = ? AND submit_date IS NULL",
    [seqId],
  );
  if (result.affectedRows === 0) {
    throw new Error("HOMEWORK_ALREADY_SUBMITTED");
  }
}

export async function markHomeworkStudent(seqId: string, input: MarkHomeworkInput): Promise<void> {
  const pool = await getMysqlPool();
  await pool.execute<ResultSetHeader>(
    `UPDATE exp_homework_student
     SET mark_user_id = ?, mark_time = ?, mark_result = ?, mark_comments = ?
     WHERE seq_id = ?`,
    [input.markUserId, nowStr(), input.markResult, input.markComments ?? null, seqId],
  );
}
