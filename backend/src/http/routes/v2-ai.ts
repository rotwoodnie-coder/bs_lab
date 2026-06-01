/**
 * V2 AI 智能体路由
 *
 * 端点：
 *   POST  /v2/ai/chat             — AI 聊天（非流式，返回完整回复）
 *   POST  /v2/ai/chat/stream      — AI 聊天（SSE 流式，逐 token 推送）
 *   POST  /v2/ai/draft/:id/feedback  — 记录采纳/拒绝反馈
 *
 * 重要：流式 SSE 处理逻辑完全在 handleAiStreamRoute 内联实现，
 * 不依赖 AiChatService 导出的 async generator，避免
 * --experimental-strip-types 异步生成器转换问题导致的流卡住。
 *
 * 流程设计（关键）：DB 审计日志写入在 writeHead/flushHeaders 之前完成，
 * 确保 SSE 首帧发出后后续没有 await 阻塞，客户端不会等待首帧超时。
 */
import { z } from "zod";
import crypto from "node:crypto";
import { getMysqlPool } from "../../infrastructure/mysql/mysql-client.ts";
import { handleAiChat } from "../../services/AiChatService.ts";
import {
  patchAiTaskLogFeedback,
  insertAiTaskLog as insertAiAuditLog,
  updateAiTaskLog,
  insertAiTaskDraft,
} from "../../infrastructure/repositories/v2-ai-repository.ts";
import {
  listTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} from "../../services/AiPromptService.ts";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { RowDataPacket } from "mysql2/promise";

function ok(data: unknown): Response {
  return Response.json({ success: true, data, message: "ok", error: null });
}

function fail(code: number, msg: string, status = 400): Response {
  return Response.json({ success: false, data: null, message: null, error: { code, message: msg } }, { status });
}

// ─── Schema ──────────────────────────────────────────────

const chatSchema = z.object({
  message: z.string().min(1, "消息不能为空").max(8000, "消息过长"),
  agent_type: z.enum(["student", "teacher", "researcher", "parent", "admin"]).optional(),
  thread_id: z.string().max(32).optional(),
  context_ref_type: z.string().max(64).optional(),
  context_ref_id: z.string().max(32).optional(),
  /** 学段："低段" | "中段" | "高段"，前端传入后透传至 agents-service */
  school_level_name: z.string().max(16).optional(),
});

const feedbackSchema = z.object({
  is_accepted: z.enum(["y", "n", "partial"]),
  feedback_score: z.number().int().min(1).max(5).optional(),
});

// ─── Prompt 管理 Schema ────────────────────────────────────

const createPromptSchema = z.object({
  code: z.string().min(1, "编码不能为空").max(64),
  name: z.string().min(1, "名称不能为空").max(128),
  role: z.string().min(1).max(32),
  content: z.string().min(1, "内容不能为空"),
  version: z.number().int().positive().optional(),
  is_active: z.enum(["y", "n"]).optional(),
  description: z.string().optional(),
});

const updatePromptSchema = z.object({
  name: z.string().min(1).max(128).optional(),
  content: z.string().min(1).optional(),
  version: z.number().int().positive().optional(),
  is_active: z.enum(["y", "n"]).optional(),
  description: z.string().optional(),
});

// ─── 提取通用参数 ────────────────────────────────────────

function extractActor(req: Request) {
  return {
    actorId: req.headers.get("x-user-id") ?? "",
    actorRole: req.headers.get("x-role") ?? "",
    userName: safeDecodeURI(req.headers.get("x-user-name") ?? undefined),
    schoolLevelId: req.headers.get("x-school-level-id") ?? undefined,
    traceId: req.headers.get("x-trace-id") ?? undefined,
  };
}

/** 安全的 URI 解码，解码失败返回原始字符串 */
function safeDecodeURI(val: string | undefined): string | undefined {
  if (!val) return undefined;
  try {
    return decodeURIComponent(val);
  } catch {
    return val;
  }
}

// ─── 路由 ────────────────────────────────────────────────

