/**
 * V2 系统角色 HTTP 路由
 * 前缀：/v2/sys-role/*
 *
 * data_role 为基础字典表，仅提供只读查询。角色新增/修改由数据迁移管理。
 * 权限矩阵（sys_role_perm 表不存在）由前端硬编码 RBAC 定义。
 */
import { z } from "zod";
import {
  createSysRole,
  getSysRoleById,
  listSysRoles,
  updateSysRole,
} from "../../infrastructure/repositories/v2-sys-role-repository.ts";

function ok(data: unknown): Response {
  return Response.json({ success: true, data, error: null });
}
function fail(msg: string, status = 400): Response {
  return Response.json({ success: false, data: null, error: { message: msg } }, { status });
}

const roleQuerySchema = z.object({
  keyword: z.string().optional(),
  status: z.enum(["y", "n"]).optional(),
});

const id32Token = z.string().min(1).max(32).regex(/^[a-zA-Z0-9_]+$/);

const roleUpsertSchema = z.object({
  roleId: id32Token.optional(),
  roleName: z.string().min(1),
  roleCode: z.string().min(1),
  status: z.enum(["y", "n"]).optional(),
  comments: z.string().optional(),
  sortOrder: z.coerce.number().int().optional(),
});

export async function routeV2SysRole(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const path = url.pathname;
    const actorId = req.headers.get("x-user-id") ?? undefined;

    if (path === "/v2/sys-role") {
      if (req.method === "GET") {
        const query = roleQuerySchema.parse(Object.fromEntries(url.searchParams));
        return ok(await listSysRoles(query));
      }
      if (req.method === "POST") {
        const input = roleUpsertSchema.parse(await req.json());
        return ok(await createSysRole(input, actorId));
      }
    }

    const match = path.match(/^\/v2\/sys-role\/([^/]+)$/);
    if (match) {
      const roleId = decodeURIComponent(match[1]!);
      if (req.method === "GET") {
        const row = await getSysRoleById(roleId);
        if (!row) return fail("角色不存在", 404);
        return ok(row);
      }
      if (req.method === "PATCH" || req.method === "PUT") {
        const input = roleUpsertSchema.partial().parse(await req.json());
        return ok(await updateSysRole(roleId, input, actorId));
      }
    }

    return new Response(null, { status: 404 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return fail(`参数校验失败：${err.errors[0]?.message ?? "未知字段"}`, 400);
    }
    if (err instanceof Error) {
      if (err.message === "PRIMARY_KEY_INVALID") {
        return fail("主键格式无效（仅 1–32 位字母、数字、下划线）", 400);
      }
      if (err.message === "ID_ALREADY_USED") return fail("主键已存在", 409);
    }
    console.error("[v2-sys-role]", err);
    return fail("服务内部错误", 500);
  }
}
