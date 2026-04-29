/**
 * V2 题库模块 MySQL 仓库
 * 对应表：exp_question / exp_question_select
 */
import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import { allocateUniqueMysqlVarchar32Id, resolveVarchar32PrimaryKey } from "../ids/identifiable-varchar32.ts";
import { getMysqlPool } from "../mysql/mysql-client.ts";
import type {
  ExpQuestionRecord,
  ExpQuestionSelectRecord,
  QuestionListQuery,
  QuestionListPage,
  CreateExpQuestionInput,
  CreateSelectInput,
  UpdateExpQuestionInput,
} from "../../domain/v2-question/v2-question-types.ts";
import type { PoolConnection } from "mysql2/promise";

function nowStr(): string {
  return new Date().toISOString().replace("T", " ").slice(0, 19);
}

function rowToSelect(row: RowDataPacket): ExpQuestionSelectRecord {
  return {
    selectId: String(row.select_id),
    questionId: String(row.question_id),
    selectContent: String(row.select_content ?? ""),
    sortOrder: row.sort_order != null ? Number(row.sort_order) : null,
    isRight: (row.is_right as "y" | "n") ?? "n",
  };
}

function rowToQuestion(row: RowDataPacket): ExpQuestionRecord {
  return {
    questionId: String(row.question_id),
    questionContent: String(row.question_content ?? ""),
    teacherUserId: row.teacher_user_id ? String(row.teacher_user_id) : null,
    classId: row.class_id ? String(row.class_id) : null,
    difficultyTypeId: row.difficulty_type_id ? String(row.difficulty_type_id) : null,
    questionTypeId: row.question_type_id ? String(row.question_type_id) : null,
    questionCapacityId: row.question_capacity_id ? String(row.question_capacity_id) : null,
    unitId: row.unit_id ? String(row.unit_id) : null,
    knowledgeId: row.knowledge_id ? String(row.knowledge_id) : null,
    knowledgeContent: row.knowledge_content ? String(row.knowledge_content) : null,
    chooseType: (row.choose_type as ExpQuestionRecord["chooseType"]) ?? null,
    status: (row.status as ExpQuestionRecord["status"]) ?? null,
    rejectReason: row.reject_reason ? String(row.reject_reason) : null,
    displayOwnerName: row.display_owner_name ? String(row.display_owner_name) : null,
    createUserId: row.create_user_id ? String(row.create_user_id) : null,
    createTime: row.create_time ? String(row.create_time) : null,
    updateUserId: row.update_user_id ? String(row.update_user_id) : null,
    updateTime: row.update_time ? String(row.update_time) : null,
    isDeleted: Number(row.is_deleted ?? 0) as 0 | 1,
  };
}

