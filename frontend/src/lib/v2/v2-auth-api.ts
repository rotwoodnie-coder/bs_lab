/**
 * V2 认证 API：/v2/auth/login、profile、change-password
 * 会话仅存 userId（与后端 x-user-id 对齐），不含令牌。
 */
import { buildApiUrl } from "@/lib/core-api-shared";

export const V2_AUTH_SESSION_KEY = "bs_lab_v2_auth_session";

export type V2AuthSession = {
  userId: string;
  loginName?: string;
  userRoleId?: string | null;
  userOrgId?: string | null;
  userName?: string;
};

export type V2LoginResult = {
  userId: string;
  userName: string;
  loginName: string;
  userRoleId: string | null;
  roleName: string | null;
  userOrgId: string | null;
  orgName: string | null;
  userLogo: string | null;
  perScore: number;
  permissions?: string[];
};

/** 与 GET /v2/auth/profile 返回的 sys_user 安全字段一致 */
export type V2AuthProfile = {
  userId: string;
  userName: string;
  userOrgId: string | null;
  userRoleId: string | null;
  userLogo?: string | null;
  userNickName?: string | null;
  loginName: string;
  userPhone: string | null;
  userEmail: string | null;
  expireDate?: string | null;
  comments?: string | null;
  lastLoginTime?: string | null;
  prefTitleId?: string | null;
  prefTitleName?: string | null;
  perResume?: string | null;
  perScore?: number;
  orgName?: string;
  roleName?: string;
  /** 主档 sys_user.user_org_id（可能与当前会话组织不同） */
  recordUserOrgId?: string | null;
  recordUserRoleId?: string | null;
  recordOrgName?: string | null;
  recordRoleName?: string | null;
  sessionOrgName?: string | null;
  sessionRoleName?: string | null;
  teachingResearchGroups?: Array<{
    groupId: string;
    groupName: string;
    status: "Y" | "N";
    ownerId: string | null;
    ownerName?: string | null;
    subjectId: string | null;
  }>;
  userRoleBindings?: Array<{
    seqId: string;
    roleId: string;
    orgId: string | null;
    roleName: string | null;
    orgName: string | null;
  }>;
  scoreTitleProgress?: {
    currentTitleName: string | null;
    nextTitleName: string | null;
    nextThreshold: number | null;
    pointsToNext: number | null;
    tiers: Array<{ seqId: string; titleName: string; scoreNum: number; icon: string | null }>;
  };
  scaleLogRecent?: Array<{ seqId: string; scaleSource: string | null; scaleNum: number; createTime: string | null }>;
  sysLogRecent?: Array<{ logId: string; logType: string | null; logTime: string | null; logDataType: string | null; logDataId: string | null }>;
  teachingSubjects?: Array<{ subjectId: string; subjectName: string }>;
  /** 组织路径节点（从根到叶），用于展示一级/二级/末级归属 */
  recordOrgPathNodes?: Array<{ orgId: string; orgName: string }>;
  sessionOrgPathNodes?: Array<{ orgId: string; orgName: string }>;
  createUserId?: string | null;
  createTime?: string | null;
  updateUserId?: string | null;
  updateTime?: string | null;
  isDeleted?: 0 | 1 | null;
  status: string | null;
  permissions?: string[];
  parentBindingSummary?: { approvedCount: number } | null;
  [key: string]: unknown;
};

type Envelope<T> = { success: boolean; data: T; error: { message: string } | null };

async function parseEnvelope<T>(res: Response): Promise<T> {
  const json = (await res.json()) as Envelope<T>;
  if (!json.success || !res.ok) {
    throw new Error(json.error?.message ?? `请求失败（HTTP ${res.status}）`);
  }
  return json.data;
}

function getCurrentPathname(): string {
  if (typeof window === "undefined") return "";
  return window.location.pathname || "";
}

function hasMobileMockRoleInStorage(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(window.localStorage.getItem("mock-mobile-login-role") || window.localStorage.getItem("mock-mobile-last-role"));
}

function shouldMockProfile(input: string): boolean {
  return process.env.NODE_ENV !== "production" && input.includes("/v2/auth/profile") && getCurrentPathname().startsWith("/m") && hasMobileMockRoleInStorage();
}

