/**
 * data_file 封面（logo_url）— 方案一
 * - 小图：复用 file_url 作为 logo_url（不落第二对象）
 * - 大图：Sharp 缩放为 JPEG 后写入独立存储键
 * - 视频：前若干秒内多点抽帧，按亮度打分选帧；若仍过暗则在更晚时刻追加抽帧，仍不达标则不写 logo_url（避免纯黑封面入库）
 */
import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import sharp from "sharp";
import { updateFileRecord } from "../../infrastructure/repositories/v2-file-repository.ts";
import { getDirectUrl, putObject } from "../../infrastructure/storage/s3-storage.ts";

export type DataFileThumbFinalizeInput = {
  fileId: string;
  fileUrl: string;
  buffer: Buffer;
  mimeType: string;
  fileName: string;
  /** 与主文件路径前缀一致，如 `v2/{userId}/…` 中的 userId 段 */
  ownerSegment: string;
};

const IMAGE_REUSE_MAX_BYTES = Number(process.env.DATA_FILE_THUMB_IMAGE_REUSE_MAX_BYTES ?? 384 * 1024);
const IMAGE_REUSE_MAX_EDGE = Number(process.env.DATA_FILE_THUMB_IMAGE_REUSE_MAX_EDGE ?? 720);
const THUMB_JPEG_QUALITY = Number(process.env.DATA_FILE_THUMB_JPEG_QUALITY ?? 82);
const THUMB_MAX_EDGE = Number(process.env.DATA_FILE_THUMB_MAX_EDGE ?? 480);

/** 优先中段时刻，减少片头黑场；时间戳均限制在「前若干秒」窗口内（与 ffprobe 时长取 min） */
const VIDEO_PROBE_ORDER_SEC = [1, 2, 0.5, 1.5, 3, 2.5, 3.5, 4, 0.25] as const;
/** 与抽帧窗口一致：在前 N 秒内多点抽帧，按亮度选最优一帧 */
const VIDEO_MAX_WINDOW_SEC = 5;
/** 平均亮度（0–255 粗近似）低于此值视为「过暗/近纯黑」，不写库；并触发更晚时刻重抽 */
const VIDEO_MIN_MEAN_LUMA = 18;
/** 首轮过暗时追加抽帧的绝对时刻（秒，会按片长裁剪） */
const VIDEO_RETRY_EXTRA_SEC = [5.5, 6.5, 8, 10, 12, 15, 18, 22, 28, 36, 45, 55] as const;
/** 首轮过暗时追加抽帧的相对片长比例（略过片头黑场后段） */
const VIDEO_RETRY_RELATIVE_FRAC = [0.12, 0.2, 0.3, 0.45, 0.65, 0.85] as const;
const VIDEO_RETRY_MAX_SEC = 60;

function ffmpegBin(): string {
  return (process.env.FFMPEG_PATH ?? "ffmpeg").trim() || "ffmpeg";
}
function ffprobeBin(): string {
  return (process.env.FFPROBE_PATH ?? "ffprobe").trim() || "ffprobe";
}

function isSpawnEnoent(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as NodeJS.ErrnoException;
  if (e.code === "ENOENT") return true;
  const msg = typeof e.message === "string" ? e.message : "";
  return msg.includes("spawn") && msg.includes("ENOENT");
}

/** unknown：未探测；ok：ffprobe -version 成功；missing：ENOENT，后续视频抽帧直接跳过 */
type FfmpegToolchainState = "unknown" | "ok" | "missing";
let ffmpegToolchainState: FfmpegToolchainState = "unknown";
let warnedFfmpegMissing = false;

function warnFfmpegMissingOnce(): void {
  if (warnedFfmpegMissing) return;
  warnedFfmpegMissing = true;
  console.warn(
    "[data_file thumb] 本机未找到 ffprobe/ffmpeg（PATH 或 ENOENT），服务端无法从视频文件自动抽封面。" +
      ` 请安装 FFmpeg 并保证命令行可执行「${ffprobeBin()}」「${ffmpegBin()}」，或设置环境变量 FFPROBE_PATH / FFMPEG_PATH 指向完整路径。` +
      " 封面仍可由前端 POST /v2/file/:fileId/poster（截帧上传）写入 logo_url。",
  );
}

async function isFfmpegToolchainAvailable(): Promise<boolean> {
  if (ffmpegToolchainState === "ok") return true;
  if (ffmpegToolchainState === "missing") return false;
  try {
    await runProc(ffprobeBin(), ["-version"]);
    ffmpegToolchainState = "ok";
    return true;
  } catch (e) {
    if (isSpawnEnoent(e)) {
      ffmpegToolchainState = "missing";
      warnFfmpegMissingOnce();
      return false;
    }
    ffmpegToolchainState = "ok";
    return true;
  }
}

function extLower(name: string): string {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i + 1).toLowerCase() : "";
}

export function looksLikeImage(mime: string, name: string): boolean {
  const m = mime.toLowerCase();
  if (m === "image/svg+xml") return false;
  if (m.startsWith("image/")) return true;
  const e = extLower(name);
  return ["jpg", "jpeg", "png", "webp", "gif", "bmp", "tif", "tiff"].includes(e);
}

