"use client";

import * as React from "react";

import type { PlayerVisualStatus, RasterPosterCaptureMode } from "./exp-video-player.types";
import { applyPlaybackToVideo } from "./exp-video-player-playback";
import { readRasterPosterFromSession, scheduleRasterFrameExtraction } from "./video-frame-capture";

type CapturePhase = "idle" | "pending" | "done" | "miss";

export function useExpVideoPosterResetOnSrcChange(
  trimmedSrc: string,
  rasterPosterCapture: RasterPosterCaptureMode,
  reset: () => void,
): void {
  React.useEffect(() => {
    reset();
  }, [trimmedSrc, rasterPosterCapture, reset]);
}

export function useExpVideoVisibleGate(
  rootRef: React.RefObject<HTMLDivElement | null>,
  rasterPosterCapture: RasterPosterCaptureMode,
  trimmedSrc: string,
  setViewportOk: (v: boolean) => void,
): void {
  React.useEffect(() => {
    const el = rootRef.current;
    if (!el || rasterPosterCapture !== "visible") return;
    const ob = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setViewportOk(true);
            break;
          }
        }
      },
      { root: null, rootMargin: "120px 0px", threshold: 0.01 },
    );
    ob.observe(el);
    return () => ob.disconnect();
  }, [rootRef, rasterPosterCapture, trimmedSrc, setViewportOk]);
}

export function useExpVideoPlaybackSync(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  mountVideo: boolean,
  status: PlayerVisualStatus,
  videoKey: number,
): void {
  React.useLayoutEffect(() => {
    const el = videoRef.current;
    if (!el || !mountVideo) return;
    applyPlaybackToVideo(el);
  }, [videoRef, mountVideo, status, videoKey]);
}

export function useExpVideoStreamRasterCapture(
  trimmedSrc: string,
  propPoster: string,
  rasterPosterCapture: RasterPosterCaptureMode,
  viewportOk: boolean,
  setLivePoster: (v: string | null) => void,
  setCapturePhase: (v: CapturePhase) => void,
): void {
  React.useEffect(() => {
    if (!trimmedSrc || propPoster || rasterPosterCapture === "never") {
      setLivePoster(null);
      setCapturePhase(propPoster ? "done" : "idle");
      return;
    }
    if (rasterPosterCapture === "visible" && !viewportOk) {
      setCapturePhase("idle");
      return;
    }
    const cached = readRasterPosterFromSession(trimmedSrc);
    if (cached) {
      setLivePoster(cached);
      setCapturePhase("done");
      return;
    }
    let cancelled = false;
    setCapturePhase("pending");
    void scheduleRasterFrameExtraction(trimmedSrc).then((url) => {
      if (cancelled) return;
      if (url) {
        setLivePoster(url);
        setCapturePhase("done");
      } else {
        setCapturePhase("miss");
      }
    });
    return () => {
      cancelled = true;
    };
  }, [trimmedSrc, propPoster, rasterPosterCapture, viewportOk, setLivePoster, setCapturePhase]);
}
