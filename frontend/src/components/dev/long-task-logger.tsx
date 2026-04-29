"use client";

import * as React from "react";
import { usePathname, useSearchParams } from "next/navigation";

type LongTaskEntry = { startTime: number; duration: number; path: string };

function getCurrentPath(pathname: string, searchParams: URLSearchParams | null) {
  const qs = searchParams?.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

/**
 * Dev-only: logs long main-thread tasks to console.
 * Useful when the browser shows "page unresponsive" after refresh.
 */
export function LongTaskLogger({ thresholdMs = 200 }: { thresholdMs?: number }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pathRef = React.useRef(getCurrentPath(pathname, searchParams));

  React.useEffect(() => {
    pathRef.current = getCurrentPath(pathname, searchParams);
  }, [pathname, searchParams]);

  React.useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    if (typeof window === "undefined") return;
    if (typeof PerformanceObserver === "undefined") return;

    const store: LongTaskEntry[] = [];
    const root = ((window as unknown as { __BS_LAB__?: Record<string, unknown> }).__BS_LAB__ ??= {});
    (root as Record<string, unknown>).longTasks = {
      enabled: true,
      entries: store,
      clear: () => {
        store.splice(0, store.length);
      },
    };

    let observer: PerformanceObserver | null = null;
    try {
      observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const duration = entry.duration ?? 0;
          if (duration < thresholdMs) continue;
          const item: LongTaskEntry = {
            startTime: entry.startTime ?? performance.now(),
            duration,
            path: pathRef.current,
          };
          store.push(item);
          // Keep it bounded to avoid console/memory runaway during a bad loop.
          if (store.length > 200) store.splice(0, store.length - 200);
          // eslint-disable-next-line no-console
          console.warn("[bs-lab][longtask]", {
            durationMs: Math.round(duration),
            path: item.path,
            startTimeMs: Math.round(item.startTime),
          });
        }
      });
      observer.observe({ entryTypes: ["longtask"] as unknown as string[] });
    } catch {
      // Some browsers disable longtask entries; ignore.
    }

    return () => {
      try {
        observer?.disconnect();
      } catch {
        /* ignore */
      }
      const root = (window as unknown as { __BS_LAB__?: Record<string, unknown> }).__BS_LAB__;
      const longTasks = root?.longTasks as { enabled?: boolean } | undefined;
      if (longTasks) longTasks.enabled = false;
    };
  }, [thresholdMs]);

  return null;
}

