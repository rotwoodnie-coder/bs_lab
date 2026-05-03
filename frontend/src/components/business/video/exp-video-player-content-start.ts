"use client";

import * as React from "react";

function clampContentStart(seconds: number, duration: number): number {
  if (!Number.isFinite(seconds) || seconds <= 0) return 0;
  if (!Number.isFinite(duration) || duration <= 0) return seconds;
  const max = Math.max(0, duration - 0.1);
  return Math.min(seconds, max);
}

/**
 * 从 `contentStartSeconds` 起播（片头黑场等由上游用 FFmpeg 等预计算后下发）。
 */
export function useExpVideoContentStartSeek(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  mountVideo: boolean,
  contentStartSeconds: number | undefined,
  videoKey: number,
): void {
  const startRaw =
    typeof contentStartSeconds === "number" && Number.isFinite(contentStartSeconds) ? contentStartSeconds : 0;
  const start = startRaw > 0 ? startRaw : 0;

  React.useEffect(() => {
    const el = videoRef.current;
    if (!el || !mountVideo || start <= 0) return;

    const applyStart = () => {
      const d = el.duration;
      if (!Number.isFinite(d) || d <= 0) return;
      const t = clampContentStart(start, d);
      if (t > 0 && Math.abs(el.currentTime - t) > 0.05) {
        el.currentTime = t;
      }
    };

    el.addEventListener("loadedmetadata", applyStart);
    if (el.readyState >= HTMLMediaElement.HAVE_METADATA) {
      applyStart();
    }
    return () => el.removeEventListener("loadedmetadata", applyStart);
  }, [videoRef, mountVideo, start, videoKey]);
}
