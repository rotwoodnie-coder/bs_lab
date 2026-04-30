/**
 * V2 认证登录 HTTP 路由
 * 前缀：/v2/auth/*
 * 密码存储：bcrypt（渐进式升级，兼容存量 SHA-256 哈希）
 */
import { createHash } from "node:crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import type { RowDataPacket } from "mysql2/promise";
import { getMysqlPool } from "../../infrastructure/mysql/mysql-client.ts";
import { createSysUser, getSysOrgById, getSysUserById } from "../../infrastructure/repositories/v2-sys-user-repository.ts";
import { listSubjectGroupsByMember } from "../../infrastructure/repositories/subject-group-repository.ts";
import { resolvePermissionCodes } from "../../lib/auth/role-permissions.ts";
import { countApprovedBindingsForParent } from "../../infrastructure/repositories/v2-parent-student-rel-repository.ts";
import {
  buildAuthClearCookieHeaders,
  buildAuthSetCookieHeaders,
  createV2SessionTokens,
  parseCookies,
  revokeRefreshBySid,
  rotateV2RefreshTokens,
  verifyV2AccessToken,
  verifyV2RefreshToken,
} from "../../lib/auth/v2-session.ts";
import type { Permission } from "../../lib/auth/role-permissions.ts";
import { writeSysLog } from "../../infrastructure/repositories/v2-sys-log-repository.ts";

function parseOrgPathIds(orgId: string, orgPath: string | null | undefined): string[] {
  const base = (orgPath ?? "").trim();
  const path = base ? base : `/${orgId}`;
  return path
    .split("/")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

async function loadOrgPathNodes(pool: ReturnType<typeof getMysqlPool>, orgId: string | null | undefined): Promise<Array<{ orgId: string; orgName: string }>> {
  const id = String(orgId ?? "").trim();
  if (!id) return [];
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT org_id, org_name, org_path FROM sys_org WHERE org_id = ? AND is_deleted = 0 LIMIT 1`,
    [id],
  );
  if (rows.length === 0) return [];
  const row = rows[0] as RowDataPacket;
  const ids = parseOrgPathIds(id, row.org_path ? String(row.org_path) : null);
  if (ids.length === 0) return [];
  const ph = ids.map(() => "?").join(",");
  const [nodeRows] = await pool.query<RowDataPacket[]>(
    `SELECT org_id, org_name FROM sys_org WHERE is_deleted = 0 AND org_id IN (${ph})`,
    ids,
  );
  const nameById = new Map(nodeRows.map((r) => [String((r as RowDataPacket).org_id), String((r as RowDataPacket).org_name ?? "")]));
  return ids.map((oid) => ({ orgId: oid, orgName: nameById.get(oid) ?? oid }));
}

type UserRoleBindingRow = {
  seqId: string;
  roleId: string;
  orgId: string | null;
  roleName: string | null;
  orgName: string | null;
};

async function loadUserRoleBindings(pool: ReturnType<typeof getMysqlPool>, userId: string): Promise<UserRoleBindingRow[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT ur.seq_id AS seqId, ur.role_id AS roleId, ur.org_id AS orgId,
            dr.role_name AS roleName, o.org_name AS orgName
     FROM sys_user_role ur
     LEFT JOIN data_role dr ON dr.role_id = ur.role_id
     LEFT JOIN sys_org o ON o.org_id = ur.org_id AND o.is_deleted = 0
     WHERE ur.user_id = ?
     ORDER BY ur.create_time DESC`,
    [userId],
  );
  return rows.map((r) => {
    const row = r as RowDataPacket;
    return {
      seqId: String(row.seqId ?? row.seq_id ?? ""),
      roleId: String(row.roleId ?? row.role_id ?? ""),
      orgId: row.orgId != null || row.org_id != null ? String(row.orgId ?? row.org_id) : null,
      roleName: row.roleName != null || row.role_name != null ? String(row.roleName ?? row.role_name) : null,
      orgName: row.orgName != null || row.org_name != null ? String(row.orgName ?? row.org_name) : null,
    };
  });
}

type ScaleTitleTier = { seqId: string; titleName: string; scoreNum: number; icon: string | null };

/** 未跑 migration_v2_role_id_fix 时 scale_title 可能仍为旧 slug */
const LEGACY_SCALE_TITLE_ROLE_ID: Record<string, string> = {
  Role_Sys_Admin: "system_admin",
  Role_District_Admin: "district_admin",
  Role_School_Admin: "school_admin",
  Role_Researcher: "researcher",
  Role_Teacher: "teacher",
  Role_Student: "student",
  Role_Parent: "parent",
};

