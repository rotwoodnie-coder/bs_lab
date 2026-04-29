"use client";

import * as React from "react";
import { Building2, ChevronRight, ScrollText, Shield, Trophy, User as UserIcon } from "@bs-lab/ui/icons";

import { cn } from "@/lib/utils";

export type ProfileSettingsTabKey = "profile" | "security" | "org" | "growth" | "activity";

export const PROFILE_SETTINGS_NAV_ITEMS: ReadonlyArray<{
  key: ProfileSettingsTabKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { key: "profile", label: "个人资料", icon: UserIcon },
  { key: "security", label: "账号安全", icon: Shield },
  { key: "org", label: "组织身份", icon: Building2 },
  { key: "growth", label: "积分成就", icon: Trophy },
  { key: "activity", label: "活动记录", icon: ScrollText },
];

export function ProfileSettingsNav({
  active,
  onChange,
  className,
}: {
  active: ProfileSettingsTabKey;
  onChange: (key: ProfileSettingsTabKey) => void;
  className?: string;
}) {
  return (
    <nav aria-label="个人中心分区" className={cn("space-y-1", className)}>
      {PROFILE_SETTINGS_NAV_ITEMS.map((it) => {
        const Icon = it.icon;
        const isActive = active === it.key;
        return (
          <button
            key={it.key}
            type="button"
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-base font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
            onClick={() => onChange(it.key)}
          >
            <Icon className={cn("size-5 shrink-0", isActive && "text-primary-foreground")} />
            <span className="min-w-0 flex-1 truncate">{it.label}</span>
            <ChevronRight
              className={cn(
                "size-4 shrink-0 opacity-50",
                isActive ? "text-primary-foreground opacity-90" : "text-muted-foreground",
              )}
            />
          </button>
        );
      })}
    </nav>
  );
}

export function ProfileSettingsNavChips({
  active,
  onChange,
  className,
}: {
  active: ProfileSettingsTabKey;
  onChange: (key: ProfileSettingsTabKey) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className,
      )}
    >
      {PROFILE_SETTINGS_NAV_ITEMS.map((it) => {
        const Icon = it.icon;
        const isActive = active === it.key;
        return (
          <button
            key={it.key}
            type="button"
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-lg border-0 px-3.5 py-2 text-sm font-medium shadow-sm transition-colors",
              isActive ? "bg-primary text-primary-foreground" : "bg-white text-muted-foreground hover:bg-secondary",
            )}
            onClick={() => onChange(it.key)}
          >
            <Icon className={cn("size-4 shrink-0", isActive && "text-primary-foreground")} />
            {it.label}
          </button>
        );
      })}
    </div>
  );
}
