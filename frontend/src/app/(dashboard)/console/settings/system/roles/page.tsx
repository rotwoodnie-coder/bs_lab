/**
 * 角色权限配置页
 *
 * 展示角色列表（data_role 真数据）与页面可见性矩阵（各角色可访问的页面）。
 * 权限为系统预设配置，不可在此编辑。
 */
"use client";

import * as React from "react";
import { Button, Card, CardContent } from "@bs-lab/ui";
import { PageHeader } from "@/components/layout/page-header";
import { DASHBOARD_MAIN_CONTAINER_CLASS } from "@/lib/layout-container-classes";
import { useRolesPage } from "./page.hooks";
import { RoleSelector } from "./_components/RoleSelector";
import { PageVisibilityMatrix } from "./_components/PageVisibilityMatrix";
import { IdentityGovernanceDrawer } from "./_components/IdentityGovernanceDrawer";

export default function ConsoleRolesPage() {
  const {
    roles,
    rolesLoading,
    rolesError,
    selectedRoleId,
    selectedRoleLabel,
    accessMatrix,
    identityDrawerOpen,
    setIdentityDrawerOpen,
    handleRoleChange,
  } = useRolesPage();

  return (
    <div className={DASHBOARD_MAIN_CONTAINER_CLASS}>
      <div className="space-y-6">
        <PageHeader
          title="角色与权限"
          description="页面可见性矩阵展示每个角色可访问的页面与功能入口。当前权限为系统预设配置，如需调整请联系系统管理员。"
          actions={
            <Button variant="outline" onClick={() => setIdentityDrawerOpen(true)}>
              打开身份治理
            </Button>
          }
        />

        <Card className="border-border shadow-none">
          <CardContent className="grid gap-6 lg:grid-cols-[200px_1fr]">
            <RoleSelector
              roles={roles}
              selectedRoleId={selectedRoleId}
              loading={rolesLoading}
              error={rolesError}
              onSelect={handleRoleChange}
            />

            <div className="min-w-0 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-foreground">
                  {selectedRoleId
                    ? `${selectedRoleLabel} — 页面可见性矩阵`
                    : "页面可见性矩阵"}
                </h3>
              </div>

              <PageVisibilityMatrix rows={accessMatrix} />
            </div>
          </CardContent>
        </Card>

        <IdentityGovernanceDrawer open={identityDrawerOpen} onOpenChange={setIdentityDrawerOpen} />
      </div>
    </div>
  );
}
