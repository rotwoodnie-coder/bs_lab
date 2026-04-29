"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

/** 板块标题：左侧 14px 高 Teal 竖线 + 可选图标 + 文案 */
export function ProfileSectionTitle({
  icon: Icon,
  children,
  className,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground", className)}>
      <span className="h-3.5 w-0.5 shrink-0 rounded-full bg-emerald-600" aria-hidden />
      {Icon ? <Icon className="size-5 shrink-0 text-emerald-700" /> : null}
      <span>{children}</span>
    </span>
  );
}
