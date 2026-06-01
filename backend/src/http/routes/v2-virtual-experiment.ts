/**
 * V2 虚拟实验路由
 * 前缀：/v2/virtual-experiment
 */
import { z } from "zod";
import type { VirtualExperimentSourceType, VirtualExperimentStatus } from "../../domain/v2-virtual-experiment/v2-virtual-experiment-types.ts";
import * as service from "../../services/VirtualExperimentService.ts";
import { VirtualExperimentServiceError } from "../../services/VirtualExperimentService.ts";
import { deepPresignResponse } from "../../lib/presign-response.ts";

function ok(data: unknown): Response {
  return Response.json({ success: true, data, message: "ok", error: null });
}
function fail(code: number, msg: string, status = 400): Response {
  return Response.json({ success: false, data: null, message: null, error: { code, message: msg } }, { status });
}

// ─── Zod schemas ─────────────────────────────────────

const listQuerySchema = z.object({
  keyword: z.string().optional(),
  sourceType: z.enum(["url", "html_file"] as const).optional(),
  status: z.enum(["draft", "pending", "published", "rejected", "archived"] as const).optional(),
  reviewMode: z.coerce.boolean().optional(),
  createUserId: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

const createSchema = z.object({
  title: z.string().min(1, "标题不能为空"),
  description: z.string().optional(),
  sourceType: z.enum(["url", "html_file"] as const),
  sourceUrl: z.string().optional(),
  /** sourceType=html_file 时，文件已上传到 /v2/file/upload 后返回的 fileUrl（storage key） */
  fileStorageKey: z.string().optional(),
  /** 原始文件名 */
  fileName: z.string().optional(),
  /** 文件字节数 */
  fileSize: z.number().int().positive().optional(),
  coverUrl: z.string().optional(),
});

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  sourceUrl: z.string().optional(),
  coverUrl: z.string().nullable().optional(),
  sortOrder: z.number().int().optional(),
  fileStorageKey: z.string().optional(),
  fileName: z.string().optional(),
  fileSize: z.number().int().positive().optional(),
});

const sortSchema = z.object({
  sortOrder: z.number().int(),
});

const reviewSchema = z.object({
  action: z.enum(["approved", "rejected"]),
  comment: z.string().max(500).nullable().optional(),
});

// ─── 路由入口 ────────────────────────────────────────

