"use client";

import { useAppMode } from "@/context/app-mode-context";
import { useEasedNumber } from "@/hooks/use-eased-number";

type ManagementAnimatedNumberProps = {
  value: number;
  /** 将缓动中的数值格式化为展示字符串 */
  format: (n: number) => string;
  durationMs?: number;
};

/**
 * 在管理台模式下自 0 缓动至目标值；门户模式下直接展示目标（避免与门户轻量动效冲突）。
 */
export function ManagementAnimatedNumber({
  value,
  format,
  durationMs = 900,
}: ManagementAnimatedNumberProps) {
  const { viewMode } = useAppMode();
  const eased = useEasedNumber(value, durationMs);
  const n = viewMode === "management" ? eased : value;
  return <>{format(n)}</>;
}
