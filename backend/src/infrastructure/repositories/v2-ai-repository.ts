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
  CreateAiTaskLogInput,
  UpdateAiTaskLogInput,
  CreateAiTaskDraftInput,
  UpdateAiTaskDraftInput,
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
  await pool.execute(
    `INSERT INTO ai_task_log (log_id, user_id, user_role, task_type, model_used, prompt_tokens, completion_tokens, duration_ms, status, context_ref_type, context_ref_id, error_message, trace_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
  await pool.execute(
    `UPDATE ai_task_log SET status = ?, prompt_tokens = ?, completion_tokens = ?, duration_ms = ?, error_message = ? WHERE log_id = ?`,
    [
      input.status,
      input.promptTokens ?? 0,
      input.completionTokens ?? 0,
      input.durationMs ?? 0,
      input.errorMessage ?? null,
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
  await pool.execute(
    `UPDATE ai_task_log SET is_accepted = ?, user_feedback_score = ? WHERE log_id = ?`,
    [
      isAccepted,
      feedbackScore ?? null,
      logId,
    ],
  );
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
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT * FROM ai_task_draft WHERE user_id = ? AND status = 'pending' ORDER BY create_time DESC LIMIT ?`,
    [userId, limit],
  );
  return rows.map(rowToAiTaskDraft);
}
