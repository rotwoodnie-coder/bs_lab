import { z } from "zod";
import type { RowDataPacket } from "mysql2/promise";
import { getMysqlPool } from "../../infrastructure/mysql/mysql-client.ts";
import { revokeRefreshTokensByUserId } from "../../lib/auth/v2-session.ts";
import { ensureRoleInDataRole } from "../../domain/v2-sys/teaching-user-role-bind.ts";

function ok(data: unknown): Response {
  return Response.json({ success: true, data, error: null });
}

function fail(msg: string, status = 400, code = "BAD_REQUEST"): Response {
  return Response.json({ success: false, data: null, error: { message: msg, code } }, { status });
}

function normalizeRoleId(v: unknown): string {
  return String(v ?? "").trim();
}

function isTeacherRole(roleId: string | null | undefined): boolean {
  const r = String(roleId ?? "").trim().toLowerCase();
  return r === "role_teacher" || r === "teacher";
}

function isStudentRole(roleId: string | null | undefined): boolean {
  const r = String(roleId ?? "").trim().toLowerCase();
  return r === "role_student" || r === "student";
}

export async function routeV2AdminUser(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    if (!url.pathname.startsWith("/v2/admin")) return new Response(null, { status: 404 });

    const actorUserId = String(req.headers.get("x-user-id") ?? "").trim();
    const actorRole = String(req.headers.get("x-role") ?? "").trim().toLowerCase();
    const isAdmin = ["role_sys_admin", "system_admin", "role_district_admin", "district_admin", "role_school_admin", "school_admin"].includes(actorRole);
    if (!actorUserId) return fail("未登录", 401, "UNAUTHORIZED");
    if (!isAdmin) return fail("权限不足", 403, "FORBIDDEN");

    const pool = getMysqlPool();

    if (req.method === "GET" && url.pathname === "/v2/admin/user/identity-search") {
      const keyword = String(url.searchParams.get("keyword") ?? "").trim();
      const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 20), 1), 50);
      if (!keyword) return ok({ items: [] });

      const like = `%${keyword}%`;
      const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT
            u.user_id AS userId,
            u.user_name AS userName,
            u.login_name AS loginName,
            u.user_org_id AS userOrgId,
            u.user_role_id AS userRoleId,
            u.status AS status,
            u.update_time AS updateTime,
            o.org_name AS orgName,
            r.role_name AS roleName,
            COALESCE(roles.attached_role_names, '') AS attachedRoleNames,
            COALESCE(roles.available_contexts, '[]') AS availableContextsJson
         FROM sys_user u
         LEFT JOIN sys_org o ON o.org_id = u.user_org_id AND o.is_deleted = 0
         LEFT JOIN data_role r ON r.role_id = u.user_role_id
         LEFT JOIN (
           SELECT
             ur.user_id,
             GROUP_CONCAT(DISTINCT dr.role_name ORDER BY dr.sort_order ASC SEPARATOR ',') AS attached_role_names,
             JSON_ARRAYAGG(
               JSON_OBJECT(
                 'roleId', ur.role_id,
                 'roleName', dr.role_name,
                 'orgId', ur.org_id,
                 'orgName', so.org_name
               )
             ) AS available_contexts
           FROM sys_user_role ur
           LEFT JOIN data_role dr ON dr.role_id = ur.role_id
           LEFT JOIN sys_org so ON so.org_id = ur.org_id AND so.is_deleted = 0
           GROUP BY ur.user_id
         ) roles ON roles.user_id = u.user_id
         WHERE u.is_deleted = 0
           AND (u.user_name LIKE ? OR u.login_name LIKE ?)
         ORDER BY CASE WHEN u.login_name = ? OR u.user_name = ? THEN 0 ELSE 1 END, u.update_time DESC, u.create_time DESC
         LIMIT ?`,
        [like, like, keyword, keyword, limit],
      );

      const items = rows.map((r) => {
        let availableContexts = [] as Array<{ roleId: string; roleName: string | null; orgId: string | null; orgName: string | null }>;
        try {
          const raw = String(r.availableContextsJson ?? '[]');
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) availableContexts = parsed;
        } catch {
          availableContexts = [];
        }
        return {
          userId: String(r.userId ?? r.user_id ?? ""),
          userName: String(r.userName ?? r.user_name ?? ""),
          loginName: String(r.loginName ?? r.login_name ?? ""),
          userOrgId: r.userOrgId ?? r.user_org_id ?? null,
          userRoleId: r.userRoleId ?? r.user_role_id ?? null,
          orgName: r.orgName ?? r.org_name ?? null,
          roleName: r.roleName ?? r.role_name ?? null,
          attachedRoleNames: String(r.attachedRoleNames ?? "") || null,
          availableContexts,
          status: String(r.status ?? ""),
          updateTime: r.updateTime ?? null,
        };
      });
      return ok({ items });
    }

    const fixMatch = url.pathname.match(/^\/v2\/admin\/user\/([^/]+)\/fix-identity$/);
    if (req.method === "POST" && fixMatch) {
      const userId = decodeURIComponent(fixMatch[1]!);
      const [userRows] = await pool.query<RowDataPacket[]>(
        `SELECT user_id AS userId, user_role_id AS userRoleId, user_org_id AS userOrgId
         FROM sys_user WHERE user_id = ? AND is_deleted = 0 LIMIT 1`,
        [userId],
      );
      if (userRows.length === 0) return fail("用户不存在", 404, "NOT_FOUND");
      const user = userRows[0] as RowDataPacket;
      const masterRole = String(user.userRoleId ?? "").trim().toLowerCase();
      const masterOrg = String(user.userOrgId ?? "").trim();

      // 清理所有非正式角色的绑定：学生角色 + 学科派生角色
      await pool.query(
        `DELETE FROM sys_user_role
         WHERE user_id = ?
           AND (role_id IN ('Role_Student', 'student', 'SUB_SCIENCE', 'SUB_STEAM')
                OR role_id LIKE 'SUB_%')`,
        [userId],
      );

      // 如果主角色是学生或学科派生，自动提升为教师（从剩余绑定找第一个教师，找不到则取任意剩余角色）
      const isStudentMaster = masterRole === "role_student" || masterRole === "student";
      const isSubjectDerived = masterRole === "sub_science" || masterRole === "sub_steam" || masterRole.startsWith("sub_");
      if (isStudentMaster || isSubjectDerived) {
        const [remaining] = await pool.query<RowDataPacket[]>(
          `SELECT ur.role_id, ur.org_id, dr.role_name
           FROM sys_user_role ur
           LEFT JOIN data_role dr ON dr.role_id = ur.role_id
           WHERE ur.user_id = ?
           ORDER BY CASE
             WHEN LOWER(ur.role_id) IN ('role_teacher', 'teacher') THEN 0
             ELSE 1
           END, ur.create_time DESC
           LIMIT 1`,
          [userId],
        );
        if (remaining.length > 0) {
          const target = remaining[0] as RowDataPacket;
          const newRoleId = String(target.role_id ?? "");
          const newOrgId = String(target.org_id ?? masterOrg);
          await pool.query(
            `UPDATE sys_user SET user_role_id = ?, user_org_id = ?, update_time = NOW()
             WHERE user_id = ?`,
            [newRoleId, newOrgId || null, userId],
          );
        } else {
          // 无其他绑定角色则默认写入 Role_Teacher（确保用户可登录）
          await pool.query(
            `UPDATE sys_user SET user_role_id = 'Role_Teacher', user_org_id = NULL, update_time = NOW()
             WHERE user_id = ?`,
            [userId],
          );
        }
      }

      revokeRefreshTokensByUserId(userId);
      return ok({ fixed: true, invalidated: true, should_relogin: true });
    }

    const match = url.pathname.match(/^\/v2\/admin-user\/([^/]+)\/roles$/);
    if (!match) return new Response(null, { status: 404 });
    const userId = decodeURIComponent(match[1]!);

    if (req.method === "GET") {
      const [userRows] = await pool.query<RowDataPacket[]>(
        `SELECT u.user_id AS userId, u.user_name AS userName, u.login_name AS loginName, u.user_org_id AS userOrgId, u.user_role_id AS userRoleId,
                o.org_name AS orgName, r.role_name AS roleName
         FROM sys_user u
         LEFT JOIN sys_org o ON o.org_id = u.user_org_id AND o.is_deleted = 0
         LEFT JOIN data_role r ON r.role_id = u.user_role_id
         WHERE u.user_id = ? AND u.is_deleted = 0 LIMIT 1`,
        [userId],
      );
      if (userRows.length === 0) return fail("用户不存在", 404, "NOT_FOUND");
      const [roleRows] = await pool.query<RowDataPacket[]>(
        `SELECT ur.seq_id AS seqId, ur.role_id AS roleId, ur.org_id AS orgId,
                dr.role_name AS roleName, o.org_name AS orgName
         FROM sys_user_role ur
         LEFT JOIN data_role dr ON dr.role_id = ur.role_id
         LEFT JOIN sys_org o ON o.org_id = ur.org_id AND o.is_deleted = 0
         WHERE ur.user_id = ?
         ORDER BY ur.create_time DESC`,
        [userId],
      );
      const user = userRows[0] as RowDataPacket;
      return ok({
        user: {
          userId: String(user.userId ?? user.user_id),
          userName: String(user.userName ?? user.user_name ?? ""),
          loginName: String(user.loginName ?? user.login_name ?? ""),
          userOrgId: user.userOrgId ?? user.user_org_id ?? null,
          userRoleId: user.userRoleId ?? user.user_role_id ?? null,
          orgName: user.orgName ?? user.org_name ?? null,
          roleName: user.roleName ?? user.role_name ?? null,
        },
        roles: roleRows.map((r) => ({
          seqId: String(r.seqId ?? r.seq_id ?? ""),
          roleId: String(r.roleId ?? r.role_id ?? ""),
          orgId: r.orgId ?? r.org_id ?? null,
          roleName: r.roleName ?? r.role_name ?? null,
          orgName: r.orgName ?? r.org_name ?? null,
        })),
      });
    }

    if (req.method === "POST") {
      const body = z.object({
        roles: z.array(z.object({
          roleId: z.string().min(1),
          orgId: z.union([z.string().min(1), z.null()]).optional(),
          isEnabled: z.boolean().optional().default(true),
          setAsDefault: z.boolean().optional().default(false),
        })).default([]),
      }).parse(await req.json());

      const [userRows] = await pool.query<RowDataPacket[]>(
        `SELECT user_id AS userId, user_role_id AS userRoleId, user_org_id AS userOrgId, login_name AS loginName
         FROM sys_user WHERE user_id = ? AND is_deleted = 0 LIMIT 1`,
        [userId],
      );
      if (userRows.length === 0) return fail("用户不存在", 404, "NOT_FOUND");
      const user = userRows[0] as RowDataPacket;
      const masterRole = normalizeRoleId(user.userRoleId ?? user.user_role_id);

      const enabledPayload = body.roles.filter((r) => r.isEnabled !== false);
      const payloadHasTeacher = enabledPayload.some((r) => isTeacherRole(r.roleId));
      const payloadHasStudent = enabledPayload.some((r) => isStudentRole(r.roleId));
      if (isTeacherRole(masterRole) && payloadHasStudent) {
        return fail("教师主角色禁止同步学生绑定", 409, "ROLE_CONFLICT_TEACHER_WITH_STUDENT");
      }
      if (isStudentRole(masterRole) && payloadHasTeacher) {
        return fail("学生主角色禁止同步教师绑定", 409, "ROLE_CONFLICT_STUDENT_WITH_TEACHER");
      }

      const [existingRows] = await pool.query<RowDataPacket[]>(
        `SELECT seq_id AS seqId, role_id AS roleId, org_id AS orgId FROM sys_user_role WHERE user_id = ?`,
        [userId],
      );
      const existingByKey = new Map(existingRows.map((r) => [`${String(r.roleId ?? r.role_id)}::${String(r.orgId ?? r.org_id ?? "")}`, String(r.seqId ?? r.seq_id)]));

      await pool.query(`DELETE FROM sys_user_role WHERE user_id = ?`, [userId]);
      for (const item of body.roles.entries()) {
        const [index, roleItem] = item;
        if (roleItem.isEnabled === false) continue;
        const orgId = roleItem.orgId ?? null;
        const seqId = existingByKey.get(`${roleItem.roleId}::${orgId ?? ""}`) ?? `${userId}-${roleItem.roleId}-${orgId ?? "default"}`.slice(0, 32);
        await ensureRoleInDataRole(pool, roleItem.roleId);
        await pool.query(
          `INSERT INTO sys_user_role (seq_id, user_id, role_id, org_id, create_time)
           VALUES (?, ?, ?, ?, NOW())
           ON DUPLICATE KEY UPDATE create_time = NOW()`,
          [seqId, userId, roleItem.roleId, orgId],
        );
      }

      const defaultRole = body.roles.find((r) => r.setAsDefault && r.isEnabled !== false) ?? body.roles.find((r) => r.isEnabled !== false);
      if (defaultRole) {
        await pool.query(
          `UPDATE sys_user SET user_role_id = ?, user_org_id = ?, update_user_id = ?, update_time = NOW() WHERE user_id = ?`,
          [defaultRole.roleId, defaultRole.orgId ?? null, actorUserId, userId],
        );
      }

      revokeRefreshTokensByUserId(userId);
      return ok({ synced: true, should_relogin: true, invalidated: true });
    }

    return new Response(null, { status: 404 });
  } catch (err) {
    if (err instanceof z.ZodError) return fail(`参数校验失败：${err.errors[0]?.message ?? "未知字段"}`, 400, "VALIDATION_ERROR");
    console.error("[v2-admin-user]", err);
    return fail(err instanceof Error ? err.message : "服务内部错误", 500, "INTERNAL_ERROR");
  }
}
