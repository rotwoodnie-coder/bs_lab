"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label } from "@bs-lab/ui";
import { UserRound } from "@bs-lab/ui/icons";

import type { AuthUser } from "@/hooks/use-auth";

import { ProfileContactCard } from "./ProfileContactCard";
import { ProfileProfessionalCard } from "./ProfileProfessionalCard";
import { formatNullable } from "./profile-format";
import { ProfileSectionTitle } from "./profile-section-title";
import { PROFILE_CARD_FLOAT_CLASS } from "./profile-ui-classes";

export function ProfileTabProfile({
  user,
  draft,
  isEditingProfile,
  onDraft,
}: {
  user: AuthUser;
  draft: {
    userName: string;
    userNickName: string;
    userPhone: string;
    userEmail: string;
    prefTitleId: string;
    perResume: string;
    comments: string;
  };
  isEditingProfile: boolean;
  onDraft: React.Dispatch<
    React.SetStateAction<{
      userName: string;
      userNickName: string;
      userPhone: string;
      userEmail: string;
      prefTitleId: string;
      perResume: string;
      comments: string;
    }>
  >;
}) {
  return (
    <div className="space-y-3">
      <Card className={PROFILE_CARD_FLOAT_CLASS}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">
            <ProfileSectionTitle icon={UserRound}>基本信息</ProfileSectionTitle>
          </CardTitle>
          <CardDescription className="text-sm text-slate-600">
            对应 sys_user：user_name、user_nick_name（与下方联系方式、简介一并保存）。
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 text-base sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="profile-tab-userName" className="text-sm text-slate-600">
              真实姓名（user_name）
            </Label>
            <Input
              id="profile-tab-userName"
              className="text-base"
              value={draft.userName}
              readOnly={!isEditingProfile}
              disabled={!isEditingProfile}
              onChange={(e) => onDraft((d) => ({ ...d, userName: e.target.value }))}
              placeholder={formatNullable(user.userName)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-tab-userNickName" className="text-sm text-slate-600">
              昵称（user_nick_name）
            </Label>
            <Input
              id="profile-tab-userNickName"
              className="text-base"
              value={draft.userNickName}
              readOnly={!isEditingProfile}
              disabled={!isEditingProfile}
              onChange={(e) => onDraft((d) => ({ ...d, userNickName: e.target.value }))}
              placeholder={formatNullable(user.userNickName)}
            />
          </div>
        </CardContent>
      </Card>

      <ProfileContactCard
        user={user}
        draft={{ userPhone: draft.userPhone, userEmail: draft.userEmail }}
        onDraftChange={(next) => onDraft((d) => ({ ...d, ...next }))}
        editable={isEditingProfile}
      />

      <ProfileProfessionalCard
        user={user}
        draft={{ prefTitleId: draft.prefTitleId, perResume: draft.perResume, comments: draft.comments }}
        onDraftChange={(next) => onDraft((d) => ({ ...d, ...next }))}
        editable={isEditingProfile}
        hideScore
      />
    </div>
  );
}
