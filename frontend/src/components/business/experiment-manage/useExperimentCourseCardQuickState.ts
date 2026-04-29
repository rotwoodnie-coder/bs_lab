"use client";

import * as React from "react";

import type { ExperimentManageCardQuickState } from "./types";

const STORAGE_KEY = "bs-lab:experiment-manage-card-quick-v1";

function normalizeState(input: unknown): Record<string, ExperimentManageCardQuickState> {
  if (!input || typeof input !== "object") return {};
  const obj = input as Record<string, unknown>;
  const out: Record<string, ExperimentManageCardQuickState> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (!v || typeof v !== "object") continue;
    const vv = v as Record<string, unknown>;
    const liked = Boolean(vv.liked);
    const favorited = Boolean(vv.favorited);
    const likeCount =
      typeof vv.likeCount === "number" && Number.isFinite(vv.likeCount) ? Math.max(0, Math.trunc(vv.likeCount)) : 0;
    const commentCount =
      typeof vv.commentCount === "number" && Number.isFinite(vv.commentCount)
        ? Math.max(0, Math.trunc(vv.commentCount))
        : 0;
    out[k] = { liked, favorited, likeCount, commentCount };
  }
  return out;
}

export function useExperimentCourseCardQuickState() {
  const [byId, setById] = React.useState<Record<string, ExperimentManageCardQuickState>>({});

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      setById(normalizeState(JSON.parse(raw)));
    } catch {
      // ignore invalid cache
    }
  }, []);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(byId));
  }, [byId]);

  const ensure = React.useCallback((id: string, seed?: { likeCount?: number }) => {
    setById((prev) => {
      if (prev[id]) return prev;
      return {
        ...prev,
        [id]: { liked: false, favorited: false, likeCount: Math.max(0, seed?.likeCount ?? 0), commentCount: 0 },
      };
    });
  }, []);

  const toggleLike = React.useCallback((id: string, seed = 0) => {
    setById((prev) => {
      const base = prev[id] ?? { liked: false, favorited: false, likeCount: Math.max(0, seed), commentCount: 0 };
      const nextLiked = !base.liked;
      return {
        ...prev,
        [id]: {
          ...base,
          liked: nextLiked,
          likeCount: Math.max(0, base.likeCount + (nextLiked ? 1 : -1)),
        },
      };
    });
  }, []);

  const toggleFavorite = React.useCallback((id: string) => {
    setById((prev) => {
      const base = prev[id] ?? { liked: false, favorited: false, likeCount: 0, commentCount: 0 };
      return { ...prev, [id]: { ...base, favorited: !base.favorited } };
    });
  }, []);

  const incrementCommentCount = React.useCallback((id: string) => {
    setById((prev) => {
      const base = prev[id] ?? { liked: false, favorited: false, likeCount: 0, commentCount: 0 };
      return { ...prev, [id]: { ...base, commentCount: base.commentCount + 1 } };
    });
  }, []);

  return { byId, ensure, toggleLike, toggleFavorite, incrementCommentCount };
}

