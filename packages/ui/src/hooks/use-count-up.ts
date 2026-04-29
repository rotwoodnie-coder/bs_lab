"use client";

import * as React from "react";

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

/**
 * 自 0 缓动至目标值（管理台指标、门户轻量数字等）。
 */
export function useCountUp(
  target: number,
  options?: { durationMs?: number; decimals?: number },
): number {
  const durationMs = options?.durationMs ?? 1200;
  const decimals = options?.decimals ?? 0;
  const [value, setValue] = React.useState(0);

  React.useEffect(() => {
    if (durationMs <= 0) {
      setValue(
        decimals === 0 ? Math.round(target) : Math.round(target * 10 ** decimals) / 10 ** decimals,
      );
      return;
    }

    let raf = 0;
    const start = performance.now();
    const from = 0;
    const to = target;

    const tick = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / durationMs);
      const eased = easeOutCubic(t);
      const next = from + (to - from) * eased;
      const rounded =
        decimals === 0 ? Math.round(next) : Math.round(next * 10 ** decimals) / 10 ** decimals;
      setValue(rounded);
      if (t < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs, decimals]);

  return value;
}
