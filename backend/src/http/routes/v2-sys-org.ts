import { z } from "zod";
import type { RowDataPacket } from "mysql2/promise";

import { getMysqlPool } from "../../infrastructure/mysql/mysql-client.ts";
import { getTeacherClassesByTeacherId } from "../../infrastructure/repositories/v2-teacher-class-repository.ts";
import { bindTeacherClassRole, syncTeacherRelations } from "../../services/TeacherClassService.ts";
import { assertAnyPermission, PermissionDeniedError } from "../../lib/auth/permission-guard.ts";
import { PERMISSIONS } from "../../lib/auth/role-permissions.ts";
import { listSysOrgs } from "../../infrastructure/repositories/v2-sys-user-repository.ts";

function ok(data: unknown): Response {
  return Response.json({ success: true, data, error: null });
}
function fail(msg: string, status = 400): Response {
  return Response.json({ success: false, data: null, error: { message: msg } }, { status });
}

export async function routeV2SysOrg(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const path = url.pathname;
    const actorId = req.headers.get("x-user-id");
    const actorRoleId = req.headers.get("x-role-id") ?? req.headers.get("x-role") ?? undefined;

    if (path === "/v2/sys-org/teacher-classes" && req.method === "GET") {
      if (!actorId) return fail("未授权的访问", 401);
      const targetTeacherId = z.string().min(1).max(32).optional().parse(url.searchParams.get("teacherId") ?? undefined);
      if (targetTeacherId && targetTeacherId !== actorId) {
        assertAnyPermission(actorRoleId, [PERMISSIONS.ORG_MANAGE]);
        const items = await getTeacherClassesByTeacherId(targetTeacherId);
        return ok({ items });
      }
      const items = await getTeacherClassesByTeacherId(actorId);
      return ok({ items });
    }

    if (path === "/v2/sys-org/teacher-class-bind" && req.method === "POST") {
      assertAnyPermission(actorRoleId, [PERMISSIONS.ORG_MANAGE]);
      const body = z.object({
        userId: z.string().min(1),
        orgId: z.string().min(1),
        subjectId: z.string().min(1),
      }).parse(await req.json());

      const pool = getMysqlPool();
      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();
        await bindTeacherClassRole(conn, body);
        await conn.commit();
        return ok({ message: "绑定成功" });
      } catch (err) {
        await conn.rollback();
        throw err;
      } finally {
        conn.release();
      }
    }

    if (path === "/v2/teacher-class/sync" && req.method === "POST") {
      assertAnyPermission(actorRoleId, [PERMISSIONS.ORG_MANAGE]);
      const body = z.object({
        teacherId: z.string().min(1),
        relations: z.array(
          z.object({
            classOrgId: z.string().min(1),
            subjectId: z.string().min(1),
          }),
        ),
      }).parse(await req.json());

      const pool = getMysqlPool();
      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();
        await syncTeacherRelations(conn, body.teacherId, body.relations);
        await conn.commit();
        return ok({ message: "同步成功" });
      } catch (err) {
        await conn.rollback();
        throw err;
      } finally {
        conn.release();
      }
    }

    if (path === "/v2/sys-org" && req.method === "GET") {
      assertAnyPermission(actorRoleId, [PERMISSIONS.ORG_MANAGE, PERMISSIONS.USER_MANAGE, PERMISSIONS.ROLE_MANAGE]);
      const query = z.object({ keyword: z.string().optional() }).parse(Object.fromEntries(url.searchParams));
      return ok(await listSysOrgs(query));
    }

    return new Response(null, { status: 404 });
  } catch (err) {
    if (err instanceof z.ZodError) return fail(`参数校验失败：${err.errors[0]?.message ?? "未知字段"}`, 400);
    if (err instanceof PermissionDeniedError) return fail(err.message, 403);
    if (err instanceof Error) return fail(err.message, 500);
    return fail("服务内部错误", 500);
  }
}
