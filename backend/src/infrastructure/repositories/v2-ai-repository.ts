/**
 * V2 AI 业务 MySQL 仓库
 * 对应表：ai_task_log / ai_task_draft
 */
import type { Pool, PoolConnection, RowDataPacket } from "mysql2/promise";
import { getMysqlPool } from "../mysql/mysql-client.ts";
import { allocateUniqueMysqlVarchar32Id } from "../ids/identifiable-varchar32.ts";
import type {
  AiTaskLogRecord,
  AiTaskDraftRecord,
  AiChatHistoryItem,
  CreateAiTaskLogInput,
  UpdateAiTaskLogInput,
  CreateAiTaskDraftInput,
  UpdateAiTaskDraftInput,
  AiPromptTemplateRecord,
  CreateAiPromptTemplateInput,
  UpdateAiPromptTemplateInput,
} from "../../domain/v2-ai/v2-ai-types.ts";

// ─── 行映射 ──────────────────────────────────────────────

function rowToAiTaskLog(row: RowDataPacket): AiTaskLogRecord {
  return {
    logId: String(row.log_id),
    userId: String(row.user_id),
    userRole: String(row.user_role),
    taskType: row.task_type as AiTaskLogRecord["taskType"],
    modelUsed: row.model_used ? String(row.model_used) : null,
    promptTokens: Number(row.prompt_tokens ?? 0),
    completionTokens: Number(row.completion_tokens ?? 0),
    durationMs: Number(row.duration_ms ?? 0),
    status: row.status as AiTaskLogRecord["status"],
    contextRefType: row.context_ref_type ? String(row.context_ref_type) : null,
    contextRefId: row.context_ref_id ? String(row.context_ref_id) : null,
    isAccepted: row.is_accepted as AiTaskLogRecord["isAccepted"] ?? null,
    userFeedbackScore: row.user_feedback_score != null ? Number(row.user_feedback_score) : null,
    errorMessage: row.error_message ? String(row.error_message) : null,
    traceId: row.trace_id ? String(row.trace_id) : null,
    requestText: row.request_text ? String(row.request_text) : null,
    responseText: row.response_text ? String(row.response_text) : null,
    createTime: row.create_time ? String(row.create_time) : null,
  };
}

function rowToAiTaskDraft(row: RowDataPacket): AiTaskDraftRecord {
  let draftJson: unknown = null;
  try { draftJson = typeof row.draft_json === "string" ? JSON.parse(row.draft_json) : row.draft_json; } catch { draftJson = row.draft_json; }
  let diffJson: unknown = null;
  if (row.diff_json) {
    try { diffJson = typeof row.diff_json === "string" ? JSON.parse(row.diff_json) : row.diff_json; } catch { diffJson = row.diff_json; }
  }
  return {
    draftId: String(row.draft_id),
    userId: String(row.user_id),
    taskType: row.task_type as AiTaskDraftRecord["taskType"],
    contextRefType: row.context_ref_type ? String(row.context_ref_type) : null,
    contextRefId: row.context_ref_id ? String(row.context_ref_id) : null,
    draftJson,
    diffJson,
    status: row.status as AiTaskDraftRecord["status"],
    source: (row.source as AiTaskDraftRecord["source"]) ?? "web",
    createTime: row.create_time ? String(row.create_time) : null,
    updateTime: row.update_time ? String(row.update_time) : null,
  };
}

// ─── ai_task_log CRUD ─────────────────────────────────

/**
 * 插入一条 AI 任务日志（pending 状态）
 * 返回生成的 logId
 */
