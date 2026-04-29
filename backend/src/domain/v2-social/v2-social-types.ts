/**
 * V2 社交互动 + 积分激励模块类型定义
 * 对应表：social_like / social_notlike / social_collection / social_evaluate /
 *         scale_log / scale_title
 */

// ─── 社交互动 social_* ───────────────────────────────────
export interface SocialLikeRecord {
  seqId: string;
  expId: string;
  userId: string;
  createTime: string | null;
}

export interface SocialNotlikeRecord {
  seqId: string;
  expId: string;
  userId: string;
  createTime: string | null;
}

export interface SocialCollectionRecord {
  seqId: string;
  expId: string;
  userId: string;
  createTime: string | null;
}

export interface SocialEvaluateRecord {
  seqId: string;
  expId: string;
  userId: string;
  evaluateContent: string | null;
  evaluateUrl: string | null;
  createTime: string | null;
}

export interface ToggleSocialInput {
  expId: string;
  userId: string;
}

export interface WriteEvaluateInput {
  expId: string;
  userId: string;
  evaluateContent?: string;
  evaluateUrl?: string;
}

/** 单个试验的互动统计汇总 */
export interface ExpSocialStats {
  expId: string;
  likeCount: number;
  notlikeCount: number;
  collectionCount: number;
  evaluateCount: number;
  /** 当前用户是否已点赞（需传入 userId 时才有效） */
  likedByMe?: boolean;
  /** 当前用户是否已收藏 */
  collectedByMe?: boolean;
}

// ─── 积分流水 scale_log ──────────────────────────────────
export interface ScaleLogRecord {
  seqId: string;
  userId: string;
  scaleSource: string | null;
  scaleNum: number;
  createTime: string | null;
}

export interface WriteScaleLogInput {
  userId: string;
  scaleSource: string;
  scaleNum: number;
}

// ─── 积分称号规则 scale_title ────────────────────────────
export interface ScaleTitleRecord {
  seqId: string;
  roleId: string;
  titleName: string;
  icon: string | null;
  scoreNum: number;
}

/** 用户当前称号（计算结果） */
export interface UserCurrentTitle {
  userId: string;
  totalScore: number;
  currentTitle: ScaleTitleRecord | null;
  nextTitle: ScaleTitleRecord | null;
  progressToNext: number;
}
