/**
 * Agent Gateway — agents-service HTTP 转发客户端
 *
 * 职责：将前端 AI 聊天请求转发到 Python LangGraph Agent 服务
 * 支持非流式和 SSE 流式两种模式
 */

import { randomUUID } from "node:crypto";

// ─── 环境变量 ────────────────────────────────────────

const AGENTS_SERVICE_BASE_URL = (
  process.env.AGENTS_SERVICE_BASE_URL ??
  process.env.STONE_TEACHER_BOT_BASE_URL ??
  "http://localhost:5001"
).trim().replace(/\/+$/, "");

const AGENTS_SERVICE_TIMEOUT_MS = Number(
  process.env.AGENTS_SERVICE_TIMEOUT_MS ?? process.env.STONE_TEACHER_BOT_TIMEOUT_MS ?? 120_000,
);

// ─── 错误 ────────────────────────────────────────────

export class AgentGatewayError extends Error {
  code: string;
  retryable: boolean;
  constructor(code: string, message: string, retryable = false) {
    super(message);
    this.code = code;
    this.retryable = retryable;
    this.name = "AgentGatewayError";
  }
}

// ─── 类型 ────────────────────────────────────────────

export interface AgentChatResult {
  content: string;
  threadId: string;
}

export interface AgentStreamChunk {
  token: string;
  threadId?: string;
}

// ─── 非流式转发 ──────────────────────────────────────

export async function callAgent(
  role: string,
  message: string,
  threadId: string | null,
  traceId: string,
  userName: string,
  gradeLevel?: string,
): Promise<AgentChatResult> {
  if (!AGENTS_SERVICE_BASE_URL) {
    throw new AgentGatewayError(
      "AGENT_NOT_CONFIGURED",
      "Agent 服务未配置，请设置 AGENTS_SERVICE_BASE_URL 环境变量",
      false,
    );
  }

  const url = `${AGENTS_SERVICE_BASE_URL}/v1/agents/${role}/chat`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AGENTS_SERVICE_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-trace-id": traceId,
      },
      body: JSON.stringify({
        message,
        thread_id: threadId,
        user_name: userName,
        grade_level: gradeLevel ?? null,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      const isRetryable = response.status >= 500 || response.status === 429;
      throw new AgentGatewayError(
        `AGENT_HTTP_${response.status}`,
        `Agent 服务返回错误 (${response.status}): ${body.slice(0, 200)}`,
        isRetryable,
      );
    }

    const data = (await response.json()) as { message?: string; thread_id?: string };
    if (!data.message) {
      throw new AgentGatewayError("AGENT_EMPTY_RESPONSE", "Agent 服务返回了空结果", false);
    }

    return {
      content: data.message,
      threadId: data.thread_id ?? threadId ?? "",
    };
  } catch (err) {
    if (err instanceof AgentGatewayError) throw err;
    if ((err as Error)?.name === "AbortError") {
      throw new AgentGatewayError(
        "AGENT_TIMEOUT",
        `Agent 服务请求超时 (${AGENTS_SERVICE_TIMEOUT_MS}ms)`,
        true,
      );
    }
    throw new AgentGatewayError(
      "AGENT_NETWORK_ERROR",
      `Agent 服务网络请求失败: ${(err as Error)?.message ?? String(err)}`,
      true,
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

// ─── 流式转发 ────────────────────────────────────────

export async function* callAgentStream(
  role: string,
  message: string,
  threadId: string | null,
  traceId: string,
  userName: string,
  gradeLevel?: string,
): AsyncGenerator<AgentStreamChunk> {
  if (!AGENTS_SERVICE_BASE_URL) {
    throw new AgentGatewayError("AGENT_NOT_CONFIGURED", "Agent 服务未配置", false);
  }
  console.log(`[agent-gateway] callAgentStream start: role=${role} agentUrl=${AGENTS_SERVICE_BASE_URL}/v1/agents/${role}/chat/stream`);

  const url = `${AGENTS_SERVICE_BASE_URL}/v1/agents/${role}/chat/stream`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AGENTS_SERVICE_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "text/event-stream",
        "x-trace-id": traceId,
      },
      body: JSON.stringify({
        message,
        thread_id: threadId,
        user_name: userName,
        grade_level: gradeLevel ?? null,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      const isRetryable = response.status >= 500 || response.status === 429;
      throw new AgentGatewayError(
        `AGENT_HTTP_${response.status}`,
        `Agent 服务返回错误 (${response.status}): ${body.slice(0, 200)}`,
        isRetryable,
      );
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new AgentGatewayError("AGENT_NO_BODY", "Agent 服务响应无 body", false);
    }

    const decoder = new TextDecoder();
    let buffer = "";
    let returnedThreadId = threadId ?? "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

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
          // SSE token 事件: {"content": "..."}
          if (typeof json.content === "string" && json.content) {
            yield { token: json.content };
          }
          // Meta 事件: {"type": "meta", ...}
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

    // 流结束，传递最终 threadId
    yield { token: "", threadId: returnedThreadId };
  } catch (err) {
    if (err instanceof AgentGatewayError) throw err;
    if ((err as Error)?.name === "AbortError") {
      throw new AgentGatewayError(
        "AGENT_TIMEOUT",
        `Agent 服务流式请求超时 (${AGENTS_SERVICE_TIMEOUT_MS}ms)`,
        true,
      );
    }
    throw new AgentGatewayError(
      "AGENT_NETWORK_ERROR",
      `Agent 服务流式网络失败: ${(err as Error)?.message ?? String(err)}`,
      true,
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

// ─── 健康检查 ────────────────────────────────────────

export async function checkAgentHealth(): Promise<boolean> {
  if (!AGENTS_SERVICE_BASE_URL) return false;
  try {
    const response = await fetch(`${AGENTS_SERVICE_BASE_URL}/health`, {
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch {
    return false;
  }
}