export async function insertAiTaskLog(
  input: CreateAiTaskLogInput,
  conn?: PoolConnection,
): Promise<string> {
  const pool = conn ?? getMysqlPool();
  const logId = input.logId ?? await allocateUniqueMysqlVarchar32Id(pool, {
    table: "ai_task_log",
    column: "log_id",
    label: "ai_log",
  });
  // 注：使用 query 而非 execute，避免旧连接的预处理语句缓存与新列数冲突
  await pool.query(
    `INSERT INTO ai_task_log (log_id, user_id, user_role, task_type, model_used, prompt_tokens, completion_tokens, duration_ms, status, context_ref_type, context_ref_id, error_message, trace_id, request_text, response_text)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      logId,
      input.userId,
      input.userRole,
      input.taskType,
      input.modelUsed ?? null,
      input.promptTokens ?? 0,
      input.completionTokens ?? 0,
      input.durationMs ?? 0,
      input.status,
      input.contextRefType ?? null,
      input.contextRefId ?? null,
      input.errorMessage ?? null,
      input.traceId ?? null,
      input.requestText ?? null,
      input.responseText ?? null,
    ],
  );
  return logId;
}

/**
 * 更新 AI 任务日志状态与结果（success / failed）
 */
export async function updateAiTaskLog(
  logId: string,
  input: UpdateAiTaskLogInput,
  conn?: PoolConnection,
): Promise<void> {
  const pool = conn ?? getMysqlPool();
  // 使用 query 而非 execute，避免预处理语句缓存冲突
  await pool.query(
    `UPDATE ai_task_log SET status = ?, prompt_tokens = ?, completion_tokens = ?, duration_ms = ?, error_message = ?, response_text = ? WHERE log_id = ?`,
    [
      input.status,
      input.promptTokens ?? 0,
      input.completionTokens ?? 0,
      input.durationMs ?? 0,
      input.errorMessage ?? null,
      input.responseText ?? null,
      logId,
    ],
  );
}

/**
 * 更新采纳状态与用户反馈
 */
export async function patchAiTaskLogFeedback(
  logId: string,
  isAccepted: "y" | "n" | "partial",
  feedbackScore?: number,
  conn?: PoolConnection,
): Promise<void> {
  const pool = conn ?? getMysqlPool();
  await pool.query(
    `UPDATE ai_task_log SET is_accepted = ?, user_feedback_score = ? WHERE log_id = ?`,
    [
      isAccepted,
      feedbackScore ?? null,
      logId,
    ],
  );
}

/**
 * 查询用户最近的成功对话历史（按 create_time 倒序）
 * 返回最多 limit 条消息（user 与 assistant 交替），用于构建滑动窗口上下文
 *
 * 仅查询与当前 userRole 匹配的记录，避免跨角色/跨身份的历史污染石头老师身份。
 */
export async function listRecentChatHistory(
  userId: string,
  limit = 8,
  userRole?: string,
  conn?: PoolConnection,
): Promise<AiChatHistoryItem[]> {
  const pool = conn ?? getMysqlPool();
  // 注：参数顺序必须与 SQL 中 ? 占位符顺序一致
  // SQL 顺序：user_id=? → (user_role=?) → LIMIT ?
  const params: unknown[] = userRole
    ? [userId, userRole, limit]
    : [userId, limit];
  const roleFilter = userRole ? " AND user_role = ?" : "";
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT request_text, response_text, create_time
     FROM ai_task_log
     WHERE user_id = ? AND status = 'success' AND request_text IS NOT NULL AND response_text IS NOT NULL${roleFilter}
     ORDER BY create_time DESC
     LIMIT ?`,
    params,
  );

  // 倒序取 N 条后再反转为正序（最早的在前面）
  const items: AiChatHistoryItem[] = [];
  for (let i = rows.length - 1; i >= 0; i--) {
    const row = rows[i];
    const req = row.request_text ? String(row.request_text) : null;
    const res = row.response_text ? String(row.response_text) : null;
    if (req) items.push({ role: "user", content: req });
    if (res) items.push({ role: "assistant", content: res });
  }
  return items;
}

// ─── ai_task_draft CRUD ─────────────────────────────

/**
 * 插入一条 AI 草稿
 * 返回生成的 draftId
 */
export async function insertAiTaskDraft(
  input: CreateAiTaskDraftInput,
  conn?: PoolConnection,
): Promise<string> {
  const pool = conn ?? getMysqlPool();
  const draftId = input.draftId ?? await allocateUniqueMysqlVarchar32Id(pool, {
    table: "ai_task_draft",
    column: "draft_id",
    label: "ai_draft",
  });
  await pool.execute(
    `INSERT INTO ai_task_draft (draft_id, user_id, task_type, context_ref_type, context_ref_id, draft_json, diff_json, status, source)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      draftId,
      input.userId,
      input.taskType,
      input.contextRefType ?? null,
      input.contextRefId ?? null,
      JSON.stringify(input.draftJson),
      input.diffJson ? JSON.stringify(input.diffJson) : null,
      input.status ?? "pending",
      input.source ?? "web",
    ],
  );
  return draftId;
}

/**
 * 更新草稿状态与内容
 */
export async function updateAiTaskDraft(
  draftId: string,
  input: UpdateAiTaskDraftInput,
  conn?: PoolConnection,
): Promise<void> {
  const pool = conn ?? getMysqlPool();
  const sets: string[] = ["status = ?"];
  const params: unknown[] = [input.status];
  if (input.draftJson !== undefined) {
    sets.push("draft_json = ?");
    params.push(JSON.stringify(input.draftJson));
  }
  if (input.diffJson !== undefined) {
    sets.push("diff_json = ?");
    params.push(input.diffJson !== null ? JSON.stringify(input.diffJson) : null);
  }
  params.push(draftId);
  await pool.query(`UPDATE ai_task_draft SET ${sets.join(", ")} WHERE draft_id = ?`, params);
}

/**
 * 查询用户最近的待确认草稿列表
 */
export async function listPendingDraftsByUser(
  userId: string,
  limit = 20,
  conn?: PoolConnection,
): Promise<AiTaskDraftRecord[]> {
  const pool = conn ?? getMysqlPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM ai_task_draft WHERE user_id = ? AND status = 'pending' ORDER BY create_time DESC LIMIT ?`,
    [userId, limit],
  );
  return rows.map(rowToAiTaskDraft);
}

