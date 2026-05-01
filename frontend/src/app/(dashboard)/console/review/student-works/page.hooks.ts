"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useSessionActor } from "@/hooks/use-session-actor";
import { sonnerToast } from "@bs-lab/ui";
import {
  fetchStudentWorksForReview,
  approveStudentWork,
  rejectStudentWork,
  type StudentWorkReviewItem,
} from "@/lib/v2/v2-review-api";

export function useStudentWorksReview() {
  const session = useSessionActor();
  const actor = session.actor;
  const router = useRouter();

  const [list, setList] = React.useState<StudentWorkReviewItem[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [pageSize] = React.useState(20);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // 选中状态
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [rejectOpen, setRejectOpen] = React.useState(false);
  const [rejectReason, setRejectReason] = React.useState("");
  const [pendingIds, setPendingIds] = React.useState<string[]>([]);

  const load = React.useCallback(async (p: number) => {
    if (!actor) return;
    setLoading(true);
    setError(null);
    try {
      const result = await fetchStudentWorksForReview(actor, p, pageSize);
      setList(result.items);
      setTotal(result.total);
      setPage(result.page ?? p);
      setSelected(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败");
      setList([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [actor, pageSize]);

  React.useEffect(() => {
    if (actor) load(page);
  }, [actor, page, load]);

  const refresh = React.useCallback(() => {
    setSelected(new Set());
    load(page);
  }, [load, page]);

  // ── 批量操作 ──

  const allIds = list.map((r) => r.expId);
  const allSelected = selected.size === allIds.length && allIds.length > 0;
  const someSelected = selected.size > 0 && !allSelected;

  const toggleAll = (next: boolean) => setSelected(next ? new Set(allIds) : new Set());
  const toggleOne = (id: string, next: boolean) =>
    setSelected((prev) => {
      const n = new Set(prev);
      next ? n.add(id) : n.delete(id);
      return n;
    });

  const handleApprove = async () => {
    const ids = [...selected];
    if (!ids.length) return sonnerToast.error("请先选择作品");
    if (!actor) return sonnerToast.error("登录已过期，请刷新页面");

    try {
      for (const id of ids) {
        await approveStudentWork(actor, id);
      }
      sonnerToast.success(`已通过 ${ids.length} 条`);
      refresh();
    } catch (err) {
      sonnerToast.error(err instanceof Error ? err.message : "操作失败");
    }
  };

  const openReject = (ids: string[]) => {
    if (!ids.length) return sonnerToast.error("请先选择作品");
    setPendingIds(ids);
    setRejectReason("");
    setRejectOpen(true);
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return sonnerToast.error("必须填写驳回理由");
    if (!actor) return sonnerToast.error("登录已过期，请刷新页面");

    try {
      for (const id of pendingIds) {
        await rejectStudentWork(actor, id, rejectReason.trim());
      }
      sonnerToast.success(`已驳回 ${pendingIds.length} 条`);
      setRejectOpen(false);
      refresh();
    } catch (err) {
      sonnerToast.error(err instanceof Error ? err.message : "操作失败");
    }
  };

  return {
    actor,
    router,
    list,
    total,
    page,
    pageSize,
    loading,
    error,
    selected,
    allSelected,
    someSelected,
    rejectOpen,
    rejectReason,
    pendingIds,
    toggleAll,
    toggleOne,
    handleApprove,
    openReject,
    setRejectOpen,
    setRejectReason,
    handleReject,
    load,
    refresh,
  };
}
