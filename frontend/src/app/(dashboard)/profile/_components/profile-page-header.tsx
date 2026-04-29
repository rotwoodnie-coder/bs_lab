"use client";

import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage, Badge, Button } from "@bs-lab/ui";
import { Edit3 } from "@bs-lab/ui/icons";

import type { AuthUser } from "@/hooks/use-auth";
import { materialStorageBrowserHref } from "@/lib/material-asset-url";
import { cn } from "@/lib/utils";

import { formatNullable } from "./profile-format";
import { PROFILE_CARD_FLOAT_CLASS } from "./profile-ui-classes";

export function ProfilePageHeader({
  user,
  identityBadgeText,
  avatarBusy,
  onPickAvatar,
  onEditProfile,
  className,
}: {
  user: AuthUser;
  /** 右侧「当前激活身份」文案，如：学校名 · 角色名 */
  identityBadgeText: string;
  avatarBusy: boolean;
  onPickAvatar: () => void;
  /** 进入可编辑资料（并切到个人资料 Tab 由父级处理） */
  onEditProfile: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        PROFILE_CARD_FLOAT_CLASS,
        "flex flex-col gap-2 bg-gradient-to-r from-primary/[0.05] via-white to-white px-3 py-2 text-base sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-4 sm:py-2.5",
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-2 sm:gap-2.5">
        <button
          type="button"
          className="group relative shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          onClick={onPickAvatar}
          disabled={avatarBusy}
          aria-label="点击更换头像"
        >
          <Avatar className="size-11 border-2 border-background shadow-sm sm:size-12">
            {user.userLogo ? <AvatarImage src={materialStorageBrowserHref(user.userLogo)} alt="头像" /> : null}
            <AvatarFallback className="bg-muted text-lg text-muted-foreground">
              {user.userName?.trim()?.slice(0, 1) || "我"}
            </AvatarFallback>
          </Avatar>
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-lg font-semibold tracking-tight text-foreground sm:text-xl">{formatNullable(user.userName)}</h2>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 shrink-0 text-muted-foreground hover:text-primary"
              onClick={onEditProfile}
              aria-label="编辑资料"
            >
              <Edit3 className="size-4" />
            </Button>
          </div>
          <p className="mt-0.5 truncate text-sm text-slate-600 sm:text-base">
            工号（登录账号）：
            <span className="font-mono tabular-nums text-foreground">{formatNullable(user.loginName)}</span>
          </p>
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-start gap-0.5 sm:items-end">
        <span className="text-sm text-slate-600">当前激活身份</span>
        <Badge variant="secondary" className="max-w-full rounded-lg border-0 bg-emerald-50 px-2.5 py-1.5 text-sm font-medium text-emerald-900 shadow-sm">
          <span className="line-clamp-2 text-left sm:text-right">{identityBadgeText}</span>
        </Badge>
      </div>
    </div>
  );
}