async function attachSelects(pool: ReturnType<typeof getMysqlPool>, items: ExpQuestionRecord[]): Promise<void> {
  if (items.length === 0) return;
  const ids = items.map((q) => q.questionId);
  const placeholders = ids.map(() => "?").join(",");
  const [selectRows] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM exp_question_select WHERE question_id IN (${placeholders}) ORDER BY sort_order`,
    ids,
  );
  const map = new Map<string, ExpQuestionSelectRecord[]>();
  for (const row of selectRows) {
    const s = rowToSelect(row as RowDataPacket);
    if (!map.has(s.questionId)) map.set(s.questionId, []);
    map.get(s.questionId)!.push(s);
  }
  for (const item of items) {
    item.selects = map.get(item.questionId) ?? [];
  }
}

export async function listQuestions(query: QuestionListQuery = {}): Promise<QuestionListPage> {
  const pool = getMysqlPool();
  const {
    keyword, teacherUserId, classId, difficultyTypeId,
    questionTypeId, unitId, status, page = 1, pageSize = 20,
  } = query;

  const conditions: string[] = ["q.is_deleted = 0"];
  const params: unknown[] = [];

  if (keyword) { conditions.push("q.question_content LIKE ?"); params.push(`%${keyword}%`); }
  if (teacherUserId) { conditions.push("q.teacher_user_id = ?"); params.push(teacherUserId); }
  if (classId) { conditions.push("q.class_id = ?"); params.push(classId); }
  if (difficultyTypeId) { conditions.push("q.difficulty_type_id = ?"); params.push(difficultyTypeId); }
  if (questionTypeId) { conditions.push("q.question_type_id = ?"); params.push(questionTypeId); }
  if (unitId) { conditions.push("q.unit_id = ?"); params.push(unitId); }
  if (status) { conditions.push("q.status = ?"); params.push(status); }

  const where = conditions.join(" AND ");
  const offset = (page - 1) * pageSize;

  const [countRows] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS cnt FROM exp_question q WHERE ${where}`,
    params,
  );
  const total = Number((countRows[0] as RowDataPacket)?.cnt ?? 0);

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT q.*, owner.user_name AS display_owner_name
     FROM exp_question q
     LEFT JOIN sys_user owner ON owner.user_id = q.create_user_id
     WHERE ${where} ORDER BY q.create_time DESC LIMIT ? OFFSET ?`,
    [...params, pageSize, offset],
  );

  const items = rows.map(rowToQuestion);
  await attachSelects(pool, items);
  return { items, total, page, pageSize };
}

export async function getQuestionById(questionId: string): Promise<ExpQuestionRecord | null> {
  const pool = getMysqlPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT q.*, owner.user_name AS display_owner_name FROM exp_question q LEFT JOIN sys_user owner ON owner.user_id = q.create_user_id WHERE q.question_id = ? AND q.is_deleted = 0",
    [questionId],
  );
  if (rows.length === 0) return null;
  const question = rowToQuestion(rows[0] as RowDataPacket);
  await attachSelects(pool, [question]);
  return question;
}

export async function createQuestion(input: CreateExpQuestionInput): Promise<ExpQuestionRecord> {
  const pool = getMysqlPool();
  const questionId = await resolveVarchar32PrimaryKey(pool, {
    table: "exp_question",
    column: "question_id",
    label: input.questionContent.slice(0, 200),
    explicit: input.questionId,
  });
  const now = nowStr();

  await pool.execute<ResultSetHeader>(
    `INSERT INTO exp_question
       (question_id, question_content, teacher_user_id, class_id, difficulty_type_id,
        question_type_id, question_capacity_id, unit_id, knowledge_id, knowledge_content,
        choose_type, status, create_user_id, create_time, update_user_id, update_time, is_deleted)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 't', ?, ?, ?, ?, 0)`,
    [
      questionId, input.questionContent,
      input.teacherUserId ?? null, input.classId ?? null,
      input.difficultyTypeId ?? null, input.questionTypeId ?? null,
      input.questionCapacityId ?? null, input.unitId ?? null,
      input.knowledgeId ?? null, input.knowledgeContent ?? null,
      input.chooseType ?? null,
      input.teacherUserId ?? null, now, input.teacherUserId ?? null, now,
    ],
  );

  const selects = input.selects ?? input.options ?? [];
  for (const [i, sel] of selects.entries()) {
    const selectId = await allocateUniqueMysqlVarchar32Id(pool, {
      table: "exp_question_select",
      column: "select_id",
      label: `${input.questionContent.slice(0, 40)}_opt_${i}_${sel.selectContent.slice(0, 40)}`,
    });
    await pool.execute<ResultSetHeader>(
      `INSERT INTO exp_question_select (select_id, question_id, select_content, sort_order, is_right)
       VALUES (?, ?, ?, ?, ?)`,
      [selectId, questionId, sel.selectContent, sel.sortOrder ?? i, sel.isRight ?? "n"],
    );
  }

  const created = await getQuestionById(questionId);
  return created!;
}

export async function updateQuestionStatus(
  questionId: string,
  status: "y" | "n" | "t",
  updaterId: string,
  rejectReason?: string,
): Promise<void> {
  const pool = getMysqlPool();
  await pool.execute<ResultSetHeader>(
    `UPDATE exp_question
     SET status = ?, reject_reason = ?, update_user_id = ?, update_time = ?
     WHERE question_id = ?`,
    [status, status === "n" ? (rejectReason ?? null) : null, updaterId, nowStr(), questionId],
  );
}

async function syncQuestionSelects(
  conn: PoolConnection,
  questionId: string,
  selects: CreateSelectInput[],
  labelForNewIds: string,
): Promise<void> {
  const desiredIds = new Set<string>();
  for (const [i, sel] of selects.entries()) {
    const sid = sel.selectId?.trim();
    if (sid) {
      await conn.execute<ResultSetHeader>(
        `UPDATE exp_question_select
         SET select_content = ?, sort_order = ?, is_right = ?
         WHERE question_id = ? AND select_id = ?`,
        [sel.selectContent, sel.sortOrder ?? i, sel.isRight ?? "n", questionId, sid],
      );
      desiredIds.add(sid);
    } else {
      const selectId = await allocateUniqueMysqlVarchar32Id(conn, {
        table: "exp_question_select",
        column: "select_id",
        label: `${labelForNewIds.slice(0, 40)}_opt_${i}_${sel.selectContent.slice(0, 40)}`,
      });
      await conn.execute<ResultSetHeader>(
        `INSERT INTO exp_question_select (select_id, question_id, select_content, sort_order, is_right)
         VALUES (?, ?, ?, ?, ?)`,
        [selectId, questionId, sel.selectContent, sel.sortOrder ?? i, sel.isRight ?? "n"],
      );
      desiredIds.add(selectId);
    }
  }

  if (desiredIds.size === 0) {
    await conn.execute<ResultSetHeader>(
      `DELETE q FROM exp_question_select q
       WHERE q.question_id = ?
         AND NOT EXISTS (
           SELECT 1 FROM exp_question_answer_select a WHERE a.select_id = q.select_id
         )`,
      [questionId],
    );
    return;
  }

  const placeholders = [...desiredIds].map(() => "?").join(",");
  await conn.execute<ResultSetHeader>(
    `DELETE q FROM exp_question_select q
     WHERE q.question_id = ?
       AND q.select_id NOT IN (${placeholders})
       AND NOT EXISTS (
         SELECT 1 FROM exp_question_answer_select a WHERE a.select_id = q.select_id
       )`,
    [questionId, ...desiredIds],
  );
}

export async function updateQuestion(questionId: string, patch: UpdateExpQuestionInput): Promise<ExpQuestionRecord> {
  const pool = getMysqlPool();
  const existing = await getQuestionById(questionId);
  if (!existing) throw new Error("NOT_FOUND");
  const updaterId = patch.updaterId?.trim();
  if (!updaterId) throw new Error("UPDATER_ID_REQUIRED");

  const fragments: string[] = [];
  const params: unknown[] = [];

  if (patch.questionContent !== undefined) {
    fragments.push("question_content = ?");
    params.push(patch.questionContent);
  }
  if (patch.teacherUserId !== undefined) {
    fragments.push("teacher_user_id = ?");
    params.push(patch.teacherUserId);
  }
  if (patch.classId !== undefined) {
    fragments.push("class_id = ?");
    params.push(patch.classId);
  }
  if (patch.difficultyTypeId !== undefined) {
    fragments.push("difficulty_type_id = ?");
    params.push(patch.difficultyTypeId);
  }
  if (patch.questionTypeId !== undefined) {
    fragments.push("question_type_id = ?");
    params.push(patch.questionTypeId);
  }
  if (patch.questionCapacityId !== undefined) {
    fragments.push("question_capacity_id = ?");
    params.push(patch.questionCapacityId);
  }
  if (patch.unitId !== undefined) {
    fragments.push("unit_id = ?");
    params.push(patch.unitId);
  }
  if (patch.knowledgeId !== undefined) {
    fragments.push("knowledge_id = ?");
    params.push(patch.knowledgeId);
  }
  if (patch.knowledgeContent !== undefined) {
    fragments.push("knowledge_content = ?");
    params.push(patch.knowledgeContent);
  }
  if (patch.chooseType !== undefined) {
    fragments.push("choose_type = ?");
    params.push(patch.chooseType);
  }

  const hasScalars = fragments.length > 0;
  const hasSelects = patch.selects !== undefined;
  if (!hasScalars && !hasSelects) throw new Error("NO_FIELDS_TO_UPDATE");

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    if (hasScalars) {
      fragments.push("update_user_id = ?", "update_time = ?");
      params.push(updaterId, nowStr(), questionId);
      await conn.query<ResultSetHeader>(
        `UPDATE exp_question SET ${fragments.join(", ")} WHERE question_id = ? AND is_deleted = 0`,
        params,
      );
    } else if (hasSelects) {
      await conn.execute<ResultSetHeader>(
        `UPDATE exp_question SET update_user_id = ?, update_time = ? WHERE question_id = ? AND is_deleted = 0`,
        [updaterId, nowStr(), questionId],
      );
    }
    if (hasSelects) {
      await syncQuestionSelects(conn, questionId, patch.selects!, patch.questionContent ?? existing.questionContent);
    }
    await conn.commit();
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }

  const updated = await getQuestionById(questionId);
  if (!updated) throw new Error("NOT_FOUND_AFTER_UPDATE");
  return updated;
}

export async function softDeleteQuestion(questionId: string, updaterId: string): Promise<void> {
  const pool = getMysqlPool();
  const [r] = await pool.execute<ResultSetHeader>(
    `UPDATE exp_question SET is_deleted = 1, update_user_id = ?, update_time = ?
     WHERE question_id = ? AND is_deleted = 0`,
    [updaterId, nowStr(), questionId],
  );
  if (r.affectedRows === 0) throw new Error("NOT_FOUND");
}
