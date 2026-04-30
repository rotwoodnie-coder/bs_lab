/**
 * V2 用户与组织 MySQL 仓库
 * 对应表：sys_user / sys_org / sys_user_role
 */
import { createHash } from "node:crypto";
import bcrypt from "bcryptjs";
import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import { resolveVarchar32PrimaryKey } from "../ids/identifiable-varchar32.ts";
import { getMysqlPool } from "../mysql/mysql-client.ts";
import type {
  SysUserRecord,
  SysUserSafeRecord,
  SysUserListQuery,
  SysUserListPage,
  CreateSysUserInput,
  UpdateSysUserInput,
  SysOrgRecord,
  SysOrgListQuery,
  CreateSysOrgInput,
} from "../../domain/v2-sys/v2-sys-types.ts";
import {
  fetchSchoolGradeIdsByOrgIds,
  fetchSchoolGradeIdsForOrg,
  replaceOrgSchoolGrades,
} from "./v2-sys-org-school-grade-repository.ts";

// ─── 工具函数 ────────────────────────────────────────────
function hashPassword(plain: string): string {
  return bcrypt.hashSync(plain, 10);
}

/**
 * 审计列 `create_user_id` / `update_user_id` 等为 VARCHAR(32)；
 * 前端身份 `x-user-id` 常为 36 字符 UUID，直接写入会触发 MySQL 错误并表现为 500。
 */
export function coerceAuditorIdForMysql32(id: string | null | undefined): string | null {
  if (id == null) return null;
  const s = String(id).trim();
  if (s.length === 0) return null;
  if (s.length <= 32) return s;
  const compact = s.replace(/-/g, "");
  if (compact.length <= 32) return compact;
  return createHash("sha256").update(s).digest("hex").slice(0, 32);
}

/**
 * 前端可能传 "YYYY-MM-DD HH:MM"（缺 ":ss"），而 MySQL DATETIME 要求完整格式；
 * 空字符串视为不设有效期（存 NULL）。
 * 长期有效锚点：2099-12-31 23:59:59，超过该值自动收敛。
 */
const ETERNAL_ANCHOR = "2099-12-31 23:59:59";

function normalizeExpireDate(v: string | null | undefined): string | null {
  if (v == null) return null;
  let raw = String(v).trim();
  if (!raw) return null;
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(raw)) raw = `${raw}:00`;
  else if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) raw = `${raw} 00:00:00`;
  // 边界收敛：超过长期锚点则截断
  if (raw > ETERNAL_ANCHOR) return ETERNAL_ANCHOR;
  // 锁定长期锚点：前端 "2099-12-31 23:59:00" 或 "2099-12-31" 都归一到精确锚点，
  // 避免未来精准匹配 = ETERNAL_ANCHOR 时漏掉数据
  if (raw === "2099-12-31 23:59:00" || raw === "2099-12-31 00:00:00") return ETERNAL_ANCHOR;
  return raw;
}

function rowToSysUser(row: RowDataPacket): SysUserSafeRecord {
  return {
    userId: String(row.user_id),
    userName: String(row.user_name ?? ""),
    userOrgId: row.user_org_id ? String(row.user_org_id) : null,
    userRoleId: row.user_role_id ? String(row.user_role_id) : null,
    userLogo: row.user_logo ? String(row.user_logo) : null,
    userNickName: row.user_nick_name ? String(row.user_nick_name) : null,
    loginName: String(row.login_name ?? ""),
    userPhone: row.user_phone ? String(row.user_phone) : null,
    userEmail: row.user_email ? String(row.user_email) : null,
    expireDate: row.expire_date ? String(row.expire_date) : null,
    comments: row.comments ? String(row.comments) : null,
    status: (row.status as SysUserRecord["status"]) ?? null,
    lastLoginTime: row.last_login_time ? String(row.last_login_time) : null,
    prefTitleId: row.pref_title_id ? String(row.pref_title_id) : null,
    perResume: row.per_resume ? String(row.per_resume) : null,
    perScore: Number(row.per_score ?? 0),
    createUserId: row.create_user_id ? String(row.create_user_id) : null,
    createTime: row.create_time ? String(row.create_time) : null,
    updateUserId: row.update_user_id ? String(row.update_user_id) : null,
    updateTime: row.update_time ? String(row.update_time) : null,
    isDeleted: Number(row.is_deleted ?? 0) as 0 | 1,
    orgName: row.org_name ? String(row.org_name) : undefined,
    roleName: row.role_name ? String(row.role_name) : undefined,
    prefTitleName: row.pref_title_name ? String(row.pref_title_name) : undefined,
  };
}

