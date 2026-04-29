"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

/** 侧栏文案：与宽度联动，opacity + translateX 避免收起/展开时生硬跳动 */
export function SidebarNavLabel({
  expanded,
  children,
  className,
}: {
  expanded: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "min-w-0 overflow-hidden transition-[max-width] duration-300 ease-in-out",
        expanded ? "max-w-[min(100%,14rem)] flex-1" : "max-w-0",
        className,
      )}
    >
      <span
        className={cn(
          "block truncate transition-[opacity,transform] duration-300 ease-in-out",
          expanded ? "translate-x-0 opacity-100" : "pointer-events-none -translate-x-2 opacity-0",
        )}
      >
        {children}
      </span>
    </div>
  );
}
