"use client";

import * as React from "react";

import { checkLoopA, checkLoopP0 } from "@/lib/closed-loop-check";

declare global {
  interface Window {
    __BS_LAB__?: {
      checkLoopA: typeof checkLoopA;
      checkLoopP0: typeof checkLoopP0;
    };
  }
}

/**
 * 开发环境将闭环自检挂到 `window.__BS_LAB__.checkLoopA()` / `checkLoopP0()`，便于控制台冒烟。
 */
export function ClosedLoopDevBridge() {
  React.useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    window.__BS_LAB__ = {
      ...(window.__BS_LAB__ ?? {}),
      checkLoopA,
      checkLoopP0,
    };
  }, []);
  return null;
}
