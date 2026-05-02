import type { Pool, RowDataPacket } from "mysql2/promise";

export type V2UserContext = {
  userId: string;
  userName: string;
  userNickName: string | null;
  userLogo: string | null;
  role: string | null;
  hasBinding: boolean;
  schoolLevelId: string | null;
  gradeId: string | null;
  orgId: string | null;
};

export async function loadV2UserContext(pool: Pool, userId: string): Promise<V2UserContext | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT
       u.user_id,
       u.user_name,
       u.user_nick_name,
       u.user_logo,
       u.user_role_id,
       u.user_org_id,
       v.grade_id,
       v.school_level_id,
       EXISTS(
         SELECT 1
         FROM v_active_parent_children b
         WHERE b.parent_user_id = u.user_id
       ) AS has_binding
     FROM sys_user u
     LEFT JOIN v_user_school_stage v ON v.user_id = u.user_id
     WHERE u.user_id = ?
       AND u.is_deleted = 0
     LIMIT 1`,
    [userId],
  );
  if (rows.length === 0) return null;
  const row = rows[0] as RowDataPacket;
  return {
    userId: String(row.user_id ?? ""),
    userName: String(row.user_name ?? ""),
    userNickName: row.user_nick_name != null ? String(row.user_nick_name) : null,
    userLogo: row.user_logo != null ? String(row.user_logo) : null,
    role: row.user_role_id != null ? String(row.user_role_id) : null,
    hasBinding: Number(row.has_binding ?? 0) > 0,
    schoolLevelId: row.school_level_id != null ? String(row.school_level_id) : null,
    gradeId: row.grade_id != null ? String(row.grade_id) : null,
    orgId: row.user_org_id != null ? String(row.user_org_id) : null,
  };
}
