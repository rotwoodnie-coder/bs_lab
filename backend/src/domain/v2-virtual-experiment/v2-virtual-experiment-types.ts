/**
 * V2 虚拟实验模块类型定义
 * 对应表：virtual_experiment
 */

// ─── 枚举 ────────────────────────────────────────────────

/** 来源类型：url（URL内嵌）、html_file（HTML文件上传） */
export type VirtualExperimentSourceType = "url" | "html_file";

/** 状态：draft（草稿）、pending（审核中）、published（已发布）、rejected（已拒绝）、archived（已归档） */
export type VirtualExperimentStatus = "draft" | "pending" | "published" | "rejected" | "archived";

// ─── DB 记录映射 ────────────────────────────────────────

export interface VirtualExperimentRecord {
  id: string;
  title: string;
  description: string | null;
  sourceType: VirtualExperimentSourceType;
  /** 外部 URL（sourceType=url 时） */
  sourceUrl: string | null;
  /** MinIO 存储 Key（sourceType=html_file 时） */
  fileStorageKey: string | null;
  /** 原始文件名（sourceType=html_file 时） */
  fileName: string | null;
  /** 文件字节数（sourceType=html_file 时） */
  fileSize: number | null;
  /** 封面图 S3 Key */
  coverUrl: string | null;
  /** 访问次数 */
  viewCount: number | null;
  /** 被调用次数 */
  callCount: number | null;
  status: VirtualExperimentStatus;
  reviewerId: string | null;
  reviewComment: string | null;
  reviewTime: string | null;
  sortOrder: number | null;
  createUserId: string | null;
  /** 创建人姓名（冗余） */
  createUserName: string | null;
  createTime: string | null;
  updateUserId: string | null;
  updateTime: string | null;
  isDeleted: string | null;
}

// ─── CRUD 输入 ──────────────────────────────────────────

export interface CreateVirtualExperimentInput {
  title: string;
  description?: string;
  sourceType: VirtualExperimentSourceType;
  sourceUrl?: string;
  fileStorageKey?: string;
  fileName?: string;
  fileSize?: number;
  coverUrl?: string;
  sortOrder?: number;
  /** 创建操作时必填 */
  createUserId?: string;
  createUserName?: string;
}

export interface UpdateVirtualExperimentInput {
  title?: string;
  description?: string | null;
  sourceUrl?: string;
  coverUrl?: string | null;
  sortOrder?: number;
  /** 替换HTML文件时的新 storage key（来自 /v2/file/upload） */
  fileStorageKey?: string;
  /** 新文件名 */
  fileName?: string;
  /** 新文件字节数 */
  fileSize?: number;
}

// ─── 查询参数 ───────────────────────────────────────────

export type VirtualExperimentListQuery = {
  keyword?: string;
  sourceType?: VirtualExperimentSourceType;
  status?: VirtualExperimentStatus;
  /** true 时返回所有 pending 实验（仅 Admin/Researcher 可用） */
  reviewMode?: boolean;
  /** 按创建者过滤（非 reviewMode 时必传，用于"我的实验"视图） */
  createUserId?: string;
  page?: number;
  pageSize?: number;
};

export type VirtualExperimentListPage = {
  items: VirtualExperimentRecord[];
  total: number;
  page: number;
  pageSize: number;
};

// ─── 审核相关 ───────────────────────────────────────────

export interface SubmitReviewInput {
  /** 提交审核时注入，无需前端传入 */
  currentUserId?: string;
}

export interface ProcessReviewInput {
  action: "approved" | "rejected";
  comment?: string;
}