function rowToSysOrg(row: RowDataPacket, schoolGradeIds: string[] = []): SysOrgRecord {
  return {
    orgId: String(row.org_id),
    orgName: String(row.org_name ?? ""),
    orgTypeId: row.org_type_id ? String(row.org_type_id) : null,
    gradeId: row.grade_id ? String(row.grade_id) : null,
    schoolGradeIds,
    parentOrgId: row.parent_org_id ? String(row.parent_org_id) : null,
    orgPath: row.org_path ? String(row.org_path) : null,
    status: (row.status as SysOrgRecord["status"]) ?? null,
    sortOrder: row.sort_order != null ? Number(row.sort_order) : null,
    createUserId: row.create_user_id ? String(row.create_user_id) : null,
    createTime: row.create_time ? String(row.create_time) : null,
    updateUserId: row.update_user_id ? String(row.update_user_id) : null,
    updateTime: row.update_time ? String(row.update_time) : null,
    isDeleted: Number(row.is_deleted ?? 0) as 0 | 1,
  };
}

// ─── sys_user CRUD ───────────────────────────────────────
export async function listSysUsers(query: SysUserListQuery): Promise<SysUserListPage> {
  const pool = getMysqlPool();
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));
  const offset = (page - 1) * pageSize;
  const where: string[] = ["u.is_deleted = 0"];
  const params: unknown[] = [];

  if (query.keyword?.trim()) {
    const like = `%${query.keyword.trim()}%`;
    where.push("(u.user_name LIKE ? OR u.login_name LIKE ? OR u.user_phone LIKE ?)");
    params.push(like, like, like);
  }
  if (query.userOrgId) { where.push("u.user_org_id = ?"); params.push(query.userOrgId); }
  if (query.userRoleId) { where.push("u.user_role_id = ?"); params.push(query.userRoleId); }
  if (query.status) { where.push("u.status = ?"); params.push(query.status); }

  const whereSql = where.join(" AND ");
  const [countRows] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM sys_user u WHERE ${whereSql}`,
    params,
  );
  const total = Number((countRows[0] as RowDataPacket).total ?? 0);

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT u.*, o.org_name, r.role_name, t.title_name AS pref_title_name
     FROM sys_user u
     LEFT JOIN sys_org o ON o.org_id = u.user_org_id AND o.is_deleted = 0
     LEFT JOIN data_role r ON r.role_id = u.user_role_id
     LEFT JOIN data_pref_title t ON t.title_id = u.pref_title_id
     WHERE ${whereSql}
     ORDER BY u.create_time DESC
     LIMIT ? OFFSET ?`,
    [...params, pageSize, offset],
  );

  return { items: rows.map(rowToSysUser), total, page, pageSize };
}

/**
 * 按 keyword 模糊搜索用户（不要求管理权限，供选人场景使用）。
 * 仅返回未删除用户，默认最多 20 条。
 */
