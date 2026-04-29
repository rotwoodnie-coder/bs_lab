import type { PoolConnection, RowDataPacket, ResultSetHeader } from "mysql2/promise";
import { randomBytes } from "node:crypto";
import { getMysqlPool } from "../infrastructure/mysql/mysql-client.ts";
import { resolveVarchar32PrimaryKey } from "../infrastructure/ids/identifiable-varchar32.ts";
import { normalizeStepComments } from "./ExpService.ts";
import type {
  CreateQuestionInput,
  QuestionListPage,
  QuestionListQuery,
  QuestionMsgRecord,
  QuestionOptionRecord,
  SaveQuestionInput,
  QuestionChooseType,
} from "../domain/v2-question/v2-question-types.ts";

export type QuestionServiceErrorCode =
  | "QUESTION_CONTENT_TOO_LONG"
  | "QUESTION_NAME_EMPTY"
  | "INVALID_QUESTION_TYPE"
  | "NOT_FOUND"
  | "INTERNAL_ERROR";

export class QuestionServiceError extends Error {
  code: QuestionServiceErrorCode;
  constructor(code: QuestionServiceErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

export function makeVarchar32Uuid(): string {
  return randomBytes(16).toString("hex");
}

const DB_DATETIME_FORMAT = "YYYY-MM-DD HH:mm:ss";

const QUESTION_TYPE_CONFIG: Record<string, QuestionChooseType> = {
  placeholder_id_single: "S",
  placeholder_id_multi: "M",
};

// FIXME: Once database seed data is found, update the IDs in QUESTION_TYPE_CONFIG
function resolveQuestionChooseType(questionTypeId: string | null | undefined): QuestionChooseType {
  if (!questionTypeId) throw new QuestionServiceError("INVALID_QUESTION_TYPE", "题型不能为空");
  const mapped = QUESTION_TYPE_CONFIG[String(questionTypeId).trim()];
  if (!mapped) throw new QuestionServiceError("INVALID_QUESTION_TYPE", "未知题型配置");
  return mapped;
}

function formatDbDatetime(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function rowToQuestion(row: RowDataPacket): QuestionMsgRecord {
  return {
    questionId: String(row.question_id),
    questionContent: String(row.question_content ?? ""),
    teacherUserId: row.teacher_user_id ? String(row.teacher_user_id) : null,
    classId: row.class_id ? String(row.class_id) : null,
    difficultyTypeId: row.difficulty_type_id ? String(row.difficulty_type_id) : null,
    difficultyTypeName: row.difficulty_type_name != null ? String(row.difficulty_type_name) : null,
    questionTypeId: row.question_type_id ? String(row.question_type_id) : null,
    questionTypeName: row.question_type_name != null ? String(row.question_type_name) : null,
    questionCapacityId: row.question_capacity_id ? String(row.question_capacity_id) : null,
    questionCapacityName: row.question_capacity_name != null ? String(row.question_capacity_name) : null,
    unitId: row.unit_id ? String(row.unit_id) : null,
    knowledgeId: row.knowledge_id ? String(row.knowledge_id) : null,
    knowledgeContent: row.knowledge_content ? String(row.knowledge_content) : null,
    chooseType: (row.choose_type as QuestionMsgRecord["chooseType"]) ?? null,
    status: row.status ? String(row.status) : null,
    rejectReason: row.reject_reason ? String(row.reject_reason) : null,
    createUserId: row.create_user_id ? String(row.create_user_id) : null,
    createTime: row.create_time ? String(row.create_time) : null,
    updateUserId: row.update_user_id ? String(row.update_user_id) : null,
    updateTime: row.update_time ? String(row.update_time) : null,
    isDeleted: Number(row.is_deleted ?? 0) as 0 | 1,
  };
}

function normalizeQuestionContent(raw: unknown): string {
  const text = normalizeStepComments(raw);
  if (!text) throw new QuestionServiceError("QUESTION_NAME_EMPTY", "题干不能为空");
  if (text.length > 10000) throw new QuestionServiceError("QUESTION_CONTENT_TOO_LONG", `题干过长，目标格式 ${DB_DATETIME_FORMAT}`);
  return text;
}

function normalizeOptionContent(raw: unknown): string | null {
  const text = normalizeStepComments(raw);
  if (!text) return null;
  return text;
}

async function replaceOptions(conn: PoolConnection, questionId: string, options: SaveQuestionInput["options"]): Promise<void> {
  await conn.query(`DELETE FROM exp_question_select WHERE question_id = ?`, [questionId]);
  for (const option of options ?? []) {
    const content = normalizeOptionContent(option.selectContent);
    if (!content) continue;
    const selectId = option.selectId?.trim() ? option.selectId.trim().slice(0, 32) : makeVarchar32Uuid();
    await conn.query(
      `INSERT INTO exp_question_select (select_id, question_id, select_content, sort_order, is_right)
       VALUES (?, ?, ?, ?, ?)`,
      [selectId, questionId, content, option.sortOrder ?? null, option.isRight ?? "n"],
    );
  }
}

export async function getQuestionList(query: QuestionListQuery): Promise<QuestionListPage> {
  const pool = getMysqlPool();
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));
  const offset = (page - 1) * pageSize;
  const where = ["q.is_deleted = 0"];
  const params: unknown[] = [];

  if (query.keyword?.trim()) {
    where.push("q.question_content LIKE ?");
    params.push(`%${query.keyword.trim()}%`);
  }
  if (query.difficultyTypeId?.trim()) { where.push("q.difficulty_type_id = ?"); params.push(query.difficultyTypeId.trim()); }
  if (query.questionTypeId?.trim()) { where.push("q.question_type_id = ?"); params.push(query.questionTypeId.trim()); }
  if (query.questionCapacityId?.trim()) { where.push("q.question_capacity_id = ?"); params.push(query.questionCapacityId.trim()); }
  if (query.unitId?.trim()) { where.push("q.unit_id = ?"); params.push(query.unitId.trim()); }
  if (query.teacherUserId?.trim()) { where.push("q.teacher_user_id = ?"); params.push(query.teacherUserId.trim()); }
  if (query.status?.trim()) { where.push("q.status = ?"); params.push(query.status.trim()); }

  const whereSql = where.join(" AND ");
  const [countRows] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM exp_question q WHERE ${whereSql}`,
    params,
  );
  const total = Number(countRows[0]?.total ?? 0);

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT
       q.*,
       d.type_name AS difficulty_type_name,
       t.type_name AS question_type_name,
       c.capacity_name AS question_capacity_name
     FROM exp_question q
     LEFT JOIN data_difficulty_type d ON d.type_id = q.difficulty_type_id
     LEFT JOIN data_question_type t ON t.type_id = q.question_type_id
     LEFT JOIN data_question_capacity c ON c.capacity_id = q.question_capacity_id
     WHERE ${whereSql}
     ORDER BY q.create_time DESC, q.question_id DESC
     LIMIT ? OFFSET ?`,
    [...params, pageSize, offset],
  );

