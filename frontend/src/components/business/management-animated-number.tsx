"use client";

import * as React from "react";

import { StatMetric, type StatMetricProps } from "@bs-lab/ui";

export type ManagementAnimatedNumberProps = Omit<StatMetricProps, "viewMode"> & {
  viewMode?: StatMetricProps["viewMode"];
};

/**
 * 管理模式 / 门户关键指标：从 0 缓动到目标值（封装 {@link StatMetric}）。
 */
export function ManagementAnimatedNumber({
  viewMode = "management",
  ...props
}: ManagementAnimatedNumberProps) {
  return <StatMetric viewMode={viewMode} {...props} />;
}
