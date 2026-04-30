/**
 * V2 系统主数据 API 客户端
 * 对接后端 /v2/sys-user  /v2/sys-org
 */
import { buildApiUrl, buildCoreApiJsonHeaders, buildCoreApiReadHeaders, type CoreApiActor } from "@/lib/core-api-shared";
import { fetchAdminDictScreen } from "@/lib/v2/v2-admin-dict-api";

export type V2OrgTypeDictItem = { id: string; name: string; sortOrder?: number | null; comments?: string | null };
export type V2SchoolGradeDictItem = { id: string; name: string; sortOrder?: number | null; comments?: string | null };

export async function fetchV2OrgTypes(actor: CoreApiActor): Promise<V2OrgTypeDictItem[]> {
  const screen = await fetchAdminDictScreen(actor, "data_org_type");
  return screen.rows.map((row) => ({
    id: String(row.type_id ?? row.id ?? ""),
    name: String(row.type_name ?? row.name ?? ""),
    sortOrder: typeof row.sort_order === "number" ? row.sort_order : null,
    comments: typeof row.comments === "string" ? row.comments : null,
  }));
}

export async function fetchV2SchoolGrades(actor: CoreApiActor): Promise<V2SchoolGradeDictItem[]> {
  const screen = await fetchAdminDictScreen(actor, "data_school_grade");
  return screen.rows.map((row) => ({
    id: String(row.grade_id ?? row.id ?? ""),
    name: String(row.grade_name ?? row.name ?? ""),
    sortOrder: typeof row.sort_order === "number" ? row.sort_order : null,
    comments: typeof row.comments === "string" ? row.comments : null,
  }));
}

export const fetchV2SchoolLevels = fetchV2SchoolGrades;

// ─── 用户类型 ──────────────────────────────────────────────
export interface V2SysUserItem {
  userId: string;
  userName: string;
  loginName: string;
  userNickName: string | null;
  userPhone: string | null;
  userEmail: string | null;
  userOrgId: string | null;
  userRoleId: string | null;
  /** 对应 sys_user.user_logo（S3 URL） */
  userLogo: string | null;
  status: "y" | "n" | null;
  expireDate: string | null;
  prefTitleId: string | null;
  comments: string | null;
  createTime: string | null;
  updateTime: string | null;
  isDeleted: 0 | 1;
  /** 列表接口 JOIN sys_org */
  orgName?: string | null;
  /** 列表接口 JOIN data_role */
  roleName?: string | null;
  lastLoginTime?: string | null;
}

export interface V2SysUserListResult {
  items: V2SysUserItem[];
  total: number;
}

export type V2SysUserQuery = {
  keyword?: string;
  userOrgId?: string;
  userRoleId?: string;
  status?: "y" | "n";
  page?: number;
  pageSize?: number;
};

export interface CreateV2SysUserInput {
  userName: string;
  loginName: string;
  loginPwd: string;
  userOrgId?: string;
  userRoleId?: string;
  userNickName?: string;
  userPhone?: string;
  userEmail?: string;
  expireDate?: string;
  status?: "y" | "n";
  comments?: string;
}

export type UpdateV2SysUserInput = Partial<Omit<CreateV2SysUserInput, "loginPwd">> & {
  loginPwd?: string;
};

// ─── 组织类型 ──────────────────────────────────────────────
/** 与表 sys_org 及 GET /v2/sys-org/tree 返回字段一致（无 org_code：表中不存在该列） */
export interface V2SysOrgItem {
  orgId: string;
  orgName: string;
  /** 对应基线 `database/migrations/bs_exp_data.sql` 中 `sys_org.org_type_id`；有效取值以 `data_org_type` 为准，常量见 `V2_ORG_TYPE_IDS` */
  orgTypeId: string | null;
  gradeId: string | null;
  /** 学校类：`sys_org_school_grade` 多选年级；未迁移库时可能为空数组 */
  schoolGradeIds?: string[];
  parentOrgId: string | null;
  orgPath: string | null;
  status: "y" | "n" | null;
  sortOrder: number | null;
  createUserId?: string | null;
  updateUserId?: string | null;
  createTime: string | null;
  updateTime: string | null;
  isDeleted?: 0 | 1;
  /** 班级/年级下挂载的学生数量；由后端 `/v2/sys-org/tree` 接口返回 */
  studentCount?: number;
  children?: V2SysOrgItem[];
}

