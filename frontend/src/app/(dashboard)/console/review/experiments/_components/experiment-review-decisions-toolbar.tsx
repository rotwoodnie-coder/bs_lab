"use client";

import { Button, sonnerToast } from "@bs-lab/ui";

export function ExperimentReviewDecisionsToolbar({
  expId,
  reviewQueueIds,
  onClearComment,
  onApprove,
  onRejectClick,
}: {
  expId: string;
  reviewQueueIds: string[];
  onClearComment: () => void;
  onApprove: () => void;
  onRejectClick: () => void;
}) {
  const saveDraft = () => {
    sonnerToast.message("暂存", {
      description: "意见草稿仅保存在本机浏览器，未写入数据库。",
    });
  };

  return (
    <div className="sticky bottom-0 z-10 flex min-h-11 shrink-0 flex-row flex-nowrap items-center justify-end gap-1.5 overflow-x-auto overflow-y-hidden border-t border-border/80 bg-card/85 px-3 py-2 pb-safe-bottom shadow-[0_-8px_24px_-12px_color-mix(in_oklab,var(--color-foreground)_10%,transparent)] backdrop-blur-md supports-[backdrop-filter]:bg-card/70">
      <Button type="button" variant="secondary" size="sm" className="min-h-11 shrink-0 px-3 text-xs" onClick={onClearComment}>
        清空意见
      </Button>
      <Button type="button" variant="secondary" size="sm" className="min-h-11 shrink-0 px-3 text-xs" onClick={saveDraft}>
        暂存
      </Button>
      <Button
        type="button"
        variant="destructive"
        size="sm"
        className="min-h-11 shrink-0 px-3 text-xs"
        disabled={!reviewQueueIds.includes(expId)}
        onClick={onRejectClick}
      >
        驳回…
      </Button>
      <Button
        type="button"
        size="sm"
        className="min-h-11 shrink-0 px-3 text-xs"
        disabled={!reviewQueueIds.includes(expId)}
        onClick={onApprove}
      >
        通过并下一条
      </Button>
    </div>
  );
}
