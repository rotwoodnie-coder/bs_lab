"use client";

import * as React from "react";

function easeOutCubic(t: number): number {
  const u = 1 - t;
  return 1 - u * u * u;
}

/**
 * 数值从 0 缓动到 target（用于耗时等关键数字的加载动效）。
 */
export function useEasedNumber(target: number, durationMs = 900): number {
  const [value, setValue] = React.useState(0);

  React.useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const from = 0;
    const delta = target - from;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const next = from + delta * easeOutCubic(t);
      setValue(next);
      if (t < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);

  return value;
}
