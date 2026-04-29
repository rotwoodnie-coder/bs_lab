import { createHmac, randomUUID, timingSafeEqual, createHash } from "node:crypto";
import { getMysqlPool } from "../../infrastructure/mysql/mysql-client.ts";

type Json = Record<string, unknown>;

function base64UrlEncode(input: string | Buffer): string {
  const buf = typeof input === "string" ? Buffer.from(input, "utf8") : input;
  return buf.toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function base64UrlDecodeToString(input: string): string {
  const s = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  return Buffer.from(s + pad, "base64").toString("utf8");
}

function sha256Hex(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

function getSessionSecret(): string {
  const v2Secret = (process.env.V2_AUTH_SESSION_SECRET ?? "").trim();
  const legacySecret = (process.env.SESSION_SECRET ?? "").trim();
  const secret = v2Secret || legacySecret;
  const isProd = process.env.NODE_ENV === "production";

  if (secret.length < 32) {
    const message = [
      "[v2-session] 配置缺失或过短：",
      `V2_AUTH_SESSION_SECRET=${v2Secret ? `set(${v2Secret.length})` : "empty"}`,
      `SESSION_SECRET=${legacySecret ? `set(${legacySecret.length})` : "empty"}`,
      "生产环境必须至少配置一个长度不小于 32 位的会话密钥，且优先使用 V2_AUTH_SESSION_SECRET。",
    ].join(" ");

    if (isProd) {
      console.error(message);
      process.exit(1);
    }

    // 本地开发兜底：避免没配环境变量就完全不可用（生产必须显式设置）
    return "dev-only-v2-auth-session-secret-change-me";
  }

  return secret;
}

function sign(payloadB64: string): string {
  const mac = createHmac("sha256", getSessionSecret()).update(payloadB64).digest();
  return base64UrlEncode(mac);
}

export type V2SessionActor = {
  userId: string;
  orgId: string | null;
  roleId: string | null;
  /** 全量角色并集（Role_* + Subj_*），来自 sys_user_role。旧 Token 可能不含此字段，回退为 [roleId]。 */
  roles: string[];
  sid: string;
};

type V2AccessPayload = {
  typ: "access";
  sub: string;
  org_id: string | null;
  role_id: string | null;
  roles: string[];
  sid: string;
  iat: number;
  exp: number;
};

type V2RefreshPayload = {
  typ: "refresh";
  sub: string;
  org_id: string | null;
  role_id: string | null;
  roles: string[];
  sid: string;
  iat: number;
  exp: number;
  rot: number;
};

export type V2SessionTokens = { accessToken: string; refreshToken: string; sid: string };

export function createV2SessionTokens(
  actor: Omit<V2SessionActor, "sid"> & { sid?: string },
  roles?: string[],
): V2SessionTokens {
  const sid = actor.sid ?? randomUUID().replace(/-/g, "");
  const nowSec = Math.floor(Date.now() / 1000);
  const accessExpSec = nowSec + 15 * 60;
  const refreshExpSec = nowSec + 30 * 24 * 60 * 60;

  const allRoles = roles?.filter(Boolean) as string[] ?? [actor.roleId].filter(Boolean) as string[];

  const accessPayload: V2AccessPayload = {
    typ: "access",
    sub: actor.userId,
    org_id: actor.orgId ?? null,
    role_id: actor.roleId ?? null,
    roles: allRoles,
    sid,
    iat: nowSec,
    exp: accessExpSec,
  };

  const refreshPayload: V2RefreshPayload = {
    typ: "refresh",
    sub: actor.userId,
    org_id: actor.orgId ?? null,
    role_id: actor.roleId ?? null,
    roles: allRoles,
    sid,
    iat: nowSec,
    exp: refreshExpSec,
    rot: 1,
  };

  const accessPayloadB64 = base64UrlEncode(JSON.stringify(accessPayload));
  const refreshPayloadB64 = base64UrlEncode(JSON.stringify(refreshPayload));

  const accessToken = `${accessPayloadB64}.${sign(accessPayloadB64)}`;
  const refreshToken = `${refreshPayloadB64}.${sign(refreshPayloadB64)}`;

  rememberRefreshToken(sid, refreshToken, refreshExpSec, actor.userId);
  return { accessToken, refreshToken, sid };
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

function parseSignedJson(token: string): Json | null {
  const idx = token.lastIndexOf(".");
  if (idx <= 0) return null;
  const payloadB64 = token.slice(0, idx);
  const sig = token.slice(idx + 1);
  const expected = sign(payloadB64);
  if (!safeEqual(sig, expected)) return null;
  try {
    const json = JSON.parse(base64UrlDecodeToString(payloadB64)) as Json;
    return json && typeof json === "object" ? json : null;
  } catch {
    return null;
  }
}

export function verifyV2AccessToken(token: string): V2SessionActor | null {
  const p = parseSignedJson(token) as Partial<V2AccessPayload> | null;
  if (!p || p.typ !== "access") return null;
  if (typeof p.sub !== "string" || p.sub.length === 0) return null;
  if (typeof p.sid !== "string" || p.sid.length === 0) return null;
  if (typeof p.exp !== "number" || p.exp <= 0) return null;
  const nowSec = Math.floor(Date.now() / 1000);
  if (p.exp <= nowSec) return null;
  return {
    userId: p.sub,
    orgId: typeof p.org_id === "string" ? p.org_id : null,
    roleId: typeof p.role_id === "string" ? p.role_id : null,
    roles: Array.isArray(p.roles) ? p.roles.filter((r): r is string => typeof r === "string") : [typeof p.role_id === "string" ? p.role_id : ""].filter(Boolean),
    sid: p.sid,
  };
}

export function verifyV2RefreshToken(token: string): V2SessionActor | null {
  const p = parseSignedJson(token) as Partial<V2RefreshPayload> | null;
  if (!p || p.typ !== "refresh") return null;
  if (typeof p.sub !== "string" || p.sub.length === 0) return null;
  if (typeof p.sid !== "string" || p.sid.length === 0) return null;
  if (typeof p.exp !== "number" || p.exp <= 0) return null;
  if (typeof p.rot !== "number" || p.rot <= 0) return null;
  const nowSec = Math.floor(Date.now() / 1000);
  if (p.exp <= nowSec) return null;
  if (!isRefreshTokenRemembered(p.sid, token)) return null;
  return {
    userId: p.sub,
    orgId: typeof p.org_id === "string" ? p.org_id : null,
    roleId: typeof p.role_id === "string" ? p.role_id : null,
    roles: Array.isArray(p.roles) ? p.roles.filter((r): r is string => typeof r === "string") : [typeof p.role_id === "string" ? p.role_id : ""].filter(Boolean),
    sid: p.sid,
  };
}

export function rotateV2RefreshTokens(oldRefreshToken: string): V2SessionTokens | null {
  const p = parseSignedJson(oldRefreshToken) as Partial<V2RefreshPayload> | null;
  if (!p || p.typ !== "refresh") return null;
  const actor = verifyV2RefreshToken(oldRefreshToken);
  if (!actor) return null;

  const nowSec = Math.floor(Date.now() / 1000);
  const accessExpSec = nowSec + 15 * 60;
  const refreshExpSec = nowSec + 30 * 24 * 60 * 60;

  const accessPayload: V2AccessPayload = {
    typ: "access",
    sub: actor.userId,
    org_id: actor.orgId ?? null,
    role_id: actor.roleId ?? null,
    roles: actor.roles,
    sid: actor.sid,
    iat: nowSec,
    exp: accessExpSec,
  };

  const refreshPayload: V2RefreshPayload = {
    typ: "refresh",
    sub: actor.userId,
    org_id: actor.orgId ?? null,
    role_id: actor.roleId ?? null,
    roles: actor.roles,
    sid: actor.sid,
    iat: nowSec,
    exp: refreshExpSec,
    rot: (typeof p.rot === "number" ? p.rot : 1) + 1,
  };

  const accessPayloadB64 = base64UrlEncode(JSON.stringify(accessPayload));
  const refreshPayloadB64 = base64UrlEncode(JSON.stringify(refreshPayload));
  const accessToken = `${accessPayloadB64}.${sign(accessPayloadB64)}`;
  const refreshToken = `${refreshPayloadB64}.${sign(refreshPayloadB64)}`;

  rememberRefreshToken(actor.sid, refreshToken, refreshExpSec, actor.userId);
  return { accessToken, refreshToken, sid: actor.sid };
}

export type CookieOptions = {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: "lax" | "none" | "strict";
  path?: string;
  maxAgeSeconds?: number;
};

export function formatSetCookie(name: string, value: string, opts: CookieOptions = {}): string {
  const httpOnly = opts.httpOnly !== false;
  const secure = opts.secure ?? process.env.NODE_ENV === "production";
  const sameSite = opts.sameSite ?? (process.env.NODE_ENV === "production" ? "lax" : "lax");
  const path = opts.path ?? "/";
  const domain = (process.env.V2_COOKIE_DOMAIN ?? "").trim();
  const parts = [`${name}=${value}`];
  parts.push(`Path=${path}`);
  if (domain) parts.push(`Domain=${domain}`);
  if (opts.maxAgeSeconds != null) parts.push(`Max-Age=${Math.max(0, Math.floor(opts.maxAgeSeconds))}`);
  if (httpOnly) parts.push("HttpOnly");
  if (secure) parts.push("Secure");
  if (sameSite) parts.push(`SameSite=${sameSite[0]?.toUpperCase()}${sameSite.slice(1)}`);
  return parts.join("; ");
}

export function parseCookies(header: string | null | undefined): Record<string, string> {
  if (!header) return {};
  const out: Record<string, string> = {};
  header.split(";").forEach((kv) => {
    const idx = kv.indexOf("=");
    if (idx === -1) return;
    const k = kv.slice(0, idx).trim();
    const v = kv.slice(idx + 1).trim();
    if (k) out[k] = v;
  });
  return out;
}

export function buildAuthSetCookieHeaders(tokens: V2SessionTokens): string[] {
  return [
    formatSetCookie("v2_access_token", tokens.accessToken, { httpOnly: true, maxAgeSeconds: 15 * 60 }),
    formatSetCookie("v2_refresh_token", tokens.refreshToken, { httpOnly: true, maxAgeSeconds: 30 * 24 * 60 * 60 }),
  ];
}

export function buildAuthClearCookieHeaders(): string[] {
  return [
    formatSetCookie("v2_access_token", "", { httpOnly: true, maxAgeSeconds: 0 }),
    formatSetCookie("v2_refresh_token", "", { httpOnly: true, maxAgeSeconds: 0 }),
  ];
}

// ─── Refresh Token 轮换存储（MySQL 持久化 + 内存快速路径） ──
// 内存 Map 保证同步验证路径（verifyV2RefreshToken 为同步函数），
// MySQL 写入作为持久化备份，支持多实例部署和重启恢复。
type RefreshRecord = { tokenHash: string; exp: number; userId: string };
const refreshStore = new Map<string, RefreshRecord>();

function rememberRefreshToken(sid: string, refreshToken: string, expSec: number, userId: string): void {
  const tokenHash = sha256Hex(refreshToken);
  refreshStore.set(sid, { tokenHash, exp: expSec, userId });

  // 异步写入 MySQL 作为持久化备份
  const pool = getMysqlPool();
  const expiresAt = new Date(expSec * 1000).toISOString().slice(0, 19).replace("T", " ");
  pool.query(
    `INSERT INTO sys_auth_refresh_token (sid, token_hash, user_id, role_code, org_id, expires_at, created_at)
     VALUES (?, ?, '', '', '', ?, NOW())
     ON DUPLICATE KEY UPDATE token_hash = VALUES(token_hash), expires_at = VALUES(expires_at), created_at = NOW()`,
    [sid, tokenHash, expiresAt],
  ).catch((err) => console.error("[refresh-token] insert error", err));
}

function isRefreshTokenRemembered(sid: string, refreshToken: string): boolean {
  // 快速路径：先查内存 Map（同步验证路径必须保持同步）
  const rec = refreshStore.get(sid);
  if (rec) {
    const nowSec = Math.floor(Date.now() / 1000);
    if (rec.exp > nowSec && rec.tokenHash === sha256Hex(refreshToken)) {
      return true;
    }
    refreshStore.delete(sid);
  }
  return false;
}

export function revokeRefreshBySid(sid: string): void {
  refreshStore.delete(sid);
  // 异步删除 MySQL 记录
  const pool = getMysqlPool();
  pool.query(`DELETE FROM sys_auth_refresh_token WHERE sid = ?`, [sid])
    .catch((err) => console.error("[refresh-token] delete error", err));
}

export function revokeRefreshTokensByUserId(userId: string): void {
  const uid = String(userId ?? "").trim();
  if (!uid) return;
  for (const [sid, rec] of refreshStore.entries()) {
    if (rec.userId === uid) refreshStore.delete(sid);
  }
  const pool = getMysqlPool();
  pool.query(`DELETE FROM sys_auth_refresh_token WHERE user_id = ?`, [uid])
    .catch((err) => console.error("[refresh-token] delete-by-user error", err));
}

/** 启动时确保 sys_auth_refresh_token 表存在（自动建表替代手动执行 migration） */
const INIT_TABLE_SQL = `CREATE TABLE IF NOT EXISTS sys_auth_refresh_token (
  sid VARCHAR(64) NOT NULL PRIMARY KEY,
  token_hash VARCHAR(128) NOT NULL,
  user_id VARCHAR(64) NOT NULL,
  role_code VARCHAR(64) NOT NULL DEFAULT '',
  org_id VARCHAR(64) NOT NULL DEFAULT '',
  expires_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_expires_at (expires_at),
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`;

(async () => {
  try {
    const pool = getMysqlPool();
    await pool.query(INIT_TABLE_SQL);
  } catch {
    // 连接池尚未就绪时静默忽略——后续操作会触发重试
  }
})();

/** 清理过期的 refresh token 记录（可定期调用） */
function cleanupExpiredRefreshTokens(): void {
  const pool = getMysqlPool();
  const nowStr = new Date().toISOString().slice(0, 19).replace("T", " ");
  pool.query(`DELETE FROM sys_auth_refresh_token WHERE expires_at < ?`, [nowStr])
    .catch((err) => console.error("[refresh-token] cleanup error", err));
}

