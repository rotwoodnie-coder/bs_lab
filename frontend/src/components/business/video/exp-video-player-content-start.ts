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
 * 跨域 MinIO 无法用 canvas 做可靠「自动黑场检测」，故不做伪检测。
 */
export function useExpVideoContentStartSeek(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  mountVideo: boolean,
  contentStartSeconds: number | undefined,
  isPreview: boolean,
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

  React.useEffect(() => {
    const el = videoRef.current;
    if (!el || !mountVideo || start <= 0 || !isPreview) return;

    const onTime = () => {
      const d = el.duration;
      if (!Number.isFinite(d) || d <= 0) return;
      const t0 = clampContentStart(start, d);
      if (t0 <= 0) return;
      if (el.currentTime < t0 - 0.02) {
        el.currentTime = t0;
      }
    };

    el.addEventListener("timeupdate", onTime);
    return () => el.removeEventListener("timeupdate", onTime);
  }, [videoRef, mountVideo, start, isPreview, videoKey]);
}
