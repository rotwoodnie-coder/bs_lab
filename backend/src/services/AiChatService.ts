/**
 * AI 聊天服务
 *
 * 职责：
 * 1. 调用云端 LLM API（DeepSeek）生成回复
 * 2. 记录完整调用日志到 ai_task_log
 * 3. 将 AI 产出写入 ai_task_draft 草稿表
 *
 * 健壮性：
 * - 超时：30s 超时熔断
 * - 重试：最多 1 次自动重试（仅对 retryable 错误的首次返回）
 * - 错误分类：网络超时 → retryable；API 4xx → 非 retryable
 * - traceId 透传：从请求头 x-trace-id 获取，或自动生成
 */
import { randomUUID } from "node:crypto";
import { getMysqlPool } from "../infrastructure/mysql/mysql-client.ts";
import {
  insertAiTaskLog,
  updateAiTaskLog,
  insertAiTaskDraft,
} from "../infrastructure/repositories/v2-ai-repository.ts";
import type { AiChatRequest, AiChatResponse } from "../domain/v2-ai/v2-ai-types.ts";

// ─── 环境变量配置 ───────────────────────────────────

const LLM_API_KEY = (process.env.LLM_API_KEY ?? "").trim();
const LLM_BASE_URL = (process.env.LLM_BASE_URL ?? "https://api.deepseek.com").trim().replace(/\/+$/, "");
const LLM_MODEL = (process.env.LLM_MODEL ?? "deepseek-chat").trim();
const LLM_TIMEOUT_MS = Number(process.env.LLM_TIMEOUT_MS ?? 30_000);

// ─── 错误 ────────────────────────────────────────────

export class AiChatServiceError extends Error {
  code: string;
  retryable: boolean;
  constructor(code: string, message: string, retryable = false) {
    super(message);
    this.code = code;
    this.retryable = retryable;
    this.name = "AiChatServiceError";
  }
}

// ─── System Prompt ──────────────────────────────────

function buildSystemPrompt(): string {
  return `你是一个初中科学实验助教。你的职责是帮助用户（学生或教师）完成实验方案的设计。

回答要求：
1. 用简体中文回复，语言简洁清晰，适合初中生理解。
2. 如果用户询问实验方案，请给出结构化的实验步骤、所需材料、安全注意事项。
3. 如果不确定具体实验参数，请给出通用建议并提醒用户根据实际情况调整。
4. 不要编造不存在的实验数据或危险等级。
5. 如果用户的问题与实验教学无关，礼貌地引导回实验主题。`;
}

// ─── LLM 调用 ───────────────────────────────────────

interface DeepSeekMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface DeepSeekResponseBody {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

async function callLlm(messages: DeepSeekMessage[], traceId: string): Promise<{
  content: string;
  promptTokens: number;
  completionTokens: number;
}> {
  if (!LLM_API_KEY) {
    throw new AiChatServiceError("LLM_NOT_CONFIGURED", "LLM API 密钥未配置，请设置环境变量 LLM_API_KEY", false);
  }

  const url = `${LLM_BASE_URL}/v1/chat/completions`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), LLM_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${LLM_API_KEY}`,
        "x-trace-id": traceId,
      },
      body: JSON.stringify({
        model: LLM_MODEL,
        messages,
        max_tokens: 4096,
        temperature: 0.7,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      const isRetryable = response.status >= 500 || response.status === 429;
      throw new AiChatServiceError(
        `LLM_HTTP_${response.status}`,
        `LLM API 返回错误 (${response.status}): ${body.slice(0, 200)}`,
        isRetryable,
      );
    }

    const data = (await response.json()) as DeepSeekResponseBody;
    const choice = data.choices?.[0];
    if (!choice?.message?.content) {
      throw new AiChatServiceError("LLM_EMPTY_RESPONSE", "LLM 返回了空结果", false);
    }

    return {
      content: choice.message.content,
      promptTokens: data.usage?.prompt_tokens ?? 0,
      completionTokens: data.usage?.completion_tokens ?? 0,
    };
  } catch (err) {
    if (err instanceof AiChatServiceError) throw err;
    if ((err as Error)?.name === "AbortError") {
      throw new AiChatServiceError("LLM_TIMEOUT", `LLM 请求超时 (${LLM_TIMEOUT_MS}ms)`, true);
    }
    throw new AiChatServiceError("LLM_NETWORK_ERROR", `LLM 网络请求失败: ${(err as Error)?.message ?? String(err)}`, true);
  } finally {
    clearTimeout(timeoutId);
  }
}

// ─── 主入口 ─────────────────────────────────────────

/**
 * 处理 AI 聊天请求
 *
 * 执行顺序：
 * 1. 插入 ai_task_log（status=pending）
 * 2. 调用 LLM API
 * 3. 更新 ai_task_log（status=success/failed）
 * 4. 将回复写入 ai_task_draft（status=pending）
 */
export async function handleAiChat(
  input: AiChatRequest,
  actor: { userId: string; userRole: string },
  traceId?: string,
): Promise<AiChatResponse> {
  const tid = traceId ?? randomUUID();
  const pool = getMysqlPool();

  // Step 1: 插入审计日志（pending）
  const logId = await insertAiTaskLog({
    userId: actor.userId,
    userRole: actor.userRole,
    taskType: "generate_scheme",
    status: "pending",
    contextRefType: input.contextRefType,
    contextRefId: input.contextRefId,
    traceId: tid,
  });

  const startedAt = Date.now();

  try {
    // Step 2: 调用 LLM
    const systemPrompt = buildSystemPrompt();
    const messages: DeepSeekMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: input.message },
    ];

    // 首次调用，失败时自动重试一次（仅对 retryable 错误）
    let llmResult: { content: string; promptTokens: number; completionTokens: number };

    try {
      llmResult = await callLlm(messages, tid);
    } catch (firstErr) {
      if (firstErr instanceof AiChatServiceError && firstErr.retryable) {
        llmResult = await callLlm(messages, tid);
      } else {
        throw firstErr;
      }
    }

    const durationMs = Date.now() - startedAt;

    // Step 3: 更新日志为 success
    await updateAiTaskLog(logId, {
      status: "success",
      promptTokens: llmResult.promptTokens,
      completionTokens: llmResult.completionTokens,
      durationMs,
    });

    // Step 4: 写入草稿表（纯文本形式存为 JSON）
    const draftPayload = {
      type: "chat_reply",
      content: llmResult.content,
      userMessage: input.message,
      contextRefType: input.contextRefType ?? null,
      contextRefId: input.contextRefId ?? null,
    };

    const draftId = await insertAiTaskDraft({
      userId: actor.userId,
      taskType: "generate_scheme",
      draftJson: draftPayload,
      status: "pending",
      source: "web",
    });

    return {
      reply: llmResult.content,
      logId,
      draftId,
    };
  } catch (err) {
    const durationMs = Date.now() - startedAt;
    const errorMsg = err instanceof AiChatServiceError
      ? `[${err.code}] ${err.message}`
      : `[UNKNOWN] ${(err as Error)?.message ?? String(err)}`;

    // 更新日志为 failed
    await updateAiTaskLog(logId, {
      status: "failed",
      durationMs,
      errorMessage: errorMsg,
    });

    throw err;
  }
}
