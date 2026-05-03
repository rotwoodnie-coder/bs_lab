/**
 * V2 用户反馈 HTTP 路由
 * 前缀：/v2/sys/feedback
 *
 * 权限策略：
 *   POST /v2/sys/feedback          登录即可提报（无需特殊权限）
 *   POST /v2/sys/feedback/upload   登录即可上传（隔离桶）
 *   GET /v2/sys/feedback           需管理权限
 *   GET /v2/sys/feedback/:id       需管理权限
 *   PUT /v2/sys/feedback/:id       需管理权限
 *   DELETE /v2/sys/feedback/:id    需管理权限
 */
import { randomUUID } from "node:crypto";
import { z } from "zod";
import {
  listSysFeedback,
  getSysFeedbackById,
  createSysFeedback,
  updateSysFeedback,
  softDeleteSysFeedback,
  getGovernanceStats,
  type SysFeedbackReporter,
  type SysFeedbackEnv,
  type FeedbackType,
  type FeedbackStatus,
} from "../../infrastructure/repositories/v2-sys-feedback-repository.ts";
import { putFeedbackObject, createFeedbackPublicPresignedReadUrl } from "../../infrastructure/storage/s3-feedback-storage.ts";
import { assertAnyPermission } from "../../lib/auth/permission-guard.ts";
import { PERMISSIONS } from "../../lib/auth/role-permissions.ts";

function ok(data: unknown): Response {
  return Response.json({ success: true, data, error: null });
}
function fail(msg: string, status = 400): Response {
  return Response.json({ success: false, data: null, error: { message: msg } }, { status });
}

// ─── Schema ──────────────────────────────────────────────

const createFeedbackSchema = z.object({
  type: z.enum(["BUG", "FEATURE", "OPTIMIZE", "INQUIRY"] as const satisfies readonly FeedbackType[]),
  title: z.string().min(1, "标题不能为空").max(200, "标题不能超过 200 字"),
  content: z.string().optional(),
  env: z
    .object({
      url: z.string().optional(),
      ua: z.string().optional(),
      browser: z.string().optional(),
      resolution: z.string().optional(),
      pathname: z.string().optional(),
      errorStack: z.string().optional(),
      error_stack_brief: z.string().optional(),
    })
    .optional(),
  issueFingerprint: z.string().optional(),
});

