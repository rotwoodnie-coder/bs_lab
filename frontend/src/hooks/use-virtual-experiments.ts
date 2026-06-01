"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSessionActor } from "@/hooks/use-session-actor";
import {
  fetchVirtualExperimentList,
  deleteVirtualExperiment,
  submitForReview,
  updateVirtualExperimentSort,
  processReview,
  type VirtualExperimentRecord,
  type VirtualExperimentListQuery,
  type VirtualExperimentListPage,
} from "@/lib/v2/v2-virtual-experiment-api";

/** 数据范围：我的实验 / 审核管理 */
export type ViewScope = "mine" | "review";

/** 视图模式：瀑布流（卡片）/ 表格 */
export type DisplayMode = "waterfall" | "table";

export interface UseVirtualExperimentsOptions {
  initialDisplayMode?: DisplayMode;
}

export function useVirtualExperiments(options?: UseVirtualExperimentsOptions) {
  const { actor, hydrated } = useSessionActor();
  const [viewScope, setViewScope] = useState<ViewScope>("mine");
  const [displayMode, setDisplayMode] = useState<DisplayMode>(
    options?.initialDisplayMode ?? "waterfall",
  );
  const [query, setQuery] = useState<VirtualExperimentListQuery>({
    page: 1,
    pageSize: 20,
  });
  const [result, setResult] = useState<VirtualExperimentListPage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // keepPreviousData: 在加载新数据期间保留上一次的结果，避免闪烁
  const prevResultRef = useRef<VirtualExperimentListPage | null>(null);

  const load = useCallback(async () => {
    if (!hydrated || !actor) return;
    setLoading(true);
    setError(null);
    try {
      const actualQuery: VirtualExperimentListQuery = {
        ...query,
        ...(viewScope === "review"
          ? { reviewMode: true as const, status: "pending" as const }
          : {}),
      };
      const data = await fetchVirtualExperimentList(actor, actualQuery);
      setResult(data);
      prevResultRef.current = data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, [actor, query, viewScope, hydrated]);

  useEffect(() => {
    load();
  }, [load]);

  // ─── 查询操作 ──────────────────────────────────────────

  const search = useCallback((keyword: string) => {
    setQuery((prev) => ({ ...prev, keyword: keyword || undefined, page: 1 }));
  }, []);

  const setFilter = useCallback(
    (filters: Partial<VirtualExperimentListQuery>) => {
      setQuery((prev) => ({ ...prev, ...filters, page: 1 }));
    },
    [],
  );

  const goPage = useCallback((page: number) => {
    setQuery((prev) => ({ ...prev, page }));
  }, []);

  // ─── 变更操作 ──────────────────────────────────────────

  const remove = useCallback(
    async (id: string) => {
      if (!actor) return;
      await deleteVirtualExperiment(actor, id);
      load();
    },
    [actor, load],
  );

  const submit = useCallback(
    async (id: string) => {
      if (!actor) return;
      await submitForReview(actor, id);
      load();
    },
    [actor, load],
  );

  const approve = useCallback(
    async (id: string) => {
      if (!actor) return;
      await processReview(actor, id, "approved");
      load();
    },
    [actor, load],
  );

  const reject = useCallback(
    async (id: string, comment?: string) => {
      if (!actor) return;
      await processReview(actor, id, "rejected", comment);
      load();
    },
    [actor, load],
  );

  const sort = useCallback(
    async (id: string, sortOrder: number) => {
      if (!actor) return;
      await updateVirtualExperimentSort(actor, id, sortOrder);
      load();
    },
    [actor, load],
  );

  // ─── 视图切换 ──────────────────────────────────────────

  const switchDisplayMode = useCallback((mode: DisplayMode) => {
    setDisplayMode(mode);
  }, []);

  const switchViewScope = useCallback((scope: ViewScope) => {
    setViewScope(scope);
    // 切换到审核范围时自动设定 status=pending
    if (scope === "review") {
      setQuery((prev) => ({ ...prev, status: "pending", page: 1 }));
    }
  }, []);

  // keepPreviousData：加载中时返回上一次的结果（避免 loading 闪烁）
  const displayResult =
    loading && prevResultRef.current ? prevResultRef.current : result;

  return {
    actor,
    /** 数据范围：mine（我的实验）/ review（审核管理） */
    viewScope,
    setViewScope: switchViewScope,
    /** 展示模式：waterfall（瀑布流卡片）/ table（表格） */
    displayMode,
    setDisplayMode: switchDisplayMode,
    query,
    /** 当前列表数据（切换视图时保留筛选条件） */
    result: displayResult,
    loading,
    error,
    search,
    setFilter,
    goPage,
    remove,
    submit,
    approve,
    reject,
    sort,
    reload: load,
  };
}
