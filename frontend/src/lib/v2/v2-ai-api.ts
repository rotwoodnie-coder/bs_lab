/**
 * V2 AI 业务 API 薄封装
 */
import { createV2ApiService } from "@/lib/v2/apiService";
import type { CoreApiActor } from "@/lib/core-api-shared";

// ─── 类型 ────────────────────────────────────────────────

export interface V2AiChatRequest {
  message: string;
  context_ref_type?: string;
  context_ref_id?: string;
}

export interface V2AiChatResponse {
  reply: string;
  logId: string;
  draftId: string | null;
}

export interface V2AiFeedbackRequest {
  is_accepted: "y" | "n" | "partial";
  feedback_score?: number;
}

// ─── API ─────────────────────────────────────────────────

/**
 * AI 聊天：发送消息给 AI 助教
 */
export function postV2AiChat(actor: CoreApiActor, input: V2AiChatRequest): Promise<V2AiChatResponse> {
  return createV2ApiService(actor).post<V2AiChatResponse>("/v2/ai/chat", input);
}

/**
 * 记录采纳/拒绝反馈
 */
export function postV2AiDraftFeedback(
  actor: CoreApiActor,
  draftId: string,
  input: V2AiFeedbackRequest,
): Promise<{ updated: boolean }> {
  return createV2ApiService(actor).post<{ updated: boolean }>(`/v2/ai/draft/${draftId}/feedback`, input);
}
