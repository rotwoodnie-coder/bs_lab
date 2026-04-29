"use client";

import { useSearchParams } from "next/navigation";

import { Button, Card, CardContent } from "@bs-lab/ui";

import { PageHeader } from "@/components/layout/page-header";
import { LeftTreeRightTableLayout } from "@/components/layout/left-tree-right-table-layout";
import { can } from "@/lib/auth/role-permissions";
import { PERMISSIONS } from "@/lib/auth/role-permissions";
import { useAuth } from "@/hooks/use-auth";
import type { RoleId } from "@/lib/console/users/types";

import { OrgTreeBoard } from "../organizations/_components/OrgTreeBoard";
import { UserDataTable } from "./_components/user-data-table";
import { UserFormDialog } from "./_components/UserFormDialog";
import { UserHeader } from "./_components/UserHeader";
import { useUserManagement } from "./use-user-management";

export default function ConsoleUsersPage() {
  const searchParams = useSearchParams();
  const juryConfigFocus = searchParams.get("focus") === "jury";

  const auth = useAuth();
  const um = useUserManagement();

  const canCreate = can(auth.user, PERMISSIONS.USER_MANAGE);
  const canImport = can(auth.user, PERMISSIONS.USER_MANAGE);
  const canBatchOperate = can(auth.user, PERMISSIONS.USER_MANAGE);

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        title="用户管理"
        description={
          <>当前页面已接入 <strong className="font-medium text-foreground">V2 `sys_user`</strong>，左侧可按组织结构筛选直属成员；新建或编辑用户在屏幕居中对话框中完成，账号状态在对话框内通过开关修改，保存后再刷新列表。</>
        }
      />
      <LeftTreeRightTableLayout
        expandedRailWidthPx={640}
        leftTitle="组织结构"
        left={
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant={um.selectedOrgId ? "secondary" : "outline"}
                onClick={() => um.setSelectedOrgId(null)}
              >
                全部组织
              </Button>
              {um.selectedOrgId ? (
                <span className="text-xs text-muted-foreground">按直属组织筛选列表</span>
              ) : null}
            </div>
            <OrgTreeBoard
              loading={um.orgTreeLoading}
              orgTree={um.orgTree}
              selectedId={um.selectedOrgId}
              onSelect={(id) => um.setSelectedOrgId(id)}
              orgTypeLabels={um.orgTypeLabels}
            />
          </div>
        }
        right={
          <Card className="min-w-0 border-border shadow-none">
            <UserHeader
              juryConfigFocus={juryConfigFocus}
              listLoading={um.listLoading}
              usersLength={um.users.length}
              listError={um.listError}
              q={um.q}
              onQChange={um.setQ}
              roleFilter={um.roleFilter}
              onRoleFilterChange={um.setRoleFilter}
              searchDebounceMs={um.SEARCH_DEBOUNCE_MS}
              onRefresh={() => void um.loadList()}
              onRetry={() => void um.loadList()}
              onCreate={() => void um.openForUser(null)}
              canCreate={canCreate}
              onExport={(c) => void um.onExport(c)}
              onPickImport={um.onPickImport}
              canImport={canImport}
              fileInput={
                <input
                  ref={um.fileRef}
                  type="file"
                  accept="application/json,.json"
                  className="hidden"
                  onChange={um.onImportFile}
                />
              }
              selectedCount={um.selectedCount}
              onBatchFreeze={() => void um.onBatchStatus("冻结")}
              onBatchUnfreeze={() => void um.onBatchStatus("正常")}
              canBatchOperate={canBatchOperate}
              onExportSelected={um.onExportSelectedJson}
              onClearSelected={() => um.setSelectedIds(new Set())}
            />

            <CardContent className="min-w-0 space-y-4">
              <UserDataTable
                users={um.users}
                listLoading={um.listLoading}
                tableBusy={um.tableBusy}
                selectedIds={um.selectedIds}
                headerCheckboxState={um.headerCheckboxState}
                onToggleSelectAllVisible={um.toggleSelectAllVisible}
                onToggleRowSelected={um.toggleRowSelected}
                onEdit={(row) => void um.openForUser(row)}
                usersLength={um.users.length}
              />
            </CardContent>
          </Card>
        }
      />

      <UserFormDialog
        open={um.drawerOpen}
        onOpenChange={um.setDrawerOpen}
        editingId={um.editingId}
        detailLoading={um.detailLoading}
        savePending={um.savePending}
        onSave={() => void um.saveUser()}
        draftUsername={um.draftUsername}
        onDraftUsernameChange={um.setDraftUsername}
        draftPassword={um.draftPassword}
        onDraftPasswordChange={um.setDraftPassword}
        draftStatus={um.draftStatus}
        onDraftStatusChange={um.setDraftStatus}
        draftExpireDate={um.draftExpireDate}
        onDraftExpireDateChange={um.setDraftExpireDate}
        draftRealName={um.draftRealName}
        onDraftRealNameChange={um.setDraftRealName}
        draftNickname={um.draftNickname}
        onDraftNicknameChange={um.setDraftNickname}
        draftPhone={um.draftPhone}
        onDraftPhoneChange={um.setDraftPhone}
        draftEmail={um.draftEmail}
        onDraftEmailChange={um.setDraftEmail}
        orgOptions={um.orgOptions}
        draftOrgId={um.draftOrgId}
        onDraftOrgIdChange={um.setDraftOrgId}
        draftRoleId={(um.draftRoles[0] ?? "teacher") as RoleId}
        onDraftRoleChange={um.setDraftRole}
        draftPermIds={um.draftPermIds}
        onTogglePerm={um.togglePerm}
      />
    </div>
  );
}