export function looksLikeVideo(mime: string, name: string): boolean {
  if (mime.toLowerCase().startsWith("video/")) return true;
  return ["mp4", "webm", "mov", "mkv", "avi", "m4v", "mpeg", "mpg"].includes(extLower(name));
}

async function meanLumaFromImageBuffer(buf: Buffer): Promise<number> {
  const { data, info } = await sharp(buf).resize(48, 48, { fit: "inside" }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const ch = info.channels;
  let sum = 0;
  let n = 0;
  for (let i = 0; i + ch <= data.length; i += ch) {
    const r = data[i]!;
    const g = data[i + 1]!;
    const b = data[i + 2]!;
    sum += 0.299 * r + 0.587 * g + 0.114 * b;
    n++;
  }
  return n > 0 ? sum / n : 0;
}

async function tryImageReuseOrCompress(input: DataFileThumbFinalizeInput): Promise<string | null> {
  const meta = await sharp(input.buffer, { animated: true, pages: 1 }).metadata();
  const w = meta.width ?? 0;
  const h = meta.height ?? 0;
  const smallEnough =
    input.buffer.length <= IMAGE_REUSE_MAX_BYTES &&
    w > 0 &&
    h > 0 &&
    w <= IMAGE_REUSE_MAX_EDGE &&
    h <= IMAGE_REUSE_MAX_EDGE;
  if (smallEnough) {
    await updateFileRecord(input.fileId, { logoUrl: input.fileUrl });
    return input.fileUrl;
  }
  const thumbBuf = await sharp(input.buffer, { animated: true, pages: 1 })
    .rotate()
    .resize({
      width: THUMB_MAX_EDGE,
      height: THUMB_MAX_EDGE,
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({ quality: THUMB_JPEG_QUALITY, mozjpeg: true })
    .toBuffer();
  const key = `v2/${input.ownerSegment}/thumb/${input.fileId}-${randomUUID().slice(0, 8)}.jpg`;
  await putObject(key, thumbBuf, "image/jpeg");
  const logoUrl = getDirectUrl(key);
  await updateFileRecord(input.fileId, { logoUrl });
  return logoUrl;
}

function runProc(bin: string, args: string[]): Promise<{ code: number | null; stdout: Buffer; stderr: string }> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const err: Buffer[] = [];
    const p = spawn(bin, args, { stdio: ["ignore", "pipe", "pipe"] });
    p.stdout.on("data", (c: Buffer) => chunks.push(c));
    p.stderr.on("data", (c: Buffer) => err.push(c));
    p.on("error", reject);
    p.on("close", (code) => {
      resolve({ code, stdout: Buffer.concat(chunks), stderr: Buffer.concat(err).toString("utf8") });
    });
  });
}

async function ffprobeDurationSec(videoPath: string): Promise<number | null> {
  const { code, stdout, stderr } = await runProc(ffprobeBin(), [
    "-v",
    "error",
    "-show_entries",
    "format=duration",
    "-of",
    "default=noprint_wrappers=1:nokey=1",
    videoPath,
  ]);
  if (code !== 0) {
    console.error("[data_file thumb] ffprobe failed", stderr.slice(0, 400));
    return null;
  }
  const v = Number.parseFloat(stdout.toString("utf8").trim());
  return Number.isFinite(v) && v > 0 ? v : null;
}

async function ffmpegFrameAt(videoPath: string, tSec: number): Promise<Buffer | null> {
  const { code, stdout, stderr } = await runProc(ffmpegBin(), [
    "-hide_banner",
    "-loglevel",
    "error",
    "-ss",
    String(tSec),
    "-i",
    videoPath,
    "-frames:v",
    "1",
    "-vf",
    /** `-vf` 链里 `,` 会分隔滤镜，`min(w,iw)` 内的逗号必须写成 `\,` 否则变成「No such filter: iw):-1」 */
    `scale=min(${THUMB_MAX_EDGE}\\,iw):-1`,
    "-f",
    "image2pipe",
    "-vcodec",
    "mjpeg",
    "pipe:1",
  ]);
  if (code !== 0 || stdout.length < 64) {
    console.error("[data_file thumb] ffmpeg frame failed", tSec, stderr.slice(0, 300));
    return null;
  }
  return stdout;
}

function roundTimeSec(n: number): number {
  return Math.round(n * 1000) / 1000;
}

/**
 * 首轮过暗时：在「前 5 秒窗口」之外再抽一批时刻，尽量避开长片头黑场。
 */
