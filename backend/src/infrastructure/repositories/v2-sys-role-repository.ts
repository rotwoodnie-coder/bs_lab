/**
 * V2 角色 MySQL 仓库
 * 对应表：data_role（角色列表字典表，只读）
 *
 * 角色列的增删改通过数据迁移管理（migration script），不在此仓库提供写入能力。
 */
import type { RowDataPacket } from "mysql2/promise";
import { getMysqlPool } from "../mysql/mysql-client.ts";
import type {
  CreateSysRoleInput,
  SysRoleListQuery,
  SysRoleRecord,
  UpdateSysRoleInput,
} from "../../domain/v2-sys/v2-sys-role-types.ts";

/**
 * data_role 只有 5 列（role_id / role_name / comments / status / sort_order），
 * 缺失 role_code / create_* / update_* / is_deleted ——此处用默认值补齐。
 */
function rowToRole(row: RowDataPacket): SysRoleRecord {
  return {
    roleId: String(row.role_id),
    roleName: String(row.role_name ?? ""),
    roleCode: String(row.role_code ?? row.role_id ?? ""),
    status: (row.status as SysRoleRecord["status"]) ?? null,
    comments: row.comments ? String(row.comments) : null,
    sortOrder: row.sort_order != null ? Number(row.sort_order) : null,
    createUserId: row.create_user_id ? String(row.create_user_id) : null,
    createTime: row.create_time ? String(row.create_time) : null,
    updateUserId: row.update_user_id ? String(row.update_user_id) : null,
    updateTime: row.update_time ? String(row.update_time) : null,
    isDeleted: Number(row.is_deleted ?? 0) as 0 | 1,
  };
}

export async function listSysRoles(query: SysRoleListQuery): Promise<SysRoleRecord[]> {
  const pool = getMysqlPool();
  const where: string[] = ["1 = 1"];
  const params: unknown[] = [];
  if (query.keyword?.trim()) {
    where.push("(role_name LIKE ? OR role_id LIKE ?)");
    const like = `%${query.keyword.trim()}%`;
    params.push(like, like);
  }
  if (query.status) { where.push("status = ?"); params.push(query.status); }
  // 宪法级保护：Subj_* 学科影子角色不参与权限矩阵展示
  where.push("role_id NOT LIKE 'Subj_%'");
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM data_role WHERE ${where.join(" AND ")} ORDER BY sort_order ASC`,
    params,
  );
  return rows.map(rowToRole);
}

export async function getSysRoleById(roleId: string): Promise<SysRoleRecord | null> {
  const pool = getMysqlPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM data_role WHERE role_id = ? LIMIT 1`,
    [roleId],
  );
  if (rows.length === 0) return null;
  return rowToRole(rows[0]!);
}

/** data_role 为基础字典表，页面不可直接写入 */
export async function createSysRole(_input: CreateSysRoleInput, _actorId?: string): Promise<SysRoleRecord> {
  throw new Error("data_role is read-only");
}

/** data_role 为基础字典表，页面不可直接写入 */
export async function updateSysRole(_roleId: string, _input: UpdateSysRoleInput, _actorId?: string): Promise<SysRoleRecord> {
  throw new Error("data_role is read-only");
}
