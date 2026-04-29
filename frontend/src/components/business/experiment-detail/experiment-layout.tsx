"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * 实验详情「视觉复用」骨架：封面 / 主栏（步骤等）/ 右侧材料带由业务页拼装；
 * 本文件仅提供统一的槽位容器，保证各角色增删插件时外边距与边框语义一致。
 */
export function ExperimentLayoutTopSlot({
  id,
  className,
  children,
}: {
  id?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className={cn(
        "rounded-xl border border-border/80 bg-card/90 shadow-sm ring-1 ring-primary/10 backdrop-blur-sm",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function ExperimentLayoutSidebarSlot({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("min-w-0 space-y-4", className)}>{children}</div>;
}

export function ExperimentLayoutBottomSlot({
  id,
  className,
  children,
}: {
  id?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      id={id}
      className={cn(
        "border-t border-border/80 bg-background/95 shadow-[0_-8px_32px_rgba(0,0,0,0.06)] backdrop-blur-md dark:shadow-[0_-8px_32px_rgba(0,0,0,0.28)]",
        className,
      )}
    >
      {children}
    </div>
  );
}
