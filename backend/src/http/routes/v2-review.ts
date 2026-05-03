import { z } from "zod";
import { assertPageRead, assertPageWrite } from "../../lib/auth/permission-guard.ts";
import { writeSysLog } from "../../infrastructure/repositories/v2-sys-log-repository.ts";
import { getMysqlPool } from "../../infrastructure/mysql/mysql-client.ts";
import { listStudentWorksForReview, patchExpMsgForReview } from "../../infrastructure/repositories/v2-exp-repository.ts";
import { listSubjectGroupsForReview, patchSubjectGroupForReview, type SubjectGroupMembership } from "../../infrastructure/repositories/subject-group-repository.ts";
import type { ExpMsgRecord } from "../../domain/v2-exp/v2-exp-types.ts";
import { presignPublicUrl } from "../../infrastructure/storage/s3-storage.ts";

function ok(data: unknown): Response {
  return Response.json({ success: true, data, error: null });
}
function fail(msg: string, status = 400): Response {
  return Response.json({ success: false, data: null, error: { message: msg } }, { status });
}

/**
 * 校验操作者是否是系统管理员。
 * 05 文档第 6 节红线：系统管理员不能直接执行审核写操作，
 * 必须使用教研员或校管账号。
 */
function rejectIfSysAdmin(actorRoleId: string | null | undefined): Response | null {
  const rid = (actorRoleId ?? "").trim().toLowerCase();
  if (rid === "role_sys_admin" || rid === "system_admin") {
    return fail("系统管理员不能直接审核，请使用教研员/校管账号", 403);
  }
  return null;
}

// ─── 实验/作品审核 DTO ───────────────────────────────────

const reviewApprovalSchema = z.object({
  exp_id: z.string().min(1).max(32),
  confirm_comments: z.string().max(200).nullable().optional(),
});

const reviewRejectSchema = z.object({
  exp_id: z.string().min(1).max(32),
  reject_reason: z.string().min(4, "驳回理由至少 4 个字符"),
});

// ─── 课题组审核 DTO ──────────────────────────────────────

const groupApprovalSchema = z.object({
  group_id: z.string().min(1).max(32),
});

const groupRejectSchema = z.object({
  group_id: z.string().min(1).max(32),
  reject_reason: z.string().min(4, "驳回理由至少 4 个字符"),
});

// ─── GET 处理函数 ─────────────────────────────────────────

/**
 * GET /v2/review/student-works
 * 查询学生作品列表（校管/教研员审核工作台）
 */
async function handleListStudentWorks(req: Request, actorRoleId: string | null | undefined): Promise<Response> {
  assertPageRead(actorRoleId, "review_student_works");
  const url = new URL(req.url);
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const pageSize = Math.min(100, Number(url.searchParams.get("page_size")) || 20);
  const result = await listStudentWorksForReview(page, pageSize);
  const presignedItems = await Promise.all(result.items.map(async (item) => ({
    ...item,
    logoUrl: await presignPublicUrl(item.logoUrl),
    simulatorUrl: await presignPublicUrl(item.simulatorUrl),
    coverVideoUrl: await presignPublicUrl(item.coverVideoUrl),
  })));
  return ok({ ...result, items: presignedItems });
}

/**
 * GET /v2/review/research-groups
 * 查询课题组列表（教研员审核工作台）
 */
async function handleListResearchGroups(actorRoleId: string | null | undefined): Promise<Response> {
  assertPageRead(actorRoleId, "review_research_groups");
  const groups = await listSubjectGroupsForReview();
  return ok({ items: groups, total: groups.length });
}

// ─── POST 审核处理函数 ────────────────────────────────────

/**
 * POST /v2/review/student-works/approve
 * 校管/教研员审核通过学生作品
 */
