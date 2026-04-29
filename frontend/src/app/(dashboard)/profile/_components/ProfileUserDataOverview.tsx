"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@bs-lab/ui";
import { BadgeHelp, Building2, CalendarClock, Coins, Mail, Phone, UserRound } from "@bs-lab/ui/icons";

import type { AuthUser } from "@/hooks/use-auth";
import { ProfileOrgPathBreadcrumb } from "@/app/(dashboard)/profile/_components/profile-org-path-breadcrumb";
import { materialStorageBrowserHref } from "@/lib/material-asset-url";
import { formatDate, formatDateTime, formatNullable } from "./profile-format";

function Row({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return (
    <div className="grid gap-1 border-b border-border/50 py-2.5 text-sm last:border-b-0 sm:grid-cols-[10.5rem_1fr] sm:gap-4 sm:items-start">
      <div className="text-muted-foreground">{label}</div>
      <div className="min-w-0 break-words font-medium text-foreground">{value}</div>
    </div>
  );
}

function statusLabel(s: string | null): string {
  const t = (s ?? "").trim().toLowerCase();
  if (t === "y") return "正常";
  if (t === "n") return "禁用";
  return formatNullable(s);
}

export function ProfileUserDataOverview({ user }: { user: AuthUser }) {
  const logoHref = user.userLogo ? materialStorageBrowserHref(user.userLogo) : null;
  const groups = user.teachingResearchGroups ?? [];
  const sessionPath = user.sessionOrgPathNodes ?? [];
  const recordPath = user.recordOrgPathNodes ?? [];
  return (
    <Card className="rounded-xl border border-slate-200/60 bg-card shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <BadgeHelp className="size-4 text-primary" />
          个人数据总览
        </CardTitle>
        <CardDescription>
          仅展示可人工识别的信息；内部编码（如各类 ID）与系统审计字段不在此处展示。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 text-sm">
        <section className="space-y-0 rounded-lg border border-border/60 bg-muted/20 px-3">
          <p className="border-b border-border/50 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">会话上下文（当前 Cookie 会话）</p>
          <Row
            label={
              <span className="inline-flex items-center gap-2">
                <Building2 className="size-4 text-muted-foreground" />
                当前组织
              </span>
            }
            value={formatNullable(user.orgName ?? user.sessionOrgName)}
          />
          <Row
            label="组织路径"
            value={<ProfileOrgPathBreadcrumb nodes={sessionPath} className="font-normal" />}
          />
          <Row
            label={
              <span className="inline-flex items-center gap-2">
                <UserRound className="size-4 text-muted-foreground" />
                当前角色
              </span>
            }
            value={formatNullable(user.roleDisplayName ?? user.sessionRoleName ?? user.role)}
          />
          <Row
            label="教研组归属（弱组织身份）"
            value={
              groups.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {groups.map((g) => (
                    <span key={g.groupId} className="rounded-lg border border-slate-200/60 bg-background px-2 py-1 text-xs font-medium">
                      {g.groupName || g.groupId}
                      {g.ownerName ? ` · 负责人 ${g.ownerName}` : ""}
                    </span>
                  ))}
                </div>
              ) : (
                "—"
              )
            }
          />
        </section>

        <section className="space-y-0 rounded-lg border border-border/60 bg-muted/20 px-3">
          <p className="border-b border-border/50 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">档案主档（sys_user 列）</p>
          <Row label="姓名" value={formatNullable(user.userName)} />
          <Row label="昵称" value={formatNullable(user.userNickName)} />
          <Row label="所属组织" value={formatNullable(user.recordOrgName ?? user.orgName)} />
          <Row
            label="组织路径"
            value={<ProfileOrgPathBreadcrumb nodes={recordPath} className="font-normal" />}
          />
          <Row label="角色" value={formatNullable(user.recordRoleName ?? user.roleDisplayName ?? user.sessionRoleName)} />
          <Row label="头像 URL" value={logoHref ? <a className="text-primary underline" href={logoHref} target="_blank" rel="noreferrer">打开</a> : "—"} />
          <Row
            label={
              <span className="inline-flex items-center gap-2">
                <Phone className="size-4 text-muted-foreground" />
                手机号
              </span>
            }
            value={formatNullable(user.userPhone)}
          />
          <Row
            label={
              <span className="inline-flex items-center gap-2">
                <Mail className="size-4 text-muted-foreground" />
                邮箱
              </span>
            }
            value={formatNullable(user.userEmail)}
          />
          <Row
            label={
              <span className="inline-flex items-center gap-2">
                <CalendarClock className="size-4 text-muted-foreground" />
                账号有效期
              </span>
            }
            value={formatDate(user.expireDate)}
          />
          <Row label="备注" value={formatNullable(user.comments)} />
          <Row label="账号状态" value={statusLabel(user.status)} />
          <Row
            label={
              <span className="inline-flex items-center gap-2">
                <CalendarClock className="size-4 text-muted-foreground" />
                最后登录时间
              </span>
            }
            value={formatDateTime(user.lastLoginTime)}
          />
          <Row label="职称" value={formatNullable(user.prefTitleName)} />
          <Row label="个人简介" value={user.perResume?.trim() ? <span className="whitespace-pre-wrap font-normal">{user.perResume}</span> : "—"} />
          <Row
            label="个人积分"
            value={
              <span className="inline-flex items-center gap-2">
                <Coins className="size-4 text-primary" />
                <span className="tabular-nums">{String(Number(user.perScore ?? 0))}</span>
              </span>
            }
          />
        </section>
      </CardContent>
    </Card>
  );
}
