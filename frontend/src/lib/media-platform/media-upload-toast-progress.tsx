"use client";

import { Progress, sonnerToast } from "@bs-lab/ui";

import type { MediaStorageMode } from "./media-upload-destination-copy";
import { mediaUploadProgressHint, mediaUploadSuccessDescription } from "./media-upload-destination-copy";

function clampPct(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function UploadToastBody(props: { title: string; percent: number }) {
  return (
    <div className="flex w-[min(100vw-2rem,22rem)] flex-col gap-2 p-1">
      <div className="text-sm font-medium text-foreground">{props.title}</div>
      <Progress value={props.percent} className="h-2" />
      <div className="text-xs text-muted-foreground">{mediaUploadProgressHint(props.percent)}</div>
    </div>
  );
}

export type MediaUploadToastOutcome = "full" | "loading-only";

export type MediaUploadToastController = {
  toastId: string | number;
  updateProgress: (percent: number) => void;
  finishSuccess: (storageMode?: MediaStorageMode, reused?: boolean) => void;
  finishError: (message: string) => void;
};

export function startMediaUploadProgressToast(
  title: string,
  outcome: MediaUploadToastOutcome,
): MediaUploadToastController {
  const toastId = `media-up-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  let lastShown = -1;

  const paint = (percent: number) => {
    const p = clampPct(percent);
    if (p < 100 && p - lastShown < 2 && lastShown >= 0) return;
    lastShown = p;
    sonnerToast.custom(() => <UploadToastBody title={title} percent={p} />, { id: toastId, duration: 600_000 });
  };

  paint(0);

  return {
    toastId,
    updateProgress: (percent: number) => paint(percent),
    finishSuccess: (storageMode?: MediaStorageMode, reused?: boolean) => {
      if (outcome === "loading-only") {
        sonnerToast.dismiss(toastId);
        return;
      }
      const okTitle = reused ? "媒体上传完成（已复用已有文件）" : "媒体上传完成";
      sonnerToast.success(okTitle, {
        id: toastId,
        description: mediaUploadSuccessDescription(storageMode, reused),
      });
    },
    finishError: (message: string) => {
      sonnerToast.error("媒体上传失败", { id: toastId, description: message });
    },
  };
}
