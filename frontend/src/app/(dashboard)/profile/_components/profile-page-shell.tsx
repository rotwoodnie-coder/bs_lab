"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * 个人中心「分层容器」：自上而下 Top → KPI → Main（由 children 传入主卡）。
 * 水平收束与 `px-4 md:px-6 lg:px-8` 由外层 Page 容器统一提供，避免与 KPI / 主卡错位。
 */
export function ProfilePageShell({
  topSlot,
  kpiSlot,
  children,
  className,
}: {
  topSlot: React.ReactNode;
  kpiSlot: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex min-h-0 flex-1 flex-col gap-3", className)}>
      <section aria-label="身份摘要" className="shrink-0">
        {topSlot}
      </section>
      <section aria-label="关键指标" className="shrink-0">
        {kpiSlot}
      </section>
      <section aria-label="设置详情" className="flex min-h-0 flex-1 flex-col">
        {children}
      </section>
    </div>
  );
}
