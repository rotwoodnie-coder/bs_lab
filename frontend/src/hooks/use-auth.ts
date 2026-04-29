"use client";

import * as React from "react";

import { UserRole } from "@/types/auth";
import {
  fetchV2Profile,
  readV2AuthSession,
  type V2AuthProfile,
} from "@/lib/v2/v2-auth-api";

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

const DEFAULT_AUTH_USER: AuthUser = {
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

function mapProfile(p: V2AuthProfile, tenantId: string, appId: string): AuthUser {
  return {
    role: roleCodeToAuthRole(p.userRoleId),
    roleId: typeof p.userRoleId === "string" ? p.userRoleId : null,
    orgId: p.userOrgId ?? "",
    userId: p.userId,
    userName: p.userName?.trim() || p.loginName || "用户",
    tenantId,
    appId,
    loginName: p.loginName ?? null,
    orgName: typeof p.orgName === "string" ? p.orgName : null,
    roleDisplayName: typeof p.roleName === "string" ? p.roleName : null,
    permissions: Array.isArray(p.permissions) ? p.permissions.map(String) : [],
    userLogo: typeof p.userLogo === "string" ? p.userLogo : null,
    userNickName: typeof p.userNickName === "string" ? p.userNickName : null,
    userPhone: p.userPhone ?? null,
    userEmail: p.userEmail ?? null,
    status: p.status ?? null,
    expireDate: typeof p.expireDate === "string" ? p.expireDate : null,
    lastLoginTime: typeof p.lastLoginTime === "string" ? p.lastLoginTime : null,
    prefTitleId: typeof p.prefTitleId === "string" ? p.prefTitleId : null,
    prefTitleName: typeof p.prefTitleName === "string" ? p.prefTitleName : null,
    perScore: typeof p.perScore === "number" ? p.perScore : Number(p.perScore ?? 0),
    perResume: typeof p.perResume === "string" ? p.perResume : null,
    comments: typeof p.comments === "string" ? p.comments : null,
    createUserId: typeof p.createUserId === "string" ? p.createUserId : null,
    createTime: typeof p.createTime === "string" ? p.createTime : null,
    updateUserId: typeof p.updateUserId === "string" ? p.updateUserId : null,
    updateTime: typeof p.updateTime === "string" ? p.updateTime : null,
    isDeleted: typeof p.isDeleted === "number" ? (p.isDeleted as 0 | 1) : null,
    recordUserOrgId: typeof p.recordUserOrgId === "string" ? p.recordUserOrgId : null,
    recordUserRoleId: typeof p.recordUserRoleId === "string" ? p.recordUserRoleId : null,
    recordOrgName: typeof p.recordOrgName === "string" ? p.recordOrgName : null,
    recordRoleName: typeof p.recordRoleName === "string" ? p.recordRoleName : null,
    sessionOrgName: typeof p.sessionOrgName === "string" ? p.sessionOrgName : null,
    sessionRoleName: typeof p.sessionRoleName === "string" ? p.sessionRoleName : null,
    teachingResearchGroups: Array.isArray(p.teachingResearchGroups)
      ? p.teachingResearchGroups
          .filter((g) => g && typeof g === "object")
          .map((g) => ({
            groupId: String((g as any).groupId ?? ""),
            groupName: String((g as any).groupName ?? ""),
            status: (String((g as any).status ?? "Y").toUpperCase() === "N" ? "N" : "Y") as "Y" | "N",
            ownerId: (g as any).ownerId ? String((g as any).ownerId) : null,
            ownerName: (g as any).ownerName ? String((g as any).ownerName).trim() || null : null,
            subjectId: (g as any).subjectId ? String((g as any).subjectId) : null,
          }))
          .filter((g) => g.groupId.length > 0)
      : [],
    userRoleBindings: Array.isArray((p as any).userRoleBindings)
      ? ((p as any).userRoleBindings as unknown[])
          .filter((b) => b && typeof b === "object")
          .map((b) => ({
            seqId: String((b as any).seqId ?? ""),
            roleId: String((b as any).roleId ?? ""),
            orgId: (b as any).orgId != null && String((b as any).orgId).trim() ? String((b as any).orgId) : null,
            roleName: (b as any).roleName != null ? String((b as any).roleName) : null,
            orgName: (b as any).orgName != null ? String((b as any).orgName) : null,
          }))
          .filter((b) => b.seqId.length > 0)
      : [],
    scoreTitleProgress: (() => {
      const raw = (p as any).scoreTitleProgress;
      if (!raw || typeof raw !== "object") return null;
      const tiers = Array.isArray(raw.tiers)
        ? raw.tiers
            .filter((t: unknown) => t && typeof t === "object")
            .map((t: any) => ({
              seqId: String(t.seqId ?? ""),
              titleName: String(t.titleName ?? ""),
              scoreNum: Number(t.scoreNum ?? 0),
              icon: t.icon != null ? String(t.icon) : null,
            }))
        : [];
      return {
        currentTitleName: raw.currentTitleName != null ? String(raw.currentTitleName) : null,
        nextTitleName: raw.nextTitleName != null ? String(raw.nextTitleName) : null,
        nextThreshold: raw.nextThreshold != null ? Number(raw.nextThreshold) : null,
        pointsToNext: raw.pointsToNext != null ? Number(raw.pointsToNext) : null,
        tiers,
      };
    })(),
    scaleLogRecent: Array.isArray((p as any).scaleLogRecent)
      ? ((p as any).scaleLogRecent as unknown[])
          .filter((r) => r && typeof r === "object")
          .map((r: any) => ({
            seqId: String(r.seqId ?? ""),
            scaleSource: r.scaleSource != null ? String(r.scaleSource) : null,
            scaleNum: Number(r.scaleNum ?? 0),
            createTime: r.createTime != null ? String(r.createTime) : null,
          }))
      : [],
    sysLogRecent: Array.isArray((p as any).sysLogRecent)
      ? ((p as any).sysLogRecent as unknown[])
          .filter((r) => r && typeof r === "object")
          .map((r: any) => ({
            logId: String(r.logId ?? ""),
            logType: r.logType != null ? String(r.logType) : null,
            logTime: r.logTime != null ? String(r.logTime) : null,
            logDataType: r.logDataType != null ? String(r.logDataType) : null,
            logDataId: r.logDataId != null ? String(r.logDataId) : null,
          }))
      : [],
    teachingSubjects: Array.isArray(p.teachingSubjects)
      ? p.teachingSubjects
          .filter((s) => s && typeof s === "object")
          .map((s) => ({ subjectId: String((s as any).subjectId ?? ""), subjectName: String((s as any).subjectName ?? "") }))
          .filter((s) => s.subjectId.length > 0 && s.subjectName.trim().length > 0)
      : [],
    sessionOrgPathNodes: Array.isArray(p.sessionOrgPathNodes)
      ? p.sessionOrgPathNodes
          .filter((n) => n && typeof n === "object")
          .map((n) => ({ orgId: String((n as any).orgId ?? ""), orgName: String((n as any).orgName ?? "") }))
          .filter((n) => n.orgId.length > 0)
      : [],
    recordOrgPathNodes: Array.isArray(p.recordOrgPathNodes)
      ? p.recordOrgPathNodes
          .filter((n) => n && typeof n === "object")
          .map((n) => ({ orgId: String((n as any).orgId ?? ""), orgName: String((n as any).orgName ?? "") }))
          .filter((n) => n.orgId.length > 0)
      : [],
    parentBindingSummary:
      p.parentBindingSummary && typeof p.parentBindingSummary === "object"
        ? { approvedCount: Number((p.parentBindingSummary as any).approvedCount ?? 0) }
        : null,
  };
}

export function useAuth(): {
  user: AuthUser;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
} {
  const [user, setUser] = React.useState<AuthUser>(() => ({ ...DEFAULT_AUTH_USER }));
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    const tenantId =
      process.env.NEXT_PUBLIC_EXPERIMENT_CATALOG_TENANT_ID?.trim() || DEFAULT_AUTH_USER.tenantId;
    const appId = "console";
    try {
      // 登录态真源：服务端 Cookie Session。localStorage 仅保留为开发期兜底（逐步移除）。
      const bootstrapId = process.env.NEXT_PUBLIC_V2_BOOTSTRAP_USER_ID?.trim() || "";
      if (bootstrapId) {
        // 兼容旧联调方式：仍允许用 userId 取 profile（后续会被 Actor 注入迁移替代）
        const session = typeof window !== "undefined" ? readV2AuthSession() : null;
        void session;
      }
      const profile = await fetchV2Profile();
      setUser(mapProfile(profile, tenantId, appId));
    } catch (e) {
      setUser({ ...DEFAULT_AUTH_USER, tenantId, appId });
      setError(e instanceof Error ? e.message : "鉴权上下文加载失败");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  return { user, loading, error, refresh: load };
}
