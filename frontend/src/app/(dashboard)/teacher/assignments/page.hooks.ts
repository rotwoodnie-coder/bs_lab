"use client";

import * as React from "react";
import { sonnerToast } from "@bs-lab/ui";
import { authRoleToUserRole, useAuth } from "@/hooks/use-auth";
import { UserRole } from "@/types/auth";
import type { CoreApiActor } from "@/lib/core-api-shared";
import {
  fetchV2HomeworkList,
  createV2Homework,
  type V2HomeworkItem,
  type CreateHomeworkInput,
} from "@/lib/v2/v2-homework-api";
import {
  fetchV2ExpLibraryList,
  type V2ExpLibraryItem,
} from "@/lib/v2/v2-exp-api";

export interface UseAssignmentsReturn {
  actor: CoreApiActor;
  items: V2HomeworkItem[];
  total: number;
  loading: boolean;
  page: number;
  pageSize: number;
  setPage: (n: number) => void;
  refresh: () => void;
  // 新建对话框
  dialogOpen: boolean;
  setDialogOpen: (v: boolean) => void;
  expLibraryItems: V2ExpLibraryItem[];
  expLibLoading: boolean;
  submitting: boolean;
  handleCreate: (input: CreateHomeworkInput) => Promise<void>;
}

export function useAssignments(): UseAssignmentsReturn {
  const { user } = useAuth();
  const role = authRoleToUserRole(user.role);
  const actor = React.useMemo<CoreApiActor>(
    () => ({ role, orgId: user.orgId, userId: user.userId, userName: user.userName }),
    [role, user.orgId, user.userId, user.userName],
  );

  const [items, setItems] = React.useState<V2HomeworkItem[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const pageSize = 20;

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [expLibraryItems, setExpLibraryItems] = React.useState<V2ExpLibraryItem[]>([]);
  const [expLibLoading, setExpLibLoading] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  const refresh = React.useCallback(() => {
    setLoading(true);
    fetchV2HomeworkList(actor, { teacherUserId: actor.userId, page, pageSize })
      .then((result) => {
        setItems(result.items);
        setTotal(result.total);
      })
      .catch((err: unknown) => {
        sonnerToast.error("作业列表加载失败", {
          description: err instanceof Error ? err.message : "未知错误",
        });
      })
      .finally(() => setLoading(false));
  }, [actor, page, pageSize]);

  React.useEffect(() => { refresh(); }, [refresh]);

  React.useEffect(() => {
    if (!dialogOpen) return;
    setExpLibLoading(true);
    fetchV2ExpLibraryList(actor, { pageSize: 100 })
      .then((r) => setExpLibraryItems(r.items))
      .catch(() => {
        sonnerToast.error("加载实验库失败");
      })
      .finally(() => setExpLibLoading(false));
  }, [actor, dialogOpen]);

  const handleCreate = React.useCallback(
    async (input: CreateHomeworkInput) => {
      setSubmitting(true);
      try {
        await createV2Homework(actor, input);
        sonnerToast.success("作业已布置", { description: "学生可在任务中心查看" });
        setDialogOpen(false);
        refresh();
      } catch (err: unknown) {
        sonnerToast.error("布置失败", {
          description: err instanceof Error ? err.message : "未知错误",
        });
      } finally {
        setSubmitting(false);
      }
    },
    [actor, refresh],
  );

  return {
    actor, items, total, loading,
    page, pageSize, setPage,
    refresh,
    dialogOpen, setDialogOpen,
    expLibraryItems, expLibLoading,
    submitting, handleCreate,
  };
}
