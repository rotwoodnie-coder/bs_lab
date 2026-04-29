"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { sonnerToast } from "@bs-lab/ui";

import { useAuth, authRoleToUserRole } from "@/hooks/use-auth";
import type { CoreApiActor } from "@/lib/core-api-shared";
import {
  fetchV2ExpDetail,
  fetchV2ExpList,
  fetchV2SchoolGrades,
  type V2ExpMsgDetail,
  type V2ExpMsgItem,
} from "@/lib/v2/v2-exp-api";
import type { ExperimentDetail } from "@/types/experiment-detail";

import { submitReviewApproveFlow, submitReviewRejectFlow } from "./experiment-review-submit";
import { v2ExpMsgDetailToExperimentDetail } from "./v2-exp-msg-detail-to-experiment-detail";

async function fetchAllPendingExpMessages(actor: CoreApiActor): Promise<V2ExpMsgItem[]> {
  const pageSize = 100;
  let page = 1;
  const out: V2ExpMsgItem[] = [];
  for (;;) {
    const { items, total } = await fetchV2ExpList(actor, { status: "t", page, pageSize });
    out.push(...items);
    if (items.length === 0 || out.length >= total || items.length < pageSize) break;
    page += 1;
    if (page > 40) break;
  }
  return out;
}

export interface ExperimentCurriculumReviewModel {
  isResearcherWorkspace: boolean;
  pendingRows: V2ExpMsgItem[];
  reviewQueueIds: string[];
  expId: string;
  setExpId: (id: string) => void;
  experimentDetail: ExperimentDetail | null;
  detailLoading: boolean;
  listLoading: boolean;
  submitApprove: (note: string) => Promise<void>;
  submitReject: (reason: string, confirmShort?: string | null) => Promise<void>;
  rawDetail: V2ExpMsgDetail | null;
}

function useReviewPendingRowsState(actor: CoreApiActor) {
  const [pendingRows, setPendingRows] = React.useState<V2ExpMsgItem[]>([]);
  const [listLoading, setListLoading] = React.useState(true);

  const refreshQueue = React.useCallback(async (): Promise<V2ExpMsgItem[]> => {
    setListLoading(true);
    try {
      const rows = await fetchAllPendingExpMessages(actor);
      setPendingRows(rows);
      return rows;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "加载失败";
      sonnerToast.error("待评审列表加载失败", { description: msg });
      return [];
    } finally {
      setListLoading(false);
    }
  }, [actor]);

  React.useEffect(() => {
    void refreshQueue();
  }, [refreshQueue]);

  return { pendingRows, listLoading, refreshQueue };
}

function useReviewExpIdState(
  pendingRows: V2ExpMsgItem[],
  listLoading: boolean,
  searchParams: ReturnType<typeof useSearchParams>,
) {
  const [expId, setExpId] = React.useState("");

  React.useEffect(() => {
    if (listLoading) return;
    if (pendingRows.length === 0) {
      setExpId("");
      return;
    }
    const qp = searchParams.get("expId");
    if (qp && pendingRows.some((r) => r.expId === qp)) {
      setExpId(qp);
      return;
    }
    setExpId((cur) => (cur && pendingRows.some((r) => r.expId === cur) ? cur : pendingRows[0]!.expId));
  }, [listLoading, pendingRows, searchParams]);

  return { expId, setExpId };
}

function useReviewGradeMap(actor: CoreApiActor) {
  const [gradeMap, setGradeMap] = React.useState<Record<string, string>>({});
  React.useEffect(() => {
    void fetchV2SchoolGrades(actor)
      .then((rows) => {
        const m: Record<string, string> = {};
        for (const g of rows) m[g.id] = (g.name as string) ?? g.id;
        setGradeMap(m);
      })
      .catch(() => {});
  }, [actor]);
  return gradeMap;
}

function useReviewDetailBundle(actor: CoreApiActor, expId: string) {
  const [rawDetail, setRawDetail] = React.useState<V2ExpMsgDetail | null>(null);
  const [detailLoading, setDetailLoading] = React.useState(false);
  const gradeMap = useReviewGradeMap(actor);

  const refreshDetail = React.useCallback(async () => {
    if (!expId) {
      setRawDetail(null);
      return;
    }
    setDetailLoading(true);
    try {
      const d = await fetchV2ExpDetail(actor, expId);
      setRawDetail(d);
    } catch {
      setRawDetail(null);
      sonnerToast.error("实验详情加载失败");
    } finally {
      setDetailLoading(false);
    }
  }, [actor, expId]);

  React.useEffect(() => {
    void refreshDetail();
  }, [refreshDetail]);

  const experimentDetail = React.useMemo(() => {
    if (!rawDetail) return null;
    const gl = rawDetail.gradeId ? gradeMap[rawDetail.gradeId] : undefined;
    return v2ExpMsgDetailToExperimentDetail(rawDetail, { gradeLabel: gl });
  }, [rawDetail, gradeMap]);

  return { rawDetail, detailLoading, experimentDetail };
}

function useReviewSubmitCallbacks(params: {
  actor: CoreApiActor;
  expId: string;
  rawDetail: V2ExpMsgDetail | null;
  reviewQueueIds: string[];
  refreshQueue: () => Promise<V2ExpMsgItem[]>;
  setExpId: (id: string) => void;
}) {
  const { actor, expId, rawDetail, reviewQueueIds, refreshQueue, setExpId } = params;
  const title = rawDetail?.expName ?? expId;

  const submitApprove = React.useCallback(
    async (note: string) => {
      try {
        await submitReviewApproveFlow({
          actor,
          expId,
          note,
          title,
          reviewQueueIds,
          refreshQueue,
          setExpId,
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "提交失败";
        sonnerToast.error("评审提交失败", { description: msg });
      }
    },
    [actor, expId, title, refreshQueue, reviewQueueIds],
  );

  const submitReject = React.useCallback(
    async (reason: string, confirmShort?: string | null) => {
      try {
        await submitReviewRejectFlow({
          actor,
          expId,
          reason,
          confirmShort: confirmShort != null ? String(confirmShort) : "",
          title,
          reviewQueueIds,
          refreshQueue,
          setExpId,
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "提交失败";
        sonnerToast.error("驳回提交失败", { description: msg });
      }
    },
    [actor, expId, title, refreshQueue, reviewQueueIds],
  );

  return { submitApprove, submitReject };
}

export function useExperimentCurriculumReview(pathname: string | null): ExperimentCurriculumReviewModel {
  const searchParams = useSearchParams();
  const isResearcherWorkspace = pathname?.startsWith("/researcher/reviews") ?? false;
  const { user } = useAuth();
  const role = authRoleToUserRole(user.role);
  const actor = React.useMemo<CoreApiActor>(
    () => ({ role, orgId: user.orgId, userId: user.userId, userName: user.userName }),
    [role, user.orgId, user.userId, user.userName],
  );

  const { pendingRows, listLoading, refreshQueue } = useReviewPendingRowsState(actor);
  const { expId, setExpId } = useReviewExpIdState(pendingRows, listLoading, searchParams);
  const { rawDetail, detailLoading, experimentDetail } = useReviewDetailBundle(actor, expId);

  const reviewQueueIds = React.useMemo(() => pendingRows.map((r) => r.expId), [pendingRows]);

  const { submitApprove, submitReject } = useReviewSubmitCallbacks({
    actor,
    expId,
    rawDetail,
    reviewQueueIds,
    refreshQueue,
    setExpId,
  });

  return {
    isResearcherWorkspace,
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
  };
}