async function v2Fetch(input: string, init?: RequestInit): Promise<Response> {
  if (shouldMockProfile(input)) {
    const role = window.localStorage.getItem("mock-mobile-login-role") ?? window.localStorage.getItem("mock-mobile-last-role") ?? "student";
    const userRoleId = role === "parent" ? "Role_Parent" : role === "teacher" ? "Role_Teacher" : "Role_Student";
    const userName = role === "parent" ? "测试家长" : role === "teacher" ? "测试老师" : "测试学生";
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          userId: "test_user",
          userName,
          loginName: `test_${role}`,
          userRoleId,
          roleName: role === "parent" ? "家长" : role === "teacher" ? "老师" : "学生",
          userOrgId: null,
          orgName: null,
          userLogo: "",
          perScore: 0,
          permissions: [],
          status: "Y",
          userNickName: userName,
          has_binding: role !== "parent" || window.localStorage.getItem("mock-mobile-parent-bound") === "true",
        },
        error: null,
      }),
      { status: 200, headers: { "content-type": "application/json" } },
    );
  }
  return fetch(buildApiUrl(input), { ...init, credentials: "include" });
}

export function readV2AuthSession(): V2AuthSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(V2_AUTH_SESSION_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw) as V2AuthSession;
    if (o && typeof o.userId === "string" && o.userId.length > 0) return o;
  } catch {
    /* ignore */
  }
  return null;
}

export function writeV2AuthSession(session: V2AuthSession): void {
  localStorage.setItem(V2_AUTH_SESSION_KEY, JSON.stringify(session));
}

export function clearV2AuthSession(): void {
  localStorage.removeItem(V2_AUTH_SESSION_KEY);
}

export async function postV2Login(body: { loginName: string; loginPwd: string }): Promise<V2LoginResult> {
  const res = await v2Fetch("/v2/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return parseEnvelope<V2LoginResult>(res);
}

export async function postV2RegisterParent(body: {
  userName: string;
  loginName: string;
  loginPwd: string;
  userPhone?: string | null;
}): Promise<{ userId: string; loginName: string; userName: string }> {
  const res = await v2Fetch("/v2/auth/register-parent", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return parseEnvelope<{ userId: string; loginName: string; userName: string }>(res);
}

export async function fetchV2Profile(): Promise<V2AuthProfile> {
  const res = await v2Fetch("/v2/auth/profile", {
    method: "GET",
  });
  return parseEnvelope<V2AuthProfile>(res);
}

export async function postV2Logout(): Promise<void> {
  const res = await v2Fetch("/v2/auth/logout", { method: "POST" });
  await parseEnvelope<unknown>(res);
}

export async function postV2SwitchRole(body: { orgId: string; roleId: string }): Promise<{
  userId: string;
  userOrgId: string | null;
  userRoleId: string | null;
  orgName: string | null;
  roleName: string | null;
  permissions: string[];
}> {
  const res = await v2Fetch("/v2/auth/switch-role", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return parseEnvelope(res);
}

export async function postV2Refresh(): Promise<void> {
  const res = await v2Fetch("/v2/auth/refresh", { method: "POST" });
  await parseEnvelope<unknown>(res);
}

export async function postV2UpdateProfileLogo(userLogo: string | null): Promise<void> {
  const res = await v2Fetch("/v2/auth/profile/logo", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ userLogo }),
  });
  await parseEnvelope<unknown>(res);
}

export async function patchV2UpdateProfile(body: {
  userName?: string;
  userNickName?: string | null;
  userPhone?: string | null;
  userEmail?: string | null;
  perResume?: string | null;
  prefTitleId?: string | null;
  comments?: string | null;
}): Promise<void> {
  const res = await v2Fetch("/v2/auth/profile", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  await parseEnvelope<unknown>(res);
}

export async function postV2ChangePassword(
  body: { oldPwd: string; newPwd: string },
): Promise<void> {
  const res = await v2Fetch("/v2/auth/change-password", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  await parseEnvelope<unknown>(res);
}
