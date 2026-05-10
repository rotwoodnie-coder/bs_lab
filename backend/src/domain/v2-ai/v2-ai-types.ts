/**
 * V2 AI 业务模块类型定义
 * 对应表：ai_task_log / ai_task_draft
 */

// ─── 枚举 ────────────────────────────────────────────────

/** AI 任务类型 */
export type AiTaskType = "generate_scheme" | "safety_check" | "analysis";

/** 任务状态 */
export type AiTaskStatus = "pending" | "success" | "failed";

/** 草稿确认状态 */
export type AiDraftStatus = "pending" | "confirmed" | "rejected" | "expired";

/** 采纳标识 */
export type AiAccepted = "y" | "n" | "partial";

/** 草稿来源 */
export type AiDraftSource = "web" | "mobile" | "api";

// ─── AI 任务日志 ai_task_log ─────────────────────────

export interface AiTaskLogRecord {
  logId: string;
  userId: string;
  userRole: string;
  taskType: AiTaskType;
  modelUsed: string | null;
  promptTokens: number;
  completionTokens: number;
  durationMs: number;
  status: AiTaskStatus;
  contextRefType: string | null;
  contextRefId: string | null;
  isAccepted: AiAccepted | null;
  userFeedbackScore: number | null;
  errorMessage: string | null;
  traceId: string | null;
  createTime: string | null;
}

export interface CreateAiTaskLogInput {
  logId?: string;
  userId: string;
  userRole: string;
  taskType: AiTaskType;
  modelUsed?: string;
  promptTokens?: number;
  completionTokens?: number;
  durationMs?: number;
  status: AiTaskStatus;
  contextRefType?: string;
  contextRefId?: string;
  errorMessage?: string;
  traceId?: string;
}

export interface UpdateAiTaskLogInput {
  status: AiTaskStatus;
  promptTokens?: number;
  completionTokens?: number;
  durationMs?: number;
  errorMessage?: string;
}

// ─── AI 草稿缓存 ai_task_draft ──────────────────────

export interface AiTaskDraftRecord {
  draftId: string;
  userId: string;
  taskType: AiTaskType;
  contextRefType: string | null;
  contextRefId: string | null;
  draftJson: unknown;
  diffJson: unknown | null;
  status: AiDraftStatus;
  source: AiDraftSource;
  createTime: string | null;
  updateTime: string | null;
}

export interface CreateAiTaskDraftInput {
  draftId?: string;
  userId: string;
  taskType: AiTaskType;
  contextRefType?: string;
  contextRefId?: string;
  draftJson: unknown;
  diffJson?: unknown;
  status?: AiDraftStatus;
  source?: AiDraftSource;
}

export interface UpdateAiTaskDraftInput {
  status: AiDraftStatus;
  draftJson?: unknown;
  diffJson?: unknown;
}

// ─── 聊天对话类型 ────────────────────────────────────

export interface AiChatRequest {
  message: string;
  contextRefType?: string;
  contextRefId?: string;
}

export interface AiChatResponse {
  reply: string;
  logId: string;
  draftId: string | null;
}
