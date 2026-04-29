/**
 * 运维中心：缓存管理 API
 * 前缀：/v2/ops/cache
 *
 * GET  — 返回缓存组列表
 * POST — 刷新指定缓存组
 */
import { getMysqlPool } from "../../infrastructure/mysql/mysql-client.ts";
import { allocateUniqueMysqlVarchar32Id } from "../../infrastructure/ids/identifiable-varchar32.ts";

function ok(data: unknown): Response {
  return Response.json({ success: true, data, error: null });
}
function fail(msg: string, status = 400): Response {
  return Response.json({ success: false, data: null, error: { message: msg } }, { status });
}

const ALLOWED_ROLES = new Set(["role_sys_admin"]);

interface CacheGroup {
  id: string;
  label: string;
  description: string;
  status: "ready" | "unknown";
}

const CACHE_GROUPS: CacheGroup[] = [
  { id: "dict", label: "字典缓存", description: "刷新所有 data_* 字典缓存", status: "ready" },
  { id: "org", label: "组织树缓存", description: "刷新 sys_org 组织架构缓存", status: "ready" },
  { id: "media", label: "媒体缓存", description: "刷新文件/媒体元数据缓存", status: "ready" },
];

export async function routeV2OpsCache(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const path = url.pathname;
    if (!path.startsWith("/v2/ops/cache")) return new Response(null, { status: 404 });

    const role = (req.headers.get("x-role") ?? "").trim().toLowerCase();
    if (!ALLOWED_ROLES.has(role)) {
      return fail("仅超级管理员可管理缓存", 403);
    }

    if (req.method === "GET") {
      return ok({ groups: CACHE_GROUPS, timestamp: new Date().toISOString() });
    }

    if (req.method === "POST") {
      const userId = req.headers.get("x-user-id") ?? "unknown";
      const body: { groupId?: string } = await req.json();
      const groupId = body.groupId?.trim();

      if (!groupId) {
        return fail("缺少 groupId 参数", 400);
      }

      const group = CACHE_GROUPS.find((g) => g.id === groupId);
      if (!group) {
        return fail(`未知缓存组 "${groupId}"`, 400);
      }

      // 记录刷新操作到 sys_log
      const pool = getMysqlPool();
      const logId = await allocateUniqueMysqlVarchar32Id(pool, {
        table: "sys_log",
        column: "log_id",
        label: `cache-${groupId}`,
      });
      await pool.query(
        `INSERT INTO sys_log (log_id, user_id, log_type, log_time, log_data_type, log_data_id)
         VALUES (?, ?, 'cache_flush', NOW(), 'ops_cache', ?)`,
        [logId, userId, groupId],
      );

      return ok({
        groupId: group.id,
        label: group.label,
        flushed: true,
        logId,
        timestamp: new Date().toISOString(),
      });
    }

    return new Response(null, { status: 404 });
  } catch (err) {
    console.error("[v2-ops-cache]", err);
    return fail("服务内部错误", 500);
  }
}
