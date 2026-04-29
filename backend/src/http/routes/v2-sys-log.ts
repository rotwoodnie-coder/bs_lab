/**
 * V2 系统日志路由
 * - GET  /v2/sys-log     审计日志列表（分页 + 筛选 + 关键词搜索）
 * - POST /v2/sys-log/client-error  前端客户端错误上报
 */
import { z } from "zod";
import { getMysqlPool } from "../../infrastructure/mysql/mysql-client.ts";
import { listSysLog, writeSysLog } from "../../infrastructure/repositories/v2-sys-log-repository.ts";

function ok(data: unknown): Response {
  return Response.json({ success: true, data, error: null });
}

function fail(msg: string, status = 400): Response {
  return Response.json({ success: false, data: null, error: { message: msg } }, { status });
}

const ALLOWED_ROLES = new Set(["role_sys_admin", "Role_Sys_Admin"]);

function checkRole(req: Request): boolean {
  const role = (req.headers.get("x-role") ?? "").trim().toLowerCase();
  // 小写统一比较
  return ALLOWED_ROLES.has(role) || ALLOWED_ROLES.has((req.headers.get("x-role") ?? "").trim());
}

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
  keyword: z.string().optional(),
  logType: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

const clientErrorSchema = z.object({
  digest: z.string().optional(),
  message: z.string().optional(),
  url: z.string().optional(),
});

export async function routeV2SysLog(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const path = url.pathname;
    const actorId = req.headers.get("x-user-id") ?? undefined;

    if (path === "/v2/sys-log" && req.method === "GET") {
      if (!checkRole(req)) {
        return fail("仅超级管理员可查看系统日志", 403);
      }
      const query = listQuerySchema.parse(Object.fromEntries(url.searchParams.entries()));
      const pool = getMysqlPool();
      const result = await listSysLog(pool, query);
      return ok(result);
    }

    if (path === "/v2/sys-log/client-error" && req.method === "POST") {
      const body = clientErrorSchema.parse(await req.json());
      const pool = getMysqlPool();
      const detail = `[${body.url?.slice(0, 120) ?? ""}] ${(body.message ?? "").slice(0, 200)}`;
      const logDataType = `client_error|${detail}`.slice(0, 60);
      const logDataId = `digest:${(body.digest ?? "unknown").slice(0, 24)}`.slice(0, 60);
      const logId = await writeSysLog(pool, {
        userId: actorId ?? null,
        logType: "CLIENT_ERROR",
        logDataType,
        logDataId,
      });
      return ok({ logged: true, logId: logId.logId });
    }

    return new Response(null, { status: 404 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return fail(`参数校验失败：${err.errors[0]?.message ?? "未知字段"}`, 400);
    }
    console.error("[v2-sys-log]", err);
    return fail("服务内部错误", 500);
  }
}
