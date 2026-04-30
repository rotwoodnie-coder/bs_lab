"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { buildPagePermissionCode, findPagePermissionByPath } from "./page-permissions";

function isPermissionConfigSuperUser(roleId: string | null | undefined, loginName?: string | null, role?: string | null): boolean {
  const rid = String(roleId ?? "").trim();
  const login = String(loginName ?? "").trim().toLowerCase();
  const r = String(role ?? "").trim();
  return rid === "Role_Sys_Admin" || rid === "system_admin" || r === "Role_Sys_Admin" || login === "admin";
}

function isPermissionConfigEntryPage(pathname: string): boolean {
  return pathname === "/console/settings/system/roles";
}

export function usePageReadPermission(pathname: string): boolean {
  const { user, loading } = useAuth();
  if (loading) return true;
  if (isPermissionConfigEntryPage(pathname)) return true;
  if (isPermissionConfigSuperUser(user.roleId, user.loginName, user.role)) return true;
  const page = findPagePermissionByPath(pathname);
  if (!page) return true;
  const code = buildPagePermissionCode(page.menuCode, "READ");
  return user.permissions.includes(code);
}

export function withPermission<P extends object>(Component: React.ComponentType<P>, pathname: string) {
  return function WithPermission(props: P) {
    const router = useRouter();
    const { loading } = useAuth();
    const canRead = usePageReadPermission(pathname);

    React.useEffect(() => {
      if (loading) return;
      if (!canRead) router.replace("/403");
    }, [canRead, loading, router]);

    if (loading) {
      return <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">权限加载中…</div>;
    }
    if (!canRead) {
      return <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">403 无权限</div>;
    }
    return <Component {...props} />;
  };
}
