"use client";

import * as React from "react";

import { cn } from "../../lib/utils";

export type DashboardEmptyPlaceholderProps = {
  icon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  className?: string;
};

/**
 * 驾驶舱空状态：线框感图标区 + 渐变标题，减少生硬留白。
 */
export function DashboardEmptyPlaceholder({
  icon,
  title,
  description,
  className,
}: DashboardEmptyPlaceholderProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-component border border-dashed border-border/80 bg-muted/15 px-4 py-8 text-center",
        className,
      )}
    >
      {icon ? (
        <div
          className={cn(
            "flex size-14 items-center justify-center rounded-full border border-border/60 bg-background/80 text-muted-foreground shadow-inner",
            "[&_svg]:size-7 [&_svg]:stroke-[1.25]",
          )}
        >
          {icon}
        </div>
      ) : null}
      <p className="max-w-xs bg-gradient-to-br from-foreground via-foreground to-muted-foreground bg-clip-text text-base font-medium text-transparent">
        {title}
      </p>
      {description ? (
        <p className="max-w-sm text-xs leading-relaxed text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}