function buildRetryProbeTimes(durationSec: number | null): number[] {
  const cap =
    durationSec != null && Number.isFinite(durationSec) && durationSec > 0.1
      ? Math.min(VIDEO_RETRY_MAX_SEC, Math.max(0.06, durationSec - 0.05))
      : VIDEO_RETRY_MAX_SEC;
  const out = new Set<number>();
  for (const t of VIDEO_RETRY_EXTRA_SEC) {
    if (t <= cap + 1e-6) out.add(roundTimeSec(Math.max(0.05, t)));
  }
  if (durationSec != null && durationSec > 2) {
    for (const f of VIDEO_RETRY_RELATIVE_FRAC) {
      const t = Math.min(cap, Math.max(0.05, durationSec * f));
      if (t > VIDEO_MAX_WINDOW_SEC + 0.2) out.add(roundTimeSec(t));
    }
    const nearEnd = Math.min(cap, Math.max(VIDEO_MAX_WINDOW_SEC + 0.2, durationSec - 0.35));
    out.add(roundTimeSec(nearEnd));
  }
  return [...out].sort((a, b) => a - b);
}

async function bestFrameAtTimes(
  videoPath: string,
  timesSec: number[],
  earlyBrightExitLuma: number,
): Promise<{ buf: Buffer; score: number } | null> {
  let best: { buf: Buffer; score: number } | null = null;
  for (const t of timesSec) {
    const raw = await ffmpegFrameAt(videoPath, t);
    if (!raw) continue;
    let jpeg: Buffer;
    try {
      jpeg = await sharp(raw).jpeg({ quality: THUMB_JPEG_QUALITY, mozjpeg: true }).toBuffer();
    } catch {
      continue;
    }
    const score = await meanLumaFromImageBuffer(jpeg);
    if (!best || score > best.score) best = { buf: jpeg, score };
    if (score >= earlyBrightExitLuma) break;
  }
  return best;
}

async function tryVideoThumb(input: DataFileThumbFinalizeInput): Promise<string | null> {
  if (!(await isFfmpegToolchainAvailable())) return null;
  const id = randomUUID();
  const ext = extLower(input.fileName) || "mp4";
  const videoPath = path.join(tmpdir(), `bslab-dfvid-${input.fileId}-${id}.${ext}`);
  try {
    await fs.writeFile(videoPath, input.buffer);
    const duration = await ffprobeDurationSec(videoPath);
    /** ffprobe 失败（封装/环境）时仍尝试在前几秒抽帧，避免封面整段跳过 */
    const maxT =
      duration != null
        ? Math.min(VIDEO_MAX_WINDOW_SEC, Math.max(0.05, duration - 0.05))
        : VIDEO_MAX_WINDOW_SEC;
    let candidates: number[] = [...VIDEO_PROBE_ORDER_SEC].filter((t) => t <= maxT + 1e-6);
    if (candidates.length === 0) candidates = [Math.min(0.05, maxT * 0.5)];

    const earlyBrightExit = VIDEO_MIN_MEAN_LUMA * 2;
    let best = await bestFrameAtTimes(videoPath, candidates, earlyBrightExit);

    if (!best) {
      console.error("[data_file thumb] no video frame candidate", input.fileId, "ffprobeDuration", duration);
      return null;
    }

    if (best.score < VIDEO_MIN_MEAN_LUMA) {
      const retryTimes = buildRetryProbeTimes(duration);
      if (retryTimes.length > 0) {
        const more = await bestFrameAtTimes(videoPath, retryTimes, earlyBrightExit);
        if (more && more.score > best.score) best = more;
      }
    }

    if (best.score < VIDEO_MIN_MEAN_LUMA) {
      console.warn(
        "[data_file thumb] sampled frames still too dark, skip logo_url",
        input.fileId,
        "bestMeanLuma",
        best.score.toFixed(1),
        "threshold",
        VIDEO_MIN_MEAN_LUMA,
      );
      return null;
    }

    const key = `v2/${input.ownerSegment}/thumb/${input.fileId}-${id.slice(0, 8)}.jpg`;
    await putObject(key, best.buf, "image/jpeg");
    const logoUrl = getDirectUrl(key);
    await updateFileRecord(input.fileId, { logoUrl });
    return logoUrl;
  } finally {
    await fs.unlink(videoPath).catch(() => {});
  }
}

/**
 * 异步写入 `data_file.logo_url`；上传路由应 `void` 调度且不阻塞响应。
 */
export async function finalizeDataFileThumbnail(input: DataFileThumbFinalizeInput): Promise<void> {
  const mime = (input.mimeType ?? "").trim().toLowerCase();
  try {
    if (looksLikeImage(mime, input.fileName)) {
      await tryImageReuseOrCompress(input);
      return;
    }
    if (looksLikeVideo(mime, input.fileName)) {
      const logo = await tryVideoThumb(input);
      if (!logo && ffmpegToolchainState !== "missing") {
        console.error(
          "[data_file thumb] video branch finished but logo_url not written (ffprobe/ffmpeg/sharp 可能失败或无可选帧)",
          input.fileId,
          "mime=",
          input.mimeType,
          "name=",
          input.fileName,
        );
      }
      return;
    }
    console.warn("[data_file thumb] skipped (not classified as image/video)", {
      fileId: input.fileId,
      mimeType: input.mimeType,
      fileName: input.fileName,
    });
  } catch (e) {
    if (isSpawnEnoent(e)) {
      ffmpegToolchainState = "missing";
      warnFfmpegMissingOnce();
      return;
    }
    console.error("[data_file thumb] finalize failed", input.fileId, e instanceof Error ? e.message : e);
  }
}
