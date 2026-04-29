/**
 * V2 教师实验素材类型配置
 * 前缀：/v2/teacher-material-types
 */
import { z } from "zod";
import {
  createTeacherMaterialTypeV2,
  deleteTeacherMaterialTypeV2,
  listTeacherMaterialTypesV2,
  updateTeacherMaterialTypeV2,
} from "../../infrastructure/repositories/v2-teacher-material-type-repository.ts";

function ok(data: unknown): Response {
  return Response.json({ success: true, data, error: null });
}
function fail(msg: string, status = 400): Response {
  return Response.json({ success: false, data: null, error: { message: msg } }, { status });
}

const roleKeySchema = z.enum([
  "STUDENT",
  "PARENT",
  "TEACHER",
  "RESEARCHER",
  "SCHOOL_ADMIN",
  "DISTRICT_ADMIN",
  "SUPER_ADMIN",
]);

const upsertSchema = z.object({
  code: z.string().min(1).max(32).regex(/^[a-z0-9_]+$/i),
  label: z.string().min(1).max(64),
  sortOrder: z.number().int(),
  visibleRoles: z.array(roleKeySchema).default([]),
});

const patchSchema = upsertSchema.omit({ code: true });

function isDupKey(err: unknown): boolean {
  return typeof err === "object" && err !== null && "code" in err && (err as { code: string }).code === "ER_DUP_ENTRY";
}

export async function routeV2TeacherMaterialTypes(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const path = url.pathname;
    if (!path.startsWith("/v2/teacher-material-types")) return new Response(null, { status: 404 });

    if (req.method === "GET" && path === "/v2/teacher-material-types") {
      return ok(await listTeacherMaterialTypesV2());
    }

    if (req.method === "POST" && path === "/v2/teacher-material-types") {
      const input = upsertSchema.parse(await req.json());
      try {
        return ok(await createTeacherMaterialTypeV2(input));
      } catch (err) {
        if (isDupKey(err)) return fail("类型编码已存在", 409);
        throw err;
      }
    }

    const match = path.match(/^\/v2\/teacher-material-types\/([^/]+)$/);
    if (!match) return new Response(null, { status: 404 });
    const code = decodeURIComponent(match[1]!);

    if (req.method === "PATCH") {
      const input = patchSchema.parse(await req.json());
      try {
        return ok(await updateTeacherMaterialTypeV2(code, input));
      } catch (err) {
        const msg = err instanceof Error ? err.message : "";
        if (msg === "TEACHER_MATERIAL_TYPE_NOT_FOUND") return fail("未找到该类型", 404);
        throw err;
      }
    }

    if (req.method === "DELETE") {
      try {
        return ok(await deleteTeacherMaterialTypeV2(code));
      } catch (err) {
        const msg = err instanceof Error ? err.message : "";
        if (msg === "TEACHER_MATERIAL_TYPE_NOT_FOUND") return fail("未找到该类型", 404);
        throw err;
      }
    }

    return new Response(null, { status: 404 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return fail(`参数校验失败：${err.errors[0]?.message ?? "未知字段"}`, 422);
    }
    const msg = err instanceof Error ? err.message : "";
    if (msg === "TEACHER_MATERIAL_TYPE_SCHEMA_MISSING") {
      return fail("当前库未安装教师素材类型表，请执行迁移 database/migrations/0019 或 0033", 503);
    }
    console.error("[v2-teacher-material-types]", err);
    return fail("服务内部错误", 500);
  }
}
