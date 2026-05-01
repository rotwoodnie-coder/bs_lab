"use client";

import * as React from "react";
import { sonnerToast } from "@bs-lab/ui";

import type { ApiActor } from "@/lib/new-core-api";
import { useSessionActor } from "@/hooks/use-session-actor";
import {
  listTeacherMaterialsApi,
  type TeacherMaterialItem,
} from "@/lib/teacher-materials-api";
import { filterTeacherMaterials, type KindFilterId } from "@/app/(dashboard)/teacher/materials/_lib/material-filters";
import type { ViewMode } from "@/components/business/material";

const MODE_STORAGE_KEY = "bs-lab:video-square:view-mode";
const KIND_FILTER_STORAGE_KEY = "bs-lab:video-square:kind-filter";

function readStored<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeStored<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* 存储满或禁用 */
  }
}

export function useVideoSquarePage() {
  const session = useSessionActor();
  const { hydrated } = session;

  const actor = React.useMemo<ApiActor>(
    () => ({
      role: session.role,
      orgId: session.orgId,
      userId: session.actor.userId,
      userName: session.actor.userName,
    }),
    [session.role, session.orgId, session.actor.userId, session.actor.userName],
  );

  const [mode, setModeState] = React.useState<ViewMode>(
    () => readStored<ViewMode>(MODE_STORAGE_KEY, "waterfall"),
  );
  const [keyword, setKeyword] = React.useState("");
  const [kindFilter, setKindFilterState] = React.useState<KindFilterId>(
    () => readStored<KindFilterId>(KIND_FILTER_STORAGE_KEY, "video"),
  );
  const [items, setItems] = React.useState<TeacherMaterialItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const setMode = React.useCallback((m: ViewMode) => {
    setModeState(m);
    writeStored(MODE_STORAGE_KEY, m);
  }, []);

  const setKindFilter = React.useCallback((k: KindFilterId) => {
    setKindFilterState(k);
    writeStored(KIND_FILTER_STORAGE_KEY, k);
  }, []);

  /** 清除所有筛选条件 */
  const clearFilters = React.useCallback(() => {
    setKeyword("");
    setKindFilter("all");
  }, [setKindFilter]);

  const fetchData = React.useCallback(() => {
    if (!hydrated) return;
    setLoading(true);
    setError(null);

    void listTeacherMaterialsApi(actor, {
      keyword: keyword.trim() || undefined,
    })
      .then((rows) => {
        setItems(rows);
      })
      .catch((err) => {
        const message = err instanceof Error ? err.message : "加载素材失败";
        setError(message);
        sonnerToast.error(message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [actor, hydrated, keyword]);

  React.useEffect(() => {
    // TODO: Refactor to server-side pagination if items > 500
    fetchData();
  }, [fetchData]);

  const filtered = React.useMemo(
    () => filterTeacherMaterials(items, kindFilter, keyword),
    [items, kindFilter, keyword],
  );

  const retry = React.useCallback(() => {
    fetchData();
  }, [fetchData]);

  return {
    actor,
    hydrated,
    mode,
    setMode,
    keyword,
    setKeyword,
    kindFilter,
    setKindFilter,
    items,
    filtered,
    loading,
    error,
    retry,
    clearFilters,
  };
}
