/**
 * 角色权限页 Hooks
 *
 * 加载角色列表（data_role）、汇总各导航定义构建页面可见性矩阵。
 */
"use client";

import * as React from "react";
import { useAuth } from "@/hooks/use-auth";
import { buildMaterialsApiActor } from "@/lib/materials-api-actor";
import type { CoreApiActor } from "@/lib/core-api-shared";
import { listSysRoles, type SysRoleRecord } from "@/lib/v2/v2-sys-role-api";
import { sonnerToast } from "@bs-lab/ui";

import {
  NAV_CONFIG,
  DASHBOARD_FOOTER_NAV,
} from "@/config/nav-config/matrix";
import type { SystemNavItemDefinition } from "@/config/nav-config.types";
import { UserRole } from "@/types/auth";

import { NAV_LABELS } from "@/config/nav-config/nav-labels";
import { roleLabel } from "@/lib/console/users/format";
import type { UseRolesPageReturn, AuthRole, PageAccessRow } from "./page.types";

/* ───────── UserRole → AuthRole 映射 ───────── */
function userRoleToAuthRole(role: UserRole): AuthRole {
  return role as AuthRole;
}

/* ───────── 构建页面可见性矩阵 ───────── */

/** 角色与其对应的管理模式页面列表 */
function getManagementNavItems(role: UserRole): readonly SystemNavItemDefinition[] {
  return NAV_CONFIG[role]?.management ?? [];
}

/** 门户模式页面列表 */
function getPortalNavItems(role: UserRole): readonly SystemNavItemDefinition[] {
  return NAV_CONFIG[role]?.portal ?? [];
}

function buildPageKey(item: SystemNavItemDefinition): string {
  return item.id;
}

function pageLabelFromNav(item: SystemNavItemDefinition): string {
  const knownLabels: Record<string, string> = NAV_LABELS as Record<string, string>;
  return knownLabels[item.id] ?? item.label;
}

function buildAccessMatrix(): PageAccessRow[] {
  const pageMap = new Map<string, PageAccessRow>();

  /** 辅助函数：记录一个页面条目对特定角色的可见性 */
  function addPageForRole(
    item: SystemNavItemDefinition,
    role: AuthRole,
    section: string,
  ) {
    const key = buildPageKey(item);
    const existing = pageMap.get(key);
    if (existing) {
      existing.roles[role] = true;
    } else {
      pageMap.set(key, {
        pageId: key,
        pageLabel: pageLabelFromNav(item),
        pageHref: item.href,
        section,
        roles: { [role]: true },
      });
    }
  }

  // 遍历 7 个角色，分别收集 portal + management 页面
  const roles: UserRole[] = [
    UserRole.SUPER_ADMIN,
    UserRole.DISTRICT_ADMIN,
    UserRole.SCHOOL_ADMIN,
    UserRole.RESEARCHER,
    UserRole.TEACHER,
    UserRole.STUDENT,
    UserRole.PARENT,
  ];

  for (const userRole of roles) {
    const authRole = userRoleToAuthRole(userRole);

    // portal 页
    const portalItems = getPortalNavItems(userRole);
    for (const item of portalItems) {
      addPageForRole(item, authRole, "门户");
    }

    // 管理台页
    const mgmtItems = getManagementNavItems(userRole);
    for (const item of mgmtItems) {
      addPageForRole(item, authRole, roleLabel(authRole));
    }
  }

  // 底部导航（所有角色）
  for (const item of DASHBOARD_FOOTER_NAV) {
    const key = buildPageKey(item);
    const existing = pageMap.get(key);
    if (existing) {
      // 补全所有角色
      for (const role of roles.map(userRoleToAuthRole)) {
        existing.roles[role] = true;
      }
    } else {
      const rolesForFooter: Partial<Record<AuthRole, boolean>> = {};
      for (const role of roles.map(userRoleToAuthRole)) {
        rolesForFooter[role] = true;
      }
      pageMap.set(key, {
        pageId: key,
        pageLabel: pageLabelFromNav(item),
        pageHref: item.href,
        section: "底部导航",
        roles: rolesForFooter,
      });
    }
  }

  return Array.from(pageMap.values());
}

/* ───────── Hook ───────── */

export function useRolesPage(): UseRolesPageReturn {
  const auth = useAuth();
  const actor = React.useMemo<CoreApiActor>(
    () =>
      buildMaterialsApiActor(auth.user.role as any, auth.user.orgId, "sys-role") as CoreApiActor,
    [auth.user.orgId, auth.user.role],
  );

  /* ─── 角色列表 ─── */
  const [roles, setRoles] = React.useState<SysRoleRecord[]>([]);
  const [rolesLoading, setRolesLoading] = React.useState(true);
  const [rolesError, setRolesError] = React.useState(false);

  /* ─── 当前选中角色 ─── */
  const [selectedRoleId, setSelectedRoleId] = React.useState<string | null>(null);

  /* ─── 身份治理面板 ─── */
  const [identityDrawerOpen, setIdentityDrawerOpen] = React.useState(false);

  /* ─── 页面可见性矩阵 ─── */
  const [accessMatrix, setAccessMatrix] = React.useState<PageAccessRow[]>([]);

  /* ─── 加载角色列表（仅首次） ─── */
  React.useEffect(() => {
    setRolesLoading(true);
    setRolesError(false);
    listSysRoles(actor)
      .then((data) => {
        setRoles(data);
        const first = data[0];
        if (first) setSelectedRoleId(first.roleId);
      })
      .catch(() => {
        setRolesError(true);
        sonnerToast.error("加载角色列表失败");
      })
      .finally(() => setRolesLoading(false));
  }, [actor]);

  /* ─── 计算页面可见性矩阵（仅首次） ─── */
  React.useEffect(() => {
    setAccessMatrix(buildAccessMatrix());
  }, []);

  /* ─── 回调 ─── */
  const handleRoleChange = React.useCallback((roleId: string) => {
    setSelectedRoleId(roleId);
  }, []);

  return {
    roles,
    rolesLoading,
    rolesError,
    selectedRoleId,
    selectedRoleLabel: selectedRoleId ? roleLabel(selectedRoleId) : "",
    accessMatrix,
    identityDrawerOpen,
    setIdentityDrawerOpen,
    handleRoleChange,
  };
}
