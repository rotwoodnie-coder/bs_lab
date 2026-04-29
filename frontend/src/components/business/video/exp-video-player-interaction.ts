"use client";

import * as React from "react";

import type { PlayerVisualStatus } from "./exp-video-player.types";

function readDesktopHoverPreview(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

export function useExpVideoListInteractions(
  status: PlayerVisualStatus,
  setStatus: React.Dispatch<React.SetStateAction<PlayerVisualStatus>>,
  bumpVideoKey: () => void,
): {
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  goActive: () => void;
} {
  const onMouseEnter = React.useCallback(() => {
    if (!readDesktopHoverPreview()) return;
    if (status !== "poster") return;
    bumpVideoKey();
    setStatus("preview");
  }, [status, bumpVideoKey, setStatus]);

  const onMouseLeave = React.useCallback(() => {
    if (status === "preview") {
      bumpVideoKey();
      setStatus("poster");
    }
  }, [status, bumpVideoKey, setStatus]);

  const goActive = React.useCallback(() => {
    if (status === "preview") {
      setStatus("active");
      return;
    }
    bumpVideoKey();
    setStatus("active");
  }, [status, bumpVideoKey, setStatus]);

  return { onMouseEnter, onMouseLeave, goActive };
}
