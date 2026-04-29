/**
 * 上传前/兜底：从本地 File（blob:）多点抽帧选最亮一帧，不发起网络视频 Range 请求。
 */

import { inferBinaryMediaKindFromFilename } from "@/lib/media/infer-media-kind-from-filename";

const SAMPLE_TIMES_SEC = [2, 1, 0.5, 3, 4] as const;
const CAPTURE_BUDGET_MS = 22_000;
const MAX_EDGE = 480;
const JPEG_QUALITY = 0.78;

function meanLumaFromCanvas(ctx: CanvasRenderingContext2D, w: number, h: number): number {
  const step = 6;
  let sum = 0;
  let n = 0;
  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      const { data } = ctx.getImageData(x, y, Math.min(step, w - x), Math.min(step, h - y));
      for (let i = 0; i + 3 < data.length; i += 4) {
        const r = data[i]!;
        const g = data[i + 1]!;
        const b = data[i + 2]!;
        sum += 0.299 * r + 0.587 * g + 0.114 * b;
        n++;
      }
    }
  }
  return n > 0 ? sum / n : 0;
}

function clampSampleTimes(durationSec: number): number[] {
  const d = Number.isFinite(durationSec) && durationSec > 0.12 ? durationSec : 5;
  const maxT = Math.min(5, Math.max(0.08, d - 0.06));
  const raw = SAMPLE_TIMES_SEC.map((t) => Math.min(t, maxT)).filter((t) => t >= 0.05);
  return [...new Set(raw.map((t) => Math.round(t * 1000) / 1000))].sort((a, b) => a - b);
}

function waitSeeked(v: HTMLVideoElement): Promise<void> {
  return new Promise((resolve) => {
    let settled = false;
    const once = (): void => {
      if (settled) return;
      settled = true;
      v.removeEventListener("seeked", onSeeked);
      window.clearTimeout(timer);
      resolve();
    };
    const onSeeked = (): void => {
      once();
    };
    const timer = window.setTimeout(once, 4000);
    v.addEventListener("seeked", onSeeked);
  });
}

function scoreFrameOnVideo(v: HTMLVideoElement): { score: number; dataUrl: string } | null {
  const w0 = v.videoWidth;
  const h0 = v.videoHeight;
  if (!w0 || !h0) return null;
  const scale = Math.min(1, MAX_EDGE / Math.max(w0, h0));
  const cw = Math.max(1, Math.round(w0 * scale));
  const ch = Math.max(1, Math.round(h0 * scale));
  const canvas = document.createElement("canvas");
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(v, 0, 0, cw, ch);
  let dataUrl: string;
  try {
    dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
  } catch {
    return null;
  }
  if (!dataUrl.startsWith("data:image/")) return null;
  const score = meanLumaFromCanvas(ctx, cw, ch);
  return { score, dataUrl };
}

function blobFromDataUrl(dataUrl: string): Promise<Blob | null> {
  return new Promise((resolve) => {
    void fetch(dataUrl)
      .then((r) => r.blob())
      .then((b) => resolve(b.size ? b : null))
      .catch(() => resolve(null));
  });
}

/**
 * 从用户选择的视频文件抽取一帧 JPEG（blob），供上传失败兜底封面。
 */
export async function pickBestPosterJpegBlobFromVideoFile(file: File): Promise<Blob | null> {
  const mime = file.type.toLowerCase();
  if (!mime.startsWith("video/") && inferBinaryMediaKindFromFilename(file.name) !== "video") {
    return null;
  }
  const objectUrl = URL.createObjectURL(file);
  const v = document.createElement("video");
  v.muted = true;
  v.defaultMuted = true;
  v.playsInline = true;
  v.setAttribute("playsinline", "");
  v.preload = "auto";
  v.style.cssText =
    "position:fixed;width:1px;height:1px;left:-9999px;top:-9999px;opacity:0;pointer-events:none;";
  document.body.appendChild(v);
  const deadline = Date.now() + CAPTURE_BUDGET_MS;
  let best: { score: number; dataUrl: string } | null = null;
  try {
    v.src = objectUrl;
    await new Promise<void>((resolve, reject) => {
      const t = window.setTimeout(() => reject(new Error("timeout")), Math.max(800, deadline - Date.now()));
      v.addEventListener(
        "loadedmetadata",
        () => {
          window.clearTimeout(t);
          resolve();
        },
        { once: true },
      );
      v.addEventListener("error", () => reject(new Error("video error")), { once: true });
      void v.load();
    });
    const times = clampSampleTimes(v.duration);
    for (const t of times) {
      if (Date.now() > deadline) break;
      try {
        v.currentTime = t;
      } catch {
        continue;
      }
      await waitSeeked(v);
      const shot = scoreFrameOnVideo(v);
      if (!shot) continue;
      if (!best || shot.score > best.score) best = shot;
    }
    if (!best) return null;
    return await blobFromDataUrl(best.dataUrl);
  } catch {
    return null;
  } finally {
    try {
      v.pause();
      v.removeAttribute("src");
      v.load();
    } catch {
      /* ignore */
    }
    v.remove();
    URL.revokeObjectURL(objectUrl);
  }
}
