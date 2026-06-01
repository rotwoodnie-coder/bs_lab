"use client";

import { UserRole } from "@/types/auth";
import { useAuthContext } from "@/lib/v2/auth-context";
import type { AuthState } from "@/lib/v2/auth-context";

export type AuthRole =
  | "Role_Researcher"
  | "Role_District_Admin"
  | "Role_Sys_Admin"
  | "Role_School_Admin"
  | "Role_Teacher"
  | "Role_Student"
  | "Role_Parent";

/** sys_user_role 绑定行（GET /v2/auth/profile） */
export type UserRoleBinding = {
  seqId: string;
  roleId: string;
  orgId: string | null;
  roleName: string | null;
  orgName: string | null;
};

export type ScaleLogEntry = {
  seqId: string;
  scaleSource: string | null;
  scaleNum: number;
  createTime: string | null;
};

export type SysLogEntry = {
  logId: string;
  logType: string | null;
  logTime: string | null;
  logDataType: string | null;
  logDataId: string | null;
};

/** scale_title 档位与距下一档（服务端预计算） */
export type ScoreTitleProgress = {
  currentTitleName: string | null;
  nextTitleName: string | null;
  nextThreshold: number | null;
  pointsToNext: number | null;
  tiers: Array<{ seqId: string; titleName: string; scoreNum: number; icon: string | null }>;
};

export type AuthUser = {
  role: AuthRole;
  /** 后端 /v2/auth/profile 返回的原始 userRoleId（用于对齐 data_role / scale_title.role_id） */
  roleId: string | null;
  orgId: string;
  userId: string;
  userName: string;
  tenantId: string;
  appId: string;
  loginName: string | null;
  orgName: string | null;
  roleDisplayName: string | null;
  permissions: readonly string[];
  userLogo: string | null;
  userNickName: string | null;
  userPhone: string | null;
  userEmail: string | null;
  status: string | null;
  expireDate: string | null;
  lastLoginTime: string | null;
  prefTitleId: string | null;
  prefTitleName: string | null;
  perScore: number;
  perResume: string | null;
  comments: string | null;
  createUserId: string | null;
  createTime: string | null;
  updateUserId: string | null;
  updateTime: string | null;
  isDeleted: 0 | 1 | null;
  /** 主档所属组织 / 角色（sys_user 列），可能与当前会话 orgId / role 不同 */
  recordUserOrgId: string | null;
  recordUserRoleId: string | null;
  recordOrgName: string | null;
  recordRoleName: string | null;
  sessionOrgName: string | null;
  sessionRoleName: string | null;
  /** 弱组织身份：教研组归属（subject_group_member + subject_group；含负责人姓名） */
  teachingResearchGroups: Array<{
    groupId: string;
    groupName: string;
    status: "Y" | "N";
    ownerId: string | null;
    ownerName: string | null;
    subjectId: string | null;
  }>;
  /** 多组织/多角色（sys_user_role） */
  userRoleBindings: UserRoleBinding[];
  scoreTitleProgress: ScoreTitleProgress | null;
  scaleLogRecent: ScaleLogEntry[];
  sysLogRecent: SysLogEntry[];
  /** 教学学科（通过课题组 subject_id 映射 data_school_subject） */
  teachingSubjects: Array<{ subjectId: string; subjectName: string }>;
  /** 强组织路径（会话 orgId） */
  sessionOrgPathNodes: Array<{ orgId: string; orgName: string }>;
  /** 主档组织路径（sys_user.user_org_id） */
  recordOrgPathNodes: Array<{ orgId: string; orgName: string }>;
  /** 家长绑定摘要（用于门禁与引导） */
  parentBindingSummary: { approvedCount: number } | null;
};

export const DEFAULT_AUTH_USER: AuthUser = {
  role: "Role_Student",
  roleId: null,
  orgId: "",
  userId: "",
  userName: "未登录",
  tenantId: "district-001",
  appId: "console",
  loginName: null,
  orgName: null,
  roleDisplayName: null,
  permissions: [],
  userLogo: null,
  userNickName: null,
  userPhone: null,
  userEmail: null,
  status: null,
  expireDate: null,
  lastLoginTime: null,
  prefTitleId: null,
  prefTitleName: null,
  perScore: 0,
  perResume: null,
  comments: null,
  createUserId: null,
  createTime: null,
  updateUserId: null,
  updateTime: null,
  isDeleted: null,
  recordUserOrgId: null,
  recordUserRoleId: null,
  recordOrgName: null,
  recordRoleName: null,
  sessionOrgName: null,
  sessionRoleName: null,
  teachingResearchGroups: [],
  teachingSubjects: [],
  sessionOrgPathNodes: [],
  recordOrgPathNodes: [],
  userRoleBindings: [],
  scoreTitleProgress: null,
  scaleLogRecent: [],
  sysLogRecent: [],
  parentBindingSummary: null,
};

/** data_role.role_id（统一为 Role_*）→ 顶栏/业务用 AuthRole */
export function roleCodeToAuthRole(code: string | null | undefined): AuthRole {
  const c = (code ?? "").trim();
  if (c === "Role_Researcher") return "Role_Researcher";
  if (c === "Role_District_Admin") return "Role_District_Admin";
  if (c === "Role_Sys_Admin") return "Role_Sys_Admin";
  if (c === "Role_School_Admin") return "Role_School_Admin";
  if (c === "Role_Teacher") return "Role_Teacher";
  if (c === "Role_Student") return "Role_Student";
  if (c === "Role_Parent") return "Role_Parent";
  // 兼容旧 slug 格式（后端尚未跑 migration_v2_role_id_fix 的场景）
  if (c === "teacher") return "Role_Teacher";
  if (c === "student") return "Role_Student";
  if (c === "researcher") return "Role_Researcher";
  if (c === "system_admin") return "Role_Sys_Admin";
  if (c === "district_admin") return "Role_District_Admin";
  if (c === "school_admin") return "Role_School_Admin";
  if (c === "parent") return "Role_Parent";
  return "Role_Student";
}

export function authRoleToUserRole(role: AuthRole): UserRole {
  switch (role) {
    case "Role_Researcher":
      return UserRole.RESEARCHER;
    case "Role_District_Admin":
      return UserRole.DISTRICT_ADMIN;
    case "Role_Sys_Admin":
      return UserRole.SUPER_ADMIN;
    case "Role_School_Admin":
      return UserRole.SCHOOL_ADMIN;
    case "Role_Teacher":
      return UserRole.TEACHER;
    case "Role_Student":
      return UserRole.STUDENT;
    case "Role_Parent":
      return UserRole.PARENT;
    default:
      return UserRole.TEACHER;
  }
}

/**
 * 全局单例用户鉴权 Context。
 * 每个组件无需独立发起 profile 请求，由 <AuthProvider> 统一管理加载一次。
 * 401 重定向由请求锁机制统一处理（见 v2-auth-api.ts 的 redirectingToLogin 模块级锁）。
 */
export function useAuth(): AuthState {
  return useAuthContext();
}

/**
 * 判断当前用户是否拥有指定角色之一（Role_* 或 Subj_*）。
 * 先检查主身份 user.role，再检查 userRoleBindings 扩展绑定。
 * 用于菜单/按钮可见性守卫。
 */
export function hasAnyRole(user: AuthUser, ...roleIds: string[]): boolean {
  const main = user.role ?? user.roleId ?? "";
  if (roleIds.includes(main)) return true;
  return user.userRoleBindings.some((b) => roleIds.includes(b.roleId));
}
