/**
 * 角色权限页 Hooks
 */
"use client";

import * as React from "react";
import { useAuth } from "@/hooks/use-auth";
import { buildMaterialsApiActor } from "@/lib/materials-api-actor";
import type { CoreApiActor } from "@/lib/core-api-shared";
import { listSysRoles, type SysRoleRecord } from "@/lib/v2/v2-sys-role-api";
import { getRoleMenuPermissions, listSysMenus, saveRoleMenuPermissions, type RoleMenuPermissionRecord, type SysMenuRecord } from "@/lib/v2/v2-role-permission-api";
import { sonnerToast } from "@bs-lab/ui";
import { getPermissionPresetByRole } from "@/lib/permissions/page-permissions";
import type { UseRolesPageReturn, AuthRole, PageAccessRow, RolePermissionRow, PermissionGroup } from "./page.types";
import { roleLabel } from "@/lib/console/users/format";
import { buildPagePermissionCode } from "@/lib/permissions/page-permissions";

const GROUPS: Record<string, string> = {
  "系统设置": "系统设置",
  "运维中心": "运维中心",
  "教师端": "教师端",
  "教研端": "教研端",
  "学生端": "学生端",
  "家长端": "家长端",
  "通用": "通用",
};

function groupByMenuCode(menuCode: string): string {
  if (menuCode.startsWith("user_") || menuCode.startsWith("role_") || menuCode.startsWith("org_") || menuCode.startsWith("class_") || menuCode.startsWith("parent_")) return "系统设置";
  if (menuCode.startsWith("ops_") || menuCode.includes("statistics")) return "运维中心";
  if (menuCode.startsWith("teacher_")) return "教师端";
  if (menuCode.startsWith("review_research_") || menuCode.startsWith("resource_")) return "教研端";
  if (menuCode.startsWith("student_")) return "学生端";
  if (menuCode.startsWith("family_")) return "家长端";
  return "通用";
}

function buildPermissionRows(menus: SysMenuRecord[], permissions: RoleMenuPermissionRecord[]): RolePermissionRow[] {
  const permMap = new Map(permissions.map((p) => [p.menuCode, p]));
  return menus.map((menu) => {
    const perm = permMap.get(menu.menuCode);
    return {
      menuId: menu.menuId,
      menuCode: menu.menuCode,
      menuName: menu.menuName,
      path: menu.path,
      canRead: perm?.canRead ?? false,
      canWrite: perm?.canWrite ?? false,
      readCode: buildPagePermissionCode(menu.menuCode, "READ"),
      writeCode: buildPagePermissionCode(menu.menuCode, "WRITE"),
      group: groupByMenuCode(menu.menuCode),
    };
  });
}

function buildPermissionGroups(rows: RolePermissionRow[], search: string, scope: UseRolesPageReturn["permissionScope"]): PermissionGroup[] {
  const kw = search.trim().toLowerCase();
  const filtered = rows.filter((row) => {
    const matchesSearch = !kw || row.menuName.toLowerCase().includes(kw) || row.menuCode.toLowerCase().includes(kw) || (row.path ?? "").toLowerCase().includes(kw);
    const matchesScope = scope === "all" ? true : scope === "read-on" ? row.canRead : scope === "write-on" ? row.canWrite : !row.canRead || !row.canWrite;
    return matchesSearch && matchesScope;
  });
  const grouped = new Map<string, RolePermissionRow[]>();
  for (const row of filtered) {
    const list = grouped.get(row.group) ?? [];
    list.push(row);
    grouped.set(row.group, list);
  }
  return Array.from(grouped.entries()).map(([group, items]) => ({ group, title: GROUPS[group] ?? group, items }));
}

function buildAccessMatrix(rows: RolePermissionRow[]): PageAccessRow[] {
  return rows.map((r) => ({ pageId: String(r.menuId), pageLabel: r.menuName, pageHref: r.path ?? "", section: r.group, roles: {} }));
}

