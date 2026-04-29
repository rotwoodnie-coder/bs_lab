"use client";

import * as React from "react";
import { Avatar, AvatarFallback, Badge, Card, CardContent } from "@bs-lab/ui";
import { sonnerToast } from "@bs-lab/ui";

import { CurriculumVideoPreview } from "@/components/business/curriculum-video";
import { ExpMsgCoverPreview } from "@/components/business/experiment-manage/ExpMsgCoverPreview";
import { submitSameStyleWork } from "@/store/works-pipeline-mock-store";

import { ExperimentCourseCardCommentDialog } from "./ExperimentCourseCardCommentDialog";
import { ExperimentCourseCardMenus } from "./ExperimentCourseCardMenus";
import { useExperimentCourseCardQuickState } from "./useExperimentCourseCardQuickState";
import type { ExperimentManageCardContext, ExperimentManageCardMenuAction } from "./types";

function authorInitial(name: string): string {
  const normalized = name.trim();
  if (!normalized) return "作";
  return normalized.slice(0, 1);
}

export type ExperimentCourseVideoCardProps = {
  ctx: ExperimentManageCardContext;
  className?: string;
  onEdit: () => void;
  onReviewOrView: () => void;
  onOpenVideoManager: () => void;
  onDelete?: () => void | Promise<void>;
};

export function ExperimentCourseVideoCard(props: ExperimentCourseVideoCardProps) {
  const { row, actor, defaultVideoId } = props.ctx;
  const quickState = useExperimentCourseCardQuickState();
  const quick = quickState.byId[row.id];

  const [commentOpen, setCommentOpen] = React.useState(false);

  React.useEffect(() => {
    quickState.ensure(row.id, { likeCount: row.copyCount ?? 0 });
  }, [quickState, row.copyCount, row.id]);

  const handleAction = React.useCallback(
    (action: ExperimentManageCardMenuAction) => {
      switch (action) {
        case "edit":
          props.onEdit();
          return;
        case "review_or_view":
          props.onReviewOrView();
          return;
        case "video_manage":
          props.onOpenVideoManager();
          return;
        case "like":
          quickState.toggleLike(row.id, row.copyCount ?? 0);
          sonnerToast.success(quick?.liked ? "已取消点赞" : "已点赞");
          return;
        case "favorite":
          quickState.toggleFavorite(row.id);
          sonnerToast.success(quick?.favorited ? "已取消收藏" : "已收藏");
          return;
        case "comment":
          setCommentOpen(true);
          return;
        case "same_style":
          submitSameStyleWork({
            sourceExperimentId: row.id,
            sourceExperimentTitle: row.title,
            title: `拍同款 · ${row.title}`,
          });
          sonnerToast.success("已模拟上传短视频并提交审核");
          return;
        case "delete":
          void props.onDelete?.();
          return;
      }
    },
    [props, quick?.favorited, quick?.liked, quickState, row.copyCount, row.id, row.title],
  );

  return (
    <Card className={`rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md ${props.className ?? ""}`}>
      <div className="relative p-5 pb-0">
        <div className="overflow-hidden rounded-xl">
          {row.coverVideoUrl ? (
            <ExpMsgCoverPreview coverUrl={row.coverVideoUrl} title={row.title} />
          ) : (
            <CurriculumVideoPreview actor={actor} rowId={row.id} defaultVideoId={defaultVideoId} />
          )}
        </div>
        <div className="pointer-events-none absolute right-4 top-4">
          <Badge variant="secondary" className="pointer-events-auto h-5 rounded-md px-2 text-[10px] font-medium text-slate-500">
            {row.durationHint ?? "—"}
          </Badge>
        </div>
      </div>

      <CardContent className="space-y-4 p-5 pt-4">
        <div className="flex items-start gap-3">
          <Avatar className="mt-0.5 size-7 border border-border">
            <AvatarFallback className="text-[10px] font-medium">{authorInitial(row.authorName || "")}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1 space-y-1">
                <div className="line-clamp-2 text-base leading-tight tracking-tight text-foreground">{row.title}</div>
                <div className="flex flex-wrap gap-1.5">
                  {row.subjectLabel ? <Badge variant="secondary" className="h-5 rounded-md px-1.5 text-[10px] font-medium text-slate-600">{row.subjectLabel}</Badge> : null}
                  {row.gradeLabels?.[0] ? <Badge variant="secondary" className="h-5 rounded-md px-1.5 text-[10px] font-medium text-slate-600">{row.gradeLabels.join("、")}</Badge> : null}
                  {row.authorRoleLabel ? <Badge variant="secondary" className="h-5 rounded-md px-1.5 text-[10px] font-medium text-slate-600">{row.authorRoleLabel}</Badge> : null}
                </div>
                <div className="truncate text-xs leading-tight text-muted-foreground">
                  {row.authorName || "—"}
                </div>
              </div>
              <ExperimentCourseCardMenus
                quick={quick}
                fallbackLikeCount={row.copyCount ?? 0}
                onAction={handleAction}
              />
            </div>
          </div>
        </div>
      </CardContent>

      <div className="px-5 pb-5 pt-0">
        <button
          type="button"
          onClick={props.onReviewOrView}
          className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-md border border-border bg-background text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          打开实验详情
        </button>
      </div>

      <ExperimentCourseCardCommentDialog
        open={commentOpen}
        onOpenChange={setCommentOpen}
        onSubmit={(text) => {
          void text;
          quickState.incrementCommentCount(row.id);
          setCommentOpen(false);
          sonnerToast.success("留言成功（本地）");
        }}
      />
    </Card>
  );
}

