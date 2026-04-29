/**
 * 控制台用户：已切换为真实 V2 sys_user API。
 * 保留原函数签名，降低页面改造范围。
 */
import { UserRole } from "@/types/auth";
import {
  batchUpdateV2SysUserStatus,
  createV2SysUser,
  fetchV2SysOrgTree,
  fetchV2SysUserById,
  fetchV2SysUserList,
  updateV2SysUser,
  type CreateV2SysUserInput,
  type UpdateV2SysUserInput,
  type V2SysOrgItem,
  type V2SysUserItem,
} from "@/lib/v2/v2-sys-api";
import type { CoreApiActor } from "@/lib/core-api-shared";
import type { ConsoleUserListQuery, ConsoleUserUpsertBody, RoleId, UserRecord } from "./types";

export class ConsoleUsersMockError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, status: number, code: string) {
    super(message);
    this.name = "ConsoleUsersMockError";
    this.status = status;
    this.code = code;
  }
}

/** 控制台用户页请求 V2 时的身份头（须为 sys_user.user_id UUID）。 */
export function getConsoleUsersActor(): CoreApiActor {
  const userId =
    process.env.NEXT_PUBLIC_V2_BOOTSTRAP_USER_ID?.trim() ||
    process.env.NEXT_PUBLIC_IAM_BOOTSTRAP_USER_ID?.trim() ||
    "";
  return {
    role: UserRole.DISTRICT_ADMIN,
    tenantId: "district-001",
    appId: "console",
    userId: userId || "00000000-0000-0000-0000-000000000000",
    userName: process.env.NEXT_PUBLIC_IAM_BOOTSTRAP_USER_NAME?.trim() || "系统管理员",
    orgId: process.env.NEXT_PUBLIC_IAM_BOOTSTRAP_ORG_ID?.trim() || "district-001-root",
  };
}

function buildOrgLookup(rows: V2SysOrgItem[]): Map<string, { orgName: string; orgPath: string }> {
  const m = new Map<string, { orgName: string; orgPath: string }>();
  for (const r of rows) {
    const name = String(r.orgName ?? "").trim() || r.orgId;
    const path = String(r.orgPath ?? "").trim() || name;
    m.set(r.orgId, { orgName: name, orgPath: path });
  }
  return m;
}

function toUserRecord(row: V2SysUserItem, orgLookup: Map<string, { orgName: string; orgPath: string }>): UserRecord {
  const oid = row.userOrgId?.trim() || "";
  const fromTree = oid ? orgLookup.get(oid) : undefined;
  const joinName = row.orgName?.trim();
  const orgName = joinName || fromTree?.orgName || (oid ? oid : "—");
  const orgPath = (fromTree?.orgPath || joinName || orgName).trim();
  const roleIds = row.userRoleId ? [row.userRoleId as RoleId] : [];
  return {
    id: row.userId,
    username: row.loginName,
    expireDate: row.expireDate ?? null,
    realName: row.userName,
    nickname: row.userNickName ?? "",
    userLogo: row.userLogo ?? null,
    phone: row.userPhone ?? "",
    email: row.userEmail ?? "",
    orgId: oid,
    orgName,
    orgPath,
    roleIds,
    status: row.status === "y" ? "正常" : "冻结",
    roleName: row.roleName?.trim() || null,
    lastLoginTime: row.lastLoginTime ?? null,
    comments: row.comments ?? null,
    createTime: row.createTime ?? null,
    updateTime: row.updateTime ?? null,
  };
}

async function fetchOrgLookup(actor: CoreApiActor): Promise<Map<string, { orgName: string; orgPath: string }>> {
  try {
    const flat = await fetchV2SysOrgTree(actor);
    return buildOrgLookup(flat);
  } catch {
    return new Map();
  }
}

function buildCreatePayload(body: ConsoleUserUpsertBody): CreateV2SysUserInput {
  const status: "y" | "n" = body.status === "正常" ? "y" : "n";
  const pwd = body.passwordPlain?.trim();
  if (!pwd || pwd.length < 6) {
    throw new ConsoleUsersMockError("新建用户须设置至少 6 位初始密码", 400, "PWD_REQUIRED");
  }
  return {
    userName: (body.realName || body.username).trim() || body.username.trim(),
    loginName: body.username.trim(),
    loginPwd: pwd,
    userOrgId: body.orgId.trim() || undefined,
    userRoleId: body.roleIds[0] ?? undefined,
    userNickName: body.nickname.trim() || undefined,
    userPhone: body.phone.trim() || undefined,
    userEmail: body.email.trim() || undefined,
    expireDate: body.expireDate || undefined,
    status,
    comments: undefined,
  };
}

function buildUpdatePayload(body: ConsoleUserUpsertBody): UpdateV2SysUserInput {
  const status: "y" | "n" = body.status === "正常" ? "y" : "n";
  const patch: UpdateV2SysUserInput = {
    userName: (body.realName || body.username).trim() || body.username.trim(),
    loginName: body.username.trim(),
    userOrgId: body.orgId.trim() || undefined,
    userRoleId: body.roleIds[0] ?? undefined,
    userNickName: body.nickname.trim() || undefined,
    userPhone: body.phone.trim() || undefined,
    userEmail: body.email.trim() || undefined,
    expireDate: body.expireDate || undefined,
    status,
    comments: undefined,
  };
  const pwd = body.passwordPlain?.trim();
  if (pwd && pwd.length >= 6) patch.loginPwd = pwd;
  return patch;
}

export async function fetchConsoleUsersList(query: ConsoleUserListQuery): Promise<{ items: UserRecord[]; total: number }> {
  const actor = getConsoleUsersActor();
  const orgLookup = await fetchOrgLookup(actor);
  const result = await fetchV2SysUserList(actor, {
    keyword: query.search?.trim() || undefined,
    userRoleId: query.roleId && query.roleId !== "all" ? query.roleId : undefined,
    userOrgId: query.userOrgId?.trim() || undefined,
    page: 1,
    pageSize: 100,
  });
  return {
    items: result.items.map((r) => toUserRecord(r, orgLookup)),
    total: result.total,
  };
}

export async function fetchConsoleUserById(id: string): Promise<UserRecord | null> {
  try {
    const actor = getConsoleUsersActor();
    const orgLookup = await fetchOrgLookup(actor);
    return toUserRecord(await fetchV2SysUserById(actor, id), orgLookup);
  } catch (err) {
    if (err instanceof Error && /404/.test(err.message)) return null;
    throw err;
  }
}

export async function createConsoleUser(body: ConsoleUserUpsertBody): Promise<UserRecord> {
  const actor = getConsoleUsersActor();
  const orgLookup = await fetchOrgLookup(actor);
  return toUserRecord(await createV2SysUser(actor, buildCreatePayload(body)), orgLookup);
}

export async function updateConsoleUser(id: string, body: ConsoleUserUpsertBody): Promise<UserRecord> {
  const actor = getConsoleUsersActor();
  const orgLookup = await fetchOrgLookup(actor);
  return toUserRecord(await updateV2SysUser(actor, id, buildUpdatePayload(body)), orgLookup);
}

export async function batchSetConsoleUserStatus(ids: string[], status: "正常" | "冻结"): Promise<number> {
  const actor = getConsoleUsersActor();
  const res = await batchUpdateV2SysUserStatus(actor, ids, status === "正常" ? "y" : "n");
  return res.updated;
}