// ─── ai_prompt_template CRUD ──────────────────────────

function rowToAiPromptTemplate(row: RowDataPacket): AiPromptTemplateRecord {
  return {
    templateId: String(row.template_id),
    code: String(row.code),
    name: String(row.name),
    role: String(row.role),
    content: String(row.content),
    version: Number(row.version),
    isActive: row.is_active as "y" | "n",
    description: row.description ? String(row.description) : null,
    createUserId: row.create_user_id ? String(row.create_user_id) : null,
    updateUserId: row.update_user_id ? String(row.update_user_id) : null,
    createTime: row.create_time ? String(row.create_time) : null,
    updateTime: row.update_time ? String(row.update_time) : null,
  };
}

/**
 * 查询所有 prompt 模板（按 code 排序）
 */
export async function listAiPromptTemplates(
  conn?: PoolConnection,
): Promise<AiPromptTemplateRecord[]> {
  const pool = conn ?? getMysqlPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM ai_prompt_template ORDER BY code ASC`,
  );
  return rows.map(rowToAiPromptTemplate);
}

/**
 * 根据 templateId 查询单个模板
 */
export async function getAiPromptTemplateById(
  templateId: string,
  conn?: PoolConnection,
): Promise<AiPromptTemplateRecord | null> {
  const pool = conn ?? getMysqlPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM ai_prompt_template WHERE template_id = ?`,
    [templateId],
  );
  return rows.length > 0 ? rowToAiPromptTemplate(rows[0]!) : null;
}

/**
 * 根据角色查询当前启用模板
 * 先精确匹配 role，未命中则回退到 role='*'
 */
export async function getActiveAiPromptByRole(
  role: string,
  conn?: PoolConnection,
): Promise<AiPromptTemplateRecord | null> {
  const pool = conn ?? getMysqlPool();
  // 1) 精确匹配
  const [exactRows] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM ai_prompt_template WHERE role = ? AND is_active = 'y' ORDER BY version DESC LIMIT 1`,
    [role],
  );
  if (exactRows.length > 0) return rowToAiPromptTemplate(exactRows[0]!);

  // 2) 回退到通配 *
  const [fallbackRows] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM ai_prompt_template WHERE role = '*' AND is_active = 'y' ORDER BY version DESC LIMIT 1`,
  );
  return fallbackRows.length > 0 ? rowToAiPromptTemplate(fallbackRows[0]!) : null;
}

/**
 * 插入一条 prompt 模板
 */
export async function insertAiPromptTemplate(
  input: CreateAiPromptTemplateInput,
  conn?: PoolConnection,
): Promise<string> {
  const pool = conn ?? getMysqlPool();
  const templateId = input.templateId ?? await allocateUniqueMysqlVarchar32Id(pool, {
    table: "ai_prompt_template",
    column: "template_id",
    label: "pt",
  });
  await pool.query(
    `INSERT INTO ai_prompt_template (template_id, code, name, role, content, version, is_active, description, create_user_id, update_user_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      templateId,
      input.code,
      input.name,
      input.role,
      input.content,
      input.version ?? 1,
      input.isActive ?? "y",
      input.description ?? null,
      input.createUserId ?? null,
      input.updateUserId ?? null,
    ],
  );
  return templateId;
}

/**
 * 更新 prompt 模板（部分更新）
 */
export async function updateAiPromptTemplate(
  templateId: string,
  input: UpdateAiPromptTemplateInput,
  conn?: PoolConnection,
): Promise<void> {
  const pool = conn ?? getMysqlPool();
  const sets: string[] = [];
  const params: unknown[] = [];
  if (input.name !== undefined) { sets.push("name = ?"); params.push(input.name); }
  if (input.content !== undefined) { sets.push("content = ?"); params.push(input.content); }
  if (input.version !== undefined) { sets.push("version = ?"); params.push(input.version); }
  if (input.isActive !== undefined) { sets.push("is_active = ?"); params.push(input.isActive); }
  if (input.description !== undefined) { sets.push("description = ?"); params.push(input.description); }
  if (input.updateUserId !== undefined) { sets.push("update_user_id = ?"); params.push(input.updateUserId); }
  if (sets.length === 0) return;
  params.push(templateId);
  await pool.query(`UPDATE ai_prompt_template SET ${sets.join(", ")} WHERE template_id = ?`, params);
}

/**
 * 删除 prompt 模板
 */
export async function deleteAiPromptTemplate(
  templateId: string,
  conn?: PoolConnection,
): Promise<void> {
  const pool = conn ?? getMysqlPool();
  await pool.query(`DELETE FROM ai_prompt_template WHERE template_id = ?`, [templateId]);
}
