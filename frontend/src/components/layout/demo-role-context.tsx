"use client";

import * as React from "react";

import { syncDemoUserRoleCookie } from "@/lib/demo-role-cookie";
import { USER_ROLE_ORDER, UserRole } from "@/types/auth";
import type { UserContext } from "@/types/org";

export function readInitialDemoRole(): UserRole {
  return UserRole.STUDENT;
}

function readStoredRole(): UserRole {
  return readInitialDemoRole();
}

function readStoredOrgId(_role: UserRole): string {
  return "org-school-east";
}

const DemoRoleContext = React.createContext<{
  role: UserRole;
  orgId: string;
  hydrated: boolean;
  setRole: (r: UserRole) => void;
  setOrgId: (id: string) => void;
  /** 与组织模型对齐的会话快照 */
  userContext: UserContext;
} | null>(null);

export function DemoRoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = React.useState<UserRole>(UserRole.STUDENT);
  const [orgId, setOrgIdState] = React.useState<string>("org-school-east");
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    const r = readStoredRole();
    syncDemoUserRoleCookie(r);
    setRoleState(r);
    setOrgIdState(readStoredOrgId(r));
    setHydrated(true);
  }, []);

  const setRole = React.useCallback((r: UserRole) => {
    setRoleState(r);
    syncDemoUserRoleCookie(r);
    const nextOrg = readStoredOrgId(r);
    setOrgIdState(nextOrg);
  }, []);

  const setOrgId = React.useCallback((id: string) => {
    setOrgIdState(id);
  }, []);

  const userContext = React.useMemo((): UserContext => ({ orgId, role }), [orgId, role]);

  const value = React.useMemo(
    () => ({ role, orgId, hydrated, setRole, setOrgId, userContext }),
    [role, orgId, hydrated, setRole, setOrgId, userContext],
  );

  return <DemoRoleContext.Provider value={value}>{children}</DemoRoleContext.Provider>;
}

export function useDemoRole(): {
  role: UserRole;
  orgId: string;
  hydrated: boolean;
  setRole: (r: UserRole) => void;
  setOrgId: (id: string) => void;
  userContext: UserContext;
} {
  const ctx = React.useContext(DemoRoleContext);
  // 兼容：某些页面历史上直接调用 useDemoRole，但未包 Provider。
  // 为避免影响真实联调身份，这里做安全降级（不抛错、不写入任何浏览器存储）。
  if (ctx) return ctx;
  const role = readStoredRole();
  const orgId = readStoredOrgId(role);
  const userContext: UserContext = { orgId, role };
  return {
    role,
    orgId,
    hydrated: true,
    setRole: () => {},
    setOrgId: () => {},
    userContext,
  };
}
