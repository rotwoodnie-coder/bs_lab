import * as React from "react";

import { WorkflowStatusPanel } from "@/components/business/experiment-course/workflow-status-panel";

export type ToolboxPanelProps = {
  workflowLabel: string;
  lifecycleLabel: string;
  showUnlinked: boolean;
  rejectHint: string | null;
};

export function ToolboxPanel({ workflowLabel, lifecycleLabel, showUnlinked, rejectHint }: ToolboxPanelProps) {
  return (
    <div className="min-w-0 space-y-4">
      <WorkflowStatusPanel
        workflowLabel={workflowLabel}
        lifecycleLabel={lifecycleLabel}
        showUnlinked={showUnlinked}
        rejectHint={rejectHint}
      />
    </div>
  );
}

