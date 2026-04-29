/**
 * V2 教材 HTTP 路由
 * 前缀：/v2/coursebook/*
 */
import { z } from "zod";
import { assertAnyPermission } from "../../lib/auth/permission-guard.ts";
import { PERMISSIONS } from "../../lib/auth/role-permissions.ts";
import {
  listCoursebooks,
  listCoursebooksEnriched,
  getCoursebookTree,
  createCoursebook,
  createChapter,
  createUnit,
  updateCoursebook,
  deleteCoursebook,
  updateChapter,
  deleteChapter,
  updateUnit,
  deleteUnit,
} from "../../infrastructure/repositories/v2-coursebook-repository.ts";

function ok(data: unknown): Response {
  return Response.json({ success: true, data, error: null });
}
function fail(msg: string, status = 400): Response {
  return Response.json({ success: false, data: null, error: { message: msg } }, { status });
}

const id32Token = z.string().min(1).max(32).regex(/^[a-zA-Z0-9_]+$/);

const createCoursebookSchema = z.object({
  coursebook_id: id32Token.optional(),
  coursebook_name: z.string().min(1),
  coursebook_version: z.string().optional(),
  subject_id: z.string().optional(),
  comments: z.string().optional(),
  status: z.string().optional(),
});

const createChapterSchema = z.object({
  chapter_id: id32Token.optional(),
  chapter_name: z.string().min(1),
  coursebook_id: z.string().min(1),
  comments: z.string().optional(),
  sort_order: z.number().int().optional(),
});

const updateChapterSchema = z.object({
  chapter_name: z.string().min(1).optional(),
  comments: z.string().nullable().optional(),
  sort_order: z.number().int().optional(),
  status: z.string().nullable().optional(),
});

const createUnitSchema = z.object({
  unit_id: id32Token.optional(),
  unit_name: z.string().min(1),
  chapter_id: z.string().min(1),
  comments: z.string().optional(),
  sort_order: z.number().int().optional(),
});

const updateUnitSchema = z.object({
  unit_name: z.string().min(1).optional(),
  comments: z.string().nullable().optional(),
  sort_order: z.number().int().optional(),
  status: z.string().nullable().optional(),
});

const updateCoursebookSchema = z.object({
  coursebook_name: z.string().min(1).optional(),
  coursebook_version: z.string().nullable().optional(),
  subject_id: z.string().nullable().optional(),
  comments: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
});

