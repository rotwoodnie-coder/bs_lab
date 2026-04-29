/**
 * V2 班级（sys_org）HTTP 路由
 * 前缀：/v2/class
 */
import { z } from "zod";
import { assertAnyPermission, assertPermission } from "../../lib/auth/permission-guard.ts";
import { PERMISSIONS } from "../../lib/auth/role-permissions.ts";
import { ClassServiceError, fetchClassById, saveClass } from "../../services/ClassService.ts";

function ok(data: unknown): Response {
  return Response.json({ success: true, data, message: "ok", error: null });
}
function fail(code: number, msg: string, status = 400): Response {
  return Response.json({ success: false, data: null, message: null, error: { code, message: msg } }, { status });
}

const id32Token = z.string().min(1).max(32).regex(/^[a-zA-Z0-9_]+$/);
const saveClassSchema = z.object({
  orgId: id32Token.optional(),
  orgName: z.string().min(1).max(60),
  parentOrgId: z.union([id32Token, z.null()]).optional(),
  orgTypeId: z.union([id32Token, z.null()]).optional(),
  gradeId: z.union([id32Token, z.null()]).optional(),
  status: z.union([z.enum(["y", "n"]), z.null()]).optional(),
  sortOrder: z.union([z.number().int(), z.null()]).optional(),
});

export async function routeV2Class(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;
  const method = req.method;
  const actorId = req.headers.get("x-user-id") ?? undefined;
  const actorRoleId = req.headers.get("x-role-id") ?? req.headers.get("x-role") ?? undefined;

  if (path === "/v2/class" && method === "POST") {
    assertPermission(actorRoleId, PERMISSIONS.ORG_MANAGE);
    let body: unknown;
    try { body = await req.json(); } catch { return fail(4000, "无效的请求体", 400); }
    const parsed = saveClassSchema.safeParse(body);
    if (!parsed.success) return fail(4000, `参数校验失败：${parsed.error.issues[0]?.message ?? "未知字段"}`, 400);
    try {
      const out = await saveClass(parsed.data, actorId);
      return ok(out);
    } catch (e) {
      if (e instanceof ClassServiceError) {
        if (e.code === "CLASS_NAME_DUPLICATED") return fail(4005, "同级下已存在同名班级", 409);
        if (e.code === "PARENT_NOT_FOUND") return fail(4041, "父组织不存在", 400);
        if (e.code === "CLASS_NOT_FOUND") return fail(4040, "未找到该班级", 404);
        if (e.code === "PRIMARY_KEY_INVALID") return fail(4000, "主键格式无效（仅 1–32 位字母、数字、下划线）", 400);
        if (e.code === "ID_ALREADY_USED") return fail(4000, "主键已存在，请更换", 409);
        return fail(5000, e.message, 500);
      }
      return fail(5000, e instanceof Error ? e.message : "保存失败", 500);
    }
  }

  const idMatch = path.match(/^\/v2\/class\/([^/]+)$/);
  if (idMatch && method === "GET") {
    assertAnyPermission(actorRoleId, [PERMISSIONS.ORG_MANAGE, PERMISSIONS.USER_MANAGE, PERMISSIONS.ROLE_MANAGE]);
    const orgId = decodeURIComponent(idMatch[1]!);
    try {
      const row = await fetchClassById(orgId);
      if (!row) return fail(4040, "未找到该班级", 404);
      return ok(row);
    } catch (e) {
      return fail(5000, e instanceof Error ? e.message : "查询失败", 500);
    }
  }

  return new Response(null, { status: 404 });
}

