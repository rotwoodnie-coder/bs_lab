"use client";

import * as React from "react";

import { buildMaterialsApiActor } from "@/lib/materials-api-actor";
import type { ApiActor } from "@/lib/new-core-api";
import { fetchV2FileListPage, type V2DataFileRecord, type V2FileListQuery } from "@/lib/v2/v2-file-api";
import { fetchV2FileTypes } from "@/lib/v2/v2-exp-api";
import { toDictOptions, type DictOption } from "@/lib/v2/v2-dict-adapter";
import { useSessionActor } from "@/hooks/use-session-actor";

export type ConsoleMediaServerPagination = {
  total: number;
  pageIndex: number;
  pageSize: number;
  onPageIndexChange: (pageIndex: number) => void;
  onPageSizeChange: (pageSize: number) => void;
};

export function useConsoleMediaPageState() {
  const { role, orgId, hydrated } = useSessionActor();
  const actor = React.useMemo(() => buildMaterialsApiActor(role, orgId, "materials-page"), [role, orgId]);
  const coreActor = actor as import("@/lib/core-api-shared").CoreApiActor;

  /** 输入框草稿，点「查询」后写入 `keywordApplied` 再请求 */
  const [keywordDraft, setKeywordDraft] = React.useState("");
  const [keywordApplied, setKeywordApplied] = React.useState("");
  const [fileTypeId, setFileTypeId] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(10);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [rows, setRows] = React.useState<V2DataFileRecord[]>([]);
  const [total, setTotal] = React.useState(0);
  const [fileTypeOptions, setFileTypeOptions] = React.useState<DictOption[]>([]);
  /** 同条件再次点「查询」时强制拉列表 */
  const [reloadToken, setReloadToken] = React.useState(0);

  React.useEffect(() => {
    setPageIndex(0);
  }, [fileTypeId, status]);

  React.useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;
    void fetchV2FileTypes(coreActor)
      .then((raw) => {
        if (!cancelled) setFileTypeOptions(toDictOptions(raw));
      })
      .catch(() => {
        if (!cancelled) setFileTypeOptions([]);
      });
    return () => {
      cancelled = true;
    };
  }, [hydrated, coreActor]);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const q: V2FileListQuery = {
        keyword: keywordApplied.trim() || undefined,
        fileTypeId: fileTypeId.trim() || undefined,
        status: status.trim() || undefined,
        page: pageIndex + 1,
        pageSize,
      };
      const page = await fetchV2FileListPage(coreActor, q);
      setRows(page.items);
      setTotal(page.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [coreActor, keywordApplied, fileTypeId, status, pageIndex, pageSize]);

  React.useEffect(() => {
    if (!hydrated) return;
    void refresh();
  }, [hydrated, refresh, reloadToken]);

  const applySearch = React.useCallback(() => {
    const next = keywordDraft.trim();
    const same = next === keywordApplied;
    setKeywordApplied(next);
    setPageIndex(0);
    if (same) setReloadToken((t) => t + 1);
  }, [keywordDraft, keywordApplied]);

  const serverPagination: ConsoleMediaServerPagination = React.useMemo(
    () => ({
      total,
      pageIndex,
      pageSize,
      onPageIndexChange: setPageIndex,
      onPageSizeChange: (next) => {
        setPageSize(next);
        setPageIndex(0);
      },
    }),
    [total, pageIndex, pageSize],
  );

  return {
    actor,
    keywordDraft,
    setKeywordDraft,
    applySearch,
    fileTypeId,
    setFileTypeId,
    status,
    setStatus,
    pageIndex,
    pageSize,
    loading,
    error,
    rows,
    total,
    refresh,
    serverPagination,
    fileTypeOptions,
  };
}

export type ConsoleMediaPageActor = ApiActor;
