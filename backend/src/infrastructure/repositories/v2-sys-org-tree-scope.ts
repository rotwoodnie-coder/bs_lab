/**
 * GET /v2/sys-org/tree：按登录身份裁剪可见组织行（sys_org）。
 * 超级管理员全量；其余角色在提供 x-org-id 时仅返回「该节点及其祖先 + 子树」内的行，供前端组树并选年级/班级。
 */
import type { Pool, RowDataPacket, ResultSetHeader } from "mysql2/promise";

const TREE_SELECT = `SELECT org_id AS orgId, org_name AS orgName, parent_org_id AS parentOrgId,
    org_type_id AS orgTypeId, grade_id AS gradeId, org_path AS orgPath,
    status, sort_order AS sortOrder,
    create_user_id AS createUserId, create_time AS createTime,
    update_user_id AS updateUserId, update_time AS updateTime,
    is_deleted AS isDeleted
  FROM sys_org WHERE is_deleted = 0`;

const SORT_ORDER = " ORDER BY sort_order ASC, create_time ASC";

function isSuperAdminRole(roleId: string | null | undefined): boolean {
  const r = (roleId ?? "").trim().toLowerCase();
  return r === "system_admin" || r === "role_sys_admin";
}

export function normalizeOrgPathPrefix(orgPath: string | null | undefined, orgId: string): string {
  const p = (orgPath ?? "").trim().replace(/\/+$/, "");
  if (p.length > 0) return p;
  return `/${orgId}`;
}

export function orgPathSegmentIds(prefix: string): string[] {
  const n = prefix.trim().replace(/\/+/g, "/").replace(/^\/|\/$/g, "");
  if (!n) return [];
  return n.split("/").filter(Boolean);
}

export async function querySysOrgTreeRowsForActor(
  pool: Pick<Pool, "query">,
  opts: { actorRoleId: string | undefined; actorOrgId: string | null | undefined },
): Promise<RowDataPacket[]> {
  if (isSuperAdminRole(opts.actorRoleId)) {
    const [rows] = await pool.query<RowDataPacket[]>(`${TREE_SELECT}${SORT_ORDER}`);
    return rows as RowDataPacket[];
  }

  const actorOrgId = String(opts.actorOrgId ?? "").trim();
  if (!actorOrgId) {
    const [rows] = await pool.query<RowDataPacket[]>(`${TREE_SELECT}${SORT_ORDER}`);
    return rows as RowDataPacket[];
  }

  const [actorRows] = await pool.query<RowDataPacket[]>(`${TREE_SELECT} AND org_id = ? LIMIT 1`, [actorOrgId]);
  const actor = actorRows[0] as RowDataPacket | undefined;
  if (!actor) return [];

  const oid = String(actor.orgId);
  const pathRaw = actor.orgPath != null ? String(actor.orgPath) : null;
  const prefix = normalizeOrgPathPrefix(pathRaw, oid);
  const segments = orgPathSegmentIds(prefix);
  const idSet = new Set<string>([oid, ...segments]);
  const ids = [...idSet];
  const ph = ids.map(() => "?").join(",");

  const [rows] = await pool.query<RowDataPacket[]>(
    `${TREE_SELECT} AND (
      org_id IN (${ph})
      OR (org_path IS NOT NULL AND TRIM(org_path) <> '' AND (org_path = ? OR org_path LIKE CONCAT(?, '/%')))
    )${SORT_ORDER}`,
    [...ids, prefix, prefix],
  );
  return rows as RowDataPacket[];
}

/**
 * 统计指定组织下（sys_user_role.org_id）的学生人数。
 * 返回 orgId → studentCount 的映射；未命中组织表示无学生。
 */
export async function fetchStudentCountsByOrgIds(
  pool: Pick<Pool, "query">,
  orgIds: string[],
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (orgIds.length === 0) return map;

  const ph = orgIds.map(() => "?").join(",");
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT ur.org_id AS orgId, COUNT(DISTINCT ur.user_id) AS cnt
       FROM sys_user_role ur
       INNER JOIN sys_user u ON u.user_id = ur.user_id AND u.is_deleted = 0
       WHERE ur.role_id = 'Role_Student'
         AND ur.org_id IN (${ph})
       GROUP BY ur.org_id`,
      orgIds,
    );
    for (const r of rows) {
      map.set(String(r.orgId), Number(r.cnt));
    }
  } catch {
    // 查询失败时静默降级：不影响组织树加载
  }
  return map;
}
