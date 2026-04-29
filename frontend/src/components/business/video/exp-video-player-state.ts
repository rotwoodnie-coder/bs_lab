"use client";

import * as React from "react";

import type { PlayerVisualStatus, RasterPosterCaptureMode } from "./exp-video-player.types";

export function useExpVideoBaseState(rasterPosterCapture: RasterPosterCaptureMode) {
  const [status, setStatus] = React.useState<PlayerVisualStatus>("poster");
  const [videoKey, setVideoKey] = React.useState(0);
  const [posterFailed, setPosterFailed] = React.useState(false);
  const [livePoster, setLivePoster] = React.useState<string | null>(null);
  const [capturePhase, setCapturePhase] = React.useState<"idle" | "pending" | "done" | "miss">("idle");
  const [viewportOk, setViewportOk] = React.useState(rasterPosterCapture !== "visible");
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const rootRef = React.useRef<HTMLDivElement | null>(null);

  const bumpVideoKey = React.useCallback(() => {
    setVideoKey((k) => k + 1);
  }, []);

  const resetOnSrc = React.useCallback(() => {
    setStatus("poster");
    setVideoKey((k) => k + 1);
    setPosterFailed(false);
    setLivePoster(null);
    setCapturePhase("idle");
    setViewportOk(rasterPosterCapture !== "visible");
  }, [rasterPosterCapture]);

  const isPreview = status === "preview";
  const isActive = status === "active";
  const mountVideo = isPreview || isActive;

  return {
    status,
    setStatus,
    videoKey,
    bumpVideoKey,
    posterFailed,
    setPosterFailed,
    livePoster,
    setLivePoster,
    capturePhase,
    setCapturePhase,
    viewportOk,
    setViewportOk,
    videoRef,
    rootRef,
    isPreview,
    isActive,
    mountVideo,
    resetOnSrc,
  };
}
