export type MediaKind = "image" | "video";

export type MediaMatchType = "TITLE_MATCH" | "CONTENT_MATCH";

export type MediaRegistryReviewStatus =
  | "DRAFT"
  | "PENDING_REVIEW"
  | "PUBLISHED"
  | "REJECTED"
  | "ARCHIVED";

export type MediaRegistryHit = {
  id: string;
  assetId: string;
  /** 后端搜索接口附带，用于按图片/视频筛选 */
  assetMediaType?: string;
  /** V2：`data_file.file_ext`（带点或不带点），用于推断 MIME 与列表缩略图策略 */
  fileExt?: string | null;
  /** V2：`data_file.logo_url`（视频封面等），可为空 */
  logoUrl?: string | null;
  /** 若该登记被实验材料引用，返回对应材料名称（用于素材库展示） */
  resourceName?: string;
  title: string;
  ownerType: string;
  ownerKey: string;
  status: string;
  ocrText?: string;
  reviewStatus: MediaRegistryReviewStatus;
  reviewComment: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  submittedAt: string | null;
  registryGroupId: string;
  versionNumber: number;
  supersedesRegistryId: string | null;
  matchType: MediaMatchType;
  matchSnippet: string | null;
};

export type MediaReviewPolicy = {
  id: string;
  tenantId: string;
  appId: string;
  orgKey: string;
  teacherUploadRequireReview: boolean;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MediaUploadInput = {
  hash: string;
  fileSize: number;
  fileExt: string;
  mediaType: "IMAGE" | "VIDEO" | "DOC" | "AUDIO" | "PPT" | "PDF" | "EXCEL";
  mimeType: string;
  storageEngine: "LOCAL" | "OSS" | "COS" | "S3";
  storageKey: string;
  durationMs?: number;
  title: string;
  ownerType: "SYSTEM" | "ORG" | "ROLE" | "USER" | "EXTERNAL";
  ownerKey: string;
};

export type MediaUploadResult = {
  asset: { id: string };
  registry: { id: string; reviewStatus: MediaRegistryReviewStatus };
  job: { id: string; processStatus: string };
  reused: boolean;
};

export type MediaReferenceRecord = {
  id: string;
  targetKind: "REGISTRY" | "SEGMENT";
  targetId: string;
  refType: string;
  refId: string;
  slotKey: string | null;
  sortOrder: number;
  refVersion: number;
  createdAt: string;
};

export type MediaCreateReferenceInput = {
  targetKind: "REGISTRY" | "SEGMENT";
  targetId: string;
  refType: string;
  refId: string;
  slotKey?: string;
  sortOrder?: number;
};

export type MediaRegistryDetail = {
  id: string;
  /** 详情接口常返回；类型侧历史上未声明时由前端兜底读取 */
  title?: string;
  registryGroupId: string;
  versionNumber: number;
  reviewStatus: MediaRegistryReviewStatus;
};

export type MediaOrphanGovernanceReport = {
  assetsWithZeroRefCount: { id: string; mediaType: string; refCount: number }[];
  registriesWithNoReferences: { id: string; title: string; reviewStatus: MediaRegistryReviewStatus }[];
};

export type MediaOutboxBatchResult = {
  scanned: number;
  published: number;
  scheduledRetry: number;
  failed: number;
  skippedInflight: number;
};

export type MediaCompleteJobsResult = {
  completed: number;
  jobIds: string[];
};