export function useRolesPage(): UseRolesPageReturn & {
  permissionRows: RolePermissionRow[];
  permissionGroups: PermissionGroup[];
  saving: boolean;
  savePermissions: () => Promise<void>;
  sysMenus: SysMenuRecord[];
} {
  const auth = useAuth();
  const actor = React.useMemo<CoreApiActor>(() => buildMaterialsApiActor(auth.user.role as any, auth.user.orgId, "sys-role") as CoreApiActor, [auth.user.orgId, auth.user.role]);

  const [roles, setRoles] = React.useState<SysRoleRecord[]>([]);
  const [rolesLoading, setRolesLoading] = React.useState(true);
  const [rolesError, setRolesError] = React.useState(false);
  const [selectedRoleId, setSelectedRoleId] = React.useState<string | null>(null);
  const [identityDrawerOpen, setIdentityDrawerOpen] = React.useState(false);
  const [sysMenus, setSysMenus] = React.useState<SysMenuRecord[]>([]);
  const [permissionRows, setPermissionRows] = React.useState<RolePermissionRow[]>([]);
  const [permissionSearch, setPermissionSearch] = React.useState("");
  const [permissionScope, setPermissionScope] = React.useState<UseRolesPageReturn["permissionScope"]>("all");
  const [saving, setSaving] = React.useState(false);

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

  const reloadPermissionMatrix = React.useCallback(async () => {
    if (!selectedRoleId) return;
    try {
      const [menus, perm] = await Promise.all([listSysMenus(actor), getRoleMenuPermissions(actor, selectedRoleId)]);
      setSysMenus(menus);
      setPermissionRows(buildPermissionRows(menus, perm.items));
    } catch (err) {
      sonnerToast.error("加载角色权限失败", { description: err instanceof Error ? err.message : "请稍后重试" });
    }
  }, [actor, selectedRoleId]);

  React.useEffect(() => {
    void reloadPermissionMatrix();
  }, [reloadPermissionMatrix]);

  const permissionGroups = React.useMemo(() => buildPermissionGroups(permissionRows, permissionSearch, permissionScope), [permissionRows, permissionScope, permissionSearch]);
  const accessMatrix = React.useMemo(() => buildAccessMatrix(permissionRows), [permissionRows]);

  const handleRoleChange = React.useCallback((roleId: string) => setSelectedRoleId(roleId), []);

  const resetToPreset = React.useCallback(() => {
    if (!selectedRoleId) return;
    const preset = getPermissionPresetByRole(selectedRoleId as AuthRole);
    setPermissionRows((prev) => prev.map((row) => ({ ...row, ...(preset[row.menuCode] ?? { read: false, write: false }) })));
    sonnerToast.success("已恢复默认预设，请继续微调后保存");
  }, [selectedRoleId]);

  const updatePermissionRow = React.useCallback((menuId: number, patch: Partial<Pick<RolePermissionRow, "canRead" | "canWrite">>) => {
    setPermissionRows((prev) => prev.map((row) => (row.menuId === menuId ? { ...row, ...patch } : row)));
  }, []);

  const savePermissions = React.useCallback(async () => {
    if (!selectedRoleId) return;
    setSaving(true);
    try {
      const items = permissionRows.map((row) => ({ menuId: row.menuId, canRead: row.canRead, canWrite: row.canWrite }));
      await saveRoleMenuPermissions(actor, selectedRoleId, items);
      await auth.refresh();
      sonnerToast.success("角色权限已保存，当前会话已刷新");
      await reloadPermissionMatrix();
    } catch (err) {
      sonnerToast.error("保存失败", { description: err instanceof Error ? err.message : "请稍后重试" });
    } finally {
      setSaving(false);
    }
  }, [actor, auth, permissionRows, reloadPermissionMatrix, selectedRoleId]);

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
    permissionRows,
    permissionGroups,
    permissionSearch,
    permissionScope,
    setPermissionSearch,
    setPermissionScope,
    updatePermissionRow,
    saving,
    savePermissions,
    sysMenus,
    resetToPreset,
  };
}
