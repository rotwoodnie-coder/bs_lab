import * as React from "react";

import { Card, CardContent } from "@bs-lab/ui";

export function StageCanvas(props: {
  zoom: number;
  stageOffset: { x: number; y: number };
  selectedElementId: string | null;
  onResetView: () => void;
  children: React.ReactNode;
}) {
  return (
    <Card className="rounded-[28px] border-0 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
      <CardContent className="space-y-3 pt-6">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>
            画布缩放 {Math.round(props.zoom * 100)}% · 偏移({props.stageOffset.x}, {props.stageOffset.y})
          </span>
          <div className="flex items-center gap-3">
            <span>选中：{props.selectedElementId ?? "无"}</span>
            <button
              type="button"
              className="underline underline-offset-2"
              onClick={props.onResetView}
            >
              重置视图
            </button>
          </div>
        </div>
        {props.children}
      </CardContent>
    </Card>
  );
}

