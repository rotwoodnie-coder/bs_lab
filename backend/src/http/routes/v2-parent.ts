/**
 * V2 家长绑定（家长自助申请 + 校级管理员审核）
 * 前缀：/v2/parent/*
 */
import { z } from "zod";
import { assertPermission } from "../../lib/auth/permission-guard.ts";
import { PERMISSIONS } from "../../lib/auth/role-permissions.ts";
import {
  auditBinding,
  auditBindingAsSuperAdmin,
  listAllSchoolPendingBindings,
  listClassesByGrade,
  listGradesBySchool,
  listMyBindings,
  listSchoolPendingBindings,
  listSchoolTree,
  listSchools,
  submitParentBindingApply,
  verifyStudentsInClass,
} from "../../services/ParentBindingService.ts";
import { listParentTasks } from "../../services/ParentTaskService.ts";
import {
  createSession,
  getSessionDetail,
  listSessionsByParent,
  updateSession,
  createReport,
  getReportBySessionId,
} from "../../services/ParentSessionService.ts";

const createSessionSchema = z.object({
  studentUserId: z.string().min(1),
  expId: z.string().min(1),
  workId: z.string().optional(),
  taskId: z.string().optional(),
  guideStyle: z.enum(["gentle", "rigorous", "playful"]).optional().default("gentle"),
});
const patchSessionSchema = z.object({
  parentAttestedAt: z.string().nullable().optional(),
  errorCount: z.number().int().min(0).optional(),
  materialShortageReported: z.number().int().min(0).max(1).optional(),
  guideStyle: z.enum(["gentle", "rigorous", "playful"]).optional(),
  completionStatus: z.enum(["in_progress", "completed"]).optional(),
});
const createReportSchema = z.object({
  sessionId: z.string().min(1),
  summary: z.string().min(1),
  strengths: z.array(z.string()).optional().default([]),
  improvements: z.array(z.string()).optional().default([]),
  nextRecommendations: z.array(z.string()).optional().default([]),
  shareCopy: z.string().optional(),
  teacherComment: z.string().optional(),
});

function ok(data: unknown): Response {
  return Response.json({ success: true, data, error: null });
}
function fail(msg: string, status = 400): Response {
  return Response.json({ success: false, data: null, error: { message: msg } }, { status });
}

function isRoleParent(roleId: string | null | undefined): boolean {
  const r = String(roleId ?? "").trim().toLowerCase();
  return r === "role_parent" || r === "parent";
}

function requireActor(req: Request): { actorId: string; actorRoleId: string | null; actorOrgId: string | null } | Response {
  const actorId = String(req.headers.get("x-user-id") ?? "").trim();
  if (!actorId) return fail("未登录", 401);
  return {
    actorId,
    actorRoleId: req.headers.get("x-role") ?? req.headers.get("x-role-id"),
    actorOrgId: req.headers.get("x-org-id"),
  };
}

