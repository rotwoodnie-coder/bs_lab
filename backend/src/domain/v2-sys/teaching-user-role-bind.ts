/**
 * 通用的用户/组织/学科断言工具。
 * 不再包含与 `data_role` 映射相关的角色解析（授课改用 Teacher_Class 专用表）。
 */
import type { PoolConnection, RowDataPacket } from "mysql2/promise";

export async function assertUserExists(conn: PoolConnection, userId: string): Promise<void> {
  const [rows] = await conn.query<RowDataPacket[]>(
    `SELECT 1 FROM sys_user WHERE user_id = ? AND is_deleted = 0 LIMIT 1`,
    [userId],
  );
  if (rows.length === 0) throw new Error("用户不存在或已删除");
}

export async function assertSubjectInDictionary(conn: PoolConnection, subjectId: string): Promise<void> {
  const [rows] = await conn.query<RowDataPacket[]>(
    `SELECT subject_id FROM data_school_subject WHERE subject_id = ? LIMIT 1`,
    [subjectId],
  );
  if (rows.length === 0) throw new Error("学科不存在：请使用 data_school_subject 中的 subject_id");
}

export async function assertOrgIsActiveClass(conn: PoolConnection, orgId: string, classTypeId: string): Promise<void> {
  const [rows] = await conn.query<RowDataPacket[]>(
    `SELECT org_id FROM sys_org WHERE org_id = ? AND is_deleted = 0 AND org_type_id = ? LIMIT 1`,
    [orgId, classTypeId],
  );
  if (rows.length === 0) throw new Error("组织节点不是有效班级（sys_org.org_type_id 须为班级类型）");
}

/** mysql.Pool 和 PoolConnection 共有的 query 签名（INSERT IGNORE 等非 SELECT 场景） */
type Queryable = {
  query(sql: string, params?: unknown[]): Promise<unknown>;
};

/**
 * 确保 role_id 存在于 data_role 中（不存在则自动 INSERT IGNORE）。
 * 仅用于 v2-admin-user 用户角色同步，与授课关系无关。
 */
export async function ensureRoleInDataRole(
  conn: Queryable,
  roleId: string,
  roleName?: string | null,
): Promise<void> {
  await conn.query(
    `INSERT IGNORE INTO data_role (role_id, role_name, comments, status)
     VALUES (?, ?, '角色（自动同步）', 'y')`,
    [roleId, roleName ?? roleId],
  );
}
