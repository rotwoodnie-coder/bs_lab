/**
 * V2 家长会话/报告类型定义
 * 对应 parent_session / parent_report 表
 */

export type GuideStyle = "gentle" | "rigorous" | "playful";
export type EvaluationStatus = "none" | "evaluated";
export type CompletionStatus = "in_progress" | "completed";

export interface ParentSessionRecord {
  sessionId: string;
  parentUserId: string;
  studentUserId: string;
  expId: string;
  workId: string | null;
  taskId: string | null;
  guideStyle: GuideStyle;
  parentAttestedAt: string | null;
  errorCount: number;
  materialShortageReported: number;
  evaluationStatus: EvaluationStatus;
  teacherComment: string | null;
  teacherStarRating: number | null;
  completionStatus: CompletionStatus;
  createTime: string;
  updateTime: string | null;
}

/** 家长端展示用的会话详情（含关联数据） */
export interface ParentSessionDetail extends ParentSessionRecord {
  expName: string;
  studentName: string;
  teacherName: string | null;
  report: ParentReportRecord | null;
}

export interface ParentReportRecord {
  reportId: string;
  sessionId: string;
  summary: string | null;
  strengths: string[];
  improvements: string[];
  nextRecommendations: string[];
  shareCopy: string | null;
  teacherComment: string | null;
  createTime: string;
}

export interface CreateParentSessionInput {
  parentUserId: string;
  studentUserId: string;
  expId: string;
  workId?: string;
  taskId?: string;
  guideStyle?: GuideStyle;
}

export interface CreateParentReportInput {
  sessionId: string;
  summary: string;
  strengths: string[];
  improvements: string[];
  nextRecommendations: string[];
  shareCopy?: string;
  teacherComment?: string;
}

export interface PatchParentSessionInput {
  parentAttestedAt?: string | null;
  errorCount?: number;
  materialShortageReported?: number;
  guideStyle?: GuideStyle;
  completionStatus?: CompletionStatus;
  teacherComment?: string | null;
  teacherStarRating?: number | null;
  evaluationStatus?: EvaluationStatus;
}