  return { items: rows.map(rowToQuestion), total, page, pageSize };
}

export async function getQuestionDetail(questionId: string) {
  const pool = getMysqlPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM exp_question WHERE question_id = ? AND is_deleted = 0 LIMIT 1`,
    [questionId],
  );
  if (rows.length === 0) return null;
  const base = rowToQuestion(rows[0]!);
  const [options] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM exp_question_select WHERE question_id = ? ORDER BY sort_order ASC, select_id ASC`,
    [questionId],
  );
  return {
    ...base,
    options: (options as RowDataPacket[]).map((r) => ({
      selectId: String(r.select_id),
      questionId: String(r.question_id),
      selectContent: r.select_content ? String(r.select_content) : "",
      sortOrder: r.sort_order != null ? Number(r.sort_order) : null,
      isRight: String(r.is_right ?? "n") as "y" | "n",
    } as QuestionOptionRecord)),
  };
}

export async function saveQuestion(input: SaveQuestionInput, actorId?: string) {
  const pool = getMysqlPool();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const questionContent = normalizeQuestionContent(input.questionContent);
    const questionTypeId = input.questionTypeId ?? null;
    const chooseType = resolveQuestionChooseType(questionTypeId);
    const now = formatDbDatetime();

    const questionId = await resolveVarchar32PrimaryKey(conn, {
      table: "exp_question",
      column: "question_id",
      label: questionContent.slice(0, 20),
      explicit: input.questionId,
    });

    const existing = await conn.query<RowDataPacket[]>(
      `SELECT question_id FROM exp_question WHERE question_id = ? AND is_deleted = 0 LIMIT 1`,
      [questionId],
    );
    const isUpdate = existing[0].length > 0;

    if (isUpdate) {
      await conn.query<ResultSetHeader>(
        `UPDATE exp_question SET
           question_content = ?,
           teacher_user_id = ?,
           class_id = ?,
           difficulty_type_id = ?,
           question_type_id = ?,
           question_capacity_id = ?,
           unit_id = ?,
           knowledge_id = ?,
           knowledge_content = ?,
           choose_type = ?,
           status = ?,
           reject_reason = ?,
           update_user_id = ?,
           update_time = ?
         WHERE question_id = ? AND is_deleted = 0`,
        [
          questionContent,
          input.teacherUserId ?? actorId ?? null,
          input.classId ?? null,
          input.difficultyTypeId ?? null,
          questionTypeId,
          input.questionCapacityId ?? null,
          input.unitId ?? null,
          input.knowledgeId ?? null,
          input.knowledgeContent ?? null,
          chooseType,
          input.status ?? "t",
          input.rejectReason ?? null,
          actorId ?? null,
          now,
          questionId,
        ],
      );
    } else {
      await conn.query<ResultSetHeader>(
        `INSERT INTO exp_question (
           question_id, question_content, teacher_user_id, class_id, difficulty_type_id,
           question_type_id, question_capacity_id, unit_id, knowledge_id, knowledge_content,
           choose_type, status, reject_reason, create_user_id, create_time, update_user_id, update_time, is_deleted
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
        [
          questionId,
          questionContent,
          input.teacherUserId ?? actorId ?? null,
          input.classId ?? null,
          input.difficultyTypeId ?? null,
          questionTypeId,
          input.questionCapacityId ?? null,
          input.unitId ?? null,
          input.knowledgeId ?? null,
          input.knowledgeContent ?? null,
          chooseType,
          input.status ?? "t",
          input.rejectReason ?? null,
          actorId ?? null,
          now,
          actorId ?? null,
          now,
        ],
      );
    }

    // 预留：如未来传入 exp_id，请在此处建立 rel_exp_question 关联
    if (input.expId) {
      // TODO: INSERT INTO rel_exp_question (...)
    }

    await replaceOptions(conn, questionId, input.options);

    await conn.commit();
    return await getQuestionDetail(questionId);
  } catch (err) {
    await conn.rollback();
    if (err instanceof QuestionServiceError) throw err;
    throw new QuestionServiceError("INTERNAL_ERROR", err instanceof Error ? err.message : String(err));
  } finally {
    conn.release();
  }
}
