/**
 * V2 社交互动 + 积分 HTTP 路由
 * 前缀：/v2/social/*  /v2/scale/*
 */
import { z } from "zod";
import {
  toggleLike,
  toggleNotlike,
  toggleCollection,
  addEvaluate,
  listEvaluates,
  getSocialStats,
  writeScaleLog,
  listScaleLogs,
} from "../../infrastructure/repositories/v2-social-repository.ts";
import { routeV2ScaleAdmin } from "./v2-scale-admin-routes.ts";
import { presignPublicUrl } from "../../infrastructure/storage/s3-storage.ts";

function ok(data: unknown): Response {
  return Response.json({ success: true, data, error: null });
}
function fail(msg: string, status = 400): Response {
  return Response.json({ success: false, data: null, error: { message: msg } }, { status });
}

const toggleSchema = z.object({
  expId: z.string().min(1),
  userId: z.string().min(1),
});

const evaluateSchema = z.object({
  expId: z.string().min(1),
  userId: z.string().min(1),
  evaluateContent: z.string().optional(),
  evaluateUrl: z.string().optional(),
});

const scaleLogSchema = z.object({
  userId: z.string().min(1),
  scaleSource: z.string().min(1),
  scaleNum: z.number().int(),
});

export async function routeV2Social(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const path = url.pathname;

    if (!path.startsWith("/v2/social") && !path.startsWith("/v2/scale")) {
      return new Response(null, { status: 404 });
    }

    // ── 点赞（切换） ──────────────────────────────────────
    if (req.method === "POST" && path === "/v2/social/like") {
      const body = await req.json();
      const { expId, userId } = toggleSchema.parse(body);
      const result = await toggleLike(expId, userId);
      return ok(result);
    }

    // ── 倒赞（切换） ──────────────────────────────────────
    if (req.method === "POST" && path === "/v2/social/notlike") {
      const body = await req.json();
      const { expId, userId } = toggleSchema.parse(body);
      const result = await toggleNotlike(expId, userId);
      return ok(result);
    }

    // ── 收藏（切换） ──────────────────────────────────────
    if (req.method === "POST" && path === "/v2/social/collection") {
      const body = await req.json();
      const { expId, userId } = toggleSchema.parse(body);
      const result = await toggleCollection(expId, userId);
      return ok(result);
    }

    // ── 发表评价 ──────────────────────────────────────────
    if (req.method === "POST" && path === "/v2/social/evaluate") {
      const body = await req.json();
      const input = evaluateSchema.parse(body);
      const record = await addEvaluate(input);
      return ok({
        ...record,
        evaluateUrl: await presignPublicUrl(record.evaluateUrl),
      });
    }

    // ── 查询评价列表 ──────────────────────────────────────
    const evalMatch = path.match(/^\/v2\/social\/evaluate\/([^/]+)$/);
    if (evalMatch && req.method === "GET") {
      const expId = decodeURIComponent(evalMatch[1]!);
      const data = await listEvaluates(expId);
      const presignedData = await Promise.all(data.map(async (item) => ({
        ...item,
        evaluateUrl: await presignPublicUrl(item.evaluateUrl),
      })));
      return ok(presignedData);
    }

    // ── 试验互动统计 ──────────────────────────────────────
    const statsMatch = path.match(/^\/v2\/social\/stats\/([^/]+)$/);
    if (statsMatch && req.method === "GET") {
      const expId = decodeURIComponent(statsMatch[1]!);
      const userId = url.searchParams.get("userId") ?? undefined;
      const data = await getSocialStats(expId, userId);
      return ok(data);
    }

    // ── 管理台：称号规则 CRUD、流水分页 ───────────────────
    const scaleAdminResp = await routeV2ScaleAdmin(req, path, url);
    if (scaleAdminResp) return scaleAdminResp;

    // ── 积分流水写入 ──────────────────────────────────────
    if (req.method === "POST" && path === "/v2/scale/log") {
      const body = await req.json();
      const input = scaleLogSchema.parse(body);
      const record = await writeScaleLog(input);
      return ok(record);
    }

    // ── 积分流水查询 ──────────────────────────────────────
    const scaleMatch = path.match(/^\/v2\/scale\/log\/([^/]+)$/);
    if (scaleMatch && req.method === "GET") {
      const userId = decodeURIComponent(scaleMatch[1]!);
      const data = await listScaleLogs(userId);
      return ok(data);
    }

    return new Response(null, { status: 404 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return fail(`参数校验失败：${err.errors[0]?.message ?? "未知字段"}`, 400);
    }
    console.error("[v2-social]", err);
    return fail("服务内部错误", 500);
  }
}
