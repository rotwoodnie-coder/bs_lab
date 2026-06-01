"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { NAV_CONFIG } from "@/config/nav-config/matrix";
import { buildPagePermissionCode, findPagePermissionByPath } from "./page-permissions";
import type { UserRole } from "@/types/auth";

function isPermissionConfigSuperUser(roleId: string | null | undefined, loginName?: string | null, role?: string | null): boolean {
  const rid = String(roleId ?? "").trim();
  const login = String(loginName ?? "").trim().toLowerCase();
  const r = String(role ?? "").trim();
  return rid === "Role_Sys_Admin" || rid === "system_admin" || r === "Role_Sys_Admin" || login === "admin";
}

function isPermissionConfigEntryPage(pathname: string): boolean {
  return pathname === "/console/settings/system/roles";
}

/**
 * 校验当前路径在对应角色的管理台导航配置中是否有匹配项。
 * 当 sys_role_menu_perm 动态权限未配置时，作为降级兜底。
 */
function isPathInRoleNav(pathname: string, role: string): boolean {
  const navConfig = NAV_CONFIG[role as UserRole];
  if (!navConfig) return false;
  const allItems = [...navConfig.portal, ...navConfig.management];
  return allItems.some(
    (item) => pathname === item.href || pathname.startsWith(item.href + "/") || pathname.startsWith(item.href + "?"),
  );
}

export function usePageReadPermission(pathname: string): boolean {
  const { user, loading } = useAuth();
  if (loading) return true;
  if (isPermissionConfigEntryPage(pathname)) return true;
  if (isPermissionConfigSuperUser(user.roleId, user.loginName, user.role)) return true;
  const page = findPagePermissionByPath(pathname);
  if (!page) return true;
  const code = buildPagePermissionCode(page.menuCode, "READ");
  // 优先权限码检查（来自 sys_role_menu_perm 动态权限）
  if (user.permissions.includes(code)) return true;
  // 兜底：若动态权限未配置完整，检查路径是否在该角色的导航菜单中
  // 导航配置（NAV_CONFIG）本身就是各角色可访问页面的设计真源
  return isPathInRoleNav(pathname, user.role);
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
