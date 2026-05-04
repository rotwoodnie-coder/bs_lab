"use client";

import type { ApiActor } from "@/lib/new-core-api";
import { defaultMaterialTitleFromFileName } from "@/lib/default-material-title";
import type { TeacherMaterialKind } from "@/lib/teacher-materials-api";

import { mediaRegistryStreamUrl } from "./registry-ref";
import {
  reconcileBinaryMediaKindFromFilename,
  reconcileTeacherMaterialKindFromFilename,
} from "@/lib/media/infer-media-kind-from-filename";

import type { MediaKind } from "./types";
import type { MultipartProgressEvent } from "./multipart-upload";
import { uploadFileViaMultipart } from "./multipart-upload";
import { startMediaUploadProgressToast } from "./media-upload-toast-progress";
import type { MediaUploadProgressEvent, MediaUploadXhrPayload } from "./upload-form-xhr";
import { extractMediaUploadError, postMediaUploadForm, postMediaUploadFormDirect } from "./upload-form-xhr";
import type { MediaStorageMode } from "./media-upload-destination-copy";

export type UploadToMediaPlatformResult = {
  registryId: string;
  assetId: string;
  viewUrl: string;
  reviewStatus: string;
  reused: boolean;
  storageMode?: MediaStorageMode;
  fileUrl?: string | null;
  registration?: "v1" | "v2";
};

export type MediaPlatformUploadOptions = {
  onProgress?: (e: MediaUploadProgressEvent) => void;
  /** 默认 toast：含进度条与落点说明；silent 不展示内置 Toast（适合已有完整进度 UI 的场景） */
  ui?: "toast" | "silent";
  /**
   * full：上传结束弹出成功/失败 Toast；
   * loading-only：仅展示上传过程，成功后关闭加载提示且不弹「媒体上传完成」，便于业务侧收口一条成功文案。
   */
  toastOutcome?: "full" | "loading-only";
  /** 单次上传的自动重试次数，默认为 1；设为 0 可完全禁用重试。 */
  retryCount?: number;
  /** 幂等键；同一文件重复提交时可用于后端去重。 */
  uploadKey?: string;
};

/** 若代理层返回 FormData 解析错误，自动降级直连后端。 */
function isFormDataParseError(payload: MediaUploadXhrPayload): boolean {
  const msg = typeof payload.error === "string" ? payload.error : payload.error?.message ?? "";
  return msg.includes("Failed to parse body as FormData");
}

async function postUploadEnvelope(
  form: FormData,
  opts?: MediaPlatformUploadOptions,
): Promise<MediaUploadXhrPayload> {
  const ui = opts?.ui ?? "toast";
  const outcome = opts?.toastOutcome ?? "full";
  const toastCtl = ui === "toast" ? startMediaUploadProgressToast("正在上传媒体资源", outcome) : null;
  try {
    const payload = await postMediaUploadForm(form, {
      onProgress: (e) => {
        opts?.onProgress?.(e);
        toastCtl?.updateProgress(e.percent);
      },
    });
    if (!payload.ok && isFormDataParseError(payload)) {
      // 代理层 FormData 解析失败 → 降级直连后端 /v2/file/upload
      toastCtl?.updateProgress(99);
      const directPayload = await postMediaUploadFormDirect(form, {
        onProgress: (e) => {
          opts?.onProgress?.(e);
          toastCtl?.updateProgress(e.percent);
        },
      });
      if (!directPayload.ok || !directPayload.data) {
        throw new Error(errorMessageFromPayload(directPayload));
      }
      toastCtl?.finishSuccess(directPayload.data.storageMode, directPayload.data.reused);
      return directPayload;
    }
    if (!payload.ok || !payload.data) {
      throw new Error(errorMessageFromPayload(payload));
    }
    toastCtl?.finishSuccess(payload.data.storageMode, payload.data.reused);
    return payload;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "上传失败";
    toastCtl?.finishError(msg);
    throw e instanceof Error ? new Error(`[上传接口] ${e.message}`) : new Error(`[上传接口] ${msg}`);
  }
}

