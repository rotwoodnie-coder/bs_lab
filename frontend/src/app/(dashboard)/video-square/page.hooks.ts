"use client";

import * as React from "react";
import { sonnerToast } from "@bs-lab/ui";

import type { ApiActor } from "@/lib/new-core-api";
import { useSessionActor } from "@/hooks/use-session-actor";
import {
  listTeacherMaterialsApi,
  type TeacherMaterialItem,
} from "@/lib/teacher-materials-api";
import type { ViewMode } from "@/components/business/material";

const MODE_STORAGE_KEY = "bs-lab:video-square:view-mode";
const SEARCH_DEBOUNCE_MS = 350;

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
  const [debouncedKeyword, setDebouncedKeyword] = React.useState("");
  const [items, setItems] = React.useState<TeacherMaterialItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const setMode = React.useCallback((m: ViewMode) => {
    setModeState(m);
    writeStored(MODE_STORAGE_KEY, m);
  }, []);

  // 搜索防抖
  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedKeyword(keyword), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [keyword]);

  const fetchData = React.useCallback(() => {
    if (!hydrated) return;
    setLoading(true);
    setError(null);

    void listTeacherMaterialsApi(actor, {
      keyword: debouncedKeyword.trim() || undefined,
      fileTypeId: "FT_Video",
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
  }, [actor, hydrated, debouncedKeyword]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

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
    items,
    loading,
    error,
    retry,
  };
}
