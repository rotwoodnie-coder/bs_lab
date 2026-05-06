import { z } from "zod";
import type { ExpLibraryListQuery, ExpLibraryStatus, PatchExpLibraryInput } from "../../domain/v2-exp/v2-exp-types.ts";
import { listExpLibrary, getExpLibraryById, createExpLibrary, patchExpLibrary } from "../../infrastructure/repositories/v2-exp-repository.ts";
import { putExpMsgDraft } from "../../infrastructure/repositories/v2-exp-draft-repository.ts";
import { assertAnyPermission } from "../../lib/auth/permission-guard.ts";
import { PERMISSIONS } from "../../lib/auth/role-permissions.ts";
import { getExpDetail, getExpList, getExpStats, saveExp, bindExpToUnit, ServiceError } from "../../services/ExpService.ts";
import { insertExpHomework, assertTeacherClassRelation } from "../../infrastructure/repositories/v2-exp-homework-repository.ts";
import { getMysqlPool } from "../../infrastructure/mysql/mysql-client.ts";

function ok(data: unknown): Response {
  return Response.json({ success: true, data, message: "ok", error: null });
}
function fail(code: number, msg: string, status = 400): Response {
  return Response.json({ success: false, data: null, message: null, error: { code, message: msg } }, { status });
}

const commaIdList = z.string().optional().transform((s) => s ? s.split(",").map((x) => x.trim().slice(0, 32)).filter(Boolean).slice(0, 40) : []);
const expMsgQuerySchema = z.object({ keyword: z.string().optional(), subjectId: z.string().optional(), subject_ids: commaIdList, schoolLevelId: z.string().optional(), school_level_ids: commaIdList, gradeId: z.string().optional(), grade_ids: commaIdList, difficultyId: z.string().optional(), status: z.enum(["t", "y", "n"]).optional(), createUserId: z.string().optional(), createUserType: z.enum(["Teacher", "Student"]).optional(), expTaskType: z.enum(["hw", "tk", "self"]).optional(), chapterId: z.string().max(32).optional(), unitId: z.string().max(32).optional(), coursebookId: z.string().max(32).optional(), page: z.coerce.number().int().min(1).optional(), pageSize: z.coerce.number().int().min(1).max(100).optional() });
const patchExpBindingSchema = z.object({ unit_id: z.string().max(32).nullable(), coursebook_id: z.string().max(32).nullable().optional() });
const createExpMsgSchema = z.object({ expId: z.string().min(1).max(32).optional(), expName: z.string().min(1), chooseType: z.enum(["y", "n"]).optional(), subjectId: z.string().optional(), schoolLevelId: z.string().optional(), gradeId: z.string().optional(), difficultyId: z.string().optional(), expPrinciple: z.string().optional(), expCaution: z.string().optional(), expDanger: z.string().optional(), classHour: z.number().optional(), coursebookId: z.string().optional(), unitId: z.string().optional(), createUserType: z.enum(["Teacher", "Student"]).optional(), standardExpId: z.string().optional(), expTaskType: z.enum(["hw", "tk", "self"]).optional(), simulatorUrl: z.string().optional(), materials: z.array(z.any()).optional(), steps: z.array(z.any()).optional() });
const id32Token = z.string().min(1).max(32).regex(/^[a-zA-Z0-9_]+$/);
const createLibrarySchema = z.object({ libExpId: id32Token.optional(), libExpName: z.string().min(1), chooseType: z.enum(["y", "n"]).optional(), subjectId: z.string().optional(), schoolLevelId: z.string().optional(), comments: z.string().optional(), status: z.enum(["t", "y", "n"]).optional(), gradeIds: z.array(z.string()).optional() });
const patchLibrarySchema = z.object({ libExpName: z.string().min(1).max(100).optional(), chooseType: z.enum(["y", "n"]).nullable().optional(), subjectId: z.string().max(32).nullable().optional(), schoolLevelId: z.string().max(32).nullable().optional(), comments: z.string().max(200).nullable().optional(), status: z.enum(["t", "y", "n"]).optional(), gradeIds: z.array(z.string()).optional() });
const patchExpMsgReviewSchema = z.object({ status: z.enum(["y", "n"]), confirm_comments: z.string().max(200).nullable().optional() });
const putExpMsgDraftSchema = z.object({ exp_name: z.string().min(1).max(100).optional(), choose_type: z.enum(["y", "n"]).nullable().optional(), subject_id: z.string().nullable().optional(), school_level_id: z.string().nullable().optional(), grade_id: z.string().nullable().optional(), difficulty_id: z.string().nullable().optional(), exp_principle: z.string().nullable().optional(), exp_caution: z.string().max(200).nullable().optional(), exp_danger: z.string().max(200).nullable().optional(), class_hour: z.number().nullable().optional(), coursebook_id: z.string().nullable().optional(), unit_id: z.string().nullable().optional(), exp_task_type: z.enum(["hw", "tk", "self"]).nullable().optional(), simulator_url: z.string().max(200).nullable().optional(), materials: z.array(z.any()).optional(), steps: z.array(z.any()).optional(), results: z.array(z.any()).optional(), references: z.array(z.any()).optional(), scientists: z.array(z.any()).optional(), videos: z.array(z.any()).optional() });

