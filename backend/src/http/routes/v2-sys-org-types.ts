/**
 * 组织类型 data_org_type 管理 API
 * 前缀：/v2/sys-org-types
 * 写操作：仅 x-role 为 super_admin / district_admin
 */
import { z } from "zod";
import {
  createOrgType,
  deleteOrgType,
  listOrgTypes,
  updateOrgType,
} from "../../infrastructure/repositories/v2-sys-org-type-repository.ts";

function ok(data: unknown): Response {
  return Response.json({ success: true, data, error: null });
}
function fail(msg: string, status = 400): Response {
  return Response.json({ success: false, data: null, error: { message: msg } }, { status });
}

function canMutateOrgTypes(req: Request): boolean {
  const role = (req.headers.get("x-role") ?? "").trim().toLowerCase();
  return role === "super_admin" || role === "district_admin";
}

const id32Token = z.string().min(1).max(32).regex(/^[a-zA-Z0-9_]+$/);

const createSchema = z.object({
  typeId: id32Token.optional(),
  typeName: z.string().min(1).max(60),
  comments: z.string().max(100).nullable().optional(),
  status: z.enum(["y", "n"]).optional(),
  sortOrder: z.number().int().optional(),
});

const patchSchema = z.object({
  typeName: z.string().min(1).max(60).optional(),
  comments: z.string().max(100).nullable().optional(),
  status: z.enum(["y", "n"]).optional(),
  sortOrder: z.number().int().optional(),
});

function isDupKey(err: unknown): boolean {
  return typeof err === "object" && err !== null && "code" in err && (err as { code: string }).code === "ER_DUP_ENTRY";
}

export async function routeV2SysOrgTypes(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const path = url.pathname;
    if (!path.startsWith("/v2/sys-org-types")) return new Response(null, { status: 404 });

    if (req.method === "GET" && path === "/v2/sys-org-types") {
      const includeInactive = url.searchParams.get("includeInactive") === "1";
      return ok(await listOrgTypes(includeInactive));
    }

    if (req.method === "POST" && path === "/v2/sys-org-types") {
      if (!canMutateOrgTypes(req)) return fail("无权限维护组织类型", 403);
      const input = createSchema.parse(await req.json());
      try {
        return ok(await createOrgType(input));
      } catch (err) {
        if (isDupKey(err)) return fail("主键冲突，请重试", 409);
        const msg = err instanceof Error ? err.message : "";
        if (msg === "PRIMARY_KEY_INVALID") return fail("主键格式无效（仅 1–32 位字母、数字、下划线）", 400);
        if (msg === "ID_ALREADY_USED") return fail("主键已存在", 409);
        throw err;
      }
    }

    const match = path.match(/^\/v2\/sys-org-types\/([^/]+)$/);
    if (!match) return new Response(null, { status: 404 });
    const typeId = decodeURIComponent(match[1]!);

    if (req.method === "PATCH") {
      if (!canMutateOrgTypes(req)) return fail("无权限维护组织类型", 403);
      const input = patchSchema.parse(await req.json());
      try {
        return ok(await updateOrgType(typeId, input));
      } catch (err) {
        const msg = err instanceof Error ? err.message : "";
        if (msg === "ORG_TYPE_NOT_FOUND") return fail("组织类型不存在", 404);
        throw err;
      }
    }

    if (req.method === "DELETE") {
      if (!canMutateOrgTypes(req)) return fail("无权限维护组织类型", 403);
      try {
        await deleteOrgType(typeId);
        return ok({ deleted: true });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "";
        if (msg === "ORG_TYPE_NOT_FOUND") return fail("组织类型不存在", 404);
        if (msg === "ORG_TYPE_IN_USE") {
          return fail("仍有组织节点引用该类型，无法删除；可改为停用（status=n）", 409);
        }
        throw err;
      }
    }

    return new Response(null, { status: 404 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return fail(`参数校验失败：${err.errors[0]?.message ?? "未知字段"}`, 422);
    }
    if (err instanceof Error) {
      if (err.message === "PRIMARY_KEY_INVALID") {
        return fail("主键格式无效（仅 1–32 位字母、数字、下划线）", 400);
      }
      if (err.message === "ID_ALREADY_USED") return fail("主键已存在", 409);
    }
    console.error("[v2-sys-org-types]", err);
    return fail("服务内部错误", 500);
  }
}
