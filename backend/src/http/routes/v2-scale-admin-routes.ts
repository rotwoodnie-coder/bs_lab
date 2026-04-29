/**
 * 管理台：积分称号 scale_title CRUD、积分流水 scale_log 分页查询。
 * 请求体字段名与表列一致（snake_case）。
 */
import { z } from "zod";
import { assertAnyPermission } from "../../lib/auth/permission-guard.ts";
import { PERMISSIONS } from "../../lib/auth/role-permissions.ts";
import {
  createScaleTitleRow,
  deleteScaleTitleRow,
  listScaleLogsAdmin,
  listScaleTitles,
  patchScaleTitleRow,
} from "../../infrastructure/repositories/v2-scale-admin-repository.ts";

function ok(data: unknown): Response {
  return Response.json({ success: true, data, error: null });
}
function fail(msg: string, status = 400): Response {
  return Response.json({ success: false, data: null, error: { message: msg } }, { status });
}

const createTitleSchema = z.object({
  role_id: z.string().min(1),
  title_name: z.string().min(1),
  icon: z.string().nullable().optional(),
  score_num: z.number().int(),
});

const patchTitleSchema = z
  .object({
    role_id: z.string().min(1).optional(),
    title_name: z.string().min(1).optional(),
    icon: z.string().nullable().optional(),
    score_num: z.number().int().optional(),
  })
  .refine((o) => Object.keys(o).length > 0, { message: "至少需要修改一项" });

function parseAdminLogQuery(url: URL): { page: number; pageSize: number; user_id?: string; scale_source?: string } {
  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1") || 1);
  const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get("page_size") ?? "20") || 20));
  const user_id = url.searchParams.get("user_id")?.trim() || undefined;
  const scale_source = url.searchParams.get("scale_source")?.trim() || undefined;
  return { page, pageSize, user_id, scale_source };
}

/** 匹配则返回 Response；否则 null（交由其它路由）。 */
export async function routeV2ScaleAdmin(req: Request, path: string, url: URL): Promise<Response | null> {
  if (!path.startsWith("/v2/scale/")) return null;

  const actorRoleId = req.headers.get("x-role-id") ?? req.headers.get("x-role") ?? undefined;

  try {
    return await dispatchV2ScaleAdmin(req, path, url, actorRoleId);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return fail(`参数校验失败：${err.errors[0]?.message ?? "未知字段"}`, 400);
    }
    if (err instanceof Error && err.message === "role_id 不存在于 data_role") {
      return fail(err.message, 400);
    }
    const msg = err instanceof Error ? err.message : "";
    if (msg.startsWith("权限不足")) return fail(msg, 403);
    throw err;
  }
}

async function dispatchV2ScaleAdmin(req: Request, path: string, url: URL, actorRoleId?: string): Promise<Response | null> {
  if (path === "/v2/scale/title" && req.method === "GET") {
    const roleId = url.searchParams.get("role_id")?.trim() || undefined;
    const data = await listScaleTitles(roleId);
    return ok(data);
  }

  if (path === "/v2/scale/title" && req.method === "POST") {
    assertAnyPermission(actorRoleId, [PERMISSIONS.SCALE_MANAGE]);
    const body = await req.json();
    const input = createTitleSchema.parse(body);
    const row = await createScaleTitleRow(input);
    return ok(row);
  }

  const titleIdMatch = path.match(/^\/v2\/scale\/title\/([^/]+)$/);
  if (titleIdMatch && req.method === "PATCH") {
    assertAnyPermission(actorRoleId, [PERMISSIONS.SCALE_MANAGE]);
    const seqId = decodeURIComponent(titleIdMatch[1]!);
    const body = await req.json();
    const patch = patchTitleSchema.parse(body);
    const row = await patchScaleTitleRow(seqId, patch);
    if (!row) return fail("记录不存在", 404);
    return ok(row);
  }

  if (titleIdMatch && req.method === "DELETE") {
    assertAnyPermission(actorRoleId, [PERMISSIONS.SCALE_MANAGE]);
    const seqId = decodeURIComponent(titleIdMatch[1]!);
    const okDel = await deleteScaleTitleRow(seqId);
    if (!okDel) return fail("记录不存在", 404);
    return ok({ deleted: true });
  }

  if (path === "/v2/scale/log/admin" && req.method === "GET") {
    assertAnyPermission(actorRoleId, [PERMISSIONS.SCALE_MANAGE]);
    const q = parseAdminLogQuery(url);
    const data = await listScaleLogsAdmin(q);
    return ok(data);
  }

  return null;
}
