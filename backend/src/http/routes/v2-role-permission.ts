import { z } from "zod";
import { assertPermission } from "../../lib/auth/permission-guard.ts";
import { PERMISSIONS, resolvePermissionCodes } from "../../lib/auth/role-permissions.ts";
import {
  clearRolePermissionCache,
  listRoleMenuPermissions,
  listSysMenus,
  refreshRolePermissionCache,
  upsertRoleMenuPermissions,
} from "../../infrastructure/repositories/v2-role-permission-repository.ts";

function ok(data: unknown): Response {
  return Response.json({ success: true, data, error: null });
}
function fail(msg: string, status = 400): Response {
  return Response.json({ success: false, data: null, error: { message: msg } }, { status });
}

const saveSchema = z.object({
  items: z.array(z.object({
    menuId: z.number().int().positive(),
    canRead: z.boolean(),
    canWrite: z.boolean(),
  })).default([]),
});

function actorRoleIdFromReq(req: Request): string | undefined {
  return req.headers.get("x-role") ?? req.headers.get("x-role-id") ?? undefined;
}

export async function routeV2RolePermission(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const path = url.pathname;
    const actorRoleId = actorRoleIdFromReq(req);
    const actorId = req.headers.get("x-user-id") ?? undefined;

    if (path === "/v2/sys-menu" && req.method === "GET") {
      return ok(await listSysMenus());
    }

    const match = path.match(/^\/v2\/sys-role\/([^/]+)\/permissions$/);
    if (!match) return new Response(null, { status: 404 });

    const roleId = decodeURIComponent(match[1]!);
    if (req.method === "GET") {
      assertPermission(actorRoleId, PERMISSIONS.ROLE_MANAGE);
      const items = await listRoleMenuPermissions(roleId);
      return ok({
        roleId,
        items: items.map((item) => ({
          menuId: item.menuId,
          menuCode: item.menuCode,
          menuName: item.menuName,
          path: item.path,
          canRead: item.canRead,
          canWrite: item.canWrite,
          readCode: `PAGE_${item.menuCode}_READ`,
          writeCode: `PAGE_${item.menuCode}_WRITE`,
        })),
        permissions: resolvePermissionCodes(roleId),
      });
    }

    if (req.method === "PUT") {
      assertPermission(actorRoleId, PERMISSIONS.ROLE_MANAGE);
      const body = saveSchema.parse(await req.json());
      const updated = await upsertRoleMenuPermissions(roleId, body.items, actorId);
      await clearRolePermissionCache(roleId);
      await refreshRolePermissionCache(roleId);
      return ok({ roleId, updated });
    }

    return new Response(null, { status: 404 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return fail(`参数校验失败：${err.errors[0]?.message ?? "未知字段"}`, 400);
    }
    if (err instanceof Error && err.message.startsWith("权限不足")) return fail(err.message, 403);
    console.error("[v2-role-permission]", err);
    return fail("服务内部错误", 500);
  }
}
