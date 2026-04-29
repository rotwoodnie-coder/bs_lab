"use client";

import * as React from "react";
import { Card, CardContent, Skeleton } from "@bs-lab/ui";

const SKELETON_CARD_COUNT = 6;

/**
 * 与 `CatalogExperimentsCardGrid` 真实卡片同栅格、同内边距，减少加载结束时的布局跳动。
 * 仅渲染视口常见行数，避免一次性挂载过多占位节点。
 */
export function CatalogExperimentsCardGridSkeleton() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="加载中"
      className="grid max-h-[min(70vh,calc(100dvh-16rem))] min-h-0 gap-3 overflow-auto p-1 sm:grid-cols-2 xl:grid-cols-3"
    >
      {Array.from({ length: SKELETON_CARD_COUNT }).map((_, i) => (
        <Card key={i} className="overflow-hidden border-border shadow-xs">
          <CardContent className="space-y-2 p-3">
            <Skeleton className="aspect-video w-full rounded-md" />
            <div className="space-y-2 pt-0.5">
              <Skeleton className="h-4 w-[88%]" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-[58%]" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
