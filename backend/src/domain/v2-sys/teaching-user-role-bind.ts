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
 * 确保 role_id 存在于 data_role 中。
 *
 * 宪法级保护：data_role 是只读字典表，不允许业务代码通过任何途径写入。
 * 所有 role_id 必须在初始化种子（Seed）或迁移脚本中预先存在。
 *
 * @throws Error 如果 role_id 在 data_role 中不存在，则抛出严重错误，
 *   提示运维补充种子数据，而不是让程序自作聪明地 INSERT IGNORE。
 */
export async function ensureRoleInDataRole(
  conn: Queryable,
  roleId: string,
): Promise<void> {
  const rid = String(roleId ?? "").trim();
  if (!rid) return;

  // 存在性断言：必须已在 data_role 中存在（种子/迁移保证）
  const [rows] = await (conn as any).query(
    `SELECT 1 FROM data_role WHERE role_id = ? LIMIT 1`,
    [rid],
  );
  const count = Array.isArray(rows) ? (rows as RowDataPacket[]).length : 0;
  if (count === 0) {
    console.error(
      `[data-role-guard] 严重：角色 "${rid}" 未在 data_role 中找到，` +
      `stack=${new Error().stack?.slice(0, 300) ?? ""}`,
    );
    throw new Error(
      `data_role 缺少条目（roleId=${rid}）。` +
      `请通过迁移脚本或种子数据预先写入 data_role，不要依赖业务代码自动插入。`,
    );
  }
}
