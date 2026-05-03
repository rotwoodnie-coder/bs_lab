"use client";

import * as React from "react";

import type { StandardVideoExpPlayerProps } from "./exp-video-player.types";

/**
 * 点击播放延迟桥接 Hook：
 * 1. goActive → status="active", videoReady=false → video 挂载但隐藏，封面+spinner 可见
 * 2. video canplay → videoReady=true → 封面淡出，视频淡入清晰播放
 * 3. 停止/回退 → status="poster", videoReady=false → 封面淡入恢复
 */
export function useStandardVideoExpPlayer(props: StandardVideoExpPlayerProps) {
  const {
    src,
    poster,
    ratio = 16 / 9,
    title = "视频",
    contentStartSeconds,
    onPlayRequest,
  } = props;
  const trimmedSrc = src.trim();
  const propPoster = poster?.trim() ?? "";

  const [status, setStatus] = React.useState<"poster" | "active">("poster");
  const [videoReady, setVideoReady] = React.useState(false);
  const [videoKey, setVideoKey] = React.useState(0);
  const [posterFailed, setPosterFailed] = React.useState(false);

  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const rootRef = React.useRef<HTMLDivElement | null>(null);

  const isActive = status === "active";
  const mountVideo = isActive;
  const displayPoster = propPoster && !posterFailed ? propPoster : undefined;

  // 全局互斥锁
  const expIdRef = React.useRef(useIdSuffix(trimmedSrc));
  const statusRef = React.useRef(status);
  statusRef.current = status;

  const entryRef = React.useRef<LockEntry | null>(null);
  if (!entryRef.current) {
    entryRef.current = makeLockEntry(expIdRef, statusRef, () => {
      setStatus("poster");
      setVideoReady(false);
      setVideoKey((k) => k + 1);
    });
  }

  // 点击播放
  const goActive = React.useCallback(() => {
    if (onPlayRequest) {
      onPlayRequest();
      return;
    }
    setVideoKey((k) => k + 1);
    setVideoReady(false);
    takeActiveExpLock(entryRef.current!);
    setStatus("active");
  }, [onPlayRequest]);

  // video 首帧就绪
  const handleVideoReady = React.useCallback(() => {
    setVideoReady(true);
  }, []);

  // 组件卸载释放锁
  const cleanup = React.useCallback(() => {
    releaseActiveExpLock(entryRef.current!);
    if (statusRef.current === "active") {
      setVideoKey((k) => k + 1);
      setVideoReady(false);
      setStatus("poster");
    }
  }, []);

  React.useEffect(() => cleanup, [cleanup]);

  // 首帧就绪后 seek 跳过片头
  const handleVideoMeta = React.useCallback(
    (e: React.SyntheticEvent<HTMLVideoElement>) => {
      if (contentStartSeconds != null && Number.isFinite(contentStartSeconds) && contentStartSeconds > 0) {
        const v = e.currentTarget;
        const t = Math.min(contentStartSeconds, Math.max(0, (v.duration ?? 0) - 0.1));
        if (t > 0 && Math.abs(v.currentTime - t) > 0.05) {
          v.currentTime = t;
        }
      }
    },
    [contentStartSeconds],
  );

  return {
    rootRef,
    trimmedSrc,
    ratio,
    title,
    status,
    videoReady,
    videoKey,
    mountVideo,
    isActive,
    displayPoster,
    posterFailed,
    setPosterFailed,
    videoRef,
    goActive,
    handleVideoReady,
    handleVideoMeta,
    className: props.className,
  };
}

// ── 全局互斥锁 ──────────────────────────────────────────

type LockEntry = { id: string; onRelease: (releasedId: string) => void };

let activeEntry: LockEntry | null = null;

function takeActiveExpLock(entry: LockEntry): void {
  if (activeEntry && activeEntry.id !== entry.id) {
    try { activeEntry.onRelease(activeEntry.id); } catch { /* ignore */ }
  }
  activeEntry = entry;
}

function releaseActiveExpLock(entry: LockEntry): void {
  if (activeEntry === entry) {
    activeEntry = null;
  }
}

function makeLockEntry(
  expIdRef: React.RefObject<string>,
  statusRef: React.RefObject<"poster" | "active">,
  onKick: () => void,
): LockEntry {
  return {
    get id() { return expIdRef.current; },
    onRelease: (releasedId: string) => {
      if (releasedId === expIdRef.current && statusRef.current === "active") {
        onKick();
      }
    },
  };
}

function useIdSuffix(src: string): string {
  const [id] = React.useState(() => ":" + src.slice(-20));
  return id;
}
