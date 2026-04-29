/** 评审通过/驳回的轻量提示音（失败时静默） */
export function playReviewChime(kind: "approve" | "reject") {
  if (typeof window === "undefined") return;
  try {
    const AC =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = kind === "approve" ? 784 : 196;
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.085, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.15);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.16);
    osc.onended = () => {
      void ctx.close();
    };
  } catch {
    /* autoplay / secure context */
  }
}

export function nextReviewIdInQueue(current: string, queue: string[]): string {
  if (queue.length === 0) return current;
  const idx = queue.indexOf(current);
  if (idx < 0) return queue[0]!;
  return queue[(idx + 1) % queue.length]!;
}
