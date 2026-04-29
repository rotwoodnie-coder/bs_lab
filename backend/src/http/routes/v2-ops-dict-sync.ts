/**
 * 运维中心：业务字典同步 API
 * 前缀：/v2/ops/dict-sync
 *
 * GET  — 读取字典快照配置列表与各表记录数
 * POST — 触发同步，将当前字典表数据记录快照写入 sys_log，返回 sync_id 与记录数
 */
import type { RowDataPacket } from "mysql2/promise";
import { getMysqlPool } from "../../infrastructure/mysql/mysql-client.ts";
import { allocateUniqueMysqlVarchar32Id } from "../../infrastructure/ids/identifiable-varchar32.ts";

function ok(data: unknown): Response {
  return Response.json({ success: true, data, error: null });
}
function fail(msg: string, status = 400): Response {
  return Response.json({ success: false, data: null, error: { message: msg } }, { status });
}

const ALLOWED_ROLES = new Set(["role_sys_admin", "Role_Sys_Admin"]);

/** 需要进行快照的业务字典表清单 */
const DICT_TABLES = [
  { table: "data_material_type", label: "材料分类" },
  { table: "data_material_security", label: "材料安全性" },
  { table: "data_material_prop", label: "材料属性" },
  { table: "data_material_unit", label: "材料单位" },
  { table: "data_file_type", label: "文件类型" },
  { table: "data_org_type", label: "组织类型" },
  { table: "data_role", label: "角色" },
  { table: "data_school_level", label: "学段" },
  { table: "data_school_grade", label: "年级" },
  { table: "data_school_subject", label: "学科" },
  { table: "data_difficulty_type", label: "难度类型" },
  { table: "data_exp_difficulty", label: "实验难度" },
  { table: "data_question_type", label: "题目类型" },
  { table: "data_question_capacity", label: "题量" },
  { table: "data_rating_scale", label: "评分量表" },
  { table: "data_pref_title", label: "称号" },
  { table: "data_msg_type", label: "消息类型" },
] as const;

interface DictTableSnapshot {
  table: string;
  label: string;
  recordCount: number;
}

export async function routeV2OpsDictSync(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const path = url.pathname;
    if (!path.startsWith("/v2/ops/dict-sync")) return new Response(null, { status: 404 });

    const role = (req.headers.get("x-role") ?? "").trim().toLowerCase();
    if (!ALLOWED_ROLES.has(role)) {
      return fail("仅超级管理员可操作字典同步", 403);
    }

    if (req.method === "GET") {
      return handleGetSnapshot();
    }

    if (req.method === "POST") {
      const userId = req.headers.get("x-user-id") ?? "unknown";
      return handleSync(userId);
    }

    return new Response(null, { status: 404 });
  } catch (err) {
    console.error("[v2-ops-dict-sync]", err);
    return fail("服务内部错误", 500);
  }
}

async function handleGetSnapshot(): Promise<Response> {
  const pool = getMysqlPool();
  const results: DictTableSnapshot[] = [];

  for (const dict of DICT_TABLES) {
    try {
      const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT COUNT(*) AS cnt FROM \`${dict.table}\``,
      );
      results.push({
        table: dict.table,
        label: dict.label,
        recordCount: Number(rows[0]?.cnt ?? 0),
      });
    } catch {
      results.push({ table: dict.table, label: dict.label, recordCount: -1 });
    }
  }

  return ok({ tables: results, totalTables: results.length });
}

async function handleSync(userId: string): Promise<Response> {
  const pool = getMysqlPool();
  let totalRecords = 0;

  for (const dict of DICT_TABLES) {
    try {
      const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT COUNT(*) AS cnt FROM \`${dict.table}\``,
      );
      const count = Number(rows[0]?.cnt ?? 0);
      totalRecords += count;
    } catch {
      // 表可能不存在，跳过
    }
  }

  const syncId = await allocateUniqueMysqlVarchar32Id(pool, {
    table: "sys_log",
    column: "log_id",
    label: "dict-sync",
  });

  await pool.query(
    `INSERT INTO sys_log (log_id, user_id, log_type, log_time, log_data_type, log_data_id)
     VALUES (?, ?, 'dict_sync', NOW(), 'ops_dict_sync', ?)`,
    [syncId, userId, `total_records_${totalRecords}`],
  );

  return ok({
    syncId,
    totalRecords,
    syncedTables: DICT_TABLES.length,
    timestamp: new Date().toISOString(),
  });
}