export interface V2SysOrgListResult {
  items: V2SysOrgItem[];
  total: number;
}

export type V2SysOrgQuery = {
  keyword?: string;
  orgTypeId?: string;
  parentOrgId?: string;
  status?: "y" | "n";
  page?: number;
  pageSize?: number;
};

export interface CreateV2SysOrgInput {
  orgName: string;
  orgTypeId?: string;
  gradeId?: string;
  /** 学校类：对应请求体 `school_grade_ids` */
  schoolGradeIds?: string[];
  parentOrgId?: string;
  orgPath?: string;
  status?: "y" | "n";
  sortOrder?: number;
}

/** PATCH /v2/sys-org/:id，与库表可写字段一致（不含改父级）。 */
export type UpdateV2SysOrgInput = {
  orgName?: string;
  orgTypeId?: string | null;
  gradeId?: string | null;
  parentOrgId?: string | null;
  /** 出现则整包替换关联表；对应请求体 `school_grade_ids` */
  schoolGradeIds?: string[];
  status?: "y" | "n";
  sortOrder?: number;
};

function toSysOrgCreateJson(input: CreateV2SysOrgInput): Record<string, unknown> {
  const o: Record<string, unknown> = { orgName: input.orgName };
  if (input.orgTypeId !== undefined) o.orgTypeId = input.orgTypeId;
  if (input.gradeId !== undefined) o.gradeId = input.gradeId;
  if (input.parentOrgId !== undefined) o.parentOrgId = input.parentOrgId;
  if (input.orgPath !== undefined) o.orgPath = input.orgPath;
  if (input.status !== undefined) o.status = input.status;
  if (input.sortOrder !== undefined) o.sortOrder = input.sortOrder;
  if (input.schoolGradeIds !== undefined) o.school_grade_ids = input.schoolGradeIds;
  return o;
}

function toSysOrgPatchJson(input: UpdateV2SysOrgInput): Record<string, unknown> {
  const o: Record<string, unknown> = {};
  if (input.orgName !== undefined) o.orgName = input.orgName;
  if (input.orgTypeId !== undefined) o.orgTypeId = input.orgTypeId;
  if (input.gradeId !== undefined) o.gradeId = input.gradeId;
  if (input.parentOrgId !== undefined) o.parentOrgId = input.parentOrgId;
  if (input.status !== undefined) o.status = input.status;
  if (input.sortOrder !== undefined) o.sortOrder = input.sortOrder;
  if (input.schoolGradeIds !== undefined) o.school_grade_ids = input.schoolGradeIds;
  return o;
}

// ─── 工具函数 ─────────────────────────────────────────────
async function v2Get<T>(path: string, actor: CoreApiActor, params?: Record<string, string | number | undefined>): Promise<T> {
  const url = new URL(buildApiUrl(path));
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== "") url.searchParams.set(k, String(v));
    }
  }
  const res = await fetch(url.toString(), { headers: buildCoreApiReadHeaders(actor), credentials: "include" });
  const json = await res.json() as { success: boolean; data: T; error: { message: string } | null };
  if (!json.success) throw new Error(json.error?.message ?? "请求失败");
  return json.data;
}

async function v2Post<T>(path: string, actor: CoreApiActor, body: unknown): Promise<T> {
  const res = await fetch(buildApiUrl(path), {
    method: "POST",
    headers: buildCoreApiJsonHeaders(actor),
    body: JSON.stringify(body),
    credentials: "include",
  });
  const json = await res.json() as { success: boolean; data: T; error: { message: string } | null };
  if (!json.success) throw new Error(json.error?.message ?? "请求失败");
  return json.data;
}

async function v2Patch<T>(path: string, actor: CoreApiActor, body: unknown): Promise<T> {
  const res = await fetch(buildApiUrl(path), {
    method: "PATCH",
    headers: buildCoreApiJsonHeaders(actor),
    body: JSON.stringify(body),
    credentials: "include",
  });
  const json = await res.json() as { success: boolean; data: T; error: { message: string } | null };
  if (!json.success) throw new Error(json.error?.message ?? "请求失败");
  return json.data;
}

