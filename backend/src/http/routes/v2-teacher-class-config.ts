import { z } from "zod";
import type { RowDataPacket } from "mysql2/promise";

import { getTeacherSubjects } from "../../infrastructure/repositories/v2-teacher-subject-repository.ts";
import { getClassSubjectConflicts } from "../../infrastructure/repositories/v2-teacher-class-conflict-repository.ts";
import { fetchAllGradeSubjectMap } from "../../infrastructure/repositories/v2-grade-subject-repository.ts";
import { getTeacherClassesByTeacherId } from "../../infrastructure/repositories/v2-teacher-class-repository.ts";
import { syncTeacherRelations } from "../../services/TeacherClassService.ts";
import { getMysqlPool } from "../../infrastructure/mysql/mysql-client.ts";
import { assertAnyPermission, PermissionDeniedError } from "../../lib/auth/permission-guard.ts";
import { PERMISSIONS } from "../../lib/auth/role-permissions.ts";

function ok(data: unknown): Response {
  return Response.json({ success: true, data, error: null });
}
function fail(msg: string, status = 400): Response {
  return Response.json({ success: false, data: null, error: { message: msg } }, { status });
}

export async function routeV2TeacherClassConfig(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const path = url.pathname;
    const actorId = req.headers.get("x-user-id");
    const actorRoleId = req.headers.get("x-role-id") ?? req.headers.get("x-role") ?? undefined;

    /**
     * 获取教师可教学科（来自其加入的课题组）。
     * GET /v2/teacher-class/subjects?teacherId=xxx
     */
    if (path === "/v2/teacher-class/subjects" && req.method === "GET") {
      const teacherId = z.string().min(1).max(32).parse(url.searchParams.get("teacherId") ?? "");
      const items = await getTeacherSubjects(teacherId);
      return ok({ items });
    }

    /**
     * 获取全部年级-学科映射（来自 data_school_grade_subject）。
     * GET /v2/teacher-class/grade-subjects
     */
    if (path === "/v2/teacher-class/grade-subjects" && req.method === "GET") {
      const map = await fetchAllGradeSubjectMap();
      return ok({ map });
    }

    /**
     * 获取班级-学科冲突列表。
     * GET /v2/teacher-class/conflicts?teacherId=xxx&gradeId=yyy
     * 查指定年级下所有班级中，哪些（班级, 学科）已被其他教师占用。
     */
    if (path === "/v2/teacher-class/conflicts" && req.method === "GET") {
      const teacherId = z.string().min(1).max(32).parse(url.searchParams.get("teacherId") ?? "");
      const gradeId = z.string().min(1).max(32).parse(url.searchParams.get("gradeId") ?? "");
      const pool = getMysqlPool();

      // 查出该年级下所有班级 org_id
      const [classRows] = await pool.query<RowDataPacket[]>(
        `SELECT org_id AS orgId FROM sys_org
         WHERE parent_org_id = ?
           AND org_type_id = 'Org_School_Class'
           AND is_deleted = 0`,
        [gradeId],
      );

      if (classRows.length === 0) return ok({ items: [] });
      const items = await getClassSubjectConflicts(teacherId, classRows.map((r) => String(r.orgId)));
      return ok({ items });
    }

    return new Response(null, { status: 404 });
  } catch (err) {
    if (err instanceof z.ZodError) return fail(`参数校验失败：${err.errors[0]?.message ?? "未知字段"}`, 400);
    if (err instanceof PermissionDeniedError) return fail(err.message, 403);
    if (err instanceof Error) return fail(err.message, 500);
    return fail("服务内部错误", 500);
  }
}
