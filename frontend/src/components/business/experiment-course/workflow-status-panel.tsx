"use client";

import * as React from "react";

import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@bs-lab/ui";

type WorkflowStatusPanelProps = {
  workflowLabel: string;
  lifecycleLabel: string;
  showUnlinked?: boolean;
  rejectHint?: string | null;
};

export function WorkflowStatusPanel({
  workflowLabel,
  lifecycleLabel,
  showUnlinked = false,
  rejectHint,
}: WorkflowStatusPanelProps) {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">实验状态</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground">流程</span>
          {showUnlinked ? <span className="text-muted-foreground">未关联条目（无 ?id=）</span> : <Badge variant="secondary">{workflowLabel}</Badge>}
        </div>
        {!showUnlinked ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground">生命周期</span>
            <Badge variant="outline">{lifecycleLabel}</Badge>
          </div>
        ) : null}
        {rejectHint ? <p className="text-xs text-muted-foreground">{rejectHint}</p> : null}
      </CardContent>
    </Card>
  );
}
