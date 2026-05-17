/**
 * V2 AI 智能体路由
 *
 * 端点：
 *   POST  /v2/ai/chat             — AI 聊天（非流式，返回完整回复）
 *   POST  /v2/ai/chat/stream      — AI 聊天（SSE 流式，逐 token 推送）
 *   POST  /v2/ai/draft/:id/feedback  — 记录采纳/拒绝反馈
 */
import { z } from "zod";
import crypto from "node:crypto";
import { handleAiChat, handleAiChatStream } from "../../services/AiChatService.ts";
import { patchAiTaskLogFeedback } from "../../infrastructure/repositories/v2-ai-repository.ts";
import {
  listTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} from "../../services/AiPromptService.ts";
import type { IncomingMessage, ServerResponse } from "node:http";

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

    // POST /v2/ai/chat — 非流式
    if (path === "/v2/ai/chat" && req.method === "POST") {
      const input = chatSchema.parse(await req.json());
      const result = await handleAiChat(
        { message: input.message, contextRefType: input.context_ref_type, contextRefId: input.context_ref_id },
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

// ─── SSE 流式路由（挂载为独立处理函数，由 server.ts 分发）───

/**
 * 处理 SSE 流式 AI 聊天请求
 * 该函数直接操作 Node.js IncomingMessage/ServerResponse，不走 Request/Response 抽象
 * server.ts 中检测到 POST /v2/ai/chat/stream 时调用此函数
 */
export async function handleAiStreamRoute(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  const actorId = extractHeader(req, "x-user-id") ?? "";
  const actorRole = extractHeader(req, "x-role") ?? "";
  const userName = safeDecodeURI(extractHeader(req, "x-user-name"));
  const schoolLevelId = extractHeader(req, "x-school-level-id") ?? undefined;
  const traceId = extractHeader(req, "x-trace-id") ?? undefined;

  // 读取 body
  const body = await readBody(req);
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

  // 设置 SSE 头
  const startTs = Date.now();
  console.log("[sse] starting stream for", actorId, input.message.slice(0, 50), "at t=0");
  res.writeHead(200, {
    "content-type": "text/event-stream",
    "cache-control": "no-cache",
    "connection": "keep-alive",
    "x-trace-id": traceId ?? "",
  });

  try {
    const tid = traceId ?? crypto.randomUUID();

    // 委托给 AiChatService.handleAiChatStream，由它处理所有逻辑
    for await (const sseChunk of handleAiChatStream(
      { message: input.message, contextRefType: input.context_ref_type, contextRefId: input.context_ref_id },
      { userId: actorId, userRole: actorRole, userName, schoolLevelId },
      tid,
    )) {
      if (req.destroyed) {
        console.log("[sse] client disconnected during stream");
        return;
      }
      res.write(sseChunk);
    }
    console.log("[sse] stream completed successfully, elapsed:", Date.now() - startTs, "ms");
  } catch (err) {
    const msg = err instanceof Error ? err.message : "未知错误";
    console.error("[sse] stream error:", msg);
    try {
      if (!req.destroyed && res.writable) {
        res.write(`data: ${JSON.stringify({ type: "error", data: msg })}\n\n`);
        res.write("data: [DONE]\n\n");
      }
    } catch { /* ignore write errors */ }
  }

  // 确保响应结束
  try {
    if (!req.destroyed && res.writable) res.end();
  } catch { /* ignore */ }
}

// ─── 工具函数 ────────────────────────────────────────────

function extractHeader(req: IncomingMessage, name: string): string | undefined {
  const raw = req.headers[name.toLowerCase()];
  if (Array.isArray(raw)) return raw[0];
  return raw;
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
    req.on("error", reject);
  });
}