async function handleApproveStudentWork(req: Request, actorId: string | undefined, actorRoleId: string | null | undefined, traceId: string): Promise<Response> {
  const blocked = rejectIfSysAdmin(actorRoleId);
  if (blocked) return blocked;
  assertPageWrite(actorRoleId, "review_student_works");

  const body = reviewApprovalSchema.parse(await req.json());
  const updated = await patchExpMsgForReview(body.exp_id, { status: "y", confirm_comments: body.confirm_comments ?? null }, actorId);

  await writeSysLog(getMysqlPool(), {
    userId: actorId ?? null,
    logType: "review_student_work_approve",
    logDataType: "exp_msg",
    logDataId: body.exp_id,
    logDataContent: JSON.stringify({
      traceId, action: "approve",
      expId: body.exp_id,
      expName: updated.expName,
    }),
  });

  return ok({ expId: body.exp_id, status: "y" });
}

/**
 * POST /v2/review/student-works/reject
 * 校管/教研员驳回学生作品
 */
async function handleRejectStudentWork(req: Request, actorId: string | undefined, actorRoleId: string | null | undefined, traceId: string): Promise<Response> {
  const blocked = rejectIfSysAdmin(actorRoleId);
  if (blocked) return blocked;
  assertPageWrite(actorRoleId, "review_student_works");

  const body = reviewRejectSchema.parse(await req.json());
  const updated = await patchExpMsgForReview(body.exp_id, { status: "n", reject_reason: body.reject_reason }, actorId);

  await writeSysLog(getMysqlPool(), {
    userId: actorId ?? null,
    logType: "review_student_work_reject",
    logDataType: "exp_msg",
    logDataId: body.exp_id,
    logDataContent: JSON.stringify({
      traceId, action: "reject",
      expId: body.exp_id,
      expName: updated.expName,
      reason: body.reject_reason,
    }),
  });

  return ok({ expId: body.exp_id, status: "n" });
}

/**
 * POST /v2/review/research-groups/approve
 * 教研员审核通过课题组
 */
async function handleApproveResearchGroup(req: Request, actorId: string | undefined, actorRoleId: string | null | undefined, traceId: string): Promise<Response> {
  const blocked = rejectIfSysAdmin(actorRoleId);
  if (blocked) return blocked;
  assertPageWrite(actorRoleId, "review_research_groups");

  const body = groupApprovalSchema.parse(await req.json());
  const updated = await patchSubjectGroupForReview(body.group_id, { reviewStatus: "y" }, actorId);

  await writeSysLog(getMysqlPool(), {
    userId: actorId ?? null,
    logType: "review_research_group_approve",
    logDataType: "subject_group",
    logDataId: body.group_id,
    logDataContent: JSON.stringify({
      traceId, action: "approve",
      groupId: body.group_id,
      groupName: updated.groupName,
    }),
  });

  return ok({ expId: body.group_id, status: "y" });
}

/**
 * POST /v2/review/research-groups/reject
 * 教研员驳回课题组
 */
async function handleRejectResearchGroup(req: Request, actorId: string | undefined, actorRoleId: string | null | undefined, traceId: string): Promise<Response> {
  const blocked = rejectIfSysAdmin(actorRoleId);
  if (blocked) return blocked;
  assertPageWrite(actorRoleId, "review_research_groups");

  const body = groupRejectSchema.parse(await req.json());
  const updated = await patchSubjectGroupForReview(body.group_id, { reviewStatus: "n", rejectReason: body.reject_reason }, actorId);

  await writeSysLog(getMysqlPool(), {
    userId: actorId ?? null,
    logType: "review_research_group_reject",
    logDataType: "subject_group",
    logDataId: body.group_id,
    logDataContent: JSON.stringify({
      traceId, action: "reject",
      groupId: body.group_id,
      groupName: updated.groupName,
      reason: body.reject_reason,
    }),
  });

  return ok({ expId: body.group_id, status: "n" });
}

// ─── 已有实验审核入口（兼容） ────────────────────────────

/**
 * POST /v2/review/experiments/approve
 * 教研员审核通过实验课程
 */
async function handleApproveExperiment(req: Request, actorId: string | undefined, actorRoleId: string | null | undefined, traceId: string): Promise<Response> {
  const blocked = rejectIfSysAdmin(actorRoleId);
  if (blocked) return blocked;
  assertPageWrite(actorRoleId, "review_experiments");

  const body = reviewApprovalSchema.parse(await req.json());
  const updated = await patchExpMsgForReview(body.exp_id, { status: "y", confirm_comments: body.confirm_comments ?? null }, actorId);

  await writeSysLog(getMysqlPool(), {
    userId: actorId ?? null,
    logType: "review_experiment_approve",
    logDataType: "exp_msg",
    logDataId: body.exp_id,
    logDataContent: JSON.stringify({ traceId, action: "approve", expId: body.exp_id, expName: updated.expName }),
  });

  return ok({ expId: body.exp_id, status: "y" });
}

