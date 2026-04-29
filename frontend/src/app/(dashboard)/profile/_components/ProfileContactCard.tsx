"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label } from "@bs-lab/ui";
import { Mail, Phone } from "@bs-lab/ui/icons";

import type { AuthUser } from "@/hooks/use-auth";
import { formatNullable } from "./profile-format";
import { ProfileSectionTitle } from "./profile-section-title";
import { PROFILE_CARD_FLOAT_CLASS } from "./profile-ui-classes";

export type ProfileContactDraft = {
  userPhone: string;
  userEmail: string;
};

export function ProfileContactCard({
  user,
  draft,
  onDraftChange,
  editable,
}: {
  user: AuthUser;
  draft: ProfileContactDraft;
  onDraftChange: (next: ProfileContactDraft) => void;
  editable: boolean;
}) {
  void React;

  return (
    <Card className={PROFILE_CARD_FLOAT_CLASS}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">
          <ProfileSectionTitle>联系方式</ProfileSectionTitle>
        </CardTitle>
        <CardDescription className="text-sm text-slate-600">
          {editable ? "可编辑手机号与邮箱，保存后生效。" : "点击「编辑资料」后可修改。"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-base">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="profile-userPhone" className="inline-flex items-center gap-2 text-sm text-slate-600">
              <Phone className="size-4 text-muted-foreground" />
              手机号
            </Label>
            <Input
              className="text-base"
              id="profile-userPhone"
              value={draft.userPhone}
              placeholder={formatNullable(user.userPhone)}
              readOnly={!editable}
              disabled={!editable}
              onChange={(e) => onDraftChange({ ...draft, userPhone: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-userEmail" className="inline-flex items-center gap-2 text-sm text-slate-600">
              <Mail className="size-4 text-muted-foreground" />
              邮箱
            </Label>
            <Input
              className="text-base"
              id="profile-userEmail"
              value={draft.userEmail}
              placeholder={formatNullable(user.userEmail)}
              readOnly={!editable}
              disabled={!editable}
              onChange={(e) => onDraftChange({ ...draft, userEmail: e.target.value })}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

