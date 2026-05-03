const CACHE_PREFIX = "bs-lab:video-poster-b64:v1:";
const CAPTURE_TIMEOUT_MS = 14_000;
const STAGGER_MS = 64;
const MAX_CANVAS_LONG_EDGE = 560;
const JPEG_QUALITY = 0.76;
/** sessionStorage 单条上限保守值，避免 QuotaExceeded */
const MAX_STORED_DATA_URL_CHARS = 1_500_000;

function djb2Hex(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i += 1) {
    h = (h << 5) + h + s.charCodeAt(i)!;
  }
  return (h >>> 0).toString(36);
}

export function posterSessionStorageKey(src: string): string {
  return `${CACHE_PREFIX}${djb2Hex(src)}`;
}

export function readRasterPosterFromSession(src: string): string | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const v = sessionStorage.getItem(posterSessionStorageKey(src));
    if (!v) return null;
    if (v.startsWith("data:image/")) return v;
    if (v.startsWith("http://") || v.startsWith("https://")) return v;
    return null;
  } catch {
    return null;
  }
}

export function writeRasterPosterToSession(src: string, dataUrl: string): void {
  if (typeof sessionStorage === "undefined") return;
  if (dataUrl.length > MAX_STORED_DATA_URL_CHARS) return;
  try {
    sessionStorage.setItem(posterSessionStorageKey(src), dataUrl);
  } catch {
    /* 配额已满等 */
  }
}

function stagger(): Promise<void> {
  return new Promise((r) => setTimeout(r, STAGGER_MS));
}

function destroyGhostVideo(v: HTMLVideoElement): void {
  try {
    v.pause();
    v.removeAttribute("src");
    v.load();
  } catch {
    /* ignore */
  }
  v.remove();
}

function paintFrameToDataUrl(v: HTMLVideoElement): string | null {
  const w0 = v.videoWidth;
  const h0 = v.videoHeight;
  if (!w0 || !h0) return null;
  const scale = Math.min(1, MAX_CANVAS_LONG_EDGE / Math.max(w0, h0));
  const cw = Math.max(1, Math.round(w0 * scale));
  const ch = Math.max(1, Math.round(h0 * scale));
  const canvas = document.createElement("canvas");
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(v, 0, 0, cw, ch);
  return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
}

/**
 * 隐藏 video → seek → canvas 抽一帧；失败返回 null（如跨域污染 canvas）。
 * 调用方须在结束后释放节点；本函数在 resolve 前会 destroy。
 */
export function extractFrameDataUrlFromStreamSrc(src: string): Promise<string | null> {
  return new Promise((resolve) => {
    const v = document.createElement("video");
    v.muted = true;
    v.defaultMuted = true;
    v.playsInline = true;
    v.setAttribute("playsinline", "");
    v.preload = "auto";
    v.crossOrigin = "anonymous";
    v.style.cssText =
      "position:fixed;width:160px;height:90px;left:-10000px;top:-10000px;opacity:0.01;pointer-events:none;";
    document.body.appendChild(v);

    let settled = false;
    const finish = (out: string | null) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      destroyGhostVideo(v);
      resolve(out);
    };

    const timer = window.setTimeout(() => finish(null), CAPTURE_TIMEOUT_MS);

    v.addEventListener(
      "error",
      () => {
        finish(null);
      },
      { once: true },
    );

    v.addEventListener(
      "loadedmetadata",
      () => {
        const dur = Number.isFinite(v.duration) && v.duration > 0.12 ? v.duration : 6;
        /** 优先 2s 附近，缩短片头黑场；短视频钳在时长内 */
        const t = Math.min(2, Math.max(0.1, dur - 0.06));
        try {
          v.currentTime = t;
        } catch {
          finish(null);
        }
      },
      { once: true },
    );

    v.addEventListener(
      "seeked",
      () => {
        try {
          const data = paintFrameToDataUrl(v);
          finish(data && data.startsWith("data:image/") ? data : null);
        } catch {
          finish(null);
        }
      },
      { once: true },
    );

    v.src = src;
    void v.load();
  });
}

let captureTail: Promise<unknown> = Promise.resolve();

/**
 * 串行 + 轻微错峰，避免列表首屏同时起几十个隐藏 video。
 */
export function scheduleRasterFrameExtraction(src: string): Promise<string | null> {
  const job = async (): Promise<string | null> => {
    await stagger();
    const cached = readRasterPosterFromSession(src);
    if (cached) return cached;
    const frame = await extractFrameDataUrlFromStreamSrc(src);
    if (frame) writeRasterPosterToSession(src, frame);
    return frame;
  };
  const next = captureTail.then(job, job);
  captureTail = next.then(
    () => undefined,
    () => undefined,
  );
  return next as Promise<string | null>;
}
