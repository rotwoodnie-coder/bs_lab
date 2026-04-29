"use client";

import * as React from "react";
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Tooltip, TooltipContent, TooltipTrigger, sonnerToast } from "@bs-lab/ui";
import { Building2, Copy, Eye, EyeOff, Shield, UserRound } from "@bs-lab/ui/icons";

import type { AuthUser } from "@/hooks/use-auth";
import { ProfileOrgPathBreadcrumb } from "@/app/(dashboard)/profile/_components/profile-org-path-breadcrumb";
import { ProfileRoleBindingsSheet } from "@/app/(dashboard)/profile/_components/profile-role-bindings-sheet";
import { ProfileSectionTitle } from "./profile-section-title";
import { formatNullable } from "./profile-format";
import { PROFILE_CARD_FLOAT_CLASS, PROFILE_INSET_SURFACE_CLASS } from "./profile-ui-classes";

function accountStatusZh(status: string | null): string {
  const s = (status ?? "").trim().toLowerCase();
  if (s === "y") return "正常";
  if (s === "n") return "禁用";
  return formatNullable(status);
}

export function ProfileIdentityCard({ user }: { user: AuthUser }) {
  const statusLabel = accountStatusZh(user.status);
  const statusVariant = user.status?.toLowerCase() === "y" ? "default" : user.status?.toLowerCase() === "n" ? "destructive" : "secondary";
  const groups = user.teachingResearchGroups ?? [];
  const sessionPath = user.sessionOrgPathNodes ?? [];
  const recordPath = user.recordOrgPathNodes ?? [];
  const [showUserId, setShowUserId] = React.useState(false);

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      sonnerToast.success("已复制");
    } catch {
      sonnerToast.error("复制失败");
    }
  }

  return (
    <Card className={PROFILE_CARD_FLOAT_CLASS}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">
          <ProfileSectionTitle icon={UserRound}>身份看板</ProfileSectionTitle>
        </CardTitle>
        <CardDescription className="text-xs text-slate-500">
          会话级身份（当前 Cookie 组织/角色）与主档归属（sys_user.user_org_id）；组织路径为节点链展示。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="rounded-lg border-0 bg-slate-100/90 shadow-sm">
            会话组织：{formatNullable(user.orgName || user.sessionOrgName)}
          </Badge>
          <Badge variant="secondary" className="rounded-lg border-0 bg-slate-100/90 shadow-sm">
            会话角色：{formatNullable(user.roleDisplayName ?? user.sessionRoleName ?? user.role)}
          </Badge>
          <Badge variant={statusVariant}>{statusLabel}</Badge>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className={["space-y-2 p-3", PROFILE_INSET_SURFACE_CLASS].join(" ")}>
            <p className="text-xs font-medium text-muted-foreground">会话组织路径</p>
            <ProfileOrgPathBreadcrumb nodes={sessionPath} />
          </div>
          <div className={["space-y-2 p-3", PROFILE_INSET_SURFACE_CLASS].join(" ")}>
            <p className="text-xs font-medium text-muted-foreground">主档组织路径（user_org_id）</p>
            <ProfileOrgPathBreadcrumb nodes={recordPath} />
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          {(user.userRoleBindings?.length ?? 0) > 0 ? (
            <ProfileRoleBindingsSheet user={user} />
          ) : (
            <p className="text-xs text-muted-foreground">暂无 sys_user_role 多组织绑定记录（仅主档 user_role_id 生效）。</p>
          )}
        </div>

        <div className={["space-y-2 p-3", PROFILE_INSET_SURFACE_CLASS].join(" ")}>
          <p className="text-xs font-medium text-muted-foreground">教研组（subject_group_member）</p>
          {groups.length === 0 ? (
            <p className="text-muted-foreground">—</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {groups.map((g) => (
                <Badge key={g.groupId} variant="outline" className="max-w-full rounded-lg border-0 bg-white/90 py-1 shadow-sm">
                  <span className="truncate">{g.groupName || g.groupId}</span>
                  {g.ownerName ? (
                    <span className="ml-1 text-muted-foreground">· 负责人 {g.ownerName}</span>
                  ) : g.ownerId ? (
                    <span className="ml-1 text-muted-foreground">· 负责人 ID 已隐藏</span>
                  ) : null}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <dl className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <dt className="flex items-center gap-2 text-muted-foreground">
              <Building2 className="size-4" />
              主档组织名
            </dt>
            <dd className="truncate text-foreground">{formatNullable(user.recordOrgName)}</dd>
          </div>
          <div className="space-y-1">
            <dt className="flex items-center gap-2 text-muted-foreground">
              <Shield className="size-4" />
              主档角色名
            </dt>
            <dd className="truncate text-foreground">{formatNullable(user.recordRoleName)}</dd>
          </div>
          <div className="space-y-1 sm:col-span-2">
            <dt className="flex items-center gap-2 text-muted-foreground">
              <UserRound className="size-4" />
              用户 ID（只读）
            </dt>
            <dd className={["flex items-center gap-2 p-2", PROFILE_INSET_SURFACE_CLASS].join(" ")}>
              <code className="min-w-0 flex-1 truncate font-mono text-xs text-foreground">
                {showUserId ? formatNullable(user.userId) : "••••••••••••••••"}
              </code>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button type="button" variant="ghost" size="icon" className="size-8" onClick={() => setShowUserId((v) => !v)}>
                    {showUserId ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{showUserId ? "隐藏" : "显示"}</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button type="button" variant="ghost" size="icon" className="size-8" onClick={() => void copy(user.userId)}>
                    <Copy className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>复制</TooltipContent>
              </Tooltip>
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
