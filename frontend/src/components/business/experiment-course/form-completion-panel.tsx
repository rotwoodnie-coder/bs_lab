"use client";

import * as React from "react";

import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@bs-lab/ui";

type ChecklistItem = { label: string; ok: boolean };

type FormCompletionPanelProps = {
  checklist: ChecklistItem[];
  completionPct: number;
  title?: string;
  description?: string;
};

export function FormCompletionPanel({
  checklist,
  completionPct,
  title = "录入完整度",
  description = "用于提交前自检（Mock）",
}: FormCompletionPanelProps) {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">完成进度</span>
          <Badge variant={completionPct === 100 ? "default" : "secondary"}>{completionPct}%</Badge>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-primary transition-all" style={{ width: `${completionPct}%` }} />
        </div>
        <div className="space-y-2">
          {checklist.map((item) => (
            <div key={item.label} className="flex items-center justify-between gap-2">
              <span className={item.ok ? "text-foreground" : "text-muted-foreground"}>{item.label}</span>
              <Badge variant={item.ok ? "outline" : "secondary"}>{item.ok ? "已完成" : "待补充"}</Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