const listQuerySchema = z.object({
  type: z.enum(["BUG", "FEATURE", "OPTIMIZE", "INQUIRY"] as const).optional(),
  status: z.enum(["TODO", "DOING", "DONE", "REJECT", "AUTO_TRIAGED"] as const).optional(),
  keyword: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

const updateFeedbackSchema = z.object({
  status: z.enum(["TODO", "DOING", "DONE", "REJECT", "AUTO_TRIAGED"] as const satisfies readonly FeedbackStatus[]).optional(),
  reply: z.string().optional(),
});

/** 规范化 API 路径，防止 `/v2/sys/feedback/` 与 `/v2/sys/feedback` 不一致导致 404 */
function normalizePath(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) return pathname.replace(/\/+$/, "");
  return pathname;
}

/** 从请求头提取提报人信息（x-user-name 经过 URI 编码，需解码） */
function extractReporter(headers: Headers): SysFeedbackReporter {
  return {
    userId: headers.get("x-user-id") ?? "",
    name: (() => {
      const raw = headers.get("x-user-name");
      return raw ? decodeURIComponent(raw) : "";
    })(),
    role: headers.get("x-role") ?? "",
    orgId: headers.get("x-org-id") ?? "",
    orgName: headers.get("x-org-name") ?? "",
  };
}

export async function routeV2SysFeedback(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const path = normalizePath(url.pathname);
    const actorId = req.headers.get("x-user-id") ?? undefined;
    const actorRoleId = req.headers.get("x-role-id") ?? req.headers.get("x-role") ?? undefined;

    if (!path.startsWith("/v2/sys/feedback")) return new Response(null, { status: 404 });

    // ── 提报反馈（登录即可） ──────────────────────────────
    if (req.method === "POST" && path === "/v2/sys/feedback") {
      const body = createFeedbackSchema.parse(await req.json());
      const reporter = extractReporter(req.headers);
      const record = await createSysFeedback({ ...body, reporter }, actorId);
      return ok(record);
    }

    // ── 反馈图片上传（登录即可，隔离存储桶） ──────────────
    if (req.method === "POST" && path === "/v2/sys/feedback/upload-image") {
      const contentType = req.headers.get("content-type") ?? "";
      if (!contentType.includes("multipart/form-data")) {
        return fail("请使用 multipart/form-data 上传图片", 400);
      }
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      if (!file) return fail("缺少 file 字段", 400);

      if (file.size > 10 * 1024 * 1024) {
        return fail("图片大小不能超过 10MB", 400);
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const fileExt = file.name.includes(".") ? file.name.split(".").pop()! : "png";
      const storageKey = `feedback/${actorId ?? "anon"}/${randomUUID()}.${fileExt}`;

      await putFeedbackObject(storageKey, buffer, file.type || "image/png");
      const url = await createFeedbackPublicPresignedReadUrl(storageKey);

      return ok({ url, storageKey });
    }

    // ── 列表查询（管理权限） ──────────────────────────────
    if (req.method === "GET" && path === "/v2/sys/feedback") {
      assertAnyPermission(actorRoleId, [PERMISSIONS.USER_MANAGE, PERMISSIONS.ROLE_MANAGE, PERMISSIONS.ORG_MANAGE]);
      const query = listQuerySchema.parse(Object.fromEntries(url.searchParams));
      const result = await listSysFeedback(query);
      return ok(result);
    }

    // ── 治理统计 ─────────────────────────────────────────
    if (req.method === "GET" && path === "/v2/sys/feedback/stats") {
      assertAnyPermission(actorRoleId, [PERMISSIONS.USER_MANAGE, PERMISSIONS.ROLE_MANAGE, PERMISSIONS.ORG_MANAGE]);
      const stats = await getGovernanceStats();
      return ok(stats);
    }

    // ── 单条操作 ─────────────────────────────────────────
    const singleMatch = path.match(/^\/v2\/sys\/feedback\/([^/]+)$/);
    if (singleMatch) {
      const feedbackId = decodeURIComponent(singleMatch[1]!);

      if (req.method === "GET") {
        assertAnyPermission(actorRoleId, [PERMISSIONS.USER_MANAGE, PERMISSIONS.ROLE_MANAGE, PERMISSIONS.ORG_MANAGE]);
        const record = await getSysFeedbackById(feedbackId);
        if (!record) return fail("反馈不存在", 404);
        return ok(record);
      }

      if (req.method === "PUT" || req.method === "PATCH") {
        assertAnyPermission(actorRoleId, [PERMISSIONS.USER_MANAGE, PERMISSIONS.ROLE_MANAGE, PERMISSIONS.ORG_MANAGE]);
        const body = updateFeedbackSchema.parse(await req.json());
        const record = await updateSysFeedback(feedbackId, { ...body, replierId: actorId }, actorId);
        if (!record) return fail("反馈不存在", 404);
        return ok(record);
      }

      if (req.method === "DELETE") {
        assertAnyPermission(actorRoleId, [PERMISSIONS.USER_MANAGE, PERMISSIONS.ROLE_MANAGE, PERMISSIONS.ORG_MANAGE]);
        const deleted = await softDeleteSysFeedback(feedbackId, actorId);
        if (!deleted) return fail("反馈不存在或已被删除", 404);
        return ok({ deleted: true });
      }
    }

    return new Response(null, { status: 404 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return fail(`参数校验失败：${err.errors[0]?.message ?? "未知字段"}`, 400);
    }
    if (err instanceof Error) {
      if (err.message.startsWith("权限不足")) return fail(err.message, 403);
      if (err.message === "FEEDBACK_CREATE_FAILED") {
        return fail("反馈写入失败，请稍后重试", 500);
      }
    }
    console.error("[v2-sys-feedback]", err);
    return fail("服务内部错误", 500);
  }
}
