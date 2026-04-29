"use client";

import * as React from "react";
import {
  Button,
  ScrollAreaWithTopEdge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  sonnerToast,
} from "@bs-lab/ui";
import { Maximize2, Minimize2 } from "@bs-lab/ui/icons";

import { ExperimentDetailContent } from "@/components/business/experiment-detail-content";
import { cn } from "@/lib/utils";

import type { ExperimentCurriculumReviewModel } from "../experiment-curriculum-review.hooks";
import { ExperimentRejectReasonDialog } from "./experiment-reject-reason-dialog";
import { ExperimentReviewDecisionsCard } from "./experiment-review-decisions-card";

const STATUS_LABEL: Record<string, string> = {
  t: "草稿",
  y: "已通过",
  n: "未通过",
};

export type ExperimentReviewWorkbenchProps = {
  model: ExperimentCurriculumReviewModel;
};

export function ExperimentReviewWorkbench({ model }: ExperimentReviewWorkbenchProps) {
  const {
    pendingRows,
    reviewQueueIds,
    expId,
    setExpId,
    experimentDetail,
    detailLoading,
    listLoading,
    submitApprove,
    submitReject,
    rawDetail,
  } = model;

  const [score, setScore] = React.useState([78]);
  const [comment, setComment] = React.useState("");
  const [opinionEditorOpen, setOpinionEditorOpen] = React.useState(false);
  const [previewExpanded, setPreviewExpanded] = React.useState(false);
  const [transitionNonce, setTransitionNonce] = React.useState(0);
  const [rejectOpen, setRejectOpen] = React.useState(false);
  const [rejectReason, setRejectReason] = React.useState("");

  const showOpinionEditor = opinionEditorOpen || Boolean(comment.trim());
  const workflowLabel = rawDetail?.status ? STATUS_LABEL[rawDetail.status] ?? "—" : "—";

  const handleApprove = React.useCallback(async () => {
    if (!reviewQueueIds.includes(expId)) {
      sonnerToast.message("当前实验不在待评审队列", {
        description: "仅「草稿」状态的试验会出现在待评审列表。",
      });
      return;
    }
    await submitApprove(comment.trim());
    setComment("");
    setOpinionEditorOpen(false);
    setTransitionNonce((n) => n + 1);
  }, [comment, expId, reviewQueueIds, submitApprove]);

  const openRejectDialog = React.useCallback(() => {
    if (!reviewQueueIds.includes(expId)) {
      sonnerToast.message("当前实验不在待评审队列", {
        description: "仅「草稿」状态的试验会出现在待评审列表。",
      });
      return;
    }
    setRejectReason(comment.trim());
    setRejectOpen(true);
  }, [comment, expId, reviewQueueIds]);

  const confirmRejectFromDialog = React.useCallback(async () => {
    const r = rejectReason.trim();
    if (r.length < 4) return;
    await submitReject(r, comment.trim());
    setComment("");
    setOpinionEditorOpen(false);
    setRejectReason("");
    setRejectOpen(false);
    setTransitionNonce((n) => n + 1);
  }, [comment, rejectReason, submitReject]);

  const scrollAreaFillClass =
    "min-h-0 flex-1 [&_[data-slot=scroll-area]]:h-full [&_[data-slot=scroll-area]]:min-h-0";

  if (listLoading && pendingRows.length === 0) {
    return <p className="text-sm text-muted-foreground">加载待评审列表…</p>;
  }

  if (!listLoading && pendingRows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        暂无待评审试验。教师新建或处于「草稿」状态的试验会出现在此队列。
      </p>
    );
  }

  if (detailLoading && !experimentDetail) {
    return <p className="text-sm text-muted-foreground">加载实验详情…</p>;
  }

  if (!experimentDetail) {
    return <p className="text-sm text-muted-foreground">未找到实验详情。</p>;
  }

  return (
    <>
      <ExperimentRejectReasonDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        rejectReason={rejectReason}
        onRejectReasonChange={setRejectReason}
        onConfirm={() => void confirmRejectFromDialog()}
      />

      <div className="rounded-xl border border-border bg-muted/30 p-3 shadow-xs sm:p-4 dark:bg-muted/15 lg:flex lg:min-h-0 lg:flex-1 lg:flex-col lg:overflow-hidden">
        <div className="grid grid-cols-1 gap-5 lg:min-h-0 lg:flex-1 lg:grid-cols-12 lg:items-stretch">
          <div
            className={
              previewExpanded
                ? "flex min-h-0 min-w-0 flex-col lg:col-span-12"
                : "flex min-h-0 min-w-0 flex-col lg:col-span-8"
            }
          >
            <div className="mb-2 flex shrink-0 flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-foreground">实验预览</h2>
              <div className="flex flex-wrap items-center gap-2">
                <Select value={expId} onValueChange={setExpId}>
                  <SelectTrigger
                    className="h-11 min-h-11 w-[min(100%,240px)]"
                    aria-label="选择待评审实验"
                  >
                    <SelectValue placeholder="选择实验" />
                  </SelectTrigger>
                  <SelectContent>
                    {pendingRows.map((row) => (
                      <SelectItem key={row.expId} value={row.expId}>
                        {row.expName || row.expId}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setPreviewExpanded((v) => !v)}
                  aria-expanded={previewExpanded}
                  aria-label={previewExpanded ? "退出全宽预览" : "放大预览区"}
                >
                  {previewExpanded ? (
                    <>
                      <Minimize2 className="size-4" />
                      退出全宽
                    </>
                  ) : (
                    <>
                      <Maximize2 className="size-4" />
                      放大
                    </>
                  )}
                </Button>
              </div>
            </div>

            <ScrollAreaWithTopEdge
              className={cn(
                scrollAreaFillClass,
                "min-h-[min(280px,42svh)] rounded-lg border border-border bg-card pr-3 lg:min-h-0",
              )}
              fadeFromClassName="from-card/95 via-card/50"
            >
              <div key={`${expId}-${transitionNonce}`} className="p-4 pb-6">
                <ExperimentDetailContent detail={experimentDetail} variant="review" />
              </div>
            </ScrollAreaWithTopEdge>
          </div>

          {!previewExpanded ? (
            <div className="flex min-h-0 min-w-0 flex-col gap-3 lg:col-span-4 lg:min-w-[300px] lg:max-w-full lg:overflow-x-auto">
              <h2 className="shrink-0 text-sm font-semibold text-foreground">评审与审批</h2>
              <ExperimentReviewDecisionsCard
                expId={expId}
                reviewQueueIds={reviewQueueIds}
                rawDetail={rawDetail}
                workflowLabel={workflowLabel}
                lifecycleLabel={workflowLabel}
                score={score}
                onScoreChange={setScore}
                comment={comment}
                onCommentChange={setComment}
                showOpinionEditor={showOpinionEditor}
                onOpinionEditorOpen={() => setOpinionEditorOpen(true)}
                onOpinionEditorClose={() => setOpinionEditorOpen(false)}
                onApprove={() => void handleApprove()}
                onRejectClick={openRejectDialog}
              />
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
