"use client";

import { Card, CardDescription, CardFooter, CardHeader, CardTitle, ScrollAreaWithTopEdge, Separator } from "@bs-lab/ui";

import type { V2ExpMsgDetail } from "@/lib/v2/v2-exp-api";
import { cn } from "@/lib/utils";

import { ExperimentReviewDecisionsCommentField } from "./experiment-review-decisions-comment-field";
import { ExperimentReviewDecisionsMetaPanel } from "./experiment-review-decisions-meta-panel";
import { ExperimentReviewDecisionsScoreSlider } from "./experiment-review-decisions-score-slider";
import { ExperimentReviewDecisionsToolbar } from "./experiment-review-decisions-toolbar";

export type ExperimentReviewDecisionsCardProps = {
  expId: string;
  reviewQueueIds: string[];
  rawDetail: V2ExpMsgDetail | null;
  workflowLabel: string;
  lifecycleLabel: string;
  score: number[];
  onScoreChange: (v: number[]) => void;
  comment: string;
  onCommentChange: (v: string) => void;
  showOpinionEditor: boolean;
  onOpinionEditorOpen: () => void;
  onOpinionEditorClose: () => void;
  onApprove: () => void;
  onRejectClick: () => void;
};

export function ExperimentReviewDecisionsCard(props: ExperimentReviewDecisionsCardProps) {
  const scrollAreaFillClass =
    "min-h-0 flex-1 [&_[data-slot=scroll-area]]:h-full [&_[data-slot=scroll-area]]:min-h-0";

  return (
    <Card className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden border-border bg-card shadow-xs">
      <CardHeader className="shrink-0 space-y-1 border-b border-border pb-3">
        <CardTitle className="min-w-0 break-words text-base">审批结论</CardTitle>
        <CardDescription>评分仅作本机备忘；入库字段为审核状态与意见/驳回原因。</CardDescription>
      </CardHeader>
      <ScrollAreaWithTopEdge
        className={cn(scrollAreaFillClass, "min-h-[min(200px,30svh)] lg:min-h-0")}
        fadeFromClassName="from-card/95 via-card/45"
      >
        <div className="space-y-4 p-4">
          <ExperimentReviewDecisionsMetaPanel
            rawDetail={props.rawDetail}
            workflowLabel={props.workflowLabel}
            lifecycleLabel={props.lifecycleLabel}
          />
          <Separator />
          <ExperimentReviewDecisionsScoreSlider score={props.score} onScoreChange={props.onScoreChange} />
          <Separator />
          <ExperimentReviewDecisionsCommentField
            comment={props.comment}
            onCommentChange={props.onCommentChange}
            showOpinionEditor={props.showOpinionEditor}
            onOpinionEditorOpen={props.onOpinionEditorOpen}
            onOpinionEditorClose={props.onOpinionEditorClose}
          />
        </div>
      </ScrollAreaWithTopEdge>
      <CardFooter className="sticky bottom-0 z-10 flex min-h-0 shrink-0 flex-col border-0 bg-transparent p-0 shadow-none">
        <ExperimentReviewDecisionsToolbar
          expId={props.expId}
          reviewQueueIds={props.reviewQueueIds}
          onClearComment={() => {
            props.onCommentChange("");
            props.onOpinionEditorClose();
          }}
          onApprove={props.onApprove}
          onRejectClick={props.onRejectClick}
        />
      </CardFooter>
    </Card>
  );
}
