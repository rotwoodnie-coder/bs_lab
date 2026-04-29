/**
 * 字典变更审计日志：写入 sys_log 表。
 *
 * sys_log 结构：
 *   log_id        VARCHAR(32) PK
 *   user_id       VARCHAR(32) 操作人 id
 *   log_type      VARCHAR(32) 日志类型（dict_create/dict_update/dict_delete）
 *   log_time      DATETIME    记录时间
 *   log_data_type VARCHAR(60) 操作数据类型（表名）
 *   log_data_id   VARCHAR(32) 操作数据主键
 */
import type { ResultSetHeader } from "mysql2/promise";
import { allocateUniqueMysqlVarchar32Id } from "../ids/identifiable-varchar32.ts";
import { getMysqlPool } from "../mysql/mysql-client.ts";

export type DictAuditAction = "dict_create" | "dict_update" | "dict_delete";

export async function writeDictAuditLog(params: {
  userId: string;
  action: DictAuditAction;
  table: string;
  pkValue: string;
}): Promise<void> {
  const { userId, action, table, pkValue } = params;
  const pool = getMysqlPool();
  const logId = await allocateUniqueMysqlVarchar32Id(pool, {
    table: "sys_log",
    column: "log_id",
    label: `dict-${table}`,
  });
  const logDataContent = JSON.stringify({ table, pkValue });
  await pool.query<ResultSetHeader>(
    `INSERT INTO sys_log (log_id, user_id, log_type, log_time, log_data_type, log_data_id, log_data_content)
     VALUES (?, ?, ?, NOW(), ?, ?, ?)`,
    [logId, userId || "unknown", action, table, pkValue, logDataContent],
  );
}