async function loadScoreTitleProgress(
  pool: ReturnType<typeof getMysqlPool>,
  roleId: string | null | undefined,
  perScore: number,
): Promise<{
  currentTitleName: string | null;
  nextTitleName: string | null;
  nextThreshold: number | null;
  pointsToNext: number | null;
  tiers: ScaleTitleTier[];
}> {
  const rid = String(roleId ?? "").trim();
  if (!rid) {
    return { currentTitleName: null, nextTitleName: null, nextThreshold: null, pointsToNext: null, tiers: [] };
  }
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT seq_id AS seqId, title_name AS titleName, score_num AS scoreNum, icon AS icon
     FROM scale_title WHERE role_id = ? ORDER BY score_num ASC`,
    [rid],
  );
  const tiers: ScaleTitleTier[] = rows.map((r) => {
    const row = r as RowDataPacket;
    return {
      seqId: String(row.seqId ?? row.seq_id ?? ""),
      titleName: String(row.titleName ?? row.title_name ?? ""),
      scoreNum: Number(row.scoreNum ?? row.score_num ?? 0),
      icon: row.icon != null ? String(row.icon) : null,
    };
  });
  let currentTitleName: string | null = null;
  let nextTitleName: string | null = null;
  let nextThreshold: number | null = null;
  for (const t of tiers) {
    if (t.scoreNum <= perScore) currentTitleName = t.titleName || currentTitleName;
    else {
      nextTitleName = t.titleName || null;
      nextThreshold = t.scoreNum;
      break;
    }
  }
  const pointsToNext = nextThreshold != null ? Math.max(0, nextThreshold - perScore) : null;
  return { currentTitleName, nextTitleName, nextThreshold, pointsToNext, tiers };
}

async function loadScoreTitleProgressBestEffort(
  pool: ReturnType<typeof getMysqlPool>,
  sessionRoleId: string | null | undefined,
  recordRoleId: string | null | undefined,
  perScore: number,
): Promise<Awaited<ReturnType<typeof loadScoreTitleProgress>>> {
  const roleIdsToTry: string[] = [];
  const push = (id: string | null | undefined) => {
    const s = String(id ?? "").trim();
    if (s.length > 0 && !roleIdsToTry.includes(s)) roleIdsToTry.push(s);
  };
  push(sessionRoleId);
  push(recordRoleId);
  const session = String(sessionRoleId ?? "").trim();
  const record = String(recordRoleId ?? "").trim();
  const legacySession = session ? LEGACY_SCALE_TITLE_ROLE_ID[session] : undefined;
  if (legacySession) push(legacySession);
  const legacyRecord = record ? LEGACY_SCALE_TITLE_ROLE_ID[record] : undefined;
  if (legacyRecord) push(legacyRecord);

  let last = await loadScoreTitleProgress(pool, roleIdsToTry[0] ?? "", perScore);
  if (last.tiers.length > 0) return last;
  for (let i = 1; i < roleIdsToTry.length; i++) {
    const next = await loadScoreTitleProgress(pool, roleIdsToTry[i]!, perScore);
    if (next.tiers.length > 0) return next;
    last = next;
  }
  return last;
}

async function loadScaleLogRecent(pool: ReturnType<typeof getMysqlPool>, userId: string, limit: number) {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT seq_id AS seqId, scale_source AS scaleSource, scale_num AS scaleNum, create_time AS createTime
     FROM scale_log WHERE user_id = ? ORDER BY create_time DESC LIMIT ?`,
    [userId, limit],
  );
  return rows.map((r) => {
    const row = r as RowDataPacket;
    return {
      seqId: String(row.seqId ?? row.seq_id ?? ""),
      scaleSource: row.scaleSource != null || row.scale_source != null ? String(row.scaleSource ?? row.scale_source) : null,
      scaleNum: Number(row.scaleNum ?? row.scale_num ?? 0),
      createTime: row.createTime != null || row.create_time != null ? String(row.createTime ?? row.create_time) : null,
    };
  });
}

