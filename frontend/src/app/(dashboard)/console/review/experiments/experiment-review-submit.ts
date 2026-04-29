import { sonnerToast } from "@bs-lab/ui";

import type { CoreApiActor } from "@/lib/core-api-shared";
import { patchV2ExpMsgReview } from "@/lib/v2/v2-exp-api";

import { nextReviewIdInQueue, playReviewChime } from "./review-chime";

export async function submitReviewApproveFlow(params: {
  actor: CoreApiActor;
  expId: string;
  note: string;
  title: string;
  reviewQueueIds: string[];
  refreshQueue: () => Promise<{ expId: string }[]>;
  setExpId: (id: string) => void;
}): Promise<void> {
  const { actor, expId, note, title, reviewQueueIds, refreshQueue, setExpId } = params;
  if (!reviewQueueIds.includes(expId)) {
    sonnerToast.message("当前实验不在待评审队列", {
      description: "仅「草稿」状态的试验会出现在待评审列表。",
    });
    return;
  }
  await patchV2ExpMsgReview(actor, expId, {
    status: "y",
    confirm_comments: note.trim().slice(0, 200) || null,
    reject_reason: null,
  });
  playReviewChime("approve");
  sonnerToast.success("评审通过", { description: `「${title}」已更新为已通过` });
  const nextRows = await refreshQueue();
  const ids = nextRows.map((r) => r.expId);
  window.setTimeout(() => {
    if (ids.length === 0) sonnerToast.info("待评审队列已空");
    setExpId(ids.length ? nextReviewIdInQueue(expId, ids) : "");
  }, 360);
}

export async function submitReviewRejectFlow(params: {
  actor: CoreApiActor;
  expId: string;
  reason: string;
  confirmShort: string;
  title: string;
  reviewQueueIds: string[];
  refreshQueue: () => Promise<{ expId: string }[]>;
  setExpId: (id: string) => void;
}): Promise<void> {
  const { actor, expId, reason, confirmShort, title, reviewQueueIds, refreshQueue, setExpId } = params;
  if (!reviewQueueIds.includes(expId)) {
    sonnerToast.message("当前实验不在待评审队列", {
      description: "仅「草稿」状态的试验会出现在待评审列表。",
    });
    return;
  }
  const short = confirmShort.trim().slice(0, 200);
  await patchV2ExpMsgReview(actor, expId, {
    status: "n",
    confirm_comments: short.length > 0 ? short : null,
    reject_reason: reason.trim(),
  });
  playReviewChime("reject");
  sonnerToast.error("已驳回", {
    description: `「${title}」已标记为未通过`,
    className: "border-destructive/30",
  });
  const nextRows = await refreshQueue();
  const ids = nextRows.map((r) => r.expId);
  window.setTimeout(() => {
    if (ids.length === 0) sonnerToast.info("待评审队列已空");
    setExpId(ids.length ? nextReviewIdInQueue(expId, ids) : "");
  }, 360);
}
