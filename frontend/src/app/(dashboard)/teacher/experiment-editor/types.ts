import type { RichMediaEmbed } from "@bs-lab/ui";

import type { EducationPhase } from "@/types/subject";
import type { SubjectDiscipline } from "@/types/subject";

export type PhaseKey = EducationPhase;

export type ExperimentMaterialDraft = {
  id: string;
  /** 来自材料库主档的弱引用 id，保存实验时同步到关联表 */
  libraryMaterialId?: string;
  /** 对齐实验列表材料字段：实验室材料名称 */
  nameLab: string;
  /** 材料数量（展示用） */
  quantity?: string;
  /** 材料类型（展示用） */
  materialType?: string;
  /** 对齐实验列表材料字段：家庭替代材料 */
  nameHomeSubstitute: string;
  /** 对齐实验列表材料字段：危险属性 */
  hazardFlags: string[];
  /** 安全提醒（展示用） */
  safetyReminder?: string;
  /** 对齐实验列表材料字段：材料备注 */
  notes: string;
  /** 材料图片（可选） */
  imageUrl?: string;
  /** 缩略图（可选） */
  thumbnailUrl?: string;
};

export type ExperimentStepDraft = {
  id: string;
  title: string;
  content: string;
  /** 步骤正文富媒体（与 RichMediaEditor 对齐） */
  contentEmbeds: RichMediaEmbed[];
  expectedResult: string;
};

/** 实验结果条目（结构与步骤正文一致，无「预期现象」字段） */
export type ExperimentResultEntryDraft = {
  id: string;
  title: string;
  content: string;
  contentEmbeds: RichMediaEmbed[];
};

/** 实验参考：借鉴或引用的其他实验条目（类参考文献） */
export type ExperimentReferenceCitationDraft = {
  id: string;
  /** 被引用或借鉴的实验/活动名称 */
  citedExperimentTitle: string;
  /** 出处、链接或文献信息 */
  sourceOrLink?: string;
  /** 与本实验的关联说明（富文本 HTML，使用 RichHtmlEditor） */
  note?: string;
};

/** 中国科学家故事（扩展模块）：一条记录对应 exp_scientist 一行 */
export type ExperimentScientistStoryDraft = {
  id: string;
  scientistName: string;
  storyName: string;
  /** 故事内容（富文本 HTML，使用 RichHtmlEditor） */
  storyComments: string;
};

/**
 * 与“原子化拆分”目标一致：将页面里已有的 step/material 草稿类型
 * 作为本 feature 的真源类型导出，供 hooks/components 复用。
 */
export type Step = ExperimentStepDraft;

/**
 * 画布工具类型（当前页面未实现真实画布；先作为扩展点保留类型层）。
 * 仅用于类型约束，不引入任何运行时行为。
 */
export type Tool = "select" | "pan" | "zoom";

/**
 * 画布状态类型（当前页面未实现真实画布；先作为扩展点保留类型层）。
 * 仅用于类型约束，不引入任何运行时行为。
 */
export type CanvasState = {
  tool: Tool;
  zoom: number;
};

/** 课标列表 DataTable 行（实验编辑器） */
export type CurriculumEditorTableRow = {
  id: string;
  title: string;
  phaseLabel: string;
  disciplineLabel: string;
  phase: EducationPhase | null;
  discipline: SubjectDiscipline | null;
  gradeCodes: string[];
  recommendedGrades: string;
  mandatory: "mandatory" | "optional";
  curriculumRefText: string;
};

