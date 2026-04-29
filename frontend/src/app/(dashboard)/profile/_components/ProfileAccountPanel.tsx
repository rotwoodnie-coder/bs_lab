"use client";

import * as React from "react";
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label } from "@bs-lab/ui";
import { User as UserIcon } from "@bs-lab/ui/icons";

import type { AuthUser } from "@/hooks/use-auth";
import { ProfileAuditCard } from "@/app/(dashboard)/profile/_components/ProfileAuditCard";
import { ProfileRecentActivityCard } from "@/app/(dashboard)/profile/_components/profile-recent-activity-card";
import { ProfileUserDataOverview } from "@/app/(dashboard)/profile/_components/ProfileUserDataOverview";
import { ProfileScoreTitleProgressCard } from "@/app/(dashboard)/profile/_components/ProfileScoreTitleProgressCard";
import { formatDateTime, formatNullable } from "@/app/(dashboard)/profile/_components/profile-format";

type Props = {
  user: AuthUser;
  userNameDraft: string;
  userNickNameDraft: string;
  isEditingProfile: boolean;
  onUserNameChange: (value: string) => void;
  onUserNickNameChange: (value: string) => void;
  score: number;
};

export function ProfileAccountPanel({
  user,
  userNameDraft,
  userNickNameDraft,
  isEditingProfile,
  onUserNameChange,
  onUserNickNameChange,
  score,
}: Props) {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-xl border border-slate-200/60 bg-card shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <UserIcon className="size-4 text-primary" />
              基本信息
            </CardTitle>
            <CardDescription>
              {isEditingProfile ? "编辑模式下可修改真实姓名与昵称；登录账号为只读。" : "点击「编辑资料」后可修改姓名与昵称。"}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 text-sm">
            <div className="space-y-2">
              <Label htmlFor="profile-userName-desk" className="text-muted-foreground">真实姓名</Label>
              <Input
                id="profile-userName-desk"
                value={userNameDraft}
                placeholder="填写姓名"
                maxLength={60}
                readOnly={!isEditingProfile}
                disabled={!isEditingProfile}
                className="border-border/60 bg-muted/30"
                onChange={(e) => onUserNameChange(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-nick-desk" className="text-muted-foreground">用户昵称</Label>
              <Input
                id="profile-nick-desk"
                value={userNickNameDraft}
                placeholder="填写昵称"
                maxLength={60}
                readOnly={!isEditingProfile}
                disabled={!isEditingProfile}
                className="border-border/60 bg-muted/30"
                onChange={(e) => onUserNickNameChange(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label className="text-muted-foreground">登录账号</Label>
                <Badge variant="outline" className="text-[10px]">只读</Badge>
              </div>
              <div className="rounded-lg border border-border/60 bg-muted/40 px-3 py-2.5 font-mono text-foreground">
                {formatNullable(user.loginName)}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">最近登录</Label>
              <div className="rounded-lg border border-border/60 bg-muted/40 px-3 py-2.5 text-foreground">
                {formatDateTime(user.lastLoginTime)}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <ProfileScoreTitleProgressCard user={user} />
        </div>
      </div>

      <ProfileRecentActivityCard user={user} />

      <ProfileAuditCard user={user} />

      <ProfileUserDataOverview user={user} />
    </div>
  );
}
