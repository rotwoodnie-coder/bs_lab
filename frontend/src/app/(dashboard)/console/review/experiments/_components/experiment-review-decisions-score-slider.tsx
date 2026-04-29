"use client";

import { Badge, Label, Slider } from "@bs-lab/ui";

export function ExperimentReviewDecisionsScoreSlider({
  score,
  onScoreChange,
}: {
  score: number[];
  onScoreChange: (v: number[]) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-muted-foreground">综合分（0–100，不落库）</Label>
        <Badge variant="outline" className="tabular-nums font-semibold">
          {score[0]}
        </Badge>
      </div>
      <div className="relative pt-7 pb-1">
        <output
          className="pointer-events-none absolute top-0 z-10 min-w-[2.25rem] -translate-x-1/2 rounded-md border border-border bg-popover px-2 py-0.5 text-center text-xs font-semibold tabular-nums text-popover-foreground shadow-sm"
          style={{ left: `${score[0]}%` }}
          aria-live="polite"
        >
          {score[0]}
        </output>
        <Slider value={score} onValueChange={onScoreChange} max={100} step={1} aria-label="综合评分" />
      </div>
    </div>
  );
}