export async function routeV2Coursebook(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const path = url.pathname;
    const actorRoleId = req.headers.get("x-role-id") ?? req.headers.get("x-role") ?? undefined;

    if (!path.startsWith("/v2/coursebook")) return new Response(null, { status: 404 });

    // ── 教材列表 ──────────────────────────────────────────
    if (req.method === "GET" && path === "/v2/coursebook") {
      const keyword = url.searchParams.get("keyword") ?? undefined;
      const data = await listCoursebooks(keyword);
      return ok(data);
    }

    // ── 教材列表（含统计数据：章节数、实验数、学科名） ────
    if (req.method === "GET" && path === "/v2/coursebook/enriched") {
      const keyword = url.searchParams.get("keyword") ?? undefined;
      const data = await listCoursebooksEnriched(keyword);
      return ok(data);
    }

    // ── 新建教材 ──────────────────────────────────────────
    if (req.method === "POST" && path === "/v2/coursebook") {
      assertAnyPermission(actorRoleId, [PERMISSIONS.COURSEBOOK_MANAGE]);
      const body = await req.json();
      const parsed = createCoursebookSchema.parse(body);
      const record = await createCoursebook({
        coursebookId: parsed.coursebook_id,
        coursebookName: parsed.coursebook_name,
        coursebookVersion: parsed.coursebook_version,
        subjectId: parsed.subject_id ?? null,
        comments: parsed.comments,
        status: parsed.status,
      });
      return ok(record);
    }

    // ── 更新/删除教材 ─────────────────────────────────────
    const bookMatch = path.match(/^\/v2\/coursebook\/([^/]+)$/);
    if (bookMatch && req.method === "PATCH") {
      assertAnyPermission(actorRoleId, [PERMISSIONS.COURSEBOOK_MANAGE]);
      const coursebookId = decodeURIComponent(bookMatch[1]!);
      const body = await req.json();
      const parsed = updateCoursebookSchema.parse(body);
      const record = await updateCoursebook(coursebookId, {
        coursebookName: parsed.coursebook_name,
        coursebookVersion: parsed.coursebook_version,
        subjectId: parsed.subject_id ?? undefined,
        comments: parsed.comments,
        status: parsed.status,
      });
      return ok(record);
    }
    if (bookMatch && req.method === "DELETE") {
      assertAnyPermission(actorRoleId, [PERMISSIONS.COURSEBOOK_MANAGE]);
      const coursebookId = decodeURIComponent(bookMatch[1]!);
      await deleteCoursebook(coursebookId);
      return ok({ deleted: true });
    }

    // ── 教材目录树（章节+小节） ───────────────────────────
    const treeMatch = path.match(/^\/v2\/coursebook\/([^/]+)\/tree$/);
    if (treeMatch && req.method === "GET") {
      const coursebookId = decodeURIComponent(treeMatch[1]!);
      const data = await getCoursebookTree(coursebookId);
      return ok(data);
    }

    // ── 新建章 ────────────────────────────────────────────
    if (req.method === "POST" && path === "/v2/coursebook/chapter") {
      assertAnyPermission(actorRoleId, [PERMISSIONS.COURSEBOOK_MANAGE]);
      const body = await req.json();
      const parsed = createChapterSchema.parse(body);
      const record = await createChapter({
        chapterId: parsed.chapter_id,
        chapterName: parsed.chapter_name,
        coursebookId: parsed.coursebook_id,
        comments: parsed.comments,
        sortOrder: parsed.sort_order,
      });
      return ok(record);
    }

    const chapterMatch = path.match(/^\/v2\/coursebook\/chapter\/([^/]+)$/);
    if (chapterMatch && req.method === "PATCH") {
      assertAnyPermission(actorRoleId, [PERMISSIONS.COURSEBOOK_MANAGE]);
      const chapterId = decodeURIComponent(chapterMatch[1]!);
      const body = await req.json();
      const parsed = updateChapterSchema.parse(body);
      const record = await updateChapter(chapterId, {
        chapterName: parsed.chapter_name,
        comments: parsed.comments,
        sortOrder: parsed.sort_order,
        status: parsed.status,
      });
      return ok(record);
    }
    if (chapterMatch && req.method === "DELETE") {
      assertAnyPermission(actorRoleId, [PERMISSIONS.COURSEBOOK_MANAGE]);
      const chapterId = decodeURIComponent(chapterMatch[1]!);
      await deleteChapter(chapterId);
      return ok({ deleted: true });
    }

    // ── 新建节 ────────────────────────────────────────────
    if (req.method === "POST" && path === "/v2/coursebook/unit") {
      assertAnyPermission(actorRoleId, [PERMISSIONS.COURSEBOOK_MANAGE]);
      const body = await req.json();
      const parsed = createUnitSchema.parse(body);
      const record = await createUnit({
        unitId: parsed.unit_id,
        unitName: parsed.unit_name,
        chapterId: parsed.chapter_id,
        comments: parsed.comments,
        sortOrder: parsed.sort_order,
      });
      return ok(record);
    }

    const unitMatch = path.match(/^\/v2\/coursebook\/unit\/([^/]+)$/);
    if (unitMatch && req.method === "PATCH") {
      assertAnyPermission(actorRoleId, [PERMISSIONS.COURSEBOOK_MANAGE]);
      const unitId = decodeURIComponent(unitMatch[1]!);
      const body = await req.json();
      const parsed = updateUnitSchema.parse(body);
      const record = await updateUnit(unitId, {
        unitName: parsed.unit_name,
        comments: parsed.comments,
        sortOrder: parsed.sort_order,
        status: parsed.status,
      });
      return ok(record);
    }
    if (unitMatch && req.method === "DELETE") {
      assertAnyPermission(actorRoleId, [PERMISSIONS.COURSEBOOK_MANAGE]);
      const unitId = decodeURIComponent(unitMatch[1]!);
      await deleteUnit(unitId);
      return ok({ deleted: true });
    }

    return new Response(null, { status: 404 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return fail(`参数校验失败：${err.errors[0]?.message ?? "未知字段"}`, 400);
    }
    if (err instanceof Error) {
      const msg = err.message;
      if (msg.startsWith("权限不足")) return fail(msg, 403);
      if (msg === "PRIMARY_KEY_INVALID") {
        return fail("主键格式无效（仅 1–32 位字母、数字、下划线）", 400);
      }
      if (msg === "ID_ALREADY_USED") return fail("主键已存在", 409);
    }
    console.error("[v2-coursebook]", err);
    return fail("服务内部错误", 500);
  }
}
