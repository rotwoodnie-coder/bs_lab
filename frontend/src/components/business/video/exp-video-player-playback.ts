export function applyPlaybackToVideo(el: HTMLVideoElement, mode: "preview" | "active"): void {
  if (mode === "preview") {
    el.muted = true;
    el.defaultMuted = true;
    el.loop = true;
    el.controls = false;
    el.removeAttribute("controls");
    void el.play().catch(() => {});
    return;
  }
  el.loop = false;
  el.muted = false;
  el.defaultMuted = false;
  el.controls = true;
  void el.play().catch(() => {});
}
