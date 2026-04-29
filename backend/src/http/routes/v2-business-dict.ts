/**
 * 业务字典独立业务域 API
 */
import {
  BUSINESS_DICT_TABLES,
  businessDictDelete,
  businessDictInsert,
  businessDictListColumns,
  businessDictListRows,
  businessDictPickPrimaryKey,
  businessDictUpdate,
  type BusinessDictTable,
} from "../../infrastructure/repositories/v2-business-dict-repository.ts";
import { writeDictAuditLog } from "../../infrastructure/repositories/v2-dict-audit-log.ts";

function ok(data: unknown): Response {
  return Response.json({ success: true, data, error: null });
}
function fail(msg: string, status = 400): Response {
  return Response.json({ success: false, data: null, error: { message: msg } }, { status });
}

function canMutate(req: Request): boolean {
  const role = (req.headers.get("x-role") ?? "").trim().toLowerCase();
  const allowed = ["super_admin", "Role_Sys_Admin", "district_admin", "Role_District_Admin"].map((r) => r.toLowerCase());
  return allowed.includes(role);
}

function getUserId(req: Request): string {
  return (req.headers.get("x-user-id") ?? "").trim();
}

function isDupKey(err: unknown): boolean {
  return typeof err === "object" && err !== null && "code" in err && (err as { code: string }).code === "ER_DUP_ENTRY";
}

function parseTable(seg: string): BusinessDictTable | null {
  const t = decodeURIComponent(seg);
  return (BUSINESS_DICT_TABLES as readonly string[]).includes(t) ? (t as BusinessDictTable) : null;
}

export async function routeV2BusinessDict(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const path = url.pathname;
    if (!path.startsWith("/v2/business-dict/")) return new Response(null, { status: 404 });

    const rest = path.slice("/v2/business-dict/".length);
    const segments = rest.split("/").filter(Boolean);
    if (segments.length === 0) return new Response(null, { status: 404 });

    const table = parseTable(segments[0]!);
    if (!table) return fail("表不在白名单或名称非法", 404);

    if (segments.length === 1) {
      const includeInactive = url.searchParams.get("includeInactive") === "1";
      if (req.method === "GET") {
        const columns = await businessDictListColumns(table);
        const primaryKey = businessDictPickPrimaryKey(columns);
        const rows = await businessDictListRows(table, includeInactive, columns);
        return ok({ meta: { table, primaryKey, columns }, rows });
      }
      if (req.method === "POST") {
        if (!canMutate(req)) return fail("无权限维护业务字典", 403);
        const body = (await req.json()) as Record<string, unknown>;
        const columns = await businessDictListColumns(table);
        try {
          const row = await businessDictInsert(table, columns, body);
          const pk = businessDictPickPrimaryKey(columns);
          const pkValue = String(row[pk] ?? "");
          if (pkValue) {
            writeDictAuditLog({ userId: getUserId(req), action: "dict_create", table, pkValue }).catch((e) =>
              console.error("[dict-audit] write failed:", e),
            );
          }
          return ok(row);
        } catch (err) {
          if (isDupKey(err)) return fail("主键或唯一约束冲突", 409);
          throw err;
        }
      }
      return new Response(null, { status: 404 });
    }

    if (segments.length === 2) {
      const pkValue = decodeURIComponent(segments[1]!);
      const columns = await businessDictListColumns(table);
      if (req.method === "PATCH") {
        if (!canMutate(req)) return fail("无权限维护业务字典", 403);
        const body = (await req.json()) as Record<string, unknown>;
        try {
          const row = await businessDictUpdate(table, columns, pkValue, body);
          writeDictAuditLog({ userId: getUserId(req), action: "dict_update", table, pkValue }).catch((e) =>
            console.error("[dict-audit] write failed:", e),
          );
          return ok(row);
        } catch (err) {
          const msg = err instanceof Error ? err.message : "";
          if (msg === "ROW_NOT_FOUND") return fail("记录不存在", 404);
          if (msg === "EMPTY_PATCH") return fail("无可更新字段", 422);
          throw err;
        }
      }
      if (req.method === "DELETE") {
        if (!canMutate(req)) return fail("无权限维护业务字典", 403);
        try {
          const result = await businessDictDelete(table, columns, pkValue);
          writeDictAuditLog({ userId: getUserId(req), action: "dict_delete", table, pkValue }).catch((e) =>
            console.error("[dict-audit] write failed:", e),
          );
          return ok(result);
        } catch (err) {
          const msg = err instanceof Error ? err.message : "";
          if (msg === "ROW_NOT_FOUND") return fail("记录不存在", 404);
          throw err;
        }
      }
    }

    return new Response(null, { status: 404 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg === "COMPOSITE_PK_UNSUPPORTED") return fail("暂不支持复合主键表", 422);
    console.error("[v2-business-dict]", err);
    return fail("服务内部错误", 500);
  }
}