async function v2Delete<T>(path: string, actor: CoreApiActor): Promise<T> {
  const res = await fetch(buildApiUrl(path), {
    method: "DELETE",
    headers: buildCoreApiReadHeaders(actor),
    credentials: "include",
  });
  const json = await res.json() as { success: boolean; data: T; error: { message: string } | null };
  if (!json.success) throw new Error(json.error?.message ?? "请求失败");
  return json.data;
}

// ─── 用户接口 ─────────────────────────────────────────────
export function fetchV2SysUserList(actor: CoreApiActor, query: V2SysUserQuery = {}): Promise<V2SysUserListResult> {
  return v2Get("/v2/sys-user", actor, query as Record<string, string | number | undefined>);
}

/** 搜索教师（免权限，默认返回全部教师，支持 keyword 过滤） */
export function fetchV2SysTeacherList(actor: CoreApiActor, keyword: string = "", pageSize: number = 200): Promise<V2SysUserListResult> {
  return v2Get("/v2/sys-user/teachers", actor, { keyword: keyword || undefined, pageSize });
}

export function fetchV2SysUserById(actor: CoreApiActor, userId: string): Promise<V2SysUserItem> {
  return v2Get(`/v2/sys-user/${encodeURIComponent(userId)}`, actor);
}

export function createV2SysUser(actor: CoreApiActor, input: CreateV2SysUserInput): Promise<V2SysUserItem> {
  return v2Post("/v2/sys-user", actor, input);
}

export function updateV2SysUser(actor: CoreApiActor, userId: string, input: UpdateV2SysUserInput): Promise<V2SysUserItem> {
  return v2Patch(`/v2/sys-user/${encodeURIComponent(userId)}`, actor, input);
}

export function batchUpdateV2SysUserStatus(actor: CoreApiActor, userIds: string[], status: "y" | "n"): Promise<{ updated: number }> {
  return v2Post<{ affected?: number }>("/v2/sys-user/batch-status", actor, { ids: userIds, status }).then((data) => ({
    updated: Number(data.affected ?? 0),
  }));
}

// ─── 组织接口 ─────────────────────────────────────────────
export function fetchV2SysOrgList(actor: CoreApiActor, query: V2SysOrgQuery = {}): Promise<V2SysOrgListResult> {
  return v2Get<unknown>("/v2/sys-org", actor, query as Record<string, string | number | undefined>).then((raw) => {
    if (Array.isArray(raw)) {
      const items = raw as V2SysOrgItem[];
      return { items, total: items.length };
    }
    const obj = raw as { items?: V2SysOrgItem[]; total?: number };
    return { items: obj.items ?? [], total: Number(obj.total ?? 0) };
  });
}

/**
 * 扁平组织列表（含 `parentOrgId`，无嵌套 `children`）；服务端按 `actor.orgId`（x-org-id）与 org_path 裁剪可见范围，超级管理员为全量。
 * 组树请使用 `buildOrgTreeFromFlat`（`@/lib/v2/build-org-tree-from-flat`）。
 */
export function fetchV2SysOrgTree(actor: CoreApiActor): Promise<V2SysOrgItem[]> {
  return v2Get<V2SysOrgItem[]>("/v2/sys-org/tree", actor).then((rows) =>
    rows.map((r) => ({ ...r, schoolGradeIds: r.schoolGradeIds ?? [] })),
  );
}

export function fetchV2SysOrgById(actor: CoreApiActor, orgId: string): Promise<V2SysOrgItem> {
  return v2Get(`/v2/sys-org/${encodeURIComponent(orgId)}`, actor);
}

export function createV2SysOrg(actor: CoreApiActor, input: CreateV2SysOrgInput): Promise<V2SysOrgItem> {
  return v2Post("/v2/sys-org", actor, toSysOrgCreateJson(input));
}

export function patchV2SysOrg(actor: CoreApiActor, orgId: string, input: UpdateV2SysOrgInput): Promise<V2SysOrgItem> {
  return v2Patch(`/v2/sys-org/${encodeURIComponent(orgId)}`, actor, toSysOrgPatchJson(input));
}

export function deleteV2SysOrg(actor: CoreApiActor, orgId: string): Promise<{ deleted: boolean }> {
  return v2Delete(`/v2/sys-org/${encodeURIComponent(orgId)}`, actor);
}
