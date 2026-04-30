"use client";

import * as React from "react";
import { sonnerToast } from "@bs-lab/ui";
import { authRoleToUserRole, useAuth } from "@/hooks/use-auth";
import { UserRole } from "@/types/auth";
import type { CoreApiActor } from "@/lib/core-api-shared";
import {
  fetchV2QuestionList,
  updateV2QuestionStatus,
  type V2QuestionItem,
} from "@/lib/v2/v2-question-api";
import {
  fetchV2DifficultyTypes,
  fetchV2QuestionTypes,
  fetchV2QuestionCapacities,
  type V2DictItem,
} from "@/lib/v2/v2-exp-api";
import { toDictOptions } from "@/lib/v2/v2-dict-adapter";

export type QuestionTabStatus = "t" | "y" | "n";

export interface UseQuestionBankReturn {
  actor: CoreApiActor;
  pendingItems: V2QuestionItem[];
  approvedItems: V2QuestionItem[];
  rejectedItems: V2QuestionItem[];
  loading: boolean;
  rejectDialogId: string | null;
  setRejectDialogId: (id: string | null) => void;
  difficultyTypes: V2DictItem[];
  questionTypes: V2DictItem[];
  questionCapacities: V2DictItem[];
  handleApprove: (questionId: string) => Promise<void>;
  handleReject: (questionId: string, rejectReason?: string) => Promise<void>;
  handleRetract: (questionId: string) => Promise<void>;
}

export function useQuestionBank(): UseQuestionBankReturn {
  const { user } = useAuth();
  const role = authRoleToUserRole(user.role);
  const actor = React.useMemo<CoreApiActor>(
    () => ({ role, orgId: user.orgId, userId: user.userId, userName: user.userName }),
    [role, user.orgId, user.userId, user.userName],
  );

  const [allItems, setAllItems] = React.useState<V2QuestionItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [rejectDialogId, setRejectDialogId] = React.useState<string | null>(null);
  const [difficultyTypes, setDifficultyTypes] = React.useState<V2DictItem[]>([]);
  const [questionTypes, setQuestionTypes] = React.useState<V2DictItem[]>([]);
  const [questionCapacities, setQuestionCapacities] = React.useState<V2DictItem[]>([]);

  const loadAll = React.useCallback(() => {
    setLoading(true);
    fetchV2QuestionList(actor, { pageSize: 100 })
      .then((r) => setAllItems(r.items))
      .catch((err: unknown) => {
        sonnerToast.error("题库加载失败", {
          description: err instanceof Error ? err.message : "未知错误",
        });
      })
      .finally(() => setLoading(false));
  }, [actor]);

  React.useEffect(() => { loadAll(); }, [loadAll]);

  React.useEffect(() => {
    void fetchV2DifficultyTypes(actor).then((rows) => setDifficultyTypes(toDictOptions(rows))).catch(() => {});
    void fetchV2QuestionTypes(actor).then((rows) => setQuestionTypes(toDictOptions(rows))).catch(() => {});
    void fetchV2QuestionCapacities(actor).then((rows) => setQuestionCapacities(toDictOptions(rows))).catch(() => {});
  }, [actor]);

  const pendingItems = allItems.filter((q) => q.status === "t" || q.status === null);
  const approvedItems = allItems.filter((q) => q.status === "y");
  const rejectedItems = allItems.filter((q) => q.status === "n");

  const doStatusUpdate = React.useCallback(
    async (questionId: string, status: "y" | "n" | "t", successMsg: string, rejectReason?: string) => {
      try {
        await updateV2QuestionStatus(actor, questionId, status, rejectReason);
        sonnerToast.success(successMsg);
        loadAll();
      } catch (err: unknown) {
        sonnerToast.error("操作失败", {
          description: err instanceof Error ? err.message : "未知错误",
        });
      }
    },
    [actor, loadAll],
  );

  const handleApprove = React.useCallback(
    (questionId: string) => doStatusUpdate(questionId, "y", "已入库"),
    [doStatusUpdate],
  );

  const handleReject = React.useCallback(
    async (questionId: string, rejectReason?: string) => {
      await doStatusUpdate(questionId, "n", "已驳回", rejectReason);
      setRejectDialogId(null);
    },
    [doStatusUpdate],
  );

  const handleRetract = React.useCallback(
    (questionId: string) => doStatusUpdate(questionId, "t", "已撤回至待处理"),
    [doStatusUpdate],
  );

  return {
    actor,
    pendingItems, approvedItems, rejectedItems,
    loading,
    rejectDialogId, setRejectDialogId,
    difficultyTypes, questionTypes, questionCapacities,
    handleApprove, handleReject, handleRetract,
  };
}
