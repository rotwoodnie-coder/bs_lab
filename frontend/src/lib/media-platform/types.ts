export type MediaKind = "image" | "video";

export type MediaMatchType = "TITLE_MATCH" | "CONTENT_MATCH";

export type MediaRegistryReviewStatus =
  | "DRAFT"
  | "PENDING_REVIEW"
  | "PUBLISHED"
  | "REJECTED"
  | "ARCHIVED";

/** V2 `data_file` 表字段分组，与 DB 列语义 1:1 映射 */
export type V2HitDataFile = {
  /** `data_file.file_url`，已由后端预签名 */
  fileUrl?: string | null;
  /** `data_file.file_ext`，用于推断 MIME */
  fileExt?: string | null;
  /** `data_file.file_size` */
  fileSize?: number | null;
  /** `data_file.logo_url`（视频封面/图片缩略图），已由后端预签名，可为空 */
  logoUrl?: string | null;
  /** `data_file.content_sha256`，用于前端内容去重 */
  contentSha256?: string | null;
  /** `data_file.file_name` */
  fileName?: string | null;
  /** `data_file.file_type_id` */
  fileTypeId?: string | null;
  /** 封面子行 fileId，用于走同源代理加载封面图片 */
  coverFileId?: string | null;
  /** 封面子行的 fileUrl（已预签名），浏览器可直接加载 */
  coverFileUrl?: string | null;
};

export type MediaRegistryHit = {
  id: string;
  assetId: string;
  /** 后端搜索接口附带，用于按图片/视频筛选 */
  assetMediaType?: string;
  /** V2 `data_file` 表字段分组——封面、扩展名、SHA256 等均在此组下 */
  dataFile?: V2HitDataFile;
  /** @deprecated 兼容旧键名，优先使用 `dataFile.logoUrl` */
  logoUrl?: string | null;
  /** @deprecated 兼容旧键名，优先使用 `dataFile.contentSha256` */
  contentSha256?: string | null;
  /** @deprecated 兼容旧键名，优先使用 `dataFile.fileExt` */
  fileExt?: string | null;
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
