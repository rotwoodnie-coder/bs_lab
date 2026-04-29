"use client";

import type { StudentWorkItem, StudentWorkStatus } from "@/types/student-work";

/** 与课标目录「小学科学」宝山来源条目对应的稳定实验 id（） */
export const BAOSHAN_100_EXPERIMENT_IDS = {
  obsFeatures: "baoshan-100-sci-001",
  materialFeatures: "baoshan-100-sci-002",
  rulerLength: "baoshan-100-sci-003",
} as const;

export const BAOSHAN_EXPERIMENT_ID_SET = new Set<string>(Object.values(BAOSHAN_100_EXPERIMENT_IDS));

/** 教师下发弹窗：宝山种子条目的展示元数据（与 buildBaoshanSeedTasks 标题一致） */
export const BAOSHAN_ASSIGNABLE_META: Record<
  string,
  { title: string; gradeLabel: string; subjectLabel: string }
> = {
  [BAOSHAN_100_EXPERIMENT_IDS.obsFeatures]: {
    title: "观察描述常见物体的特征",
    gradeLabel: "小学科学 · 1~2年级",
    subjectLabel: "科学",
  },
  [BAOSHAN_100_EXPERIMENT_IDS.materialFeatures]: {
    title: "观察常见材料的外部特征",
    gradeLabel: "小学科学 · 1~2年级",
    subjectLabel: "科学",
  },
  [BAOSHAN_100_EXPERIMENT_IDS.rulerLength]: {
    title: "用尺子测量物体的长度",
    gradeLabel: "小学科学 · 3~4年级",
    subjectLabel: "科学",
  },
};

export type AssignableExperimentOption = {
  id: string;
  title: string;
  gradeLabel: string;
  subjectLabel: string;
};

/** 占位媒体 URL，满足 POST /v1/works 的 videoUrl 形态 */
export const UNIFIED_MOCK_CAPTURE_MEDIA_URL =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect fill="#404040" width="120" height="120" rx="12"/><text x="60" y="68" text-anchor="middle" fill="#fafafa" font-size="11" font-family="system-ui">Capture</text></svg>`,
  );

export type UnifiedTaskStatus = "draft" | "published" | "closed" | "archived";

export type AiSessionGuideStyle = "gentle" | "rigorous" | "playful";

export type UnifiedTaskMock = {
  taskId: string;
  experimentId: string;
  title: string;
  experimentTitle: string;
  gradeLabel: string;
  classIds: string[];
  /** 下发到实验小组时填写；与 classIds 可并存用于血缘展示 */
  groupIds?: string[];
  dueAt: string;
  status: UnifiedTaskStatus;
  createdByTeacherId?: string;
  /** ：任务对哪些学生可见（正式版由班级 roster / 小组推导） */
  studentUserIds: string[];
  /** 任务级默认 AI 引导风格；`createSessionWithTask` 会写入会话 `guideStyle` */
  aiStyle?: AiSessionGuideStyle;
  academic_year?: string;
};

/** 统一仓中的学生（行政班 + 实验小组归属）；校管分班与教师建组共用 */
export type MockStudentUser = {
  userId: string;
  displayName: string;
  /** 教师侧行政班 TEACHER_MOCK_CLASSES.id；未分班则为 null */
  adminClassId: string | null;
  /** 组织树班级节点，如 g10-c1；未进班则为 null */
  orgClassNodeId: string | null;
  /** 当前所属实验小组（教师 /class/home）；null 表示未入组 */
  groupId: string | null;
  /** 用年级阶（高一=10…高三=12）；缺省由行政班推导 */
  gradeLevel?: number;
  isActive?: boolean;
  role?: "student" | "alumni";
};

export type LabGroupMock = {
  groupId: string;
  label: string;
  adminClassId: string;
  memberUserIds: string[];
  createdAt: string;
};

/** 会话完成度（家长背书 / 教师结课 / 学年更替中断） */
export type SessionCompletionStatus =
  | "ongoing"
  | "completed"
  | "parent_confirmed"
  | "interrupted_by_new_year";

/** 教师批改闭环：会话是否已写入结构化评价 */
export type UnifiedSessionEvaluationStatus = "none" | "evaluated";

export type UnifiedSessionMock = {
  sessionId: string;
  taskId?: string;
  experimentId: string;
  studentUserId: string;
  parentUserId: string;
  workIds: string[];
  guideStyle: AiSessionGuideStyle;
  startedAt: string;
  /** 家长「陪同确认 / 数字背书」时间；未背书为 null */
  parent_attested_at: string | null;
  completion_status: SessionCompletionStatus;
  /** 互动日志：错误预警、答错等累计次数（规则预审用） */
  errorCount: number;
  /** 家长反馈：家中材料难凑齐（班级学情热力图用） */
  materialShortageReported?: boolean;
  /** 成就卡 / 分享用报告链接（Mock 路径） */
  report_url?: string | null;
  /** 教师寄语（批改回传家长端） */
  teacher_feedback?: string | null;
  /** 分项评分折算 1–5（汇总星） */
  teacher_star_rating?: number;
  evaluation_status?: UnifiedSessionEvaluationStatus;
  /** 学年切片，如 2025-2026 */
  academic_year?: string;
  /** 往届档案：默认查询应过滤 */
  is_archived?: boolean;
};

export type UnifiedWorkKind = "capture" | "same_style_submission";

export type UnifiedWorkTeacherStatus = "pending_review" | "published" | "rejected";

/** P0 规则预审结果（可扩展为服务端 AI 回写） */
export type AiSuggestionStatus = "pass" | "warning" | "error";

export type AiWorkSuggestion = {
  status: AiSuggestionStatus;
  reason: string;
  flags: string[];
};

export type TeacherWorkRubricMock = {
  inquiry: number;
  operation: number;
  principle: number;
};

export type UnifiedWorkMock = {
  workId: string;
  sessionId: string;
  experimentId: string;
  kind: UnifiedWorkKind;
  studentUserId: string;
  title: string;
  description?: string;
  mediaMock: { photoUrl?: string; videoUrl?: string };
  createdAt: string;
  taskId?: string;
  teacherReviewStatus: UnifiedWorkTeacherStatus;
  /** 可选：服务端或规则引擎写入的预审快照；缺省用 calculateWorkSuggestion */
  ai_suggestion?: AiWorkSuggestion;
  /** 教师在批改抽屉中保存的结构化评分 */
  teacherRubric?: TeacherWorkRubricMock;
  teacherQuickNote?: string;
  academic_year?: string;
  is_archived?: boolean;
};

export type UnifiedAcademicMeta = {
  currentAcademicYear: string;
  lastPromotionAt?: string;
};

export type ClassDisplayOverride = { name?: string; gradeLabel?: string };

export type UnifiedStoreShape = {
  tasks: UnifiedTaskMock[];
  sessions: UnifiedSessionMock[];
  works: UnifiedWorkMock[];
  labGroups: LabGroupMock[];
  studentUsers: MockStudentUser[];
  academicMeta?: UnifiedAcademicMeta;
  classDisplayOverrides?: Record<string, ClassDisplayOverride>;
};

export type { StudentWorkItem, StudentWorkStatus };

