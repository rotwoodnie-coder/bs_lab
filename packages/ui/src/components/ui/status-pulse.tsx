"use client";

import * as React from "react";

import { cn } from "../../lib/utils";

const variantRing: Record<"success" | "warning" | "error", string> = {
  success: "bg-chart-2",
  warning: "bg-chart-4",
  error: "bg-chart-5",
};

export type StatusPulseProps = {
  variant?: "success" | "warning" | "error";
  className?: string;
  /** 外圈尺寸（像素感），默认与首页 IoT 脉搏一致 */
  sizePx?: number;
};

/**
 * 状态脉搏点：`animate-ping` 外圈 + 实心内核；success / warning / error 分别绑定 chart-2 / chart-4 / chart-5。
 */
export function StatusPulse({ variant = "success", className, sizePx = 10 }: StatusPulseProps) {
  const ring = variantRing[variant];
  const s = `${sizePx}px`;
  return (
    <span
      className={cn("relative inline-flex shrink-0", className)}
      style={{ width: s, height: s }}
      aria-hidden
    >
      <span
        className={cn(
          "absolute inline-flex size-full animate-ping rounded-full opacity-60",
          ring,
        )}
      />
      <span className={cn("relative inline-flex size-full rounded-full", ring)} />
    </span>
  );
}
