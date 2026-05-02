"use client";

import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type MobileUserContext = {
  userId?: string;
  userName?: string;
  userNickName: string | null;
  userLogo: string | null;
  role: string | null;
  hasBinding: boolean;
  schoolLevelId: string | null;
  gradeId: string | null;
  orgId: string | null;
};

export type MobileChild = {
  studentUserId: string;
  studentUserName: string;
  classOrgName: string | null;
  schoolOrgName: string | null;
  avatar: string;
  relationLabel: string;
};

export type SchoolStage = "primary" | "middle" | "unknown";

type ProfileResponse = {
  success?: boolean;
  data?: {
    user_id?: string;
    user_name?: string;
    nickName?: string;
    nick_name?: string;
    avatar?: string;
    role?: string;
    has_binding?: boolean;
    school_level_id?: string | null;
    grade_id?: string | null;
    org_id?: string | null;
  };
};

function normalizeSchoolStage(schoolLevelId?: string | null): SchoolStage {
  const value = String(schoolLevelId ?? "").trim().toLowerCase();
  if (!value) return "unknown";
  if (
    value === "primary" ||
    value === "middle" ||
    value.includes("小学") ||
    value.includes("初中") ||
    value.includes("中学") ||
    value.includes("middle") ||
    value.includes("junior") ||
    value.includes("primary")
  ) {
    return value.includes("middle") || value.includes("junior") || value.includes("初中") || value.includes("中学") ? "middle" : "primary";
  }
  return "unknown";
}

type MobileContextValue = {
  userContext: MobileUserContext | null;
  children: MobileChild[];
  currentChildId: string | null;
  currentChild: MobileChild | null;
  setCurrentChildId: (value: string | null) => void;
  refreshUserContext: () => Promise<MobileUserContext>;
  getSchoolStage: () => SchoolStage;
  forceBindingComplete: () => void;
};

const MobileContext = createContext<MobileContextValue | null>(null);

const MOCK_CHILDREN: MobileChild[] = [
  { studentUserId: "student_001", studentUserName: "小明", classOrgName: "三年级一班", schoolOrgName: "实验小学", avatar: "XM", relationLabel: "大宝" },
  { studentUserId: "student_002", studentUserName: "小红", classOrgName: "四年级二班", schoolOrgName: "实验小学", avatar: "XH", relationLabel: "二宝" },
  { studentUserId: "student_003", studentUserName: "小宇", classOrgName: "初一一班", schoolOrgName: "实验中学", avatar: "XY", relationLabel: "三宝" },
];

function readCookie(name: string) {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function decodeMockToken(token: string) {
  const raw = token.split(".")[0] ?? "";
  const base64 = raw.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  try {
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

function buildMockProfile(): MobileUserContext {
  const token = readCookie("v2_access_token");
  const decoded = token ? decodeMockToken(token) : null;
  const role = String(decoded?.role ?? window.localStorage.getItem("mock-mobile-last-role") ?? "parent");
  const hasBinding = Boolean(decoded?.has_binding ?? (role !== "parent" || window.localStorage.getItem("mock-mobile-parent-bound") === "true"));
  const schoolLevelId = role === "teacher" ? "middle" : role === "student" ? "primary" : hasBinding ? "primary" : null;
  return {
    userId: `${role}_user`,
    userName: `${role}用户`,
    userNickName: role === "parent" ? "测试家长" : role === "student" ? "测试学生" : "测试老师",
    userLogo: null,
    role,
    hasBinding,
    schoolLevelId,
    gradeId: role === "student" ? "grade_1" : null,
    orgId: null,
  };
}

function normalizeProfileResponse(payload: ProfileResponse): MobileUserContext {
  const data = payload.data ?? {};
  const role = data.role ?? null;
  return {
    userId: data.user_id ?? data.user_name ?? undefined,
    userName: data.user_name ?? undefined,
    userNickName: data.nickName ?? data.nick_name ?? (role ? `${role}用户` : null),
    userLogo: data.avatar ?? null,
    role,
    hasBinding: Boolean(data.has_binding),
    schoolLevelId: data.school_level_id ?? null,
    gradeId: data.grade_id ?? null,
    orgId: data.org_id ?? null,
  };
}

export function MobileProvider({ children }: { children: ReactNode }) {
  const [userContext, setUserContext] = useState<MobileUserContext | null>(null);
  const [childrenList] = useState<MobileChild[]>(MOCK_CHILDREN);
  const [currentChildId, setCurrentChildId] = useState<string | null>(MOCK_CHILDREN[0]?.studentUserId ?? null);

  const refreshUserContext = async () => {
    try {
      const response = await fetch("/v2/auth/profile", { method: "GET", credentials: "include" });
      if (!response.ok) throw new Error(`profile failed: ${response.status}`);
      const payload = (await response.json()) as ProfileResponse;
      const normalized = normalizeProfileResponse(payload);
      setUserContext(normalized);
      return normalized;
    } catch {
      const mock = buildMockProfile();
      setUserContext(mock);
      return mock;
    }
  };

  useEffect(() => {
    void refreshUserContext().catch(() => undefined);
  }, []);

  useEffect(() => {
    const parentChildren = childrenList.length > 0 ? childrenList : MOCK_CHILDREN;
    if (!currentChildId || !parentChildren.some((child) => child.studentUserId === currentChildId)) {
      setCurrentChildId(parentChildren[0]?.studentUserId ?? null);
    }
  }, [childrenList, currentChildId]);

  const forceBindingComplete = useCallback(() => {
    setUserContext((prev) =>
      prev
        ? { ...prev, hasBinding: true }
        : {
            userId: undefined,
            userName: undefined,
            userNickName: null,
            userLogo: null,
            role: null,
            hasBinding: true,
            schoolLevelId: null,
            gradeId: null,
            orgId: null,
          },
    );
  }, []);

  const currentChild = useMemo(() => childrenList.find((child) => child.studentUserId === currentChildId) ?? null, [childrenList, currentChildId]);
  const getSchoolStage = useCallback(() => normalizeSchoolStage(userContext?.schoolLevelId), [userContext?.schoolLevelId]);

  const value = useMemo(
    () => ({ userContext, children: childrenList, currentChildId, currentChild, setCurrentChildId, refreshUserContext, getSchoolStage, forceBindingComplete }),
    [userContext, childrenList, currentChildId, currentChild, getSchoolStage],
  );

  return <MobileContext.Provider value={value}>{children}</MobileContext.Provider>;
}

export function useMobileContext() {
  const ctx = useContext(MobileContext);
  if (!ctx) throw new Error("MobileProvider missing");
  return ctx;
}
