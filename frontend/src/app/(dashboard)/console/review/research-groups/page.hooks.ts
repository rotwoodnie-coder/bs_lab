"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useSessionActor } from "@/hooks/use-session-actor";
import { sonnerToast } from "@bs-lab/ui";
import {
  fetchResearchGroupsForReview,
  approveResearchGroup,
  rejectResearchGroup,
  type ResearchGroupReviewItem,
} from "@/lib/v2/v2-review-api";

export function useResearchGroupsReview() {
  const session = useSessionActor();
  const actor = session.actor;
  const router = useRouter();

  const [list, setList] = React.useState<ResearchGroupReviewItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // 选中状态
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [rejectOpen, setRejectOpen] = React.useState(false);
  const [rejectReason, setRejectReason] = React.useState("");
  const [pendingIds, setPendingIds] = React.useState<string[]>([]);

  const load = React.useCallback(async () => {
    if (!actor) return;
    setLoading(true);
    setError(null);
    try {
      const result = await fetchResearchGroupsForReview(actor);
      setList(result.items);
      setSelected(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败");
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [actor]);

  React.useEffect(() => {
    if (actor) load();
  }, [actor, load]);

  const refresh = React.useCallback(() => {
    setSelected(new Set());
    load();
  }, [load]);

  // ── 批量操作 ──

  const allIds = list.map((r) => r.groupId);
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
    if (!ids.length) return sonnerToast.error("请先选择课题组");
    if (!actor) return sonnerToast.error("登录已过期，请刷新页面");

    try {
      for (const id of ids) {
        await approveResearchGroup(actor, id);
      }
      sonnerToast.success(`已通过 ${ids.length} 条`);
      refresh();
    } catch (err) {
      sonnerToast.error(err instanceof Error ? err.message : "操作失败");
    }
  };

  const openReject = (ids: string[]) => {
    if (!ids.length) return sonnerToast.error("请先选择课题组");
    setPendingIds(ids);
    setRejectReason("");
    setRejectOpen(true);
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return sonnerToast.error("必须填写驳回理由");
    if (!actor) return sonnerToast.error("登录已过期，请刷新页面");

    try {
      for (const id of pendingIds) {
        await rejectResearchGroup(actor, id, rejectReason.trim());
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
