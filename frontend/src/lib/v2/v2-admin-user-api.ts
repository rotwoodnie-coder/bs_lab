import { buildApiUrl, buildCoreApiJsonHeaders, buildCoreApiReadHeaders, type CoreApiActor } from "@/lib/core-api-shared";

export type V2AdminUserRoleItem = {
  seqId: string;
  roleId: string;
  orgId: string | null;
  isEnabled: boolean;
  sortOrder: number | null;
  roleName: string | null;
  orgName: string | null;
};

export type V2AdminUserRoleSyncItem = {
  roleId: string;
  orgId?: string | null;
  isEnabled?: boolean;
  setAsDefault?: boolean;
};

export type V2AdminIdentitySearchItem = {
  userId: string;
  userName: string;
  loginName: string;
  userOrgId: string | null;
  userRoleId: string | null;
  orgName: string | null;
  roleName: string | null;
  attachedRoleNames: string | null;
  availableContexts: Array<{ roleId: string; roleName: string | null; orgId: string | null; orgName: string | null }>;
  status: string;
  updateTime: string | null;
};

export class V2AdminUserApiError extends Error {
  code?: string;
  constructor(message: string, code?: string) {
    super(message);
    this.name = "V2AdminUserApiError";
    this.code = code;
  }
}

async function readJson<T>(res: Response): Promise<T> {
  const json = await res.json() as { success: boolean; data: T; error: { message: string; code?: string } | null };
  if (!json.success) {
    throw new V2AdminUserApiError(json.error?.message ?? "请求失败", json.error?.code);
  }
  return json.data;
}

async function getJson<T>(path: string, actor: CoreApiActor): Promise<T> {
  const res = await fetch(buildApiUrl(path), { headers: buildCoreApiReadHeaders(actor), credentials: "include" });
  return readJson<T>(res);
}

async function postJson<T>(path: string, actor: CoreApiActor, body: unknown): Promise<T> {
  const res = await fetch(buildApiUrl(path), {
    method: "POST",
    headers: buildCoreApiJsonHeaders(actor),
    body: JSON.stringify(body),
    credentials: "include",
  });
  return readJson<T>(res);
}

export function searchV2AdminUserIdentity(actor: CoreApiActor, keyword: string): Promise<{ items: V2AdminIdentitySearchItem[] }> {
  return getJson(`/v2/admin/user/identity-search?keyword=${encodeURIComponent(keyword)}`, actor);
}

export function fetchV2AdminUserRoles(actor: CoreApiActor, userId: string): Promise<{
  user: { userId: string; userName: string; loginName: string; userOrgId: string | null; userRoleId: string | null; orgName: string | null; roleName: string | null };
  roles: V2AdminUserRoleItem[];
}> {
  return getJson(`/v2/admin-user/${encodeURIComponent(userId)}/roles`, actor);
}

export function syncV2AdminUserRoles(actor: CoreApiActor, userId: string, roles: V2AdminUserRoleSyncItem[]): Promise<{ synced: boolean; should_relogin?: boolean; invalidated: boolean }> {
  return postJson(`/v2/admin-user/${encodeURIComponent(userId)}/roles`, actor, { roles });
}

export function fixV2AdminUserIdentity(actor: CoreApiActor, userId: string): Promise<{ fixed: boolean; invalidated: boolean; should_relogin: boolean }> {
  return postJson(`/v2/admin/user/${encodeURIComponent(userId)}/fix-identity`, actor, {});
}

export function forceReloginAfterRoleSync(payload?: { should_relogin?: boolean }): void {
  if (typeof window === "undefined") return;
  if (payload?.should_relogin === false) return;
  try {
    window.localStorage.clear();
    window.sessionStorage.clear();
  } catch {
    // ignore
  }
  window.location.href = "/login";
}

export function mapAdminUserRoleSyncErrorToToast(err: unknown): string {
  if (err instanceof V2AdminUserApiError) {
    switch (err.code) {
      case "ROLE_CONFLICT_TEACHER_WITH_STUDENT":
        return "保存失败：教师主角色禁止同时绑定学生身份。";
      case "ROLE_CONFLICT_STUDENT_WITH_TEACHER":
        return "保存失败：学生主角色禁止同时绑定教师身份。";
      case "UNAUTHORIZED":
        return "保存失败：请重新登录后再试。";
      case "FORBIDDEN":
        return "保存失败：当前账号没有权限执行该操作。";
      default:
        return err.message || "保存失败";
    }
  }
  return err instanceof Error ? err.message : "保存失败";
}
