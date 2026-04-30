import type { RowDataPacket } from "mysql2/promise";
import { getMysqlPool } from "../mysql/mysql-client.ts";
import { clearRolePagePermissions, setRolePagePermissions } from "../../lib/auth/role-permissions.ts";

export type SysMenuRecord = {
  menuId: number;
  parentId: number | null;
  menuName: string;
  menuCode: string;
  menuType: string;
  path: string | null;
  component: string | null;
  sortOrder: number | null;
  status: string | null;
  comments: string | null;
};

export type RoleMenuPermissionRecord = {
  seqId: string;
  roleId: string;
  menuId: number;
  menuCode: string;
  menuName: string;
  path: string | null;
  canRead: boolean;
  canWrite: boolean;
};

function rowToMenu(row: RowDataPacket): SysMenuRecord {
  return {
    menuId: Number(row.menu_id),
    parentId: row.parent_id != null ? Number(row.parent_id) : null,
    menuName: String(row.menu_name ?? ""),
    menuCode: String(row.menu_code ?? ""),
    menuType: String(row.menu_type ?? "page"),
    path: row.path != null ? String(row.path) : null,
    component: row.component != null ? String(row.component) : null,
    sortOrder: row.sort_order != null ? Number(row.sort_order) : null,
    status: row.status != null ? String(row.status) : null,
    comments: row.comments != null ? String(row.comments) : null,
  };
}

export async function listSysMenus(): Promise<SysMenuRecord[]> {
  const pool = getMysqlPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT menu_id, parent_id, menu_name, menu_code, menu_type, path, component, sort_order, status, comments
     FROM sys_menu
     WHERE COALESCE(status, 'y') = 'y'
     ORDER BY sort_order ASC, menu_id ASC`,
  );
  return rows.map(rowToMenu);
}

export async function listRoleMenuPermissions(roleId: string): Promise<RoleMenuPermissionRecord[]> {
  const pool = getMysqlPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT p.seq_id AS seqId, p.role_id AS roleId, p.menu_id AS menuId,
            m.menu_code AS menuCode, m.menu_name AS menuName, m.path AS path,
            p.can_read AS canRead, p.can_write AS canWrite
     FROM sys_role_menu_perm p
     INNER JOIN sys_menu m ON m.menu_id = p.menu_id
     WHERE p.role_id = ? AND p.status = 'y'
     ORDER BY m.sort_order ASC, m.menu_id ASC`,
    [roleId],
  );
  return rows.map((row) => ({
    seqId: String(row.seqId),
    roleId: String(row.roleId),
    menuId: Number(row.menuId),
    menuCode: String(row.menuCode),
    menuName: String(row.menuName),
    path: row.path != null ? String(row.path) : null,
    canRead: Boolean(row.canRead),
    canWrite: Boolean(row.canWrite),
  }));
}

export async function upsertRoleMenuPermissions(roleId: string, items: Array<{ menuId: number; canRead: boolean; canWrite: boolean }>, actorId?: string): Promise<number> {
  const pool = getMysqlPool();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query(`DELETE FROM sys_role_menu_perm WHERE role_id = ?`, [roleId]);
    let inserted = 0;
    for (const item of items) {
      const seqId = `RM_${roleId}_${item.menuId}`.slice(0, 32);
      await conn.query(
        `INSERT INTO sys_role_menu_perm
          (seq_id, role_id, menu_id, can_read, can_write, status, create_user_id, create_time, update_user_id, update_time)
         VALUES (?, ?, ?, ?, ?, 'y', ?, NOW(), ?, NOW())`,
        [seqId, roleId, item.menuId, item.canRead ? 1 : 0, item.canWrite ? 1 : 0, actorId ?? null, actorId ?? null],
      );
      inserted += 1;
    }
    await conn.commit();
    return inserted;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

export async function refreshRolePermissionCache(roleId: string): Promise<void> {
  const items = await listRoleMenuPermissions(roleId);
  setRolePagePermissions(
    roleId,
    items.map((item) => ({ menuCode: item.menuCode, read: item.canRead, write: item.canWrite })),
  );
}

export async function clearRolePermissionCache(roleId: string): Promise<void> {
  clearRolePagePermissions(roleId);
}