export async function routeV2Parent(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const path = url.pathname;
    if (!path.startsWith("/v2/parent")) return new Response(null, { status: 404 });

    const actor = requireActor(req);
    if (actor instanceof Response) return actor;

    // ── 家长端：级联组织 ───────────────────────────────────
    if (req.method === "GET" && path === "/v2/parent/school-tree") {
      if (!isRoleParent(actor.actorRoleId)) return fail("仅家长可访问", 403);
      return ok({ items: await listSchoolTree() });
    }

    if (req.method === "GET" && path === "/v2/parent/schools") {
      if (!isRoleParent(actor.actorRoleId)) return fail("仅家长可访问", 403);
      return ok({ items: await listSchools() });
    }

    if (req.method === "GET" && path === "/v2/parent/grades") {
      if (!isRoleParent(actor.actorRoleId)) return fail("仅家长可访问", 403);
      const schoolOrgId = String(url.searchParams.get("schoolOrgId") ?? "").trim();
      if (!schoolOrgId) return fail("缺少 schoolOrgId", 400);
      return ok({ items: await listGradesBySchool(schoolOrgId) });
    }

    if (req.method === "GET" && path === "/v2/parent/classes") {
      if (!isRoleParent(actor.actorRoleId)) return fail("仅家长可访问", 403);
      const gradeOrgId = String(url.searchParams.get("gradeOrgId") ?? "").trim();
      if (!gradeOrgId) return fail("缺少 gradeOrgId", 400);
      return ok({ items: await listClassesByGrade(gradeOrgId) });
    }

    // ── 家长端：校验学生候选 ───────────────────────────────
    if (req.method === "POST" && path === "/v2/parent/verify-student") {
      if (!isRoleParent(actor.actorRoleId)) return fail("仅家长可访问", 403);
      const body = z.object({
        classOrgId: z.string().min(1),
        studentName: z.string().min(1).max(60),
      }).parse(await req.json());
      const candidates = await verifyStudentsInClass(body);
      return ok({ candidates });
    }

    // ── 家长端：提交绑定申请 ───────────────────────────────
    if (req.method === "POST" && path === "/v2/parent/bind-apply") {
      if (!isRoleParent(actor.actorRoleId)) return fail("仅家长可访问", 403);
      const body = z.object({
        classOrgId: z.string().min(1),
        studentUserId: z.string().min(1),
      }).parse(await req.json());
      await submitParentBindingApply({ parentUserId: actor.actorId, studentUserId: body.studentUserId, classOrgId: body.classOrgId });
      return ok({ submitted: true });
    }

    // ── 家长端：查看我的绑定与审核状态 ─────────────────────
    if (req.method === "GET" && path === "/v2/parent/my-bindings") {
      if (!isRoleParent(actor.actorRoleId)) return fail("仅家长可访问", 403);
      const items = await listMyBindings(actor.actorId);
      return ok({ items });
    }

    // ── 家长端：任务中心（查看已绑定孩子的作业）────────────────
    if (req.method === "GET" && path === "/v2/parent/tasks") {
      if (!isRoleParent(actor.actorRoleId)) return fail("仅家长可访问", 403);
      const items = await listParentTasks(actor.actorId);
      return ok({ items });
    }

    // ── 家长端：会话列表 ────────────────────────────────────
    if (req.method === "GET" && path === "/v2/parent/sessions") {
      if (!isRoleParent(actor.actorRoleId)) return fail("仅家长可访问", 403);
      const items = await listSessionsByParent(actor.actorId);
      return ok({ items });
    }

    // ── 家长端：创建会话 ────────────────────────────────────
    if (req.method === "POST" && path === "/v2/parent/sessions") {
      if (!isRoleParent(actor.actorRoleId)) return fail("仅家长可访问", 403);
      const body = createSessionSchema.parse(await req.json());
      const session = await createSession({
        parentUserId: actor.actorId,
        studentUserId: body.studentUserId,
        expId: body.expId,
        workId: body.workId,
        taskId: body.taskId,
        guideStyle: body.guideStyle,
      });
      return ok({ session });
    }

    // ── 家长端：会话详情 / 更新 ────────────────────────────
    const sessionMatch = path.match(/^\/v2\/parent\/sessions\/([^/]+)$/);
    if (sessionMatch && req.method === "GET") {
      if (!isRoleParent(actor.actorRoleId)) return fail("仅家长可访问", 403);
      const detail = await getSessionDetail(decodeURIComponent(sessionMatch[1]!));
      if (!detail) return fail("会话不存在", 404);
      if (detail.parentUserId !== actor.actorId) return fail("无权访问该会话", 403);
      return ok({ session: detail });
    }

    if (sessionMatch && req.method === "PATCH") {
      if (!isRoleParent(actor.actorRoleId)) return fail("仅家长可访问", 403);
      const body = patchSessionSchema.parse(await req.json());
      await updateSession(decodeURIComponent(sessionMatch[1]!), body);
      return ok({ updated: true });
    }

    // ── 家长端：报告 ────────────────────────────────────────
    if (req.method === "POST" && path === "/v2/parent/reports") {
      if (!isRoleParent(actor.actorRoleId)) return fail("仅家长可访问", 403);
      const body = createReportSchema.parse(await req.json());
      const report = await createReport({
        sessionId: body.sessionId,
        summary: body.summary,
        strengths: body.strengths,
        improvements: body.improvements,
        nextRecommendations: body.nextRecommendations,
        shareCopy: body.shareCopy,
        teacherComment: body.teacherComment,
      });
      return ok({ report });
    }

    if (req.method === "GET" && path === "/v2/parent/reports") {
      if (!isRoleParent(actor.actorRoleId)) return fail("仅家长可访问", 403);
      const sessionId = String(url.searchParams.get("sessionId") ?? "").trim();
      if (!sessionId) return fail("缺少 sessionId", 400);
      const report = await getReportBySessionId(sessionId);
      if (!report) return fail("报告未生成", 404);
      return ok({ report });
    }

    // ── 校管端：待审核列表 ─────────────────────────────────
    if (req.method === "GET" && path === "/v2/parent/audit/pending") {
      assertPermission(actor.actorRoleId, PERMISSIONS.ORG_MANAGE);
      const schoolOrgId = String(actor.actorOrgId ?? "").trim();
      // 超级管理员显示所有学校待审记录；校级管理员仅显示本校
      const isSuperAdmin = (actor.actorRoleId ?? "").trim().toLowerCase() === "role_sys_admin"
        || (actor.actorRoleId ?? "").trim().toLowerCase() === "system_admin";
      if (isSuperAdmin) {
        const items = await listAllSchoolPendingBindings();
        return ok({ items });
      }
      if (!schoolOrgId) return fail("当前会话缺少学校组织上下文（x-org-id）", 400);
      const items = await listSchoolPendingBindings(schoolOrgId);
      return ok({ items });
    }

    // ── 校管端：审核（通过/驳回） ───────────────────────────
    if (req.method === "POST" && path === "/v2/parent/audit") {
      assertPermission(actor.actorRoleId, PERMISSIONS.ORG_MANAGE);
      const schoolOrgId = String(actor.actorOrgId ?? "").trim();
      const isSuperAdmin = (actor.actorRoleId ?? "").trim().toLowerCase() === "role_sys_admin"
        || (actor.actorRoleId ?? "").trim().toLowerCase() === "system_admin";
      if (!isSuperAdmin && !schoolOrgId) return fail("当前会话缺少学校组织上下文（x-org-id）", 400);
      const body = z.object({
        seqId: z.string().min(1),
        auditStatus: z.enum(["Y", "N"]),
        auditComments: z.union([z.string().max(500), z.null()]).optional(),
      }).parse(await req.json());
      if (isSuperAdmin) {
        await auditBindingAsSuperAdmin({
          seqId: body.seqId,
          auditorUserId: actor.actorId,
          status: body.auditStatus,
          comments: body.auditComments ?? null,
        });
      } else {
        await auditBinding({
          seqId: body.seqId,
          schoolOrgId,
          auditorUserId: actor.actorId,
          status: body.auditStatus,
          comments: body.auditComments ?? null,
        });
      }
      return ok({ audited: true });
    }

    return new Response(null, { status: 404 });
  } catch (err) {
    if (err instanceof z.ZodError) return fail(`参数校验失败：${err.errors[0]?.message ?? "未知字段"}`, 400);
    if (err instanceof Error) {
      if (err.message === "SCHOOL_ORG_RESOLVE_FAILED") return fail("无法定位学生所属学校（组织树数据异常）", 400);
      if (err.message === "PARENT_BINDING_AUDIT_NOT_FOUND_OR_ALREADY_HANDLED") return fail("记录不存在或已处理", 409);
      if (err.message.startsWith("权限不足")) return fail(err.message, 403);
    }
    console.error("[v2-parent]", err);
    return fail("服务内部错误", 500);
  }
}

