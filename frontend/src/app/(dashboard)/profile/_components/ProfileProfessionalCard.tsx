"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label, Textarea } from "@bs-lab/ui";
import { Coins, FileText, Medal, StickyNote } from "@bs-lab/ui/icons";

import type { AuthUser } from "@/hooks/use-auth";
import { formatNullable } from "./profile-format";
import { ProfileSectionTitle } from "./profile-section-title";
import { PROFILE_CARD_FLOAT_CLASS, PROFILE_INSET_SURFACE_CLASS } from "./profile-ui-classes";

export type ProfileProfessionalDraft = {
  prefTitleId: string;
  perResume: string;
  comments: string;
};

export function ProfileProfessionalCard({
  user,
  draft,
  onDraftChange,
  editable,
  hideScore = false,
}: {
  user: AuthUser;
  draft: ProfileProfessionalDraft;
  onDraftChange: (next: ProfileProfessionalDraft) => void;
  editable: boolean;
  /** 积分在「积分成就」Tab 展示时，此处隐藏只读积分块 */
  hideScore?: boolean;
}) {
  void React;

  return (
    <Card className={PROFILE_CARD_FLOAT_CLASS}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">
          <ProfileSectionTitle icon={Medal}>专业信息</ProfileSectionTitle>
        </CardTitle>
        <CardDescription className="text-sm text-slate-600">
          {editable ? "可编辑职称、个人简介与备注，保存后生效。" : "点击「编辑资料」后可修改。"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-base">
        <div className={hideScore ? "grid gap-3" : "grid gap-3 sm:grid-cols-2"}>
          <div className="space-y-2">
            <Label className="inline-flex items-center gap-2 text-sm text-slate-600">
              <Medal className="size-4 text-muted-foreground" />
              职称
            </Label>
            <Input className="text-base" value={formatNullable(user.prefTitleName)} readOnly disabled />
            <p className="text-sm text-muted-foreground">职称由系统字典维护；此处仅展示可识别名称。</p>
          </div>
          {hideScore ? null : (
            <div className="space-y-2">
              <Label className="inline-flex items-center gap-2 text-sm text-slate-600">
                <Coins className="size-4 text-muted-foreground" />
                积分（只读）
              </Label>
              <div className={["flex items-center gap-2 px-3 py-2", PROFILE_INSET_SURFACE_CLASS].join(" ")}>
                <Coins className="size-4 text-emerald-700" />
                <span className="font-semibold tabular-nums text-foreground">{String(Number(user.perScore ?? 0))}</span>
              </div>
            </div>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="profile-perResume" className="inline-flex items-center gap-2 text-sm text-slate-600">
            <FileText className="size-4 text-muted-foreground" />
            个人简介
          </Label>
          <Textarea
            className="text-base"
            id="profile-perResume"
            value={draft.perResume}
            placeholder="填写你的个人简介（用于展示）"
            readOnly={!editable}
            disabled={!editable}
            onChange={(e) => onDraftChange({ ...draft, perResume: e.target.value })}
            rows={4}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="profile-comments" className="inline-flex items-center gap-2 text-sm text-slate-600">
            <StickyNote className="size-4 text-muted-foreground" />
            备注
          </Label>
          <Textarea
            className="text-base"
            id="profile-comments"
            value={draft.comments}
            placeholder="填写备注（可选）"
            readOnly={!editable}
            disabled={!editable}
            maxLength={200}
            onChange={(e) => onDraftChange({ ...draft, comments: e.target.value })}
            rows={2}
          />
          <p className="text-sm text-muted-foreground">对应 sys_user.comments，最多 200 字。</p>
        </div>
      </CardContent>
    </Card>
  );
}

