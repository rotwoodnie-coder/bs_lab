import type { RowDataPacket } from "mysql2/promise";
import type { MysqlQueryLike } from "../ids/identifiable-varchar32.ts";
import { allocateUniqueMysqlVarchar32Id } from "../ids/identifiable-varchar32.ts";
import { coerceAuditorIdForMysql32 } from "./v2-sys-user-repository.ts";

export interface SysLogRecord {
  logId: string;
  userId: string | null;
  userName: string | null;
  logType: string | null;
  logTime: string | null;
  logDataType: string | null;
  logDataId: string | null;
  logDataContent: string | null;
}

export interface SysLogListPage {
  items: SysLogRecord[];
  total: number;
  page: number;
  pageSize: number;
}

export interface SysLogListQuery {
  page?: number;
  pageSize?: number;
  keyword?: string;
  logType?: string;
  from?: string;
  to?: string;
}

export async function listSysLog(
  pool: MysqlQueryLike,
  query: SysLogListQuery,
): Promise<SysLogListPage> {
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));
  const offset = (page - 1) * pageSize;
  const where: string[] = [];
  const params: unknown[] = [];

  if (query.keyword?.trim()) {
    const like = `%${query.keyword.trim()}%`;
    where.push("(l.log_id LIKE ? OR u.user_name LIKE ? OR l.log_type LIKE ? OR l.log_data_type LIKE ? OR l.log_data_id LIKE ? OR l.log_data_content LIKE ?)");
    params.push(like, like, like, like, like, like);
  }
  if (query.logType) {
    where.push("l.log_type = ?");
    params.push(query.logType);
  }
  if (query.from) {
    where.push("l.log_time >= ?");
    params.push(query.from);
  }
  if (query.to) {
    where.push("l.log_time <= ?");
    params.push(query.to);
  }

  const whereSql = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";

  const [countRows] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM sys_log l LEFT JOIN sys_user u ON u.user_id = l.user_id ${whereSql}`,
    params,
  );
  const total = Number((countRows[0] as RowDataPacket).total ?? 0);

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT l.log_id, l.user_id, u.user_name,
            l.log_type, l.log_time, l.log_data_type, l.log_data_id, l.log_data_content
     FROM sys_log l
     LEFT JOIN sys_user u ON u.user_id = l.user_id
     ${whereSql}
     ORDER BY l.log_time DESC
     LIMIT ? OFFSET ?`,
    [...params, pageSize, offset],
  );

  const items: SysLogRecord[] = rows.map((r) => ({
    logId: String(r.log_id ?? ""),
    userId: r.user_id ? String(r.user_id) : null,
    userName: r.user_name ? String(r.user_name) : null,
    logType: r.log_type ? String(r.log_type) : null,
    logTime: r.log_time ? String(r.log_time) : null,
    logDataType: r.log_data_type ? String(r.log_data_type) : null,
    logDataId: r.log_data_id ? String(r.log_data_id) : null,
    logDataContent: r.log_data_content ? String(r.log_data_content) : null,
  }));

  return { items, total, page, pageSize };
}

export async function writeSysLog(
  pool: MysqlQueryLike,
  input: { userId: string | null; logType: string; logDataType?: string | null; logDataId?: string | null; logDataContent?: string | null },
): Promise<{ logId: string }> {
  const logId = await allocateUniqueMysqlVarchar32Id(pool, { table: "sys_log", column: "log_id", label: input.logType });
  const userId = coerceAuditorIdForMysql32(input.userId);
  await pool.query(
    `INSERT INTO sys_log (log_id, user_id, log_type, log_time, log_data_type, log_data_id, log_data_content)
     VALUES (?, ?, ?, NOW(), ?, ?, ?)`,
    [logId, userId, input.logType, input.logDataType ?? null, input.logDataId ?? null, input.logDataContent ?? null],
  );
  return { logId };
}

