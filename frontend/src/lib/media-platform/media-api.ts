"use client";

import type { ApiActor } from "@/lib/new-core-api";
import type { CoreApiActor } from "@/lib/core-api-shared";
import { fetchV2FileById, fetchV2FileListPage } from "@/lib/v2/v2-file-api";
import type {
  MediaCompleteJobsResult,
  MediaCreateReferenceInput,
  MediaOrphanGovernanceReport,
  MediaOutboxBatchResult,
  MediaReferenceRecord,
  MediaRegistryDetail,
  MediaRegistryHit,
  MediaReviewPolicy,
  MediaUploadInput,
  MediaUploadResult,
} from "./types";

export type MediaActor = ApiActor;

function toCore(actor: MediaActor): CoreApiActor {
  return {
    role: actor.role,
    userId: actor.userId,
    userName: actor.userName,
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    appId: actor.appId,
  };
}

function v2StatusToReviewStatus(status: string | null | undefined): MediaRegistryHit["reviewStatus"] {
  const s = (status ?? "y").toLowerCase();
  if (s === "n" || s === "deleted") return "ARCHIVED";
  return "PUBLISHED";
}

const VIDEO_EXTS = new Set(["mp4", "webm", "mov", "m4v", "avi", "mkv", "mpeg", "mpg"]);
const IMAGE_EXTS = new Set(["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg", "avif", "tif", "tiff"]);

function extToken(fileExt: string | null | undefined, fileName: string): string {
  const fromCol = (fileExt ?? "").replace(/^\./, "").trim().toLowerCase();
  if (fromCol) return fromCol;
  const m = fileName.trim().toLowerCase().match(/\.([a-z0-9]+)(\?|#|$)/i);
  return (m?.[1] ?? "").toLowerCase();
}

/** 由扩展名推断登记类型，避免 V2 列表未带 MIME 时全部落入 UNKNOWN 被当成图片用 `<img>` 加载视频流。 */
function inferAssetMediaTypeFromV2File(f: { fileExt: string | null; fileName: string }): "IMAGE" | "VIDEO" | "UNKNOWN" {
  const e = extToken(f.fileExt, f.fileName);
  if (VIDEO_EXTS.has(e)) return "VIDEO";
  if (IMAGE_EXTS.has(e)) return "IMAGE";
  return "UNKNOWN";
}

export async function searchMediaRegistry(
  actor: MediaActor,
  keyword: string,
  reviewStatus?: string,
  _extraHeaders?: Record<string, string>,
): Promise<MediaRegistryHit[]> {
  const core = toCore(actor);
  const page = await fetchV2FileListPage(core, {
    keyword: keyword.trim() || undefined,
    page: 1,
    pageSize: 100,
  });
  return page.items
    .map((f) => {
      const rs = v2StatusToReviewStatus(f.status);
      if (reviewStatus?.trim() && rs !== reviewStatus.trim()) return null;
      const hit: MediaRegistryHit = {
        id: f.fileId,
        assetId: f.fileId,
        assetMediaType: inferAssetMediaTypeFromV2File(f),
        fileExt: f.fileExt,
        contentSha256: f.contentSha256,
        logoUrl: f.logoUrl?.trim() ? f.logoUrl : null,
        title: f.fileName,
        ownerType: "USER",
        ownerKey: f.ownerUserId ?? "",
        status: f.status ?? "y",
        reviewStatus: rs,
        reviewComment: null,
        reviewedBy: null,
        reviewedAt: null,
        submittedAt: null,
        registryGroupId: f.fileId,
        versionNumber: 1,
        supersedesRegistryId: null,
        matchType: "TITLE_MATCH",
        matchSnippet: null,
      };
      return hit;
    })
    .filter((x): x is MediaRegistryHit => x != null);
}

function notSupported(name: string): never {
  throw new Error(`V2 文件库已替代旧版媒体中台，${name}暂不可用。`);
}

export async function getMediaReviewPolicy(_actor: MediaActor): Promise<MediaReviewPolicy> {
  return {
    id: "v2-file",
    tenantId: "",
    appId: "",
    orgKey: "",
    teacherUploadRequireReview: false,
    updatedBy: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export async function putMediaReviewPolicy(_actor: MediaActor, _teacherUploadRequireReview: boolean): Promise<MediaReviewPolicy> {
  return getMediaReviewPolicy(_actor);
}

export async function submitMediaRegistryReview(actor: MediaActor, _registryId: string): Promise<unknown> {
  notSupported("提交审核");
}

export async function approveMediaRegistry(actor: MediaActor, _registryId: string): Promise<unknown> {
  notSupported("审核通过");
}

export async function rejectMediaRegistry(
  actor: MediaActor,
  _registryId: string,
  _comment: string,
): Promise<unknown> {
  notSupported("驳回");
}

export async function forkMediaRegistryRevision(
  actor: MediaActor,
  _registryId: string,
  _body?: { title?: string; assetId?: string },
): Promise<unknown> {
  notSupported("修订草稿");
}

export async function upgradeMediaReferenceRegistry(
  actor: MediaActor,
  _referenceId: string,
  _targetRegistryId: string,
): Promise<unknown> {
  notSupported("引用升级");
}

export async function uploadMediaAssetAndRegistry(
  actor: MediaActor,
  _payload: MediaUploadInput,
): Promise<MediaUploadResult> {
  notSupported("JSON 直传登记（请使用页面上传走 /api/media/upload → /v2/file/upload）");
}

export async function createMediaReference(
  _actor: MediaActor,
  payload: MediaCreateReferenceInput,
): Promise<MediaReferenceRecord> {
  return {
    id: `v2-noref-${payload.refId}`,
    targetKind: payload.targetKind,
    targetId: payload.targetId,
    refType: payload.refType,
    refId: payload.refId,
    slotKey: payload.slotKey ?? null,
    sortOrder: payload.sortOrder ?? 0,
    refVersion: 1,
    createdAt: new Date().toISOString(),
  };
}

export async function listMediaReferences(
  actor: MediaActor,
  _refType: string,
  _refId: string,
): Promise<MediaReferenceRecord[]> {
  return [];
}

export async function getMediaRegistry(actor: MediaActor, registryId: string): Promise<MediaRegistryDetail> {
  const f = await fetchV2FileById(toCore(actor), registryId.trim());
  return {
    id: f.fileId,
    title: f.fileName,
    registryGroupId: f.fileId,
    versionNumber: 1,
    reviewStatus: v2StatusToReviewStatus(f.status),
  };
}

export async function getMediaOrphanReport(_actor: MediaActor): Promise<MediaOrphanGovernanceReport> {
  return { assetsWithZeroRefCount: [], registriesWithNoReferences: [] };
}

export async function completeMediaPendingJobs(_actor: MediaActor, _limit?: number): Promise<MediaCompleteJobsResult> {
  return { completed: 0, jobIds: [] };
}

export async function processMediaOutbox(_actor: MediaActor, _limit?: number): Promise<MediaOutboxBatchResult> {
  return { scanned: 0, published: 0, scheduledRetry: 0, failed: 0, skippedInflight: 0 };
}
