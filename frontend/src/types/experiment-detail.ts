import type { EducationPhase, SubjectDiscipline } from "@/types/subject";

/** 材料危险/禁忌属性（脑图：不可品尝等） */
export type MaterialHazardFlag =
  | "no_taste"
  | "no_inhale"
  | "flammable"
  | "corrosive"
  | "toxic"
  | "sharp"
  | "eye_protection"
  | string;

export interface ExperimentMaterial {
  id: string;
  /** 实验室标准名称 */
  nameLab: string;
  /** 家庭替代物名称 */
  nameHomeSubstitute?: string;
  imageUrl?: string;
  hazardFlags: MaterialHazardFlag[];
  notes?: string;
}

export interface ExperimentStepMedia {
  imageUrl?: string;
  videoUrl?: string;
}

export interface ExperimentStep {
  id: string;
  order: number;
  title: string;
  description: string;
  media?: ExperimentStepMedia;
}

/** 课标 / 教材上下文 */
export interface TeachingContext {
  curriculumStandardRef?: string;
  textbookRef?: string;
  chapter?: string;
  learningObjectives?: string[];
}

export type SafetySeverity = "critical" | "warning" | "info";

/** 安全红线 / 注意事项 */
export interface SafetyAlert {
  id: string;
  title: string;
  body: string;
  severity: SafetySeverity;
}

/** 科学故事与评价维度 */
export interface ExperimentEvaluation {
  scienceStory?: string;
  rubricSummary?: string;
  dimensions?: readonly { name: string; weightPct: number }[];
}

/** 审批信息（教研评审脑图） */
export interface ExperimentApprovalMeta {
  submitterName?: string;
  submittedAt?: string;
  schoolName?: string;
  version?: string;
  statusLabel?: string;
}

/**
 * 实验详情全量模型（第一张脑图：课标教材、材料、步骤、安全、评价）。
 */
export interface ExperimentDetail {
  id: string;
  title: string;
  summary?: string;
  subjectPath: {
    phase: EducationPhase;
    discipline: SubjectDiscipline;
    gradeLabel: string;
    gradeCode?: string;
  };
  durationMin: number;
  mainVideoUrl?: string;
  teachingContext: TeachingContext;
  materials: ExperimentMaterial[];
  steps: ExperimentStep[];
  safetyAlerts: SafetyAlert[];
  evaluation: ExperimentEvaluation;
  approvalMeta?: ExperimentApprovalMeta;
}
