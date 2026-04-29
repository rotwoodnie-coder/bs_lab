/**
 * 运维中心：数据导出 API
 * 前缀：/v2/ops/data-export
 *
 * POST — 接收表名、格式、时间范围等参数，执行 SELECT 返回 JSON 结果集
 */
import type { RowDataPacket } from "mysql2/promise";
import { getMysqlPool } from "../../infrastructure/mysql/mysql-client.ts";

function ok(data: unknown): Response {
  return Response.json({ success: true, data, error: null });
}
function fail(msg: string, status = 400): Response {
  return Response.json({ success: false, data: null, error: { message: msg } }, { status });
}

const ALLOWED_ROLES = new Set(["role_sys_admin", "Role_Sys_Admin"]);

interface ExportRequest {
  tableName: string;
  format: "json" | "csv";
  timeRange?: {
    start?: string;
    end?: string;
  };
}

/** 允许导出的字典表白名单，防止 SQL 注入 */
const ALLOWED_TABLES = new Set([
  "data_material_type",
  "data_material_security",
  "data_material_prop",
  "data_material_unit",
  "data_file_type",
  "data_org_type",
  "data_role",
  "data_school_level",
  "data_school_grade",
  "data_school_subject",
  "data_difficulty_type",
  "data_exp_difficulty",
  "data_question_type",
  "data_question_capacity",
  "data_rating_scale",
  "data_pref_title",
  "data_msg_type",
  "sys_org",
  "sys_user",
  "sys_user_role",
]);

export async function routeV2OpsDataExport(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const path = url.pathname;
    if (!path.startsWith("/v2/ops/data-export")) return new Response(null, { status: 404 });

    const role = (req.headers.get("x-role") ?? "").trim().toLowerCase();
    if (!ALLOWED_ROLES.has(role)) {
      return fail("仅超级管理员可执行数据导出", 403);
    }

    if (req.method !== "POST") return new Response(null, { status: 404 });

    const body: ExportRequest = await req.json();
    const { tableName, format } = body;

    if (!tableName || !ALLOWED_TABLES.has(tableName)) {
      return fail(`不允许导出表 "${tableName}"`, 400);
    }

    if (format !== "json" && format !== "csv") {
      return fail('格式仅支持 "json" 或 "csv"', 400);
    }

    const pool = getMysqlPool();
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM \`${tableName}\``,
    );

    const recordCount = rows.length;

    return ok({
      table: tableName,
      format,
      recordCount,
      timestamp: new Date().toISOString(),
      rows,
    });
  } catch (err) {
    console.error("[v2-ops-data-export]", err);
    return fail("服务内部错误", 500);
  }
}