/**
 * POST /v2/review/experiments/reject
 * 教研员驳回实验课程
 */
async function handleRejectExperiment(req: Request, actorId: string | undefined, actorRoleId: string | null | undefined, traceId: string): Promise<Response> {
  const blocked = rejectIfSysAdmin(actorRoleId);
  if (blocked) return blocked;
  assertPageWrite(actorRoleId, "review_experiments");

  const body = reviewRejectSchema.parse(await req.json());
  const updated = await patchExpMsgForReview(body.exp_id, { status: "n", reject_reason: body.reject_reason }, actorId);

  await writeSysLog(getMysqlPool(), {
    userId: actorId ?? null,
    logType: "review_experiment_reject",
    logDataType: "exp_msg",
    logDataId: body.exp_id,
    logDataContent: JSON.stringify({ traceId, action: "reject", expId: body.exp_id, expName: updated.expName, reason: body.reject_reason }),
  });

  return ok({ expId: body.exp_id, status: "n" });
}

// ─── 路由分发 ─────────────────────────────────────────────

export async function routeV2Review(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const path = url.pathname;
    const actorId = req.headers.get("x-user-id") ?? undefined;
    const actorRoleId = req.headers.get("x-role-id") ?? req.headers.get("x-role") ?? undefined;
    const traceId = req.headers.get("x-trace-id") ?? "";

    switch (path) {
      // ── GET 列表 ──
      case "/v2/review/student-works":
        if (req.method !== "GET") return fail("仅支持 GET", 405);
        return await handleListStudentWorks(req, actorRoleId);

      case "/v2/review/research-groups":
        if (req.method !== "GET") return fail("仅支持 GET", 405);
        return await handleListResearchGroups(actorRoleId);

      // ── POST 审核写操作 ──
      case "/v2/review/student-works/approve":
        if (req.method !== "POST") return fail("仅支持 POST", 405);
        return await handleApproveStudentWork(req, actorId, actorRoleId, traceId);

      case "/v2/review/student-works/reject":
        if (req.method !== "POST") return fail("仅支持 POST", 405);
        return await handleRejectStudentWork(req, actorId, actorRoleId, traceId);

      case "/v2/review/research-groups/approve":
        if (req.method !== "POST") return fail("仅支持 POST", 405);
        return await handleApproveResearchGroup(req, actorId, actorRoleId, traceId);

      case "/v2/review/research-groups/reject":
        if (req.method !== "POST") return fail("仅支持 POST", 405);
        return await handleRejectResearchGroup(req, actorId, actorRoleId, traceId);

      case "/v2/review/experiments/approve":
        if (req.method !== "POST") return fail("仅支持 POST", 405);
        return await handleApproveExperiment(req, actorId, actorRoleId, traceId);

      case "/v2/review/experiments/reject":
        if (req.method !== "POST") return fail("仅支持 POST", 405);
        return await handleRejectExperiment(req, actorId, actorRoleId, traceId);

      default:
        return new Response(null, { status: 404 });
    }
  } catch (err) {
    if (err instanceof z.ZodError) {
      return fail(`参数校验失败：${err.errors[0]?.message ?? "未知字段"}`, 400);
    }
    if (err instanceof Error) {
      if (err.message === "NOT_FOUND") return fail("审核对象不存在", 404);
      if (err.message === "NOT_PENDING_REVIEW") return fail("当前状态不可审核（不是待审核状态）", 409);
      if (err.message === "REJECT_REASON_TOO_SHORT") return fail("驳回理由至少 4 个字符", 400);
      if (err.message.startsWith("权限不足")) return fail(err.message, 403);
    }
    console.error("[v2-review]", err);
    return fail("服务内部错误", 500);
  }
}
