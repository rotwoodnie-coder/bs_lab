/**
 * 角色选择器（无状态）
 *
 * 📌 Props 驱动：数据源与选中态由父级通过 props 注入。
 *    未来也可用于审计日志角色选择、批量授权向导等场景。
 */
"use client";

import * as React from "react";
import { Button, Skeleton } from "@bs-lab/ui";
import type { RoleItem } from "../page.types";

export type RoleSelectorProps = {
  /** 角色列表（从后端加载） */
  roles: RoleItem[];
  /** 当前选中角色 ID */
  selectedRoleId: string | null;
  /** 角色列表加载中 */
  loading?: boolean;
  /** 角色列表加载失败 */
  error?: boolean;
  /** 选中回调 */
  onSelect: (roleId: string) => void;
};

export function RoleSelector({
  roles,
  selectedRoleId,
  loading,
  error,
  onSelect,
}: RoleSelectorProps) {
  if (loading) {
    return (
      <div className="space-y-2 rounded-md border border-border p-3">
        <p className="px-1 text-xs font-medium text-muted-foreground">当前编辑角色ID</p>
        <div className="flex flex-col gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full rounded-md" />
          ))}
        </div>
      </div>
    );
  }

  if (error || roles.length === 0) {
    return (
      <div className="space-y-2 rounded-md border border-border p-3">
        <p className="px-1 text-xs font-medium text-muted-foreground">当前编辑角色ID</p>
        <p className="px-1 text-sm text-muted-foreground">
          {error ? "加载失败" : "暂无角色"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2 rounded-md border border-border p-3">
      <p className="px-1 text-xs font-medium text-muted-foreground">当前编辑角色</p>
      <div className="flex flex-col gap-2">
        {roles.map((r) => (
          <Button
            key={r.roleId}
            type="button"
            variant={r.roleId === selectedRoleId ? "secondary" : "ghost"}
            className="h-9 w-full justify-start font-normal"
            onClick={() => onSelect(r.roleId)}
          >
            {r.roleName}
          </Button>
        ))}
      </div>
    </div>
  );
}
