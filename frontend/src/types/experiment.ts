/**
 * 实验业务实体（卡片与列表用最小字段集，后续可与 API DTO 对齐）。
 */
export type ExperimentDifficulty = "easy" | "medium" | "hard";

export type ExperimentStatus = "published" | "draft";

/** 无封面时用于品牌渐变占位（物化生） */
export type ExperimentScienceDiscipline = "physics" | "chemistry" | "biology";

export interface Experiment {
  id: string;
  title: string;
  /** 卡片副标题 / 一句说明 */
  summary?: string;
  /** 展示用年级文案，如「高一」 */
  gradeLabel: string;
  /** 学科或分类标签 */
  categoryLabel?: string;
  coverImageUrl?: string;
  /** 封面循环视频（静音）；与 {@link coverImageUrl} 同时存在时优先视频 */
  coverVideoUrl?: string;
  /** 无封面时决定渐变主题色 */
  scienceDiscipline?: ExperimentScienceDiscipline;
  difficulty?: ExperimentDifficulty;
  status?: ExperimentStatus;
  /** 预计课时（分钟） */
  durationMin?: number;
  likesCount?: number;
  /** 列表/卡片展示阅读量 */
  viewsCount?: number;
  /** 卡片/列表展示：评论条数 */
  commentsCount?: number;
  /** 发布者展示名 */
  authorDisplayName?: string;
  /** 发布者头像 URL（可选） */
  authorAvatarUrl?: string;
  /** 相对发布时间文案，如「2 小时前」 */
  publishedAgoLabel?: string;
}

/** 必做 / 选做 */
export type ExperimentParticipation = "required" | "optional";

/** 对照课标：一二级主题 + 核心素养 */
export interface CurriculumStandardRef {
  level1Theme: string;
  level2Theme: string;
  coreCompetencies: string[];
}

/** 对照教材 */
export interface TextbookRef {
  version: string;
  unit: string;
  section: string;
}

/** 教学背景 */
export interface ExperimentTeachingContext {
  subject: string;
  /** 学段，如「普通高中」 */
  stage: string;
  gradeLabel: string;
  participation: ExperimentParticipation;
  curriculum: CurriculumStandardRef;
  textbook: TextbookRef;
}

/** 器材危险属性 */
export type EquipmentHazardLevel = "none" | "caution" | "warning" | "danger";

/** 器材清单项 */
export interface ExperimentEquipmentItem {
  id: string;
  name: string;
  imageUrl?: string;
  /** 家庭替代配图（与 homeSubstitute 文案配套切换） */
  homeSubstituteImageUrl?: string;
  /** 量取 / 规格说明 */
  measureNote?: string;
  homeSubstitute?: string;
  hazard: EquipmentHazardLevel;
}

/** 步骤媒体 */
export interface ExperimentStepMedia {
  type: "image" | "video";
  url: string;
  alt?: string;
}

/** 实验步骤 */
export interface ExperimentStep {
  id: string;
  order: number;
  title: string;
  content: string;
  media?: ExperimentStepMedia[];
}

/** 实验计时配置 */
export interface ExperimentTimerConfig {
  /** 建议总时长（秒） */
  suggestedDurationSec?: number;
  enableClassTimer?: boolean;
}

/** 实验核心：原理、器材、步骤、安全、计时 */
export interface ExperimentCore {
  principle: string;
  equipment: ExperimentEquipmentItem[];
  steps: ExperimentStep[];
  /** 安全红线 / 注意事项（展示为 Alert） */
  safetyAlerts: string[];
  timer: ExperimentTimerConfig;
}

export interface ScientistStory {
  name: string;
  period?: string;
  summary: string;
}

export interface ExtensionExperiment {
  id: string;
  title: string;
  summary: string;
}

/** 科学拓展 */
export interface ExperimentScienceExtension {
  scientistStory?: ScientistStory;
  extensionExperiments: ExtensionExperiment[];
}

export type ExperimentApprovalStatus = "draft" | "pending" | "approved" | "rejected";

/** 在线模拟配置；未配置、空对象或无有效入口即视为暂未上线 */
export interface ExperimentSimulationConfig {
  /** 模拟器嵌入地址（iframe / Web 组件入口） */
  embedSrc?: string;
  version?: string;
}

/** 管理层：审批（教研员/管理员可见敏感字段） */
export interface ExperimentManagement {
  approvalStatus: ExperimentApprovalStatus;
  approverName?: string;
  /** 评审意见（仅管理角色展示） */
  reviewerComment?: string;
  lastReviewedAt?: string;
  /** 班级维度完成率 0–100（管理模式统计动效用） */
  classCompletionRatePct?: number;
  /** 已提交实践单/报告份数（） */
  practiceSubmissionCount?: number;
  /** 本班平均得分（0–100，管理模式顶栏动效） */
  classAverageScore?: number;
}

/**
 * 实验详情（对齐业务脑图：教学背景 / 实验核心 / 科学拓展 / 管理）。
 * 列表字段与 {@link Experiment} 兼容，便于由卡片进入详情。
 */
export interface ExperimentDetail extends Experiment {
  /** Banner 视频占位 URL（可选） */
  bannerVideoUrl?: string;
  /** 在线模拟；省略或空表示暂无，教师端可发起需求反馈 */
  simulationConfig?: ExperimentSimulationConfig | null;
  teaching: ExperimentTeachingContext;
  core: ExperimentCore;
  extension: ExperimentScienceExtension;
  management: ExperimentManagement;
}
