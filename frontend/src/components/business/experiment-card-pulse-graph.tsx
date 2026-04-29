"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

/** Variant C：底部微型动态波形（SVG + CSS stroke 动画） */
export function ExperimentCardPulseGraph({ className }: { className?: string }) {
  const uid = React.useId();
  const gradId = `${uid.replace(/:/g, "")}-pg`;

  return (
    <svg
      className={cn("h-7 w-full text-chart-2", className)}
      viewBox="0 0 140 28"
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.25} />
          <stop offset="50%" stopColor="var(--chart-4)" stopOpacity={0.95} />
          <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0.28} />
        </linearGradient>
      </defs>
      <path
        d="M0 18 C 18 6, 28 26, 42 14 S 72 22, 88 10 S 118 24, 140 8"
        fill="none"
        stroke={`url(#${gradId})`}
        strokeWidth={1.35}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        className="experiment-pulse-graph-stroke"
      />
      <path
        d="M0 20 L 22 12 L 40 20 L 58 9 L 76 17 L 94 11 L 112 19 L 130 14 L 140 16"
        fill="none"
        stroke="currentColor"
        strokeWidth={0.85}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        opacity={0.45}
        className="experiment-pulse-graph-stroke-delayed"
      />
    </svg>
  );
}