async function loadSysLogRecent(pool: ReturnType<typeof getMysqlPool>, userId: string, limit: number) {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT log_id AS logId, log_type AS logType, log_time AS logTime, log_data_type AS logDataType, log_data_id AS logDataId
     FROM sys_log WHERE user_id = ? ORDER BY log_time DESC LIMIT ?`,
    [userId, limit],
  );
  return rows.map((r) => {
    const row = r as RowDataPacket;
    return {
      logId: String(row.logId ?? row.log_id ?? ""),
      logType: row.logType != null || row.log_type != null ? String(row.logType ?? row.log_type) : null,
      logTime: row.logTime != null || row.log_time != null ? String(row.logTime ?? row.log_time) : null,
      logDataType: row.logDataType != null || row.log_data_type != null ? String(row.logDataType ?? row.log_data_type) : null,
      logDataId: row.logDataId != null || row.log_data_id != null ? String(row.logDataId ?? row.log_data_id) : null,
    };
  });
}

async function loadSubjectNamesByIds(pool: ReturnType<typeof getMysqlPool>, subjectIds: string[]): Promise<Map<string, string>> {
  const ids = subjectIds.map((s) => String(s).trim()).filter((s) => s.length > 0);
  if (ids.length === 0) return new Map();
  const uniq = Array.from(new Set(ids));
  const ph = uniq.map(() => "?").join(",");
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT subject_id AS subjectId, subject_name AS subjectName
     FROM data_school_subject
     WHERE COALESCE(status, 'y') = 'y' AND subject_id IN (${ph})`,
    uniq,
  );
  const m = new Map<string, string>();
  for (const r of rows) {
    const id = String((r as RowDataPacket).subjectId ?? "").trim();
    if (!id) continue;
    const name = String((r as RowDataPacket).subjectName ?? "").trim();
    if (name) m.set(id, name);
  }
  return m;
}

function ok(data: unknown, init?: ResponseInit): Response {
  return Response.json({ success: true, data, error: null }, init);
}
function fail(msg: string, status = 400): Response {
  return Response.json({ success: false, data: null, error: { message: msg } }, { status });
}

function hashPwd(plain: string): string {
  return bcrypt.hashSync(plain, 10);
}

function coerceRoleCode(roleId: string | null | undefined, roleName: string | null | undefined): string | null {
  const rid = (roleId ?? "").trim();
  if (!rid) return null;

  // 兼容旧版 slug：data_role 缺标准 Role_* 记录时，sys_user.user_role_id 可能为旧格式
  const OLD_SLUG_TO_CODE: Record<string, string> = {
    system_admin: "Role_Sys_Admin",
    district_admin: "Role_District_Admin",
    school_admin: "Role_School_Admin",
    researcher: "Role_Researcher",
    teacher: "Role_Teacher",
    student: "Role_Student",
    parent: "Role_Parent",
  };
  if (rid in OLD_SLUG_TO_CODE) return OLD_SLUG_TO_CODE[rid]!;

  // 若 role_id 本身就是权限系统的 code，则直接返回
  const known = new Set<string>([
    "Role_Sys_Admin",
    "Role_District_Admin",
    "Role_School_Admin",
    "Role_Researcher",
    "Role_Teacher",
    "Role_Student",
    "Role_Parent",
  ]);
  if (known.has(rid)) return rid;

  // 否则根据角色名称做一次稳定映射（兼容 role_id 为随机主键的情况）
  const rn = (roleName ?? "").trim();
  if (!rn) return null;
  const s = rn.replace(/\s+/g, "");
  if (s.includes("系统管理员") || s.includes("超级管理员") || s === "系统管理") return "Role_Sys_Admin";
  if (s.includes("区") && s.includes("管理员")) return "Role_District_Admin";
  if ((s.includes("校") || s.includes("学校")) && s.includes("管理员")) return "Role_School_Admin";
  if (s.includes("教研") || s.includes("研究员") || s.includes("研究")) return "Role_Researcher";
  if (s.includes("教师") || s.includes("老师")) return "Role_Teacher";
  if (s.includes("学生")) return "Role_Student";
  if (s.includes("家长")) return "Role_Parent";
  return null;
}

const loginSchema = z.object({
  loginName: z.string().min(1),
  loginPwd: z.string().min(1),
  orgId: z.string().min(1).optional(),
  roleId: z.string().min(1).optional(),
});

const registerParentSchema = z.object({
  userName: z.string().min(1).max(60),
  loginName: z.string().min(1).max(60),
  loginPwd: z.string().min(6).max(255),
  userPhone: z.union([z.string().min(1).max(20), z.null()]).optional(),
});

const switchRoleSchema = z.object({
  orgId: z.string().min(1),
  roleId: z.string().min(1),
});

function tryParseBasicAuth(req: Request): { loginName: string; loginPwd: string } | null {
  const auth = req.headers.get("authorization") ?? "";
  const m = auth.match(/^Basic\s+(.+)$/i);
  if (!m) return null;
  try {
    const raw = Buffer.from(m[1]!, "base64").toString("utf8");
    const idx = raw.indexOf(":");
    if (idx <= 0) return null;
    const loginName = raw.slice(0, idx);
    const loginPwd = raw.slice(idx + 1);
    if (!loginName || !loginPwd) return null;
    return { loginName, loginPwd };
  } catch {
    return null;
  }
}

