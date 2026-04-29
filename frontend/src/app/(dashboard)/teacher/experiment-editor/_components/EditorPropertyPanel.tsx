import * as React from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@bs-lab/ui";

export function EditorPropertyPanel(props: {
  phaseLabel: string;
  disciplineLabel: string;
  gradeLabels: string[];
  participation: "required" | "optional";
  durationMin: string;
  autosaveStatusText: string;
}) {
  return (
    <Card className="rounded-[28px] border-0 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">参数与状态</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex items-center justify-between gap-2 rounded-md bg-muted/40 px-2 py-1.5">
          <span className="text-muted-foreground">学段</span>
          <span>{props.phaseLabel}</span>
        </div>
        <div className="flex items-center justify-between gap-2 rounded-md bg-muted/40 px-2 py-1.5">
          <span className="text-muted-foreground">学科</span>
          <span>{props.disciplineLabel}</span>
        </div>
        <div className="flex items-center justify-between gap-2 rounded-md bg-muted/40 px-2 py-1.5">
          <span className="text-muted-foreground">年级</span>
          <span className="truncate">{props.gradeLabels.join("、") || "未选择"}</span>
        </div>
        <div className="flex items-center justify-between gap-2 rounded-md bg-muted/40 px-2 py-1.5">
          <span className="text-muted-foreground">任务类型</span>
          <span>{props.participation === "required" ? "必做" : "选做"}</span>
        </div>
        <div className="flex items-center justify-between gap-2 rounded-md bg-muted/40 px-2 py-1.5">
          <span className="text-muted-foreground">预计时长</span>
          <span>{props.durationMin || "未填写"} 分钟</span>
        </div>
        <p className="rounded-md border border-border px-2 py-1.5 text-xs text-muted-foreground">{props.autosaveStatusText}</p>
      </CardContent>
    </Card>
  );
}