export async function searchSysUsersByKeyword(keyword: string, limit: number = 20): Promise<SysUserListPage> {
  const pool = getMysqlPool();
  const like = `%${keyword}%`;
  const pageSize = Math.min(50, Math.max(1, limit));
  const [countRows] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM sys_user u WHERE u.is_deleted = 0 AND (u.user_name LIKE ? OR u.login_name LIKE ? OR u.user_phone LIKE ?)`,
    [like, like, like],
  );
  const total = Number((countRows[0] as RowDataPacket).total ?? 0);
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT u.*, o.org_name, r.role_name, t.title_name AS pref_title_name
     FROM sys_user u
     LEFT JOIN sys_org o ON o.org_id = u.user_org_id AND o.is_deleted = 0
     LEFT JOIN data_role r ON r.role_id = u.user_role_id
     LEFT JOIN data_pref_title t ON t.title_id = u.pref_title_id
     WHERE u.is_deleted = 0 AND (u.user_name LIKE ? OR u.login_name LIKE ? OR u.user_phone LIKE ?)
     ORDER BY u.create_time DESC
     LIMIT ?`,
    [like, like, like, pageSize],
  );
  return { items: rows.map(rowToSysUser), total, page: 1, pageSize };
}

/**
 * 按 keyword 模糊搜索教师（不要求管理权限，供成员添加等选人场景使用）。
 * 不传 keyword 时返回全部教师（默认最多 200 条）。
 */
export async function searchSysTeachersByKeyword(keyword: string, limit: number = 200): Promise<SysUserListPage> {
  const pool = getMysqlPool();
  const pageSize = Math.min(200, Math.max(1, limit));
  const where: string[] = ["u.is_deleted = 0", "r.role_id = 'Role_Teacher'"];
  const params: unknown[] = [];
  if (keyword.trim()) {
    const like = `%${keyword.trim()}%`;
    where.push("(u.user_name LIKE ? OR u.login_name LIKE ? OR u.user_phone LIKE ?)");
    params.push(like, like, like);
  }
  const [countRows] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM sys_user u
     LEFT JOIN data_role r ON r.role_id = u.user_role_id
     WHERE ${where.join(" AND ")}`,
    params,
  );
  const total = Number((countRows[0] as RowDataPacket).total ?? 0);
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT u.*, o.org_name, r.role_name, t.title_name AS pref_title_name
     FROM sys_user u
     LEFT JOIN sys_org o ON o.org_id = u.user_org_id AND o.is_deleted = 0
     LEFT JOIN data_role r ON r.role_id = u.user_role_id
     LEFT JOIN data_pref_title t ON t.title_id = u.pref_title_id
     WHERE ${where.join(" AND ")}
     ORDER BY u.create_time DESC
     LIMIT ?`,
    [...params, pageSize],
  );
  return { items: rows.map(rowToSysUser), total, page: 1, pageSize };
}

