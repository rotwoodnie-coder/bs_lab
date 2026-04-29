/** 反馈类型 */
export type FeedbackType = "BUG" | "FEATURE" | "OPTIMIZE" | "INQUIRY";

/** 反馈状态 */
export type FeedbackStatus = "TODO" | "DOING" | "DONE" | "REJECT" | "AUTO_TRIAGED";

/** 提报人信息 */
export interface FeedbackReporter {
  userId: string;
  name: string;
  role: string;
  orgId: string;
  orgName: string;
}

/** 环境信息 */
export interface FeedbackEnv {
  url?: string;
  ua?: string;
  browser?: string;
  resolution?: string;
  pathname?: string;
  errorStack?: string;
  error_stack_brief?: string;
}

/** 反馈条目 */
export interface FeedbackItem {
  feedbackId: string;
  type: FeedbackType;
  title: string;
  content: string | null;
  status: FeedbackStatus;
  reporter: FeedbackReporter | null;
  env: FeedbackEnv | null;
  issueFingerprint: string | null;
  reply: string | null;
  replierId: string | null;
  replyTime: string | null;
  createUserId: string | null;
  createTime: string | null;
  updateUserId: string | null;
  updateTime: string | null;
}

/** 反馈列表查询参数 */
export interface FeedbackListQuery {
  type?: FeedbackType;
  status?: FeedbackStatus;
  keyword?: string;
  page?: number;
  pageSize?: number;
}

/** 反馈列表响应 */
export interface FeedbackListResult {
  items: FeedbackItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface GovernanceStats {
  totalNew: number;
  totalAutoTriaged: number;
  topFingerprints: Array<{ issueFingerprint: string; count: number }>;
}

/** 创建反馈请求 */
export interface CreateFeedbackInput {
  type: FeedbackType;
  title: string;
  content?: string;
  env?: FeedbackEnv;
  issueFingerprint?: string | null;
}

/** 更新反馈请求 */
export interface UpdateFeedbackInput {
  status?: FeedbackStatus;
  reply?: string;
}

/** 反馈类型 → 中文标签 */
export const FEEDBACK_TYPE_LABEL: Record<FeedbackType, string> = {
  BUG: "故障",
  FEATURE: "新增",
  OPTIMIZE: "优化",
  INQUIRY: "咨询",
};

/** 反馈状态 → 中文标签 */
export const FEEDBACK_STATUS_LABEL: Record<FeedbackStatus, string> = {
  TODO: "待处理",
  DOING: "修复中",
  DONE: "已上线",
  REJECT: "拒绝",
  AUTO_TRIAGED: "已分诊",
};

/** 反馈类型 → Badge variant 映射（语义色） */
export const FEEDBACK_TYPE_BADGE_VARIANT: Record<FeedbackType, "destructive" | "default" | "success" | "warning"> = {
  BUG: "destructive",
  FEATURE: "default",
  OPTIMIZE: "success",
  INQUIRY: "warning",
};

/** 反馈状态 → Badge variant 映射 */
export const FEEDBACK_STATUS_BADGE_VARIANT: Record<FeedbackStatus, "default" | "warning" | "success" | "destructive" | "secondary"> = {
  TODO: "default",
  DOING: "warning",
  DONE: "success",
  REJECT: "destructive",
  AUTO_TRIAGED: "secondary",
};
