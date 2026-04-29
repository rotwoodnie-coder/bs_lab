"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { HelpCircle, Settings } from "@bs-lab/ui/icons";
import { Avatar, AvatarFallback, AvatarImage, Button } from "@bs-lab/ui";
import { useAuth } from "@/hooks/use-auth";
import { materialStorageBrowserHref } from "@/lib/material-asset-url";
import { cn } from "@/lib/utils";

type Props = {
  collapsed: boolean;
  className?: string;
};

export function SidebarUserPanel({ collapsed, className }: Props) {
  const router = useRouter();
  const { user } = useAuth();

  const displayName = (user.userNickName || user.userName || "用户").trim() || "用户";
  const avatarSrc = user.userLogo?.trim() ? materialStorageBrowserHref(user.userLogo.trim()) : null;
  const fallbackChar = displayName.slice(0, 1) || "用";

  const titlePart = user.prefTitleName?.trim() || user.roleDisplayName?.trim() || user.sessionRoleName?.trim() || "";
  const groupName = user.teachingResearchGroups.find((g) => g.status === "Y")?.groupName?.trim();
  const subjectLine = [titlePart, groupName].filter(Boolean).join(" · ") || "个人中心";

  const openProfile = () => router.push("/profile");

  if (collapsed) {
    return (
      <div className={cn("hidden min-[2000px]:block mt-auto shrink-0 space-y-2 border-t border-slate-200/80 pt-3", className)}>
        <Button type="button" variant="ghost" size="icon" className="size-11 min-h-11 min-w-11 rounded-full" onClick={openProfile} title="个人中心">
          <Avatar className="h-9 w-9 border-2 border-primary/20">
            {avatarSrc ? <AvatarImage src={avatarSrc} alt={displayName} /> : null}
            <AvatarFallback className="text-xs">{fallbackChar}</AvatarFallback>
          </Avatar>
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("hidden min-[2000px]:block mt-auto shrink-0 space-y-3 border-t border-slate-200/80 pt-4 pb-8", className)}>
      <div>
        <p className="mb-2 px-3 text-xs font-medium text-muted-foreground">个人中心</p>
        <button
          type="button"
          onClick={openProfile}
          className="group flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-secondary"
        >
          <Avatar className="h-10 w-10 shrink-0 border-2 border-primary/20">
            {avatarSrc ? <AvatarImage src={avatarSrc} alt={displayName} /> : null}
            <AvatarFallback>{fallbackChar}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{displayName}</p>
            <p className="truncate text-xs text-muted-foreground">{subjectLine}</p>
          </div>
          <Settings className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
        </button>
      </div>

      <div className="hidden min-[2000px]:block rounded-lg border border-primary/10 bg-primary/5 px-3 py-3 text-xs leading-relaxed text-muted-foreground">
        <div className="mb-1 flex items-center gap-1.5 font-medium text-foreground">
          <HelpCircle className="h-3.5 w-3.5 text-primary" />
          需要帮助？
        </div>
        <p>遇到问题可查看帮助文档，或联系管理员获取支持。</p>
      </div>
    </div>
  );
}