export async function getSysUserById(userId: string): Promise<SysUserSafeRecord | null> {
  const pool = getMysqlPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT u.*, o.org_name, r.role_name, t.title_name AS pref_title_name
     FROM sys_user u
     LEFT JOIN sys_org o ON o.org_id = u.user_org_id AND o.is_deleted = 0
     LEFT JOIN data_role r ON r.role_id = u.user_role_id
     LEFT JOIN data_pref_title t ON t.title_id = u.pref_title_id
     WHERE u.user_id = ? AND u.is_deleted = 0 LIMIT 1`,
    [userId],
  );
  if (rows.length === 0) return null;
  return rowToSysUser(rows[0]!);
}

export async function createSysUser(
  input: CreateSysUserInput,
  actorId?: string,
): Promise<SysUserSafeRecord> {
  const pool = getMysqlPool();
  const userId = await resolveVarchar32PrimaryKey(pool, {
    table: "sys_user",
    column: "user_id",
    label: `${input.userName} ${input.loginName}`.trim(),
    explicit: input.userId,
  });
  const pwd = hashPassword(input.loginPwd);
  await pool.query<ResultSetHeader>(
    `INSERT INTO sys_user
      (user_id, user_name, login_name, login_pwd,
       user_org_id, user_role_id, user_nick_name, user_phone, user_email,
       expire_date, pref_title_id, status, comments,
       create_user_id, create_time, update_user_id, update_time)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, NOW())`,
    [
      userId, input.userName, input.loginName, pwd,
      input.userOrgId ?? null, input.userRoleId ?? null,
      input.userNickName ?? null, input.userPhone ?? null, input.userEmail ?? null,
      normalizeExpireDate(input.expireDate), input.prefTitleId ?? null,
      input.status ?? "y", input.comments ?? null,
      coerceAuditorIdForMysql32(actorId), coerceAuditorIdForMysql32(actorId),
    ],
  );
  const row = await getSysUserById(userId);
  if (!row) throw new Error("SYS_USER_CREATE_FAILED");
  return row;
}

export async function updateSysUser(
  userId: string,
  input: UpdateSysUserInput,
  actorId?: string,
): Promise<SysUserSafeRecord> {
  const pool = getMysqlPool();
  const [curRows] = await pool.query<RowDataPacket[]>(
    `SELECT user_role_id AS userRoleId, user_org_id AS userOrgId FROM sys_user WHERE user_id = ? AND is_deleted = 0 LIMIT 1`,
    [userId],
  );
  if (curRows.length === 0) throw new Error("SYS_USER_NOT_FOUND");
  const currentRoleId = curRows[0]?.userRoleId ? String((curRows[0] as RowDataPacket).userRoleId) : null;
  const nextRoleId = input.userRoleId !== undefined ? (input.userRoleId ? String(input.userRoleId) : null) : currentRoleId;

  const isStudentRole = (() => {
    const r = String(nextRoleId ?? "").trim().toLowerCase();
    if (!r) return false;
    if (r === "student") return true;
    // 兼容：role_id 非 code 时按名称推断
    return false;
  })();

  if (input.userOrgId !== undefined) {
    const orgId = String(input.userOrgId ?? "").trim();
    if (!orgId) throw new Error("SYS_USER_ORG_REQUIRED");
    const [orgRows] = await pool.query<RowDataPacket[]>(
      `SELECT org_id FROM sys_org WHERE org_id = ? AND is_deleted = 0 LIMIT 1`,
      [orgId],
    );
    if (orgRows.length === 0) throw new Error("SYS_ORG_NOT_FOUND");
    if (isStudentRole) {
      const [childRows] = await pool.query<RowDataPacket[]>(
        `SELECT org_id FROM sys_org WHERE parent_org_id = ? AND is_deleted = 0 LIMIT 1`,
        [orgId],
      );
      if (childRows.length > 0) throw new Error("SYS_USER_STUDENT_ORG_MUST_BE_LEAF");
    }
  }

  const sets: string[] = ["update_user_id = ?", "update_time = NOW()"];
  const params: unknown[] = [coerceAuditorIdForMysql32(actorId)];

  if (input.userName !== undefined) { sets.push("user_name = ?"); params.push(input.userName); }
  if (input.loginName !== undefined) { sets.push("login_name = ?"); params.push(input.loginName); }
  if (input.loginPwd !== undefined) { sets.push("login_pwd = ?"); params.push(hashPassword(input.loginPwd)); }
  if (input.userOrgId !== undefined) { sets.push("user_org_id = ?"); params.push(input.userOrgId); }
  if (input.userRoleId !== undefined) { sets.push("user_role_id = ?"); params.push(input.userRoleId); }
  if (input.userNickName !== undefined) { sets.push("user_nick_name = ?"); params.push(input.userNickName); }
  if (input.userPhone !== undefined) { sets.push("user_phone = ?"); params.push(input.userPhone); }
  if (input.userEmail !== undefined) { sets.push("user_email = ?"); params.push(input.userEmail); }
  if (input.expireDate !== undefined) {
    sets.push("expire_date = ?");
    params.push(normalizeExpireDate(input.expireDate));
  }
  if (input.prefTitleId !== undefined) { sets.push("pref_title_id = ?"); params.push(input.prefTitleId); }
  if (input.comments !== undefined) { sets.push("comments = ?"); params.push(input.comments); }
  if (input.status !== undefined) { sets.push("status = ?"); params.push(input.status); }

  const [res] = await pool.query<ResultSetHeader>(
    `UPDATE sys_user SET ${sets.join(", ")} WHERE user_id = ? AND is_deleted = 0`,
    [...params, userId],
  );
  if (res.affectedRows === 0) throw new Error("SYS_USER_NOT_FOUND");
  const row = await getSysUserById(userId);
  if (!row) throw new Error("SYS_USER_NOT_FOUND");
  return row;
}

export async function deleteSysUser(userId: string, actorId?: string): Promise<void> {
  const pool = getMysqlPool();
  await pool.query(
    `UPDATE sys_user SET is_deleted = 1, update_user_id = ?, update_time = NOW()
     WHERE user_id = ? AND is_deleted = 0`,
    [coerceAuditorIdForMysql32(actorId), userId],
  );
}

// ─── sys_org CRUD ────────────────────────────────────────
export async function listSysOrgs(query: SysOrgListQuery): Promise<SysOrgRecord[]> {
  const pool = getMysqlPool();
  const where: string[] = ["is_deleted = 0"];
  const params: unknown[] = [];

  if (query.keyword?.trim()) {
    where.push("org_name LIKE ?"); params.push(`%${query.keyword.trim()}%`);
  }
  if (query.orgTypeId) { where.push("org_type_id = ?"); params.push(query.orgTypeId); }
  if (query.parentOrgId !== undefined) {
    where.push(query.parentOrgId ? "parent_org_id = ?" : "parent_org_id IS NULL");
    if (query.parentOrgId) params.push(query.parentOrgId);
  }
  if (query.status) { where.push("status = ?"); params.push(query.status); }

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM sys_org WHERE ${where.join(" AND ")} ORDER BY sort_order ASC, create_time ASC`,
    params,
  );
  const ids = rows.map((r) => String(r.org_id));
  const gradeMap = await fetchSchoolGradeIdsByOrgIds(ids);
  return rows.map((r) => rowToSysOrg(r, gradeMap.get(String(r.org_id)) ?? []));
}

