"use client";

import * as React from "react";

import { cn } from "../../lib/utils";
import { useCountUp } from "../../hooks/use-count-up";

export type StatMetricViewMode = "portal" | "management";

export type StatMetricProps = {
  value: number;
  /** 0 表示无动画，直接展示目标值 */
  durationMs?: number;
  decimals?: number;
  viewMode?: StatMetricViewMode;
  className?: string;
  suffix?: React.ReactNode;
  prefix?: React.ReactNode;
};

/**
 * 关键指标数字：等宽数字防跳动；门户偏轻、管理台偏重。
 */
export function StatMetric({
  value,
  durationMs = 900,
  decimals = 0,
  viewMode = "management",
  className,
  suffix,
  prefix,
}: StatMetricProps) {
  const n = useCountUp(value, { durationMs, decimals });
  return (
    <span
      className={cn(
        "font-mono tabular-nums tracking-tight",
        viewMode === "management" ? "font-semibold" : "font-medium",
        className,
      )}
    >
      {prefix}
      {n}
      {suffix}
    </span>
  );
}
