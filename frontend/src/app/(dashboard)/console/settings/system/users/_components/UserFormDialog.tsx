import * as React from "react";


import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Skeleton,
  Spinner,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@bs-lab/ui";
import { X } from "@bs-lab/ui/icons";

import type { RoleId } from "@/lib/console/users/types";

import { UserAuditTab } from "./user-form/UserAuditTab";
import { UserPermissionsTab } from "./user-form/UserPermissionsTab";
import { UserProfileTab } from "./user-form/UserProfileTab";

export function UserFormDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingId: string | null;
  detailLoading: boolean;
  savePending: boolean;
  onSave: () => void;
  draftUsername: string;
  onDraftUsernameChange: (v: string) => void;
  draftPassword: string;
  onDraftPasswordChange: (v: string) => void;
  draftStatus: "正常" | "冻结";
  onDraftStatusChange: (v: "正常" | "冻结") => void;
  draftExpireDate: string;
  onDraftExpireDateChange: (v: string) => void;
  draftRealName: string;
  onDraftRealNameChange: (v: string) => void;
  draftNickname: string;
  onDraftNicknameChange: (v: string) => void;
  draftPhone: string;
  onDraftPhoneChange: (v: string) => void;
  draftEmail: string;
  onDraftEmailChange: (v: string) => void;
  orgOptions: { orgId: string; label: string }[];
  draftOrgId: string;
  onDraftOrgIdChange: (v: string) => void;
  draftRoleId: RoleId;
  onDraftRoleChange: (id: RoleId) => void;
  draftPermIds: string[];
  onTogglePerm: (permId: string, checked: boolean) => void;
}) {
  const auditSubject = (props.draftUsername || "—").trim() || "—";

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="grid min-h-0 w-[calc(100vw-1rem)] max-w-3xl grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden p-0 sm:w-full sm:max-w-3xl lg:max-w-[min(96rem,calc(100vw-2rem))]"
      >
        <DialogClose asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3 z-10 size-9 shrink-0"
            aria-label="关闭"
          >
            <X className="size-4" />
          </Button>
        </DialogClose>

        <DialogHeader className="shrink-0 space-y-1 border-b border-border px-6 py-4 pr-14 text-left">
          <DialogTitle>{props.editingId ? "编辑用户" : "新建用户"}</DialogTitle>
          <DialogDescription className="text-left">
            在窗口中完成资料与状态修改，保存后列表将自动刷新；关闭窗口不会提交变更。
          </DialogDescription>
        </DialogHeader>

        {/* 中间区域固定占用剩余高度，内部单独滚动，避免底部字段被裁切 */}
        <div className="flex min-h-0 flex-col overflow-hidden">
          <Tabs defaultValue="profile" className="flex min-h-0 flex-1 flex-col gap-0">
            <div className="shrink-0 border-b border-border px-4 pt-2">
              <TabsList className="mb-2 grid h-auto w-full max-w-full grid-cols-3 gap-1 bg-transparent p-0 lg:max-w-2xl">
                <TabsTrigger value="profile" className="text-xs sm:text-sm" disabled={props.detailLoading}>
                  账号资料
                </TabsTrigger>
                <TabsTrigger value="permissions" className="text-xs sm:text-sm" disabled={props.detailLoading}>
                  权限管理
                </TabsTrigger>
                <TabsTrigger value="audit" className="text-xs sm:text-sm" disabled={props.detailLoading}>
                  审计日志
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain [scrollbar-gutter:stable]">
              {props.detailLoading ? (
                <div className="space-y-3 px-6 py-6 pb-16">
                  <Skeleton className="h-9 w-full" />
                  <Skeleton className="h-9 w-full" />
                  <Skeleton className="h-9 w-2/3" />
                </div>
              ) : (
                <div className="space-y-6 px-6 py-4 pb-24">
                  <TabsContent value="profile" className="mt-0 space-y-8 focus-visible:outline-none">
                    <UserProfileTab
                      editingId={props.editingId}
                      savePending={props.savePending}
                      draftUsername={props.draftUsername}
                      onDraftUsernameChange={props.onDraftUsernameChange}
                      draftPassword={props.draftPassword}
                      onDraftPasswordChange={props.onDraftPasswordChange}
                      draftStatus={props.draftStatus}
                      onDraftStatusChange={props.onDraftStatusChange}
                      draftExpireDate={props.draftExpireDate}
                      onDraftExpireDateChange={props.onDraftExpireDateChange}
                      draftRealName={props.draftRealName}
                      onDraftRealNameChange={props.onDraftRealNameChange}
                      draftNickname={props.draftNickname}
                      onDraftNicknameChange={props.onDraftNicknameChange}
                      draftPhone={props.draftPhone}
                      onDraftPhoneChange={props.onDraftPhoneChange}
                      draftEmail={props.draftEmail}
                      onDraftEmailChange={props.onDraftEmailChange}
                      orgOptions={props.orgOptions}
                      draftOrgId={props.draftOrgId}
                      onDraftOrgIdChange={props.onDraftOrgIdChange}
                    />
                  </TabsContent>

                  <TabsContent value="permissions" className="mt-0 space-y-6 focus-visible:outline-none">
                    <UserPermissionsTab
                      savePending={props.savePending}
                      draftRoleId={props.draftRoleId}
                      onDraftRoleChange={props.onDraftRoleChange}
                      draftPermIds={props.draftPermIds}
                      onTogglePerm={props.onTogglePerm}
                    />
                  </TabsContent>

                  <TabsContent value="audit" className="mt-0 focus-visible:outline-none">
                    <UserAuditTab auditSubject={auditSubject} editingId={props.editingId} />
                  </TabsContent>
                </div>
              )}
            </div>
          </Tabs>
        </div>

        <DialogFooter className="shrink-0 gap-2 border-t border-border bg-background px-6 py-4 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            disabled={props.savePending}
            onClick={() => props.onOpenChange(false)}
          >
            取消
          </Button>

          <Button type="button" onClick={() => void props.onSave()} disabled={props.savePending || props.detailLoading}>
            {props.savePending ? (
              <>
                <Spinner className="size-4" />
                保存中…
              </>
            ) : (
              "保存"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
