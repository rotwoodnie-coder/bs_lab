import * as React from "react";

import type { RoleId } from "@/lib/console/users/types";

export type UserManagementCohort = "student" | "researcher" | "school_admin";
export type UserManagementStatus = "正常" | "冻结";

export const SEARCH_DEBOUNCE_MS = 400;

export const MOCK_PERMISSIONS = [
  { id: "experiment.read", label: "查看实验与数据" },
  { id: "experiment.write", label: "创建与编辑实验" },
  { id: "console.users", label: "用户与角色管理" },
  { id: "console.audit", label: "审计与合规导出" },
  { id: "school.settings", label: "校级基础配置" },
] as const;

export function seedPermissionIds(roleIds: RoleId[]): string[] {
  const s = new Set<string>();

  if (roleIds.some((r) => r === "Role_Sys_Admin" || r === "Role_District_Admin")) {
    MOCK_PERMISSIONS.forEach((p) => s.add(p.id));
    return [...s];
  }

  if (roleIds.includes("Role_School_Admin")) {
    s.add("experiment.read");
    s.add("experiment.write");
    s.add("school.settings");
  }

  if (roleIds.includes("Role_Teacher") || roleIds.includes("Role_Researcher")) {
    s.add("experiment.read");
    s.add("experiment.write");
  }

  if (roleIds.includes("Role_Student")) s.add("experiment.read");
  if (roleIds.includes("Role_Parent")) s.add("experiment.read");

  return [...s];
}

export function useDebouncedValue(value: string, delayMs: number) {
  const [debounced, setDebounced] = React.useState(value);

  React.useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(t);
  }, [delayMs, value]);

  return debounced;
}

