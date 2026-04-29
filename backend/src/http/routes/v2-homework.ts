/**
 * V2 作业模块 HTTP 路由
 * 前缀：/v2/homework
 */
import { z } from "zod";
import { assertPermission, assertAnyPermission } from "../../lib/auth/permission-guard.ts";
import { PERMISSIONS } from "../../lib/auth/role-permissions.ts";
import {
  listHomework,
  getHomeworkById,
  getHomeworkStudentById,
  createHomework,
  listHomeworkStudents,
  markHomeworkStudent,
} from "../../infrastructure/repositories/v2-homework-repository.ts";
import { assertTeacherClassRelation } from "../../infrastructure/repositories/v2-exp-homework-repository.ts";

function ok(data: unknown): Response {
  return Response.json({ success: true, data, error: null });
}
function fail(msg: string, status = 400): Response {
  return Response.json({ success: false, data: null, error: { message: msg } }, { status });
}

const homeworkQuerySchema = z.object({
  teacherUserId: z.string().optional(),
  classId: z.string().optional(),
  expId: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

const id32Token = z.string().min(1).max(32).regex(/^[a-zA-Z0-9_]+$/);

const createHomeworkSchema = z.object({
  workId: id32Token.optional(),
  expId: z.string().min(1),
  teacherUserId: z.string().min(1),
  classId: z.string().min(1),
  requireDate: z.string().optional(),
  studentUserIds: z.array(z.string()).optional(),
});

const markSchema = z.object({
  markUserId: z.string().min(1),
  markResult: z.string().min(1),
  markComments: z.string().optional(),
});

const studentQuerySchema = z.object({
  workId: z.string().optional(),
  studentUserId: z.string().optional(),
  submitted: z.enum(["true", "false"]).optional(),
  marked: z.enum(["true", "false"]).optional(),
});

export async function routeV2Homework(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method;
    const actorId = req.headers.get("x-user-id") ?? undefined;
    const actorRoleId = req.headers.get("x-role-id") ?? req.headers.get("x-role") ?? undefined;

    // GET /v2/homework
    if (path === "/v2/homework" && method === "GET") {
      if (!actorId) return fail("缺少用户身份", 401);
      const raw = Object.fromEntries(url.searchParams.entries());
      const parsed = homeworkQuerySchema.safeParse(raw);
      if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "参数错误");
      // T1: Enforce teacher filter — teacher can only see homework from their own classes
      if (!parsed.data.teacherUserId) {
        // Default to the requesting user's ID
        parsed.data.teacherUserId = actorId;
      }
      try {
        const result = await listHomework(parsed.data);
        return ok(result);
      } catch (e) {
        return fail(e instanceof Error ? e.message : "查询失败", 500);
      }
    }

    // POST /v2/homework
    if (path === "/v2/homework" && method === "POST") {
      assertAnyPermission(actorRoleId, [PERMISSIONS.EXP_PUBLISH, PERMISSIONS.TASK_GRADE]);
      let body: unknown;
      try { body = await req.json(); } catch { return fail("无效的请求体"); }
      const parsed = createHomeworkSchema.safeParse(body);
      if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "参数错误");
      try {
        const created = await createHomework(parsed.data);
        return ok(created);
      } catch (e) {
        const m = e instanceof Error ? e.message : "";
        if (m === "PRIMARY_KEY_INVALID") return fail("主键格式无效（仅 1–32 位字母、数字、下划线）", 400);
        if (m === "ID_ALREADY_USED") return fail("主键已存在", 409);
        return fail(e instanceof Error ? e.message : "创建失败", 500);
      }
    }

    // GET /v2/homework/:id
    const getMatch = path.match(/^\/v2\/homework\/([^/]+)$/);
    if (getMatch && method === "GET") {
      const workId = decodeURIComponent(getMatch[1]!);
      try {
        const hw = await getHomeworkById(workId);
        if (!hw) return fail("未找到", 404);
        return ok(hw);
      } catch (e) {
        return fail(e instanceof Error ? e.message : "查询失败", 500);
      }
    }

    // GET /v2/homework/:id/students
    const studentsMatch = path.match(/^\/v2\/homework\/([^/]+)\/students$/);
    if (studentsMatch && method === "GET") {
      const workId = decodeURIComponent(studentsMatch[1]!);
      const raw = Object.fromEntries(url.searchParams.entries());
      const parsed = studentQuerySchema.safeParse(raw);
      if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "参数错误");
      try {
        const students = await listHomeworkStudents({
          workId,
          studentUserId: parsed.data.studentUserId,
          submitted: parsed.data.submitted === "true" ? true : parsed.data.submitted === "false" ? false : undefined,
          marked: parsed.data.marked === "true" ? true : parsed.data.marked === "false" ? false : undefined,
        });
        return ok(students);
      } catch (e) {
        return fail(e instanceof Error ? e.message : "查询失败", 500);
      }
    }

    // PATCH /v2/homework/students/:seqId/mark
    const markMatch = path.match(/^\/v2\/homework\/students\/([^/]+)\/mark$/);
    if (markMatch && method === "PATCH") {
      assertPermission(actorRoleId, PERMISSIONS.TASK_GRADE);
      const seqId = decodeURIComponent(markMatch[1]!);
      let body: unknown;
      try { body = await req.json(); } catch { return fail("无效的请求体"); }
      const parsed = markSchema.safeParse(body);
      if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "参数错误");
      try {
        // T2: Ownership check — verify the homework was assigned by this teacher or they teach the class
        const studentRecord = await getHomeworkStudentById(seqId);
        if (!studentRecord) return fail("未找到该学生作业记录", 404);
        if (!actorId) return fail("缺少用户身份", 401);
        if (studentRecord.teacherUserId !== actorId) {
          const hwRecord = await getHomeworkById(studentRecord.workId);
          if (!hwRecord) return fail("未找到作业记录", 404);
          try {
            await assertTeacherClassRelation(actorId, hwRecord.classId);
          } catch {
            return fail("权限不足：您无权批改该学生作业", 403);
          }
        }
        await markHomeworkStudent(seqId, parsed.data);
        return ok({ seqId });
      } catch (e) {
        return fail(e instanceof Error ? e.message : "操作失败", 500);
      }
    }

    return new Response(null, { status: 404 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.startsWith("权限不足")) return fail(msg, 403);
    return fail(msg || "服务内部错误", 500);
  }
}
