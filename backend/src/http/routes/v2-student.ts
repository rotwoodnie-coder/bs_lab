/**
 * V2 学生（sys_user）HTTP 路由
 * 前缀：/v2/student
 */
import { z } from "zod";
import { assertAnyPermission, assertPermission } from "../../lib/auth/permission-guard.ts";
import { PERMISSIONS } from "../../lib/auth/role-permissions.ts";
import { StudentServiceError, fetchStudentById, saveStudent } from "../../services/StudentService.ts";
import { fetchStudentTasks } from "../../infrastructure/repositories/v2-student-task-repository.ts";
import { fetchStudentFootprints } from "../../infrastructure/repositories/v2-student-footprints-repository.ts";
import { getHomeworkStudentById, submitHomeworkStudent } from "../../infrastructure/repositories/v2-homework-repository.ts";

function ok(data: unknown): Response {
  return Response.json({ success: true, data, message: "ok", error: null });
}
function fail(code: number, msg: string, status = 400): Response {
  return Response.json({ success: false, data: null, message: null, error: { code, message: msg } }, { status });
}

const id32Token = z.string().min(1).max(32).regex(/^[a-zA-Z0-9_]+$/);
const saveStudentSchema = z.object({
  userId: id32Token.optional(),
  userName: z.string().min(1).max(60),
  loginName: z.string().min(1).max(60),
  loginPwd: z.string().min(6).max(255),
  userOrgId: id32Token.optional(),
  userRoleId: id32Token.optional(),
  userNickName: z.string().optional(),
  userPhone: z.string().optional(),
  userEmail: z.string().optional(),
  expireDate: z.string().optional(),
  prefTitleId: id32Token.optional(),
  status: z.enum(["y", "n"]).optional(),
  comments: z.string().optional(),
});

export async function routeV2Student(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;
  const method = req.method;
  const actorId = req.headers.get("x-user-id") ?? undefined;
  const actorRoleId = req.headers.get("x-role-id") ?? req.headers.get("x-role") ?? undefined;

  if (path === "/v2/student" && method === "POST") {
    assertPermission(actorRoleId, PERMISSIONS.USER_MANAGE);
    let body: unknown;
    try { body = await req.json(); } catch { return fail(4000, "无效的请求体", 400); }
    const parsed = saveStudentSchema.safeParse(body);
    if (!parsed.success) return fail(4000, `参数校验失败：${parsed.error.issues[0]?.message ?? "未知字段"}`, 400);
    try {
      const out = await saveStudent(parsed.data, actorId);
      return ok(out);
    } catch (e) {
      if (e instanceof StudentServiceError) {
        if (e.code === "PRIMARY_KEY_INVALID") return fail(4000, "主键格式无效（仅 1–32 位字母、数字、下划线）", 400);
        if (e.code === "ID_ALREADY_USED") return fail(4000, "主键已存在，请更换", 409);
        return fail(5000, e.message, 500);
      }
      return fail(5000, e instanceof Error ? e.message : "保存失败", 500);
    }
  }

  // GET /v2/student/tasks — 学生任务列表（需在 /:id 之前匹配）
  if (path === "/v2/student/tasks" && method === "GET") {
    const studentUserId = req.headers.get("x-user-id") ?? "";
    if (!studentUserId) return fail(4001, "缺少用户身份", 401);
    try {
      const tasks = await fetchStudentTasks(studentUserId);
      return ok(tasks);
    } catch (e) {
      return fail(5000, e instanceof Error ? e.message : "查询失败", 500);
    }
  }

  // GET /v2/student/footprints — 学生成长足迹（需在 /:id 之前匹配）
  if (path === "/v2/student/footprints" && method === "GET") {
    const studentUserId = req.headers.get("x-user-id") ?? "";
    if (!studentUserId) return fail(4001, "缺少用户身份", 401);
    try {
      const footprints = await fetchStudentFootprints(studentUserId);
      return ok(footprints);
    } catch (e) {
      return fail(5000, e instanceof Error ? e.message : "查询失败", 500);
    }
  }

  const idMatch = path.match(/^\/v2\/student\/([^/]+)$/);
  if (idMatch && method === "GET") {
    assertAnyPermission(actorRoleId, [PERMISSIONS.USER_MANAGE, PERMISSIONS.ORG_MANAGE, PERMISSIONS.ROLE_MANAGE]);
    const userId = decodeURIComponent(idMatch[1]!);
    try {
      const row = await fetchStudentById(userId);
      if (!row) return fail(4040, "未找到该学生", 404);
      return ok(row);
    } catch (e) {
      return fail(5000, e instanceof Error ? e.message : "查询失败", 500);
    }
  }

  // POST /v2/student/tasks/:seqId/submit — 学生提交作业
  const submitMatch = path.match(/^\/v2\/student\/tasks\/([^/]+)\/submit$/);
  if (submitMatch && method === "POST") {
    const seqId = decodeURIComponent(submitMatch[1]!);
    const studentUserId = req.headers.get("x-user-id") ?? "";
    if (!studentUserId) return fail(4001, "缺少用户身份", 401);
    try {
      const record = await getHomeworkStudentById(seqId);
      if (!record) return fail(4040, "作业记录不存在", 404);
      if (record.studentUserId !== studentUserId) return fail(4030, "无权提交他人的作业", 403);
      await submitHomeworkStudent(seqId);
      return ok({ seqId });
    } catch (e) {
      if (e instanceof Error && e.message === "HOMEWORK_ALREADY_SUBMITTED") {
        return fail(4090, "作业已提交，不可重复提交", 409);
      }
      return fail(5000, e instanceof Error ? e.message : "提交失败", 500);
    }
  }

  return new Response(null, { status: 404 });
}