export async function routeV2VirtualExperiment(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const path = url.pathname;
    const actorId = req.headers.get("x-user-id") ?? undefined;
    const actorRole = req.headers.get("x-role") ?? "";

    // ── 列表分页 ────────────────────────────────────────
    if (path === "/v2/virtual-experiment" && req.method === "GET") {
      const query = listQuerySchema.parse(Object.fromEntries(url.searchParams.entries()));

      // reviewMode 需要校验角色
      if (query.reviewMode) {
        const role = actorRole.replace(/^Role_/, "");
        const isReviewer = ["Admin", "Researcher", "Sys_Admin", "School_Admin"].includes(role);
        if (!isReviewer) return fail(4031, "仅管理员/教研员可查看审核列表", 403);

        // reviewMode 自动注入 status=pending 且不按创建者过滤
        query.status = "pending";
      } else {
        // 非 reviewMode 时注入当前用户 ID，实现"我的实验"过滤
        query.createUserId = actorId;
      }

      const result = await service.listVirtualExperiments(query);
      return ok(await deepPresignResponse(result));
    }

    // ── 创建实验（URL 内嵌 / HTML 文件上传均走此路由）───
    if (path === "/v2/virtual-experiment" && req.method === "POST") {
      const input = createSchema.parse(await req.json());

      // URL 校验
      if (input.sourceType === "url" && input.sourceUrl) {
        if (!input.sourceUrl.startsWith("http://") && !input.sourceUrl.startsWith("https://")) {
          return fail(4000, "外部 URL 必须以 http:// 或 https:// 开头", 400);
        }
      }

      const record = await service.createVirtualExperiment({
        title: input.title,
        description: input.description,
        sourceType: input.sourceType as VirtualExperimentSourceType,
        sourceUrl: input.sourceUrl,
        fileStorageKey: input.fileStorageKey,
        fileName: input.fileName,
        fileSize: input.fileSize,
        coverUrl: input.coverUrl,
        createUserId: actorId,
      });

      return ok(await deepPresignResponse(record));
    }

    // ── 路径参数匹配（:id）───
    const idMatch = path.match(/^\/v2\/virtual-experiment\/([^/]+)$/);
    if (idMatch) {
      const id = decodeURIComponent(idMatch[1]!);

      if (req.method === "GET") {
        const record = await service.getVirtualExperimentById(id);
        if (!record) return fail(4040, "未找到该实验", 404);
        return ok(await deepPresignResponse(record));
      }

      if (req.method === "PUT") {
        const input = updateSchema.parse(await req.json());
        const record = await service.updateVirtualExperiment(id, input, actorId ?? "");
        return ok(await deepPresignResponse(record));
      }

      if (req.method === "DELETE") {
        await service.deleteVirtualExperiment(id, actorId ?? "");
        return ok(null);
      }
    }

    // ── view ──
    const viewMatch = path.match(/^\/v2\/virtual-experiment\/([^/]+)\/view$/);
    if (viewMatch && req.method === "POST") {
      const id = decodeURIComponent(viewMatch[1]!);
      await service.incrementViewCount(id);
      return ok(null);
    }

    // ── submit 提交审核 ──
    const submitMatch = path.match(/^\/v2\/virtual-experiment\/([^/]+)\/submit$/);
    if (submitMatch && req.method === "POST") {
      const id = decodeURIComponent(submitMatch[1]!);
      await service.submitForReview(id, actorId ?? "");
      return ok(null);
    }

    // ── review 审核处理 ──
    const reviewMatch = path.match(/^\/v2\/virtual-experiment\/([^/]+)\/review$/);
    if (reviewMatch && req.method === "POST") {
      const id = decodeURIComponent(reviewMatch[1]!);
      // 角色校验
      const role = actorRole.replace(/^Role_/, "");
      const isReviewer = ["Admin", "Researcher", "Sys_Admin", "School_Admin"].includes(role);
      if (!isReviewer) return fail(4031, "仅管理员/教研员可审核", 403);

      const input = reviewSchema.parse(await req.json());
      await service.processReview(id, input.action, actorId ?? "", input.comment ?? null);
      return ok(null);
    }

    // ── call 调用计数 ──
    const callMatch = path.match(/^\/v2\/virtual-experiment\/([^/]+)\/call$/);
    if (callMatch && req.method === "POST") {
      const id = decodeURIComponent(callMatch[1]!);
      await service.incrementCallCount(id);
      return ok(null);
    }

    // ── sort 排序 ──
    const sortMatch = path.match(/^\/v2\/virtual-experiment\/([^/]+)\/sort$/);
    if (sortMatch && req.method === "PUT") {
      const id = decodeURIComponent(sortMatch[1]!);
      const input = sortSchema.parse(await req.json());
      await service.updateSortOrder(id, input.sortOrder, actorId ?? "");
      return ok(null);
    }

    // ── archive 归档 ──
    const archiveMatch = path.match(/^\/v2\/virtual-experiment\/([^/]+)\/archive$/);
    if (archiveMatch && req.method === "POST") {
      const id = decodeURIComponent(archiveMatch[1]!);
      const role = actorRole.replace(/^Role_/, "");
      const isReviewer = ["Admin", "Researcher", "Sys_Admin", "School_Admin"].includes(role);
      if (!isReviewer) return fail(4031, "仅管理员/教研员可归档", 403);
      await service.archiveVirtualExperiment(id, actorId ?? "");
      return ok(null);
    }

    return new Response(null, { status: 404 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return fail(4000, `参数校验失败：${err.errors[0]?.message ?? "未知字段"}`, 400);
    }
    if (err instanceof VirtualExperimentServiceError) {
      if (err.code === "NOT_FOUND") return fail(4040, err.message, 404);
      if (err.code === "FORBIDDEN_OWNER") return fail(4030, err.message, 403);
      if (err.code === "INVALID_STATUS_TRANSITION") return fail(4005, err.message, 400);
      return fail(5000, err.message, 500);
    }
    if (err instanceof Error) {
      console.error("[routeV2VirtualExperiment]", err);
      return fail(5000, "服务内部错误", 500);
    }
    return fail(5000, "服务内部错误", 500);
  }
}
