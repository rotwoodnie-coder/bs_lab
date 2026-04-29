import * as React from "react";
import Link from "next/link";

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  Textarea,
} from "@bs-lab/ui";

import { EXPERIMENT_EDITOR_MULTILINE_ROWS } from "../page.constants";
import { SectionAnchorNav } from "@/components/business/experiment-course/section-anchor-nav";
import {
  EDITOR_PEER_WORKFLOW_LABEL,
  type EditorPeerWorkflowStatus,
} from "../utils/editor-peer-row-types";

export type EditorToolbarProps = {
  expId: string | null;
  intervention: boolean;
  creatorName: string;
  fallbackCreatorName: string;

  // runtime config (intervention)
  showInterventionPanel: boolean;
  rtSafety: string;
  setRtSafety: (v: string) => void;
  rtMaterial: string;
  setRtMaterial: (v: string) => void;
  onSaveRuntimeConfig: () => void;

  // review bars
  showResearcherReviewBar: boolean;
  showResearcherTakedown: boolean;
  showResearcherNoopHint: boolean;
  rowTitle?: string;
  workflowStatus?: EditorPeerWorkflowStatus;
  onApprove: () => void;
  onArchivePublished: () => void;

  // reject dialog
  rejectOpen: boolean;
  setRejectOpen: (open: boolean) => void;
  rejectDraft: string;
  setRejectDraft: (v: string) => void;
  onConfirmReject: () => void;

  // mobile nav
  anchorsWithStatus: { id: string; label: string; progressPct?: number; completed?: boolean }[];
  activeAnchorId: string;
  onNavigateAnchor: (id: string) => void;
  mobileNavOpen: boolean;
  setMobileNavOpen: (open: boolean) => void;
};

export function EditorToolbar({
  expId,
  intervention,
  creatorName,
  fallbackCreatorName,
  showInterventionPanel,
  rtSafety,
  setRtSafety,
  rtMaterial,
  setRtMaterial,
  onSaveRuntimeConfig,
  showResearcherReviewBar,
  showResearcherTakedown,
  showResearcherNoopHint,
  rowTitle,
  workflowStatus,
  onApprove,
  onArchivePublished,
  rejectOpen,
  setRejectOpen,
  rejectDraft,
  setRejectDraft,
  onConfirmReject,
  anchorsWithStatus,
  activeAnchorId,
  onNavigateAnchor,
  mobileNavOpen,
  setMobileNavOpen,
}: EditorToolbarProps) {
  return (
    <>
      {showInterventionPanel ? null : null}

      {showResearcherReviewBar && workflowStatus ? (
        <Card className="rounded-[28px] border-0 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">审核</p>
              <p className="text-xs text-muted-foreground">
                {rowTitle} · 当前 {EDITOR_PEER_WORKFLOW_LABEL[workflowStatus]}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="success" onClick={onApprove}>
                审核通过
              </Button>
              <Button type="button" variant="warning" onClick={() => setRejectOpen(true)}>
                驳回
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {showResearcherTakedown ? (
        <Card className="rounded-[28px] border-0 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">上架内容管理</p>
              <p className="text-xs text-muted-foreground">{rowTitle} · 已上架，可下架归档</p>
            </div>
            <Button type="button" variant="destructive" onClick={onArchivePublished}>
              下架
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {showResearcherNoopHint && workflowStatus ? (
        <p className="text-sm text-muted-foreground">
          当前状态为「{EDITOR_PEER_WORKFLOW_LABEL[workflowStatus]}」，无需评审操作。
        </p>
      ) : null}

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>驳回原因</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="reject-reason">原因说明</Label>
            <Textarea
              id="reject-reason"
              value={rejectDraft}
              onChange={(e) => setRejectDraft(e.target.value)}
              rows={EXPERIMENT_EDITOR_MULTILINE_ROWS}
              placeholder="请输入驳回原因"
              className="min-h-[120px]"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setRejectOpen(false)}>
              取消
            </Button>
            <Button type="button" variant="warning" onClick={onConfirmReject} disabled={!rejectDraft.trim()}>
              确认驳回
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex items-center justify-between gap-3 lg:hidden">
        <Button type="button" variant="outline" onClick={() => setMobileNavOpen(true)}>
          目录
        </Button>
      </div>

      <Dialog open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>目录</DialogTitle>
          </DialogHeader>
          <SectionAnchorNav
            anchors={anchorsWithStatus}
            activeId={activeAnchorId}
            onNavigate={(id) => {
              setMobileNavOpen(false);
              requestAnimationFrame(() => onNavigateAnchor(id));
            }}
            title="目录"
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