export async function getSysOrgById(orgId: string): Promise<SysOrgRecord | null> {
  const pool = getMysqlPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM sys_org WHERE org_id = ? AND is_deleted = 0 LIMIT 1`,
    [orgId],
  );
  if (rows.length === 0) return null;
  const oid = String(rows[0]!.org_id);
  const sg = await fetchSchoolGradeIdsForOrg(oid);
  return rowToSysOrg(rows[0]!, sg);
}

export async function createSysOrg(
  input: CreateSysOrgInput,
  actorId?: string,
): Promise<SysOrgRecord> {
  const pool = getMysqlPool();
  const orgId = await resolveVarchar32PrimaryKey(pool, {
    table: "sys_org",
    column: "org_id",
    label: input.orgName,
    explicit: input.orgId,
  });
  let orgPath = `/${orgId}`;
  if (input.parentOrgId) {
    const parent = await getSysOrgById(input.parentOrgId);
    if (!parent) throw new Error("SYS_ORG_PARENT_NOT_FOUND");
    const base =
      parent.orgPath != null && String(parent.orgPath).trim() !== ""
        ? String(parent.orgPath).replace(/\/+$/, "")
        : `/${parent.orgId}`;
    orgPath = `${base}/${orgId}`;
  }
  const auditUserId = coerceAuditorIdForMysql32(actorId);
  const sg = input.schoolGradeIds?.filter((g) => g.length > 0) ?? [];
  const gradeIdForRow = sg.length > 0 ? null : input.gradeId ?? null;
  await pool.query<ResultSetHeader>(
    `INSERT INTO sys_org
      (org_id, org_name, org_type_id, grade_id, parent_org_id, org_path,
       status, sort_order, create_user_id, create_time, update_user_id, update_time)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, NOW())`,
    [
      orgId, input.orgName, input.orgTypeId ?? null, gradeIdForRow,
      input.parentOrgId ?? null, input.orgPath ?? orgPath,
      input.status ?? "y", input.sortOrder ?? 0,
      auditUserId, auditUserId,
    ],
  );
  if (sg.length > 0) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await replaceOrgSchoolGrades(conn, orgId, sg);
      await conn.commit();
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  }
  const row = await getSysOrgById(orgId);
  if (!row) throw new Error("SYS_ORG_CREATE_FAILED");
  return row;
}