export async function routeV2Ai(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const path = url.pathname;
    const { actorId, actorRole, userName, schoolLevelId, traceId } = extractActor(req);

    // GET /v2/ai/context — 获取用户年级信息（供 AI 面板展示）
    if (path === "/v2/ai/context" && req.method === "GET") {
      const pool = getMysqlPool();
      const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT grade_name AS gradeName, school_level_name AS schoolLevelName
         FROM v_user_school_stage
         WHERE user_id = ?
         LIMIT 1`,
        [actorId],
      );
      if (rows.length > 0) {
        return ok({
          gradeName: rows[0].gradeName ?? null,
          schoolLevelName: rows[0].schoolLevelName ?? null,
        });
      }
      return ok({ gradeName: null, schoolLevelName: null });
    }

    // POST /v2/ai/chat — 非流式
    if (path === "/v2/ai/chat" && req.method === "POST") {
      const input = chatSchema.parse(await req.json());
      const result = await handleAiChat(
        {
          message: input.message,
          agentType: input.agent_type,
          threadId: input.thread_id,
          contextRefType: input.context_ref_type,
          contextRefId: input.context_ref_id,
          schoolLevelName: input.school_level_name,
        },
        { userId: actorId, userRole: actorRole, userName, schoolLevelId },
        traceId,
      );
      return ok(result);
    }

    // POST /v2/ai/draft/:id/feedback
    const feedbackMatch = path.match(/^\/v2\/ai\/draft\/([^/]+)\/feedback$/);
    if (feedbackMatch && req.method === "POST") {
      const draftId = decodeURIComponent(feedbackMatch[1]!);
      const body = feedbackSchema.parse(await req.json());
      await patchAiTaskLogFeedback(draftId, body.is_accepted, body.feedback_score);
      return ok({ updated: true });
    }

    // ── Prompt 模板管理 ─────────────────────────────

    // GET /v2/ai/prompts — 列出所有模板
    if (path === "/v2/ai/prompts" && req.method === "GET") {
      const templates = await listTemplates();
      return ok(templates);
    }

    // GET /v2/ai/prompts/:id — 查询单个模板
    const getPromptMatch = path.match(/^\/v2\/ai\/prompts\/([^/]+)$/);
    if (getPromptMatch && req.method === "GET") {
      const template = await getTemplateById(decodeURIComponent(getPromptMatch[1]!));
      if (!template) return fail(404, "模板不存在", 404);
      return ok(template);
    }

    // POST /v2/ai/prompts — 创建模板
    if (path === "/v2/ai/prompts" && req.method === "POST") {
      const body = createPromptSchema.parse(await req.json());
      const tid = await createTemplate({
        code: body.code,
        name: body.name,
        role: body.role,
        content: body.content,
        version: body.version,
        isActive: body.is_active,
        description: body.description,
        createUserId: actorId || undefined,
        updateUserId: actorId || undefined,
      });
      return ok({ templateId: tid });
    }

    // PUT /v2/ai/prompts/:id — 更新模板
    const putPromptMatch = path.match(/^\/v2\/ai\/prompts\/([^/]+)$/);
    if (putPromptMatch && req.method === "PUT") {
      const templateId = decodeURIComponent(putPromptMatch[1]!);
      const body = updatePromptSchema.parse(await req.json());
      await updateTemplate(templateId, {
        name: body.name,
        content: body.content,
        version: body.version,
        isActive: body.is_active,
        description: body.description,
        updateUserId: actorId || undefined,
      });
      return ok({ updated: true });
    }

    // DELETE /v2/ai/prompts/:id — 删除模板
    const deletePromptMatch = path.match(/^\/v2\/ai\/prompts\/([^/]+)$/);
    if (deletePromptMatch && req.method === "DELETE") {
      const templateId = decodeURIComponent(deletePromptMatch[1]!);
      await deleteTemplate(templateId);
      return ok({ deleted: true });
    }

    return fail(404, "NOT_FOUND", 404);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return fail(422, err.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join("; "));
    }
    if (err instanceof Error) {
      console.error("[routeV2Ai] error:", err.message, "stack:", err.stack);
      const status = err.message.includes("未配置") ? 503 : 500;
      return fail(status, err.message, status);
    }
    console.error("[routeV2Ai] unknown error:", err);
    return fail(500, "服务器内部错误", 500);
  }
}

// ─── Agent 角色映射 ──────────────────────────────────────

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

// ─── Agent 服务配置 ─────────────────────────────────────

const AGENTS_SERVICE_BASE_URL = (
  process.env.AGENTS_SERVICE_BASE_URL ??
  process.env.STONE_TEACHER_BOT_BASE_URL ??
  "http://localhost:5001"
).trim().replace(/\/+$/, "");

const AGENTS_SERVICE_TIMEOUT_MS = Number(
  process.env.AGENTS_SERVICE_TIMEOUT_MS ?? process.env.STONE_TEACHER_BOT_TIMEOUT_MS ?? 120_000,
);

// ─── SSE 流式路由（完全内联）────────────────────────────

/**
 * 处理 SSE 流式 AI 聊天请求
 *
 * 关键设计：DB 审计日志写入在 writeHead/flushHeaders 之前完成，
 * 确保 SSE 响应头发出后后续不再有 await 阻塞，客户端不会等待首帧超时。
 */
export async function handleAiStreamRoute(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  console.log("[sse3] entered handleAiStreamRoute");
  const actorId = extractHeader(req, "x-user-id") ?? "";
  const actorRole = extractHeader(req, "x-role") ?? "";
  const userName = safeDecodeURI(extractHeader(req, "x-user-name"));
  const schoolLevelId = extractHeader(req, "x-school-level-id") ?? undefined;
  const traceId = extractHeader(req, "x-trace-id") ?? undefined;

  // 读取 body — 使用 node:stream/consumers 更加稳健
  const { text } = await import("node:stream/consumers");
  const body = await text(req);
  console.log("[sse3] readBody done, length:", body.length);

  let input: z.infer<typeof chatSchema>;
  try {
    input = chatSchema.parse(JSON.parse(body));
  } catch (err) {
    res.statusCode = 422;
    res.setHeader("content-type", "application/json; charset=utf-8");
    const msg = err instanceof z.ZodError
      ? err.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join("; ")
      : "请求体格式错误";
    res.end(JSON.stringify({ success: false, error: { message: msg } }));
    return;
  }

  const startTs = Date.now();
  const tid = traceId ?? crypto.randomUUID();
  const agentType = resolveAgentType(actorRole, input.agent_type);

  // 当 thread_id 为空时，用 userId_agentType 作为稳定标识
  const stableThreadId = input.thread_id ?? `${actorId}_${agentType}`;

  try {
    // Step 1: 先完成 DB 写入（尚未发送任何 SSE 数据）
    console.log("[sse3] Step 1: inserting audit log...");
    const logId = await insertAiAuditLog({
      userId: actorId,
      userRole: actorRole,
      taskType: "generate_scheme",
      modelUsed: `langgraph-agent-${agentType}`,
      status: "pending",
      contextRefType: input.context_ref_type,
      contextRefId: input.context_ref_id,
      traceId: tid,
      requestText: input.message,
    });
    console.log("[sse3] Step 1 done, logId:", logId);

    // Step 2: 设置 SSE 头并立即 flush（后续没有 await 阻塞客户端）
    console.log("[sse3] Step 2: writeHead + flushHeaders");
    res.writeHead(200, {
      "content-type": "text/event-stream",
      "cache-control": "no-cache",
      "connection": "keep-alive",
      "x-trace-id": traceId ?? "",
    });
    res.flushHeaders();
    console.log("[sse3] Step 2: flushHeaders done, res.destroyed=", res.destroyed);
    // 注：只检查 res.destroyed。req 在 body 被 readBody 消费后 destroyed=true 是正常的，不代表客户端断连。
    if (res.destroyed) return;

    // Step 3: 写 meta 事件（DB 已完成，立即写出）
    res.write(`data: ${JSON.stringify({ type: "meta", logId, agentType })}\n\n`);
    console.log("[sse3] Step 3 done, meta event written");

    // Step 4: 调用 agents-service 流式接口
    const url = `${AGENTS_SERVICE_BASE_URL}/v1/agents/${agentType}/chat/stream`;
    console.log("[sse3] Step 4: fetching agents-service at", url);
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
          user_name: userName ?? "",
          grade_level: input.school_level_name,
        }),
        signal: controller.signal,
      });
      console.log("[sse3] Step 4 done, agents-service status:", response.status);

      if (!response.ok) {
        const errBody = await response.text().catch(() => "");
        const errMsg = `Agent 服务返回错误 (${response.status}): ${errBody.slice(0, 200)}`;
        console.error("[sse] agents-service error:", errMsg);
      if (!res.destroyed && res.writable) {
        res.write(`data: ${JSON.stringify({ type: "error", data: errMsg })}\n\n`);
      }
        try { await updateAiTaskLog(logId, { status: "failed", errorMessage: errMsg }); } catch { /* noop */ }
        return;
      }
    } finally {
      clearTimeout(timeoutId);
    }

    // Step 5: 读取 SSE 流并转发 token
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("Agent 服务响应无 body");
    }

    const decoder = new TextDecoder();
    let buffer = "";
    let fullResponse = "";
    let returnedThreadId = stableThreadId;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (res.destroyed || !res.writable) {
        console.log("[sse] client disconnected during stream");
        try { await updateAiTaskLog(logId, { status: "failed", errorMessage: "客户端断开" }); } catch { /* noop */ }
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
          if (typeof json.content === "string" && json.content) {
            fullResponse += json.content;
            res.write(`data: ${JSON.stringify({ type: "token", data: json.content })}\n\n`);
          }
          if (json.type === "meta" && typeof json.session_id === "string") {
            returnedThreadId = json.session_id;
          }
          if (typeof json.thread_id === "string") {
            returnedThreadId = json.thread_id;
          }
        } catch {
          // 跳过无法解析的行
        }
      }
    }

    // Step 6: 流结束，写审计日志与草稿
    const draftId = await insertAiTaskDraft({
      userId: actorId,
      taskType: "generate_scheme",
      draftJson: {
        type: "chat_reply",
        content: fullResponse,
        userMessage: input.message,
        threadId: returnedThreadId,
        agentType,
        contextRefType: input.context_ref_type ?? null,
        contextRefId: input.context_ref_id ?? null,
      },
      status: "pending",
      source: "web",
    });

    const durationMs = Date.now() - startTs;
    await updateAiTaskLog(logId, {
      status: "success",
      promptTokens: 0,
      completionTokens: 0,
      durationMs,
      responseText: fullResponse,
    });

    if (!res.destroyed) {
      res.write(`data: ${JSON.stringify({ type: "done", draftId })}\n\n`);
    }
    console.log("[sse] stream completed successfully, elapsed:", Date.now() - startTs, "ms");
  } catch (err) {
    const msg = err instanceof Error ? err.message : "未知错误";
    console.error("[sse] stream error:", msg);
    try {
      if (!res.destroyed && res.writable) {
        res.write(`data: ${JSON.stringify({ type: "error", data: msg })}\n\n`);
        res.write("data: [DONE]\n\n");
      }
    } catch { /* ignore write errors */ }
  }

  try {
    if (!res.destroyed && res.writable) res.end();
  } catch { /* ignore */ }
}

// ─── 工具函数 ────────────────────────────────────────────

function extractHeader(req: IncomingMessage, name: string): string | undefined {
  const raw = req.headers[name.toLowerCase()];
  if (Array.isArray(raw)) return raw[0];
  return raw;
}

/**
 * 读取 IncomingMessage 的完整 body 内容。
 *
 * 使用 for await...of 而非 on("data")/on("end") 回调模式，
 * 避免 Readable Stream 在 async 调度中处于 paused 模式时
 * data 事件永远不被触发导致的挂起问题。
 */
async function readBody(req: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(chunk as Buffer);
  }
  return Buffer.concat(chunks).toString("utf-8");
}
