/**
 * AI 聊天服务 — LangGraph Agent 网关版
 *
 * 职责：
 * 1. 认证检查（从请求头获取 actor）
 * 2. 角色路由（agent_type 映射到 agents-service 的角色端点）
 * 3. HTTP 转发到 Python LangGraph Agent 服务
 * 4. 审计日志记录（ai_task_log / ai_task_draft）
 * 5. 错误包装（转发 AgentError 给前端）
 */
import { randomUUID } from "node:crypto";
import {
  insertAiTaskLog,
  updateAiTaskLog,
  insertAiTaskDraft,
} from "../infrastructure/repositories/v2-ai-repository.ts";
import type { AiChatRequest, AiChatResponse } from "../domain/v2-ai/v2-ai-types.ts";
import {
  callAgent,
  AgentGatewayError,
} from "./agent-gateway.ts";
import type { ServerResponse, IncomingMessage } from "node:http";

// ─── Agent 角色映射 ──────────────────────────────────

type AgentType = "student" | "teacher" | "researcher" | "parent" | "admin";

function resolveAgentType(userRole: string, inputAgentType?: string): AgentType {
  if (inputAgentType && ["student", "teacher", "researcher", "parent", "admin"].includes(inputAgentType)) {
    return inputAgentType as AgentType;
  }
  // 去掉 Role_ 前缀后再匹配
  const role = userRole.replace(/^Role_/, "");
  switch (role) {
    case "Student": return "student";
    case "Teacher": return "teacher";
    case "Researcher": return "researcher";
    case "Parent": return "parent";
    case "School_Admin":
    case "Sys_Admin":
      return "admin";
    default: return "student";
  }
}

// ─── 主入口（非流式）─────────────────────────────────

export async function handleAiChat(
  input: AiChatRequest,
  actor: { userId: string; userRole: string; schoolLevelId?: string | null; userName?: string | null },
  traceId?: string,
): Promise<AiChatResponse> {
  const tid = traceId ?? randomUUID();
  const agentType = resolveAgentType(actor.userRole, input.agentType);

  const logId = await insertAiTaskLog({
    userId: actor.userId,
    userRole: actor.userRole,
    taskType: "generate_scheme",
    modelUsed: `langgraph-agent-${agentType}`,
    status: "pending",
    contextRefType: input.contextRefType,
    contextRefId: input.contextRefId,
    traceId: tid,
    requestText: input.message,
  });

  const startedAt = Date.now();

  try {
    // 当 threadId 为空时，用 userId_agentType 作为稳定标识
    // 确保同一学生同一角色的多轮对话命中同一个 checkpointer 状态
    const stableThreadId = input.threadId ?? `${actor.userId}_${agentType}`;
    const result = await callAgent(
      agentType,
      input.message,
      stableThreadId,
      tid,
      actor.userName ?? "",
      input.schoolLevelName,
    );

    const durationMs = Date.now() - startedAt;

    await updateAiTaskLog(logId, {
      status: "success",
      promptTokens: 0,
      completionTokens: 0,
      durationMs,
      responseText: result.content,
    });

    const draftId = await insertAiTaskDraft({
      userId: actor.userId,
      taskType: "generate_scheme",
      draftJson: {
        type: "chat_reply",
        content: result.content,
        userMessage: input.message,
        threadId: result.threadId,
        agentType,
        contextRefType: input.contextRefType ?? null,
        contextRefId: input.contextRefId ?? null,
      },
      status: "pending",
      source: "web",
    });

    return { reply: result.content, logId, draftId };
  } catch (err) {
    const durationMs = Date.now() - startedAt;
    const errorMsg = err instanceof AgentGatewayError
      ? `[${err.code}] ${err.message}`
      : `[UNKNOWN] ${(err as Error)?.message ?? String(err)}`;
    console.error("[AiChatService] handleAiChat error:", errorMsg);
    await updateAiTaskLog(logId, { status: "failed", durationMs, errorMessage: errorMsg });
    throw err;
  }
}

// ─── 流式（纯 async/await，无 async generator）─────────

const AGENTS_SERVICE_BASE_URL = (
  process.env.AGENTS_SERVICE_BASE_URL ??
  process.env.STONE_TEACHER_BOT_BASE_URL ??
  "http://localhost:5001"
).trim().replace(/\/+$/, "");

const AGENTS_SERVICE_TIMEOUT_MS = Number(
  process.env.AGENTS_SERVICE_TIMEOUT_MS ?? process.env.STONE_TEACHER_BOT_TIMEOUT_MS ?? 120_000,
);

