"use client";

import * as React from "react";

import type { PlayerVisualStatus } from "./exp-video-player.types";

/** 全局互斥：同时只允许一路视频 active（点击播放后其它卡片自动回退 poster） */
let activeExpId: string | null = null;

/** 注册机制：用 ref 持有回调，避免 React 重渲染时 stale 问题 */
type LockEntry = { id: string; onRelease: (releasedId: string) => void };
let activeEntry: LockEntry | null = null;

function takeActiveExpLock(entry: LockEntry): boolean {
  if (activeEntry && activeEntry.id !== entry.id) {
    // 释放上一个 active
    try {
      activeEntry.onRelease(activeEntry.id);
    } catch {
      /* ignore */
    }
  }
  activeExpId = entry.id;
  activeEntry = entry;
  return true;
}

function releaseActiveExpLock(entry: LockEntry): void {
  if (activeEntry === entry) {
    activeExpId = null;
    activeEntry = null;
  }
}

/**
 * 点击播放 / 键盘触发放置。无悬停预览。
 * 同一个页面只有一个视频可处于 active 状态（全局互斥）。
 * 使用 ref 持有最新状态避免 stale closure。
 */
export function useExpVideoListInteractions(
  expId: string,
  status: PlayerVisualStatus,
  setStatus: React.Dispatch<React.SetStateAction<PlayerVisualStatus>>,
  bumpVideoKey: () => void,
): {
  goActive: () => void;
  cleanup: () => void;
} {
  // 用 ref 跟踪最新状态，回调不随状态变化重建
  const statusRef = React.useRef(status);
  statusRef.current = status;

  const expIdRef = React.useRef(expId);
  expIdRef.current = expId;

  const setStatusRef = React.useRef(setStatus);
  setStatusRef.current = setStatus;

  const bumpKeyRef = React.useRef(bumpVideoKey);
  bumpKeyRef.current = bumpVideoKey;

  // 创建稳定的 entry 对象（ref 不可变）
  const entryRef = React.useRef<LockEntry | null>(null);
  if (!entryRef.current) {
    entryRef.current = {
      get id() {
        return expIdRef.current;
      },
      onRelease: (releasedId: string) => {
        if (releasedId === expIdRef.current && statusRef.current === "active") {
          bumpKeyRef.current();
          setStatusRef.current("poster");
        }
      },
    };
  }

  const goActive = React.useCallback(() => {
    bumpKeyRef.current();
    takeActiveExpLock(entryRef.current!);
    setStatusRef.current("active");
  }, []);

  const cleanup = React.useCallback(() => {
    releaseActiveExpLock(entryRef.current!);
    if (statusRef.current === "active") {
      bumpKeyRef.current();
      setStatusRef.current("poster");
    }
  }, []);

  React.useEffect(() => cleanup, [cleanup]);

  return { goActive, cleanup };
}