function errorMessageFromPayload(payload: MediaUploadXhrPayload): string {
  const err = extractMediaUploadError(payload);
  const code = err.code ? ` [${err.code}]` : "";
  const trace = err.traceId ? ` (traceId: ${err.traceId})` : "";
  return `${err.message}${code}${trace}`;
}

function mapData(payload: MediaUploadXhrPayload): UploadToMediaPlatformResult {
  const d = payload.data!;
  return {
    registryId: d.registryId,
    assetId: d.assetId,
    viewUrl: d.viewUrl,
    reviewStatus: d.reviewStatus,
    reused: d.reused,
    storageMode: d.storageMode,
    fileUrl: d.fileUrl ?? undefined,
    registration: d.registration,
  };
}

export async function uploadMediaFileToPlatform(
  actor: ApiActor,
  file: File,
  input: { kind: MediaKind; title?: string },
  options?: MediaPlatformUploadOptions,
): Promise<UploadToMediaPlatformResult> {
  const form = new FormData();
  form.append("file", file);
  form.append("title", (input.title ?? file.name).trim() || "未命名素材");
  form.append("mediaKind", reconcileBinaryMediaKindFromFilename(input.kind, file.name));
  form.append("userId", actor.userId);
  form.append("orgId", actor.orgId);
  form.append("userName", actor.userName);
  form.append("role", actor.role);
  if (options?.uploadKey) form.append("uploadKey", options.uploadKey);

  const payload = await postUploadEnvelope(form, options);
  return mapData(payload);
}

/** 实验素材库：按素材类型上传至媒体中台（含 Office / PDF / Excel 等）。 */
export async function uploadTeacherMaterialFileToPlatform(
  actor: ApiActor,
  file: File,
  input: { materialKind: TeacherMaterialKind; title: string },
  options?: MediaPlatformUploadOptions,
): Promise<UploadToMediaPlatformResult> {
  // ── 大文件走 multipart 分片上传 ──────────────────────────
  const MULTIPART_THRESHOLD = 100 * 1024 * 1024; // 100MB
  if (file.size >= MULTIPART_THRESHOLD) {
    return uploadTeacherMaterialViaMultipart(actor, file, input, options);
  }

  // ── 小文件继续走原 XHR 管道 ──────────────────────────────
  const form = new FormData();
  form.append("file", file);
  const title =
    input.title.trim() || defaultMaterialTitleFromFileName(file.name) || file.name.trim() || "未命名素材";
  form.append("title", title);
  form.append("teacherMaterialKind", reconcileTeacherMaterialKindFromFilename(input.materialKind, file.name));
  form.append("userId", actor.userId);
  form.append("orgId", actor.orgId);
  form.append("userName", actor.userName);
  form.append("role", actor.role);
  if (options?.uploadKey) form.append("uploadKey", options.uploadKey);

  const payload = await postUploadEnvelope(form, options);
  return mapData(payload);
}

/** 大文件走 multipart 分片上传，返回兼容 UploadToMediaPlatformResult 的结构 */
async function uploadTeacherMaterialViaMultipart(
  actor: ApiActor,
  file: File,
  input: { materialKind: TeacherMaterialKind; title: string },
  options?: MediaPlatformUploadOptions,
): Promise<UploadToMediaPlatformResult> {
  const title =
    input.title.trim() || defaultMaterialTitleFromFileName(file.name) || file.name.trim() || "未命名素材";

  const onProgress = options?.onProgress
    ? (e: MultipartProgressEvent) =>
        options.onProgress!({ loaded: e.loadedBytes, total: e.totalBytes, percent: e.percent })
    : undefined;

  const { reused, fileRecord } = await uploadFileViaMultipart(actor, file, {
    fileName: file.name,
    title,
    teacherMaterialKind: reconcileTeacherMaterialKindFromFilename(input.materialKind, file.name),
    onProgress,
  });

  return {
    assetId: fileRecord.fileId,
    registryId: "",
    viewUrl: fileRecord.fileUrl ?? "",
    reviewStatus: fileRecord.status ?? "",
    reused,
    storageMode: "minio",
    fileUrl: fileRecord.fileUrl ?? null,
    registration: "v2",
  };
}

export function viewUrlForRegistryId(registryId: string, actor?: ApiActor): string {
  return mediaRegistryStreamUrl(registryId, "view", actor);
}
