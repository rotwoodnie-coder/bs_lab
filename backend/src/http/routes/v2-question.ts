/**
 * V2 题库模块 HTTP 路由
 * 前缀：/v2/question
 */
import { z } from "zod";
import {
  listQuestions,
  getQuestionById,
  createQuestion,
  updateQuestionStatus,
  updateQuestion,
  softDeleteQuestion,
} from "../../infrastructure/repositories/v2-question-repository.ts";
import { assertAnyPermission, assertPermission } from "../../lib/auth/permission-guard.ts";
import { PERMISSIONS } from "../../lib/auth/role-permissions.ts";

function ok(data: unknown): Response {
  return Response.json({ success: true, data, message: "ok", error: null });
}
function fail(msg: string, status = 400): Response {
  return Response.json({ success: false, data: null, message: null, error: { message: msg } }, { status });
}

const questionQuerySchema = z.object({
  keyword: z.string().optional(),
  teacherUserId: z.string().optional(),
  classId: z.string().optional(),
  difficultyTypeId: z.string().optional(),
  questionTypeId: z.string().optional(),
  unitId: z.string().optional(),
  status: z.enum(["y", "n", "t"]).optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

const id32Token = z.string().min(1).max(32).regex(/^[a-zA-Z0-9_]+$/);

const createQuestionSchema = z.object({
  questionId: id32Token.optional(),
  questionContent: z.string().min(1),
  teacherUserId: z.string().optional(),
  classId: z.string().optional(),
  difficultyTypeId: z.string().optional(),
  questionTypeId: z.string().optional(),
  questionCapacityId: z.string().optional(),
  unitId: z.string().optional(),
  knowledgeId: z.string().optional(),
  knowledgeContent: z.string().optional(),
  chooseType: z.enum(["S", "M"]).optional(),
  selects: z.array(z.object({
    selectContent: z.string().min(1),
    sortOrder: z.number().int().optional(),
    isRight: z.enum(["y", "n"]),
  })).optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(["y", "n", "t"]),
  updaterId: z.string().min(1),
  rejectReason: z.string().optional(),
});

const selectPatchItem = z.object({
  selectId: id32Token.optional(),
  selectContent: z.string().min(1),
  sortOrder: z.number().int().optional(),
  isRight: z.enum(["y", "n"]),
});

const updateQuestionSchema = z.object({
  questionContent: z.string().min(1).optional(),
  teacherUserId: z.union([z.string(), z.null()]).optional(),
  classId: z.union([z.string(), z.null()]).optional(),
  difficultyTypeId: z.union([z.string(), z.null()]).optional(),
  questionTypeId: z.union([z.string(), z.null()]).optional(),
  questionCapacityId: z.union([z.string(), z.null()]).optional(),
  unitId: z.union([z.string(), z.null()]).optional(),
  knowledgeId: z.union([z.string(), z.null()]).optional(),
  knowledgeContent: z.union([z.string(), z.null()]).optional(),
  chooseType: z.union([z.enum(["S", "M"]), z.null()]).optional(),
  updaterId: z.string().min(1),
  selects: z.array(selectPatchItem).optional(),
});

const deleteQuestionSchema = z.object({
  updaterId: z.string().min(1),
});

export async function routeV2Question(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;
  const method = req.method;
  const actorRoleId = req.headers.get("x-role-id") ?? req.headers.get("x-role") ?? undefined;

  if (path === "/v2/question" && method === "GET") {
    assertAnyPermission(actorRoleId, [PERMISSIONS.QUESTION_CREATE, PERMISSIONS.QUESTION_AUDIT, PERMISSIONS.EXP_VIEW]);
    const raw = Object.fromEntries(url.searchParams.entries());
    const parsed = questionQuerySchema.safeParse(raw);
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "参数错误");
    try {
      const result = await listQuestions(parsed.data);
      return ok(result);
    } catch (e) {
      return fail(e instanceof Error ? e.message : "查询失败", 500);
    }
  }

  if (path === "/v2/question" && method === "POST") {
    assertAnyPermission(actorRoleId, [PERMISSIONS.QUESTION_CREATE, PERMISSIONS.EXP_CREATE]);
    let body: unknown;
    try { body = await req.json(); } catch { return fail("无效的请求体"); }
    const parsed = createQuestionSchema.safeParse(body);
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "参数错误");
    try {
      const created = await createQuestion(parsed.data);
      return ok(created);
    } catch (e) {
      const m = e instanceof Error ? e.message : "";
      if (m === "PRIMARY_KEY_INVALID") return fail("主键格式无效（仅 1–32 位字母、数字、下划线）", 400);
      if (m === "ID_ALREADY_USED") return fail("主键已存在", 409);
      if (m === "INVALID_QUESTION_TYPE") return fail("非法的题目类型ID", 4003);
      return fail(e instanceof Error ? e.message : "创建失败", 500);
    }
  }

  const statusMatch = path.match(/^\/v2\/question\/([^/]+)\/status$/);
  if (statusMatch && method === "PATCH") {
    assertPermission(actorRoleId, PERMISSIONS.QUESTION_AUDIT);
    const questionId = decodeURIComponent(statusMatch[1]!);
    let body: unknown;
    try { body = await req.json(); } catch { return fail("无效的请求体"); }
    const parsed = updateStatusSchema.safeParse(body);
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "参数错误");
    try {
      await updateQuestionStatus(questionId, parsed.data.status, parsed.data.updaterId, parsed.data.rejectReason);
      return ok({ questionId, status: parsed.data.status });
    } catch (e) {
      return fail(e instanceof Error ? e.message : "操作失败", 500);
    }
  }

  const idMatch = path.match(/^\/v2\/question\/([^/]+)$/);
  if (idMatch) {
    const questionId = decodeURIComponent(idMatch[1]!);

    if (method === "GET") {
      assertAnyPermission(actorRoleId, [PERMISSIONS.QUESTION_CREATE, PERMISSIONS.QUESTION_AUDIT, PERMISSIONS.EXP_VIEW]);
      try {
        const q = await getQuestionById(questionId);
        if (!q) return fail("未找到", 404);
        return ok(q);
      } catch (e) {
        return fail(e instanceof Error ? e.message : "查询失败", 500);
      }
    }

    if (method === "PATCH") {
      assertAnyPermission(actorRoleId, [PERMISSIONS.QUESTION_CREATE, PERMISSIONS.QUESTION_AUDIT]);
      let body: unknown;
      try { body = await req.json(); } catch { return fail("无效的请求体"); }
      const parsed = updateQuestionSchema.safeParse(body);
      if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "参数错误");
      try {
        const updated = await updateQuestion(questionId, parsed.data);
        return ok(updated);
      } catch (e) {
        const m = e instanceof Error ? e.message : "";
        if (m === "NOT_FOUND") return fail("未找到", 404);
        if (m === "NO_FIELDS_TO_UPDATE") return fail("没有可更新的字段", 400);
        return fail(e instanceof Error ? e.message : "更新失败", 500);
      }
    }

    if (method === "DELETE") {
      assertPermission(actorRoleId, PERMISSIONS.QUESTION_AUDIT);
      let body: unknown;
      try { body = await req.json(); } catch { return fail("无效的请求体"); }
      const parsed = deleteQuestionSchema.safeParse(body);
      if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "参数错误");
      try {
        await softDeleteQuestion(questionId, parsed.data.updaterId);
        return ok({ questionId, deleted: true });
      } catch (e) {
        const m = e instanceof Error ? e.message : "";
        if (m === "NOT_FOUND") return fail("未找到", 404);
        return fail(e instanceof Error ? e.message : "删除失败", 500);
      }
    }
  }

  return new Response(null, { status: 404 });
}
