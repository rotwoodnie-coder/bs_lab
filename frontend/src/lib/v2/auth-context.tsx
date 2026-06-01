"use client";

import * as React from "react";
import { fetchV2Profile } from "./v2-auth-api";
import {
  type AuthUser,
  DEFAULT_AUTH_USER,
  roleCodeToAuthRole,
} from "@/hooks/use-auth";

// ─── Types ────────────────────────────────────────────────

export type AuthState = {
  user: AuthUser;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

// ─── Context ──────────────────────────────────────────────

const AuthContext = React.createContext<AuthState | undefined>(undefined);

// ─── Internal helpers ────────────────────────────────────

function mapProfile(
  p: Record<string, unknown>,
  tenantId: string,
  appId: string,
): AuthUser {
  const roleId = String(p.userRoleId ?? "");
  const orgId = String(p.userOrgId ?? "");
  const userId = String(p.userId ?? "");
  const userName = String(p.userName ?? p.loginName ?? "用户").trim() || "用户";
  const loginName = p.loginName != null ? String(p.loginName) : null;
  const orgName = p.orgName != null ? String(p.orgName) : null;
  const roleName = p.roleName != null ? String(p.roleName) : null;

  return {
    role: roleCodeToAuthRole(roleId),
    roleId: roleId || null,
    orgId,
    userId,
    userName,
    tenantId,
    appId,
    loginName,
    orgName,
    roleDisplayName: roleName,
    permissions: Array.isArray(p.permissions)
      ? (p.permissions as string[]).map(String)
      : [],
    userLogo: typeof p.userLogo === "string" ? p.userLogo : null,
    userNickName: typeof p.userNickName === "string" ? p.userNickName : null,
    userPhone: p.userPhone != null ? String(p.userPhone) : null,
    userEmail: p.userEmail != null ? String(p.userEmail) : null,
    status: p.status != null ? String(p.status) : null,
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
      ? (p.teachingResearchGroups as Array<Record<string, unknown>>)
          .filter((g) => g && typeof g === "object")
          .map((g) => ({
            groupId: String(g.groupId ?? ""),
            groupName: String(g.groupName ?? ""),
            status: (String(g.status ?? "Y").toUpperCase() === "N" ? "N" : "Y") as "Y" | "N",
            ownerId: g.ownerId ? String(g.ownerId) : null,
            ownerName: g.ownerName ? String(g.ownerName).trim() || null : null,
            subjectId: g.subjectId ? String(g.subjectId) : null,
          }))
          .filter((g) => g.groupId.length > 0)
      : [],
    userRoleBindings: Array.isArray(p.userRoleBindings)
      ? (p.userRoleBindings as Array<Record<string, unknown>>)
          .filter((b) => b && typeof b === "object")
          .map((b) => ({
            seqId: String(b.seqId ?? ""),
            roleId: String(b.roleId ?? ""),
            orgId: b.orgId != null && String(b.orgId).trim() ? String(b.orgId) : null,
            roleName: b.roleName != null ? String(b.roleName) : null,
            orgName: b.orgName != null ? String(b.orgName) : null,
          }))
          .filter((b) => b.seqId.length > 0)
      : [],
    scoreTitleProgress: (() => {
      const raw = p.scoreTitleProgress as Record<string, unknown> | undefined;
      if (!raw || typeof raw !== "object") return null;
      const tiers = Array.isArray(raw.tiers)
        ? (raw.tiers as Array<Record<string, unknown>>)
            .filter((t) => t && typeof t === "object")
            .map((t) => ({
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
    scaleLogRecent: Array.isArray(p.scaleLogRecent)
      ? (p.scaleLogRecent as Array<Record<string, unknown>>)
          .filter((r) => r && typeof r === "object")
          .map((r) => ({
            seqId: String(r.seqId ?? ""),
            scaleSource: r.scaleSource != null ? String(r.scaleSource) : null,
            scaleNum: Number(r.scaleNum ?? 0),
            createTime: r.createTime != null ? String(r.createTime) : null,
          }))
      : [],
    sysLogRecent: Array.isArray(p.sysLogRecent)
      ? (p.sysLogRecent as Array<Record<string, unknown>>)
          .filter((r) => r && typeof r === "object")
          .map((r) => ({
            logId: String(r.logId ?? ""),
            logType: r.logType != null ? String(r.logType) : null,
            logTime: r.logTime != null ? String(r.logTime) : null,
            logDataType: r.logDataType != null ? String(r.logDataType) : null,
            logDataId: r.logDataId != null ? String(r.logDataId) : null,
          }))
      : [],
    teachingSubjects: Array.isArray(p.teachingSubjects)
      ? (p.teachingSubjects as Array<Record<string, unknown>>)
          .filter((s) => s && typeof s === "object")
          .map((s) => ({
            subjectId: String(s.subjectId ?? ""),
            subjectName: String(s.subjectName ?? ""),
          }))
          .filter((s) => s.subjectId.length > 0 && s.subjectName.trim().length > 0)
      : [],
    sessionOrgPathNodes: Array.isArray(p.sessionOrgPathNodes)
      ? (p.sessionOrgPathNodes as Array<Record<string, unknown>>)
          .filter((n) => n && typeof n === "object")
          .map((n) => ({ orgId: String(n.orgId ?? ""), orgName: String(n.orgName ?? "") }))
          .filter((n) => n.orgId.length > 0)
      : [],
    recordOrgPathNodes: Array.isArray(p.recordOrgPathNodes)
      ? (p.recordOrgPathNodes as Array<Record<string, unknown>>)
          .filter((n) => n && typeof n === "object")
          .map((n) => ({ orgId: String(n.orgId ?? ""), orgName: String(n.orgName ?? "") }))
          .filter((n) => n.orgId.length > 0)
      : [],
    parentBindingSummary:
      p.parentBindingSummary && typeof p.parentBindingSummary === "object"
        ? { approvedCount: Number((p.parentBindingSummary as Record<string, unknown>).approvedCount ?? 0) }
        : null,
  };
}

// ─── Provider ─────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
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
      const profile = await fetchV2Profile();
      setUser(mapProfile(profile as unknown as Record<string, unknown>, tenantId, appId));
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

  const value = React.useMemo<AuthState>(
    () => ({ user, loading, error, refresh: load }),
    [user, loading, error, load],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─── Consumer hook ────────────────────────────────────────

export function useAuthContext(): AuthState {
  const ctx = React.useContext(AuthContext);
  if (!ctx) {
    throw new Error(
      "useAuthContext() 必须在 <AuthProvider> 内使用。请确保 AppProviders 已包裹 AuthProvider。",
    );
  }
  return ctx;
}