/**
 * 内联 SSE 流式转发：直接调用 agents-service 的流式接口，
 * 将 token 逐个写入 ServerResponse。
 *
 * 本函数不使用任何 async generator，避免 Node.js --experimental-strip-types
 * 对 async generator 的转换问题导致流卡住。
 */
export async function handleAiChatStream(
  input: AiChatRequest,
  actor: { userId: string; userRole: string; schoolLevelId?: string | null; userName?: string | null },
  traceId: string,
  logId: string,
  res: ServerResponse,
  req: IncomingMessage,
): Promise<void> {
  const tid = traceId;
  const agentType = resolveAgentType(actor.userRole, input.agentType);
  console.log(`[inline-stream] starting for agentType=${agentType}, logId=${logId}`);

  // 写 meta 事件
  if (req.destroyed) return;
  try {
    res.write(`data: ${JSON.stringify({ type: "meta", logId, agentType })}\n\n`);
  } catch { return; }

  const startedAt = Date.now();
  let fullResponse = "";
  let returnedThreadId = "";
  const stableThreadId = input.threadId ?? `${actor.userId}_${agentType}`;

  try {
    // 直接调用 agents-service 流式接口
    const url = `${AGENTS_SERVICE_BASE_URL}/v1/agents/${agentType}/chat/stream`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), AGENTS_SERVICE_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "text/event-stream",
          "x-trace-id": tid,
        },
        body: JSON.stringify({
          message: input.message,
          thread_id: stableThreadId,
          user_name: actor.userName ?? "",
          grade_level: input.schoolLevelName,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errBody = await response.text().catch(() => "");
        throw new AgentGatewayError(
          `AGENT_HTTP_${response.status}`,
          `Agent 服务返回错误 (${response.status}): ${errBody.slice(0, 200)}`,
          response.status >= 500 || response.status === 429,
        );
      }
    } finally {
      clearTimeout(timeoutId);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new AgentGatewayError("AGENT_NO_BODY", "Agent 服务响应无 body", false);
    }

    const decoder = new TextDecoder();
    let buffer = "";

    // SSE 逐行解析
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (req.destroyed) {
        console.log("[sse] client disconnected during stream");
        return;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data:")) continue;
        const jsonStr = trimmed.slice(5).trim();
        if (jsonStr === "[DONE]" || jsonStr === "data: [DONE]") continue;

        try {
          const json = JSON.parse(jsonStr) as Record<string, unknown>;

          // token 事件: {"content": "..."}
          if (typeof json.content === "string" && json.content) {
            fullResponse += json.content;
            res.write(`data: ${JSON.stringify({ type: "token", data: json.content })}\n\n`);
          }
          // Meta 事件: {"type": "meta", "session_id": "..."}
          if (json.type === "meta" && typeof json.session_id === "string") {
            returnedThreadId = json.session_id;
          }
          // thread_id 透传
          if (typeof json.thread_id === "string") {
            returnedThreadId = json.thread_id;
          }
        } catch {
          // 跳过无法解析的行
        }
      }
    }

    // 流结束，写 DB
    const draftId = await insertAiTaskDraft({
      userId: actor.userId,
      taskType: "generate_scheme",
      draftJson: {
        type: "chat_reply",
        content: fullResponse,
        userMessage: input.message,
        threadId: returnedThreadId,
        agentType,
        contextRefType: input.contextRefType ?? null,
        contextRefId: input.contextRefId ?? null,
      },
      status: "pending",
      source: "web",
    });

    const durationMs = Date.now() - startedAt;
    await updateAiTaskLog(logId, {
      status: "success",
      promptTokens: 0,
      completionTokens: 0,
      durationMs,
      responseText: fullResponse,
    });

    if (!req.destroyed) {
      res.write(`data: ${JSON.stringify({ type: "done", draftId })}\n\n`);
    }
  } catch (err) {
    const durationMs = Date.now() - startedAt;
    const errorMsg = err instanceof AgentGatewayError
      ? `[${err.code}] ${err.message}`
      : `[UNKNOWN] ${(err as Error)?.message ?? String(err)}`;
    console.error("[handleAiChatStream] error:", errorMsg);

    try {
      if (logId) { await updateAiTaskLog(logId, { status: "failed", durationMs, errorMessage: errorMsg }); }
    } catch { /* noop */ }

    if (!req.destroyed) {
      res.write(`data: ${JSON.stringify({ type: "error", data: errorMsg })}\n\n`);
    }
  }
}
