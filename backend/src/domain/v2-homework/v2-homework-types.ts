/**
 * V2 作业与仲裁模块类型定义
 * 对应表：exp_homework / exp_homework_student /
 *         exp_arbitration / exp_arbitration_like / exp_arbitration_notlike
 */

/** 仲裁状态：t 仲裁中，y 通过，n 不通过 */
export type ArbitrationStatus = "t" | "y" | "n";

// ─── 作业主表 exp_homework ───────────────────────────────
export interface ExpHomeworkRecord {
  workId: string;
  expId: string;
  teacherUserId: string;
  classId: string;
  requireDate: string | null;
  createUserId: string | null;
  createTime: string | null;
  updateUserId: string | null;
  updateTime: string | null;
  isDeleted: 0 | 1;
}

export interface CreateExpHomeworkInput {
  /** 可选：显式 `work_id`；缺省由实验/教师/班级组合语义生成。 */
  workId?: string;
  expId: string;
  teacherUserId: string;
  classId: string;
  requireDate?: string;
  studentUserIds?: string[];
}

export type HomeworkListQuery = {
  teacherUserId?: string;
  classId?: string;
  expId?: string;
  page?: number;
  pageSize?: number;
};

// ─── 学生作业记录 exp_homework_student ──────────────────
export interface ExpHomeworkStudentRecord {
  seqId: string;
  workId: string;
  /** 学生副本试验 id（作业快照） */
  expId: string;
  teacherUserId: string;
  /** 教师标准版试验 id（快照冻结，不随标准库更新而变化） */
  teacherExpId: string;
  studentUserId: string;
  requireDate: string | null;
  submitDate: string | null;
  markUserId: string | null;
  markTime: string | null;
  markResult: string | null;
  markComments: string | null;
}

export interface MarkHomeworkInput {
  markUserId: string;
  markResult: string;
  markComments?: string;
}

export type HomeworkStudentListQuery = {
  workId?: string;
  studentUserId?: string;
  submitted?: boolean;
  marked?: boolean;
};

// ─── 实验仲裁 exp_arbitration ────────────────────────────
export interface ExpArbitrationRecord {
  seqId: string;
  expId: string;
  initiatorId: string;
  initiatorTime: string | null;
  likeNum: number;
  notlikeNum: number;
  judgeUserId: string | null;
  judgeTime: string | null;
  initiatorStatus: ArbitrationStatus | null;
}

export interface CreateArbitrationInput {
  expId: string;
  initiatorId: string;
}

export interface JudgeArbitrationInput {
  judgeUserId: string;
  initiatorStatus: "y" | "n";
}

// ─── 仲裁支持 / 反对记录 ─────────────────────────────────
export interface ExpArbitrationLikeRecord {
  seqId: string;
  expId: string;
  userId: string;
  comments: string | null;
  createTime: string | null;
}

/**
 * 仲裁反对记录
 * 注意：此表必须保留，仅在实验小法庭中展示，不可删除。
 */
export interface ExpArbitrationNotlikeRecord {
  seqId: string;
  expId: string;
  userId: string;
  comments: string | null;
  createTime: string | null;
}

export interface VoteArbitrationInput {
  expId: string;
  userId: string;
  comments?: string;
}
