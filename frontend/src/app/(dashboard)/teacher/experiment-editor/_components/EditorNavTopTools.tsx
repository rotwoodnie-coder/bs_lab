import * as React from "react";
import { Button } from "@bs-lab/ui";

import { WorkflowStatusPanel } from "@/components/business/experiment-course/workflow-status-panel";

export function EditorNavTopTools(props: {
  showSubmit: boolean;
  onSubmit: () => void;
  workflowLabel: string;
  lifecycleLabel: string;
  showUnlinked: boolean;
  rejectHint: string | null;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-3">
      <WorkflowStatusPanel
        workflowLabel={props.workflowLabel}
        lifecycleLabel={props.lifecycleLabel}
        showUnlinked={props.showUnlinked}
        rejectHint={props.rejectHint}
      />
      {props.showSubmit ? (
        <Button type="button" onClick={props.onSubmit}>
          提交审核
        </Button>
      ) : (
        <span className="text-xs text-muted-foreground">当前角色不支持提交审核</span>
      )}
    </div>
  );
}

