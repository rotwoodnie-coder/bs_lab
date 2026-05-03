"use client";

export function applyPlaybackToVideo(el: HTMLVideoElement): void {
  el.muted = false;
  el.defaultMuted = false;
  el.loop = false;
  el.controls = true;
  void el.play().catch(() => {});
}
