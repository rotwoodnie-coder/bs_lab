/**
 * V2 AI 智能体路由
 *
 * 端点：
 *   POST /v2/ai/chat          — AI 聊天（生成实验方案）
 *   POST /v2/ai/draft/:id/feedback  — 记录采纳/拒绝反馈
 */
import { z } from "zod";
import { handleAiChat } from "../../services/AiChatService.ts";
import { patchAiTaskLogFeedback } from "../../infrastructure/repositories/v2-ai-repository.ts";

function ok(data: unknown): Response {
  return Response.json({ success: true, data, message: "ok", error: null });
}

function fail(code: number, msg: string, status = 400): Response {
  return Response.json({ success: false, data: null, message: null, error: { code, message: msg } }, { status });
}

// ─── Schema ──────────────────────────────────────────────

const chatSchema = z.object({
  message: z.string().min(1, "消息不能为空").max(8000, "消息过长"),
  context_ref_type: z.string().max(64).optional(),
  context_ref_id: z.string().max(32).optional(),
});

const feedbackSchema = z.object({
  is_accepted: z.enum(["y", "n", "partial"]),
  feedback_score: z.number().int().min(1).max(5).optional(),
});

// ─── 路由 ────────────────────────────────────────────────

export async function routeV2Ai(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const path = url.pathname;
    const actorId = req.headers.get("x-user-id") ?? "";
    const actorRole = req.headers.get("x-role") ?? "";
    const traceId = req.headers.get("x-trace-id") ?? undefined;

    // POST /v2/ai/chat
    if (path === "/v2/ai/chat" && req.method === "POST") {
      const input = chatSchema.parse(await req.json());
      const result = await handleAiChat(
        { message: input.message, contextRefType: input.context_ref_type, contextRefId: input.context_ref_id },
        { userId: actorId, userRole: actorRole },
        traceId,
      );
      return ok(result);
    }

    // POST /v2/ai/draft/:id/feedback
    const feedbackMatch = path.match(/^\/v2\/ai\/draft\/([^/]+)\/feedback$/);
    if (feedbackMatch && req.method === "POST") {
      const draftId = decodeURIComponent(feedbackMatch[1]!);
      const body = feedbackSchema.parse(await req.json());
      // 将 draftId 作为 logId 写入反馈（M1-Phase1 草稿与日志均以相同 id 关联）
      await patchAiTaskLogFeedback(draftId, body.is_accepted, body.feedback_score);
      return ok({ updated: true });
    }

    return fail(404, "NOT_FOUND", 404);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return fail(422, err.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join("; "));
    }
    // AiChatServiceError 或其它已知错误
    if (err instanceof Error) {
      const status = err.message.includes("未配置") ? 503 : 500;
      return fail(status, err.message, status);
    }
    return fail(500, "服务器内部错误", 500);
  }
}