export async function routeV2Exp(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const path = url.pathname;
    const actorId = req.headers.get("x-user-id") ?? undefined;
    const actorRoleId = req.headers.get("x-role-id") ?? req.headers.get("x-role") ?? undefined;

    if (path === "/v2/exp") {
      if (req.method === "GET") {
        const q = expMsgQuerySchema.parse(Object.fromEntries(url.searchParams.entries()));
        return ok(await getExpList({ keyword: q.keyword, subjectId: q.subjectId, subjectIds: q.subject_ids.length ? q.subject_ids : undefined, schoolLevelId: q.schoolLevelId, schoolLevelIds: q.school_level_ids.length ? q.school_level_ids : undefined, gradeId: q.gradeId, gradeIds: q.grade_ids.length ? q.grade_ids : undefined, difficultyId: q.difficultyId, status: q.status, createUserId: q.createUserId, createUserType: q.createUserType, expTaskType: q.expTaskType, chapterId: q.chapterId, unitId: q.unitId, coursebookId: q.coursebookId, page: q.page, pageSize: q.pageSize }));
      }
      if (req.method === "POST") {
        assertAnyPermission(actorRoleId, [PERMISSIONS.EXP_CREATE, PERMISSIONS.EXP_EDIT]);
        const input = createExpMsgSchema.parse(await req.json());
        return ok(await saveExp(input as any, actorId));
      }
    }

    const expBindingMatch = path.match(/^\/v2\/exp\/([^/]+)\/binding$/);
    if (expBindingMatch && req.method === "PATCH") {
      assertAnyPermission(actorRoleId, [PERMISSIONS.EXP_CREATE, PERMISSIONS.EXP_EDIT]);
      const { unit_id, coursebook_id } = patchExpBindingSchema.parse(await req.json());
      await bindExpToUnit(decodeURIComponent(expBindingMatch[1]!), unit_id, coursebook_id ?? null, actorId);
      return ok({ updated: true });
    }

    const expDraftMatch = path.match(/^\/v2\/exp\/([^/]+)\/draft$/);
    if (expDraftMatch && req.method === "PUT") {
      assertAnyPermission(actorRoleId, [PERMISSIONS.EXP_CREATE, PERMISSIONS.EXP_EDIT]);
      return ok(await putExpMsgDraft(decodeURIComponent(expDraftMatch[1]!), putExpMsgDraftSchema.parse(await req.json()), actorId));
    }

    // stats 必须放在通用 /v2/exp/:id 前，否则 "stats" 会被匹配为 expId
    if (path === "/v2/exp/stats" && req.method === "GET") {
      return ok(await getExpStats());
    }

    const expMatch = path.match(/^\/v2\/exp\/([^/]+)$/);
    if (expMatch && req.method === "GET") {
      const detail = await getExpDetail(getMysqlPool(), decodeURIComponent(expMatch[1]!));
      if (!detail) return fail(404, "实验不存在", 404);
      return ok(detail);
    }

    if (expMatch && req.method === "PATCH") {
      assertAnyPermission(actorRoleId, [PERMISSIONS.EXP_PUBLISH, PERMISSIONS.QUESTION_AUDIT]);
      const patch = patchExpMsgReviewSchema.parse(await req.json());
      const { patchExpMsgForReview } = await import("../../infrastructure/repositories/v2-exp-repository.ts");
      return ok(await patchExpMsgForReview(decodeURIComponent(expMatch[1]!), patch as any, actorId));
    }

    // ── 批量分发整本教材实验（课程 → 班级） ──
    if (path === "/v2/exp/publish-coursebook-tasks" && req.method === "POST") {
      assertAnyPermission(actorRoleId, [PERMISSIONS.EXP_CREATE, PERMISSIONS.EXP_EDIT]);
      if (!actorId) return fail(401, "未授权", 401);
      const body = z.object({
        coursebookId: z.string().min(1).max(32),
        targetClassId: z.string().min(1).max(32),
        requireDate: z.string().nullable().optional(),
      }).parse(await req.json());
      await assertTeacherClassRelation(actorId, body.targetClassId);
      const expPage = await getExpList({ coursebookId: body.coursebookId, status: "y", pageSize: 200 });
      const created: string[] = [];
      for (const exp of expPage.items) {
        const hw = await insertExpHomework({ expId: exp.expId, teacherUserId: actorId, classId: body.targetClassId, requireDate: body.requireDate ?? null }, actorId);
        created.push(hw.workId);
      }
      return ok({ createdCount: created.length, classId: body.targetClassId });
    }

    if (path === "/v2/exp/publish-course-task" && req.method === "POST") {
      assertAnyPermission(actorRoleId, [PERMISSIONS.EXP_CREATE, PERMISSIONS.EXP_EDIT]);
      if (!actorId) return fail(401, "未授权", 401);
      const body = z.object({
        draftId: z.string().min(1).max(32),
        targetClassId: z.string().min(1).max(32),
        deadline: z.string().nullable().optional(),
        requirement: z.string().max(2000).nullable().optional(),
      }).parse(await req.json());
      await assertTeacherClassRelation(actorId, body.targetClassId);
      const record = await insertExpHomework({
        expId: body.draftId,
        teacherUserId: actorId,
        classId: body.targetClassId,
        requireDate: body.deadline ?? null,
      }, actorId);
      return ok({ workId: record.workId, expId: record.expId, classId: record.classId, status: "published" });
    }

    if (path === "/v2/exp-library") {
      if (req.method === "GET") {
        const params = Object.fromEntries(url.searchParams.entries());
        const query: ExpLibraryListQuery = {};
        if (params.keyword?.trim()) query.keyword = params.keyword.trim();
        if (params.page) query.page = Math.max(1, Number(params.page));
        if (params.pageSize) query.pageSize = Math.min(100, Math.max(1, Number(params.pageSize)));
        if (params.status) query.status = params.status as ExpLibraryStatus;
        return ok(await listExpLibrary(query));
      }
      if (req.method === "POST") return ok(await createExpLibrary(createLibrarySchema.parse(await req.json()) as any, actorId));
    }

    const libMatch = path.match(/^\/v2\/exp-library\/([^/]+)$/);
    if (libMatch && req.method === "GET") return ok(await getExpLibraryById(decodeURIComponent(libMatch[1]!)));
    if (libMatch && req.method === "PATCH") return ok(await patchExpLibrary(decodeURIComponent(libMatch[1]!), patchLibrarySchema.parse(await req.json()) as PatchExpLibraryInput, actorId));

    return new Response(null, { status: 404 });
  } catch (err) {
    if (err instanceof z.ZodError) return fail(400, `参数校验失败：${err.errors[0]?.message ?? "未知字段"}`);
    if (err instanceof ServiceError) {
      if (err.code === "CONTENT_TOO_LONG") return fail(4001, "实验步骤内容过长", 400);
      if (err.code === "EXP_NAME_EMPTY") return fail(4002, "实验名称不能为空", 400);
      return fail(4000, err.message, 400);
    }
    if (err instanceof Error) return fail(5000, err.message, 500);
    return fail(5000, "服务内部错误", 500);
  }
}