export async function routeV2Auth(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const path = url.pathname;

    if (!path.startsWith("/v2/auth")) return new Response(null, { status: 404 });

    const cookies = parseCookies(req.headers.get("cookie"));

    // ── 家长自主注册 ───────────────────────────────────────
    if (req.method === "POST" && path === "/v2/auth/register-parent") {
      const body = registerParentSchema.parse(await req.json());
      const pool = getMysqlPool();
      // 家长无组织上下文，默认写入 Role_Parent（与权限系统 Role_* 对齐）
      const out = await createSysUser(
        {
          userName: body.userName.trim(),
          loginName: body.loginName.trim(),
          loginPwd: body.loginPwd,
          userRoleId: "Role_Parent",
          userPhone: body.userPhone ?? undefined,
          status: "y",
          comments: "家长自助注册",
        },
        undefined,
      );
      // 立即返回可登录账号信息（不自动登录，避免短信/协议等未补齐前越权）
      return ok({ userId: out.userId, loginName: out.loginName, userName: out.userName });
    }

    // ── 登录 ─────────────────────────────────────────────
    if (req.method === "POST" && path === "/v2/auth/login") {
      let parsed: z.infer<typeof loginSchema> | null = null;
      try {
        const body = await req.json();
        parsed = loginSchema.parse(body);
      } catch (e) {
        // 兼容 Postman Basic Auth / 非 JSON body：避免直接抛 500
        const basic = tryParseBasicAuth(req);
        if (basic) {
          parsed = loginSchema.parse(basic);
        } else if (e instanceof z.ZodError) {
          return fail(`参数校验失败：${e.errors[0]?.message ?? "未知字段"}`, 400);
        } else {
          return fail("参数格式错误：请使用 JSON 请求体或 Basic Auth", 400);
        }
      }

      const { loginName, loginPwd, orgId, roleId } = parsed;

      const pool = getMysqlPool();
      const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT u.*, o.org_name, r.role_name
         FROM sys_user u
         LEFT JOIN sys_org o ON o.org_id = u.user_org_id AND o.is_deleted = 0
         LEFT JOIN data_role r ON r.role_id = u.user_role_id
         WHERE u.login_name = ? AND u.is_deleted = 0 AND UPPER(u.status) = 'Y'
         LIMIT 1`,
        [loginName],
      );
      if (rows.length === 0) return fail("用户名或密码错误", 401);

      const row = rows[0] as RowDataPacket;
      const storedPwd = String(row.login_pwd ?? "");
      // 渐进式迁移：先尝试 bcrypt（新格式），失败则回退 SHA-256（旧格式）
      const isBcrypt = storedPwd.startsWith("$2a$") || storedPwd.startsWith("$2b$");
      const pwdMatch = isBcrypt
        ? bcrypt.compareSync(loginPwd, storedPwd)
        : createHash("sha256").update(loginPwd).digest("hex") === storedPwd;
      if (!pwdMatch) return fail("用户名或密码错误", 401);

      // 自动升级：旧格式密码登录成功后立即重哈希为 bcrypt
      if (!isBcrypt) {
        pool.query(
          `UPDATE sys_user SET login_pwd = ?, update_time = NOW() WHERE user_id = ?`,
          [hashPwd(loginPwd), row.user_id],
        ).catch((err) => console.error("[password-migration] upgrade error", err));
      }

      const expireDate = row.expire_date ? new Date(String(row.expire_date)) : null;
      if (expireDate && expireDate < new Date()) return fail("账号已过期", 401);

      await pool.query(
        `UPDATE sys_user SET last_login_time = NOW() WHERE user_id = ?`,
        [row.user_id],
      );

      // 选择会话上下文：优先采用客户端指定（需校验归属），否则按 sys_user_role + data_role.sort_order 选择。
      const userId = String(row.user_id);
      const userDefaultOrgId = row.user_org_id ? String(row.user_org_id) : null;
      const userDefaultRoleId = row.user_role_id ? String(row.user_role_id) : null;
      // data_role 未必有 role_code 字段；权限系统以 roleId 作为 code（初始化固定值）
      const userDefaultRoleCode = coerceRoleCode(userDefaultRoleId, row.role_name ? String(row.role_name) : null);

      const [ctxRows] = await pool.query<RowDataPacket[]>(
        `SELECT ur.org_id, ur.role_id, o.org_name,
               r.role_name, r.sort_order, r.status AS role_status
         FROM sys_user_role ur
         LEFT JOIN sys_org o ON o.org_id = ur.org_id AND o.is_deleted = 0
         LEFT JOIN data_role r ON r.role_id = ur.role_id
         WHERE ur.user_id = ?`,
        [userId],
      );

      const contexts = ctxRows
        .map((r) => ({
          orgId: r.org_id ? String(r.org_id) : "",
          roleId: r.role_id ? String(r.role_id) : "",
          // 兼容 data_role：role_id 本身作为权限 code
          roleCode: coerceRoleCode(r.role_id ? String(r.role_id) : null, r.role_name ? String(r.role_name) : null) ??
            (r.role_id ? String(r.role_id) : ""),
          orgName: r.org_name ? String(r.org_name) : null,
          roleName: r.role_name ? String(r.role_name) : null,
          sortOrder: r.sort_order != null ? Number(r.sort_order) : 0,
          roleStatus: r.role_status ? String(r.role_status) : null,
        }))
        .filter((c) => c.orgId.length > 0 && c.roleId.length > 0)
        .filter((c) => (c.roleStatus ? c.roleStatus.toUpperCase() === "Y" : true));

      let currentOrgId: string | null = null;
      let currentRoleCode: string | null = null;

      if (orgId && roleId) {
        const hit = contexts.find((c) => c.orgId === orgId && c.roleId === roleId);
        if (!hit) return fail("无效的组织或角色上下文", 400);
        currentOrgId = hit.orgId;
        currentRoleCode = hit.roleCode;
      } else if (contexts.length > 0) {
        const exactDefaultContext =
          userDefaultOrgId && userDefaultRoleId
            ? contexts.find((c) => c.orgId === userDefaultOrgId && c.roleId === userDefaultRoleId)
            : undefined;
        const defaultRoleContext = userDefaultRoleId ? contexts.find((c) => c.roleId === userDefaultRoleId) : undefined;
        const defaultOrgContext = userDefaultOrgId ? contexts.find((c) => c.orgId === userDefaultOrgId) : undefined;
        const preferred =
          exactDefaultContext ??
          defaultRoleContext ??
          defaultOrgContext ??
          contexts.slice().sort((a, b) => a.sortOrder - b.sortOrder)[0];
        currentOrgId = preferred?.orgId ?? null;
        currentRoleCode = preferred?.roleCode ?? null;
      } else {
        currentOrgId = userDefaultOrgId;
        currentRoleCode = userDefaultRoleCode;
      }

      // 开发期兜底：若未配置任何角色上下文，且为内置 admin 账号，则赋予 Role_Sys_Admin。
      // 生产环境应通过 data_role + sys_user_role 配置完成授权。
      if (process.env.NODE_ENV !== "production" && !currentRoleCode && String(row.login_name ?? "") === "admin") {
        currentRoleCode = "Role_Sys_Admin";
      }

      const permissions = resolvePermissionCodes(currentRoleCode);
      // 若仍无法解析权限，说明 data_role 的 role_id 不符合约定且 role_name 也无法映射。
      // 开发期对 admin 做兜底；其他账号仍按空权限处理（提示权限不足）。
      if (process.env.NODE_ENV !== "production" && permissions.length === 0 && String(row.login_name ?? "") === "admin") {
        currentRoleCode = "Role_Sys_Admin";
      }
      const finalPermissions = resolvePermissionCodes(currentRoleCode);
      // token 内 roleId 统一存 Role_*（用于权限计算与路由守卫）

      // 收集全量角色并集（Role_* + Subj_*），用于 Token 入射的 roles[]
      const [allRoleRows] = await pool.query<RowDataPacket[]>(
        `SELECT DISTINCT role_id FROM sys_user_role WHERE user_id = ?`,
        [userId],
      );
      const allRoleIds = allRoleRows
        .map((r) => String((r as RowDataPacket).role_id ?? ""))
        .filter(Boolean);
      // 确保主角色在内
      if (currentRoleCode && !allRoleIds.includes(currentRoleCode)) {
        allRoleIds.push(currentRoleCode);
      }

      const tokens = createV2SessionTokens(
        { userId, orgId: currentOrgId, roleId: currentRoleCode, roles: allRoleIds },
        allRoleIds,
      );
      const setCookies = buildAuthSetCookieHeaders(tokens);

      const headers = new Headers();
      setCookies.forEach((c) => headers.append("set-cookie", c));

      return ok(
        {
          userId,
          userName: String(row.user_name ?? ""),
          loginName: String(row.login_name ?? ""),
          // 返回 roleCode（前端与权限系统使用 code）
          userRoleId: currentRoleCode,
          roleName: typeof row.role_name === "string" && row.role_name ? String(row.role_name) : null,
          userOrgId: currentOrgId,
          orgName: row.org_name ? String(row.org_name) : null,
          userLogo: row.user_logo ? String(row.user_logo) : null,
          perScore: Number(row.per_score ?? 0),
          permissions: finalPermissions,
          availableContexts: contexts.map((c) => ({
            orgId: c.orgId,
            roleId: c.roleId,
            roleCode: c.roleCode,
            orgName: c.orgName,
            roleName: c.roleName,
          })),
        },
        { headers },
      );
    }

    // ── 当前用户信息 ──────────────────────────────────────
    if (req.method === "GET" && path === "/v2/auth/profile") {
      const accessToken = cookies.v2_access_token;
      const refreshToken = cookies.v2_refresh_token;

      let actor = accessToken ? verifyV2AccessToken(accessToken) : null;
      const headers = new Headers();

      // 兜底：access 过期/缺失时，允许使用 refresh 自动续期一次并继续取 profile
      if (!actor && refreshToken) {
        const r = verifyV2RefreshToken(refreshToken);
        if (r) {
          const rotated = rotateV2RefreshTokens(refreshToken);
          if (rotated) {
            buildAuthSetCookieHeaders(rotated).forEach((c) => headers.append("set-cookie", c));
            actor = { userId: r.userId, orgId: r.orgId, roleId: r.roleId, sid: r.sid, roles: r.roles ?? [r.roleId] };
          }
        }
      }

      if (!actor) {
        const isProd = process.env.NODE_ENV === "production";
        if (!isProd) {
          const ck = [
            `hasAccess=${accessToken ? "Y" : "N"}`,
            `hasRefresh=${refreshToken ? "Y" : "N"}`,
          ].join(", ");
          return fail(`未登录（${ck}）`, 401);
        }
        return fail("未登录", 401);
      }

      const user = await getSysUserById(actor.userId);
      if (!user) return fail("用户不存在", 404);
      const recordUserOrgId = user.userOrgId;
      const recordUserRoleId = user.userRoleId;
      const recordOrgName = user.orgName ?? null;
      const recordRoleName = user.roleName ?? null;

      let sessionOrgName: string | null = null;
      if (actor.orgId) {
        const og = await getSysOrgById(actor.orgId);
        sessionOrgName = og?.orgName ?? null;
      }
      const pool = getMysqlPool();
      const [roleRows] = await pool.query<RowDataPacket[]>(
        `SELECT role_name FROM data_role WHERE role_id = ? LIMIT 1`,
        [actor.roleId],
      );
      const sessionRoleName = roleRows[0]?.role_name ? String((roleRows[0] as RowDataPacket).role_name) : null;
      const teachingResearchGroups = await listSubjectGroupsByMember(actor.userId);
      const recordOrgPathNodes = await loadOrgPathNodes(pool, recordUserOrgId);
      const sessionOrgPathNodes = await loadOrgPathNodes(pool, actor.orgId);
      const subjectIds = teachingResearchGroups.map((g) => g.subjectId).filter((x): x is string => typeof x === "string" && x.trim().length > 0);
      const subjectNameById = await loadSubjectNamesByIds(pool, subjectIds);
      const teachingSubjectsMap = new Map<string, string>();
      for (const g of teachingResearchGroups) {
        const sid = String(g.subjectId ?? "").trim();
        if (!sid) continue;
        const name = subjectNameById.get(sid);
        if (!name) continue;
        if (!teachingSubjectsMap.has(sid)) teachingSubjectsMap.set(sid, name);
      }
      const teachingSubjects = Array.from(teachingSubjectsMap.entries()).map(([subjectId, subjectName]) => ({ subjectId, subjectName }));

      const userRoleBindings = await loadUserRoleBindings(pool, actor.userId);
      const scoreTitleProgress = await loadScoreTitleProgressBestEffort(
        pool,
        actor.roleId,
        recordUserRoleId,
        Number(user.perScore ?? 0),
      );
      const scaleLogRecent = await loadScaleLogRecent(pool, actor.userId, 40);
      const sysLogRecent = await loadSysLogRecent(pool, actor.userId, 25);

      const parentBindingSummary = await (async () => {
        const roleLower = String(actor.roleId ?? "").trim().toLowerCase();
        if (roleLower !== "role_parent" && roleLower !== "parent") return null;
        const approvedCount = await countApprovedBindingsForParent(pool, actor.userId);
        return { approvedCount };
      })();

      return ok(
        {
          ...user,
          recordUserOrgId,
          recordUserRoleId,
          recordOrgName,
          recordRoleName,
          sessionOrgName,
          sessionRoleName,
          teachingResearchGroups,
          teachingSubjects,
          recordOrgPathNodes,
          sessionOrgPathNodes,
          userRoleBindings,
          scoreTitleProgress,
          scaleLogRecent,
          sysLogRecent,
          // 顶层 orgName / roleName 与会话上下文一致，避免 userOrgId 已切到会话但名称仍停留在主档 JOIN 的歧义。
          orgName: sessionOrgName ?? recordOrgName ?? user.orgName ?? null,
          roleName: sessionRoleName ?? recordRoleName ?? user.roleName ?? null,
          // 权限以会话上下文为准（来自 Cookie Session roleCode）。同时覆盖返回体中的 roleId 为 roleCode，避免前端/鉴权链条出现“主键 id 与 code 混用”。
          userRoleId: actor.roleId,
          userOrgId: actor.orgId,
          permissions: resolvePermissionCodes(actor.roleId),
          parentBindingSummary,
        },
        headers.keys().next().done ? undefined : { headers },
      );
    }

    // ── 更新头像（仅本人） ─────────────────────────────────
    if (req.method === "POST" && path === "/v2/auth/profile/logo") {
      const accessToken = cookies.v2_access_token;
      if (!accessToken) return fail("未登录", 401);
      const actor = verifyV2AccessToken(accessToken);
      if (!actor) return fail("未登录", 401);

      const body = z.object({
        userLogo: z.union([z.string().min(1), z.null()]).optional(),
      }).parse(await req.json());

      const pool = getMysqlPool();
      await pool.query(
        `UPDATE sys_user SET user_logo = ?, update_user_id = ?, update_time = NOW()
         WHERE user_id = ? AND is_deleted = 0`,
        [body.userLogo ?? null, actor.userId, actor.userId],
      );
      return ok({ message: "ok" });
    }

    // ── 更新个人资料（仅本人，可编辑字段） ─────────────────────
    if (req.method === "PATCH" && path === "/v2/auth/profile") {
      const accessToken = cookies.v2_access_token;
      if (!accessToken) return fail("未登录", 401);
      const actor = verifyV2AccessToken(accessToken);
      if (!actor) return fail("未登录", 401);

      const body = z.object({
        userName: z.string().min(1).max(60).optional(),
        userNickName: z.union([z.string().min(1).max(60), z.null()]).optional(),
        userPhone: z.union([z.string().min(1), z.null()]).optional(),
        userEmail: z.union([z.string().min(1), z.null()]).optional(),
        perResume: z.union([z.string().max(8000), z.null()]).optional(),
        prefTitleId: z.union([z.string().min(1), z.null()]).optional(),
        comments: z.union([z.string().max(200), z.null()]).optional(),
      }).parse(await req.json());

      const sets: string[] = [];
      const params: unknown[] = [];
      if (body.userName !== undefined) { sets.push("user_name = ?"); params.push(body.userName); }
      if (body.userNickName !== undefined) { sets.push("user_nick_name = ?"); params.push(body.userNickName); }
      if (body.userPhone !== undefined) { sets.push("user_phone = ?"); params.push(body.userPhone); }
      if (body.userEmail !== undefined) { sets.push("user_email = ?"); params.push(body.userEmail); }
      if (body.perResume !== undefined) { sets.push("per_resume = ?"); params.push(body.perResume); }
      if (body.prefTitleId !== undefined) { sets.push("pref_title_id = ?"); params.push(body.prefTitleId); }
      if (body.comments !== undefined) { sets.push("comments = ?"); params.push(body.comments); }

      if (sets.length === 0) return fail("未提供可更新字段", 400);

      const pool = getMysqlPool();
      await pool.query(
        `UPDATE sys_user
         SET ${sets.join(", ")}, update_user_id = ?, update_time = NOW()
         WHERE user_id = ? AND is_deleted = 0`,
        [...params, actor.userId, actor.userId],
      );
      return ok({ message: "ok" });
    }

    // ── 刷新会话 ──────────────────────────────────────────
    if (req.method === "POST" && path === "/v2/auth/refresh") {
      const refreshToken = cookies.v2_refresh_token;
      if (!refreshToken) return fail("未登录", 401);
      const actor = verifyV2RefreshToken(refreshToken);
      if (!actor) return fail("未登录", 401);
      const rotated = rotateV2RefreshTokens(refreshToken);
      if (!rotated) return fail("未登录", 401);

      const headers = new Headers();
      buildAuthSetCookieHeaders(rotated).forEach((c) => headers.append("set-cookie", c));
      return ok({ message: "ok" }, { headers });
    }

    // ── 切换会话角色/组织（正式身份切换）──────────────────────
    if (req.method === "POST" && path === "/v2/auth/switch-role") {
      const accessToken = cookies.v2_access_token;
      if (!accessToken) return fail("未登录", 401);
      const actor = verifyV2AccessToken(accessToken);
      if (!actor) return fail("未登录", 401);

      const body = switchRoleSchema.parse(await req.json());
      const pool = getMysqlPool();

      // 校验：必须是该用户已绑定的 sys_user_role 上下文
      const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT ur.org_id, ur.role_id, o.org_name, r.role_name, r.status AS role_status
         FROM sys_user_role ur
         LEFT JOIN sys_org o ON o.org_id = ur.org_id AND o.is_deleted = 0
         LEFT JOIN data_role r ON r.role_id = ur.role_id
         WHERE ur.user_id = ? AND ur.org_id = ? AND ur.role_id = ?
         LIMIT 1`,
        [actor.userId, body.orgId, body.roleId],
      );
      if (rows.length === 0) return fail("无效的组织或角色上下文", 400);
      const hit = rows[0] as RowDataPacket;
      const roleStatus = hit.role_status ? String(hit.role_status) : null;
      if (roleStatus && roleStatus.toUpperCase() !== "Y") return fail("角色已停用", 403);

      const nextRoleCode = coerceRoleCode(String(hit.role_id ?? ""), hit.role_name ? String(hit.role_name) : null);
      if (!nextRoleCode) return fail("无法识别角色编码", 422);
      const nextOrgId = String(hit.org_id ?? "").trim();
      if (!nextOrgId) return fail("无法识别组织", 422);

      // 复用当前 sid，避免刷新 token 记忆表失效导致短期登出
      const tokens = createV2SessionTokens(
        { userId: actor.userId, orgId: nextOrgId, roleId: nextRoleCode, roles: actor.roles, sid: actor.sid },
        actor.roles,
      );
      const headers = new Headers();
      buildAuthSetCookieHeaders(tokens).forEach((c) => headers.append("set-cookie", c));

      // 审计：记录一次会话角色切换（不改表结构，落 sys_log）
      try {
        await writeSysLog(pool, {
          userId: actor.userId,
          logType: "AUTH_SWITCH_ROLE",
          logDataType: "sys_user_role",
          logDataId: `${nextOrgId}:${nextRoleCode}`.slice(0, 32),
        });
      } catch {
        /* ignore audit failure */
      }

      return ok(
        {
          userId: actor.userId,
          userOrgId: nextOrgId,
          userRoleId: nextRoleCode,
          orgName: hit.org_name ? String(hit.org_name) : null,
          roleName: hit.role_name ? String(hit.role_name) : null,
          permissions: resolvePermissionCodes(nextRoleCode),
        },
        { headers },
      );
    }

    // ── 退出 ──────────────────────────────────────────────
    if (req.method === "POST" && path === "/v2/auth/logout") {
      const refreshToken = cookies.v2_refresh_token;
      if (refreshToken) {
        const actor = verifyV2RefreshToken(refreshToken);
        if (actor) revokeRefreshBySid(actor.sid);
      }
      const headers = new Headers();
      buildAuthClearCookieHeaders().forEach((c) => headers.append("set-cookie", c));
      return ok({ message: "ok" }, { headers });
    }

    // ── 修改密码 ──────────────────────────────────────────
    if (req.method === "POST" && path === "/v2/auth/change-password") {
      const accessToken = cookies.v2_access_token;
      if (!accessToken) return fail("未登录", 401);
      const actor = verifyV2AccessToken(accessToken);
      if (!actor) return fail("未登录", 401);

      const body = await req.json();
      const { oldPwd, newPwd } = z.object({
        oldPwd: z.string().min(1),
        newPwd: z.string().min(6),
      }).parse(body);

      const pool = getMysqlPool();
      const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT login_pwd FROM sys_user WHERE user_id = ? AND is_deleted = 0`, [actor.userId],
      );
      if (rows.length === 0) return fail("用户不存在", 404);
      const changePwdStored = String(rows[0]!.login_pwd ?? "");
      const isBcryptChange = changePwdStored.startsWith("$2a$") || changePwdStored.startsWith("$2b$");
      const oldPwdMatch = isBcryptChange
        ? bcrypt.compareSync(oldPwd, changePwdStored)
        : createHash("sha256").update(oldPwd).digest("hex") === changePwdStored;
      if (!oldPwdMatch) return fail("旧密码错误", 400);

      await pool.query(
        `UPDATE sys_user SET login_pwd = ?, update_time = NOW() WHERE user_id = ?`,
        [hashPwd(newPwd), actor.userId],
      );
      return ok({ message: "密码修改成功" });
    }

    return new Response(null, { status: 404 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return fail(`参数校验失败：${err.errors[0]?.message ?? "未知字段"}`, 400);
    }
    console.error("[v2-auth]", err);
    const isProd = process.env.NODE_ENV === "production";
    if (!isProd && err instanceof Error) {
      return fail(`服务内部错误：${err.message}`, 500);
    }
    return fail("服务内部错误", 500);
  }
}
