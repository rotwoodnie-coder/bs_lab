"use client";

import * as React from "react";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  sonnerToast,
} from "@bs-lab/ui";
import { CheckCircle2, ClipboardList, XCircle } from "@bs-lab/ui/icons";

import { ExperimentLayoutTopSlot } from "@/components/business/experiment-detail/experiment-layout";
import type { ExperimentDetail } from "@/types/experiment";

export type AuditControlBarProps = {
  detail: ExperimentDetail;
  className?: string;
};

/** 教研员顶部槽位：审批状态、意见与通过 / 驳回（逻辑与视觉自包含）。 */
export function AuditControlBar({ detail, className }: AuditControlBarProps) {
  const [reviewStatus, setReviewStatus] = React.useState<string>(detail.management.approvalStatus);
  const [reviewComment, setReviewComment] = React.useState("");
  const [reviewOpinionExpanded, setReviewOpinionExpanded] = React.useState(false);
  const showReviewOpinionField = reviewOpinionExpanded || Boolean(reviewComment.trim());

  React.useEffect(() => {
    setReviewStatus(detail.management.approvalStatus);
  }, [detail.id, detail.management.approvalStatus]);

  React.useEffect(() => {
    setReviewOpinionExpanded(false);
  }, [detail.id]);

  const handleApprove = React.useCallback(() => {
    sonnerToast.success("已通过（Mock）", { description: reviewComment || "无附加意见" });
  }, [reviewComment]);

  const handleReject = React.useCallback(() => {
    sonnerToast.message("已驳回（Mock）", { description: reviewComment || "请补充材料后重新提交" });
  }, [reviewComment]);

  const handleSaveReviewForm = React.useCallback(() => {
    sonnerToast.success("评审已记录（Mock）", {
      description: `状态：${reviewStatus}；意见：${reviewComment || "无"}`,
    });
  }, [reviewComment, reviewStatus]);

  return (
    <ExperimentLayoutTopSlot id="audit-control-bar" className={className}>
      <Card className="border-0 bg-transparent shadow-none">
        <CardHeader className="space-y-1 pb-2 sm:flex sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0 space-y-1">
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="size-4 text-primary" />
              教研审批
            </CardTitle>
            <CardDescription>审批状态、评审意见与通过 / 驳回操作</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,200px)_1fr] lg:items-end">
            <div className="space-y-2">
              <Label htmlFor="audit-review-status">审批状态</Label>
              <Select value={reviewStatus} onValueChange={setReviewStatus}>
                <SelectTrigger id="audit-review-status" className="w-full">
                  <SelectValue placeholder="选择状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">草稿</SelectItem>
                  <SelectItem value="pending">待审批</SelectItem>
                  <SelectItem value="approved">已通过</SelectItem>
                  <SelectItem value="rejected">已驳回</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Label htmlFor="audit-review-note">意见</Label>
                {showReviewOpinionField && !reviewComment.trim() ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs text-muted-foreground"
                    onClick={() => setReviewOpinionExpanded(false)}
                  >
                    收起
                  </Button>
                ) : null}
              </div>
              {showReviewOpinionField ? (
                <Textarea
                  id="audit-review-note"
                  placeholder="填写评审意见或通过说明…"
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="min-h-[72px] resize-y"
                />
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 w-full justify-start font-normal text-muted-foreground"
                  onClick={() => setReviewOpinionExpanded(true)}
                >
                  添加意见…
                </Button>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" className="h-9 gap-1.5" onClick={handleApprove}>
              <CheckCircle2 className="size-3.5" />
              通过
            </Button>
            <Button type="button" size="sm" variant="destructive" className="h-9 gap-1.5" onClick={handleReject}>
              <XCircle className="size-3.5" />
              驳回
            </Button>
            <Button type="button" size="sm" variant="outline" className="h-9 gap-1.5" onClick={handleSaveReviewForm}>
              保存评审
            </Button>
          </div>
        </CardContent>
      </Card>
    </ExperimentLayoutTopSlot>
  );
}
