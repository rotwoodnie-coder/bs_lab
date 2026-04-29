/** 课标条目发布状态（教研侧编排下一学年 / 当前学年隔离） */
export type CurriculumPublishStatus = "draft" | "published";

/** 教研员维护的「学科」实体 */
export type CurriculumSubject = {
  id: string;
  name: string;
  description: string;
};

/** 对照课标条目（隶属于某一学科） */
export type CurriculumStandardRow = {
  id: string;
  subjectId: string;
  /** 学段（与 CSV「学段」列一致：小学、初中、高中） */
  phase?: string;
  /** 一级主题 */
  level1Theme: string;
  /** 二级主题 */
  level2Theme: string;
  /** 适用年级（自由标签，可与「建议年级」并存） */
  applicableGrades: string[];
  /** 课标要求 */
  requirements: string;
  /** 基本实验活动 */
  basicExperiments: string[];
  /** 活动类型（与 CSV「活动类型」列） */
  activityType?: string;
  /** 必做/选做标记（用于管理页编辑与展示对齐） */
  requiredFlag?: "必做" | "选做";
  /** 建议年级（与 CSV「建议年级」列，如「1~2年级」「七~九年级」） */
  suggestedGradeRange?: string;
  /** 建议课时（标准管理页原位编辑字段） */
  suggestedPeriods?: number;
  /** 生效年份（如 2022 版课纲） */
  effectiveYear?: number;
  /** 发布状态：草稿仅教研可见编排；已发布对教师侧生效（语义） */
  publishStatus?: CurriculumPublishStatus;
  /** 建议核心材料（家庭实验室 / 材料库闭环） */
  suggestedCoreMaterials?: string;
  /** 难度系数（：低 / 中 / 高 或自定义文案） */
  difficultyLevel?: string;
  updatedAt: string;
};

export type CurriculumStandardsStore = {
  subjects: CurriculumSubject[];
  rows: CurriculumStandardRow[];
};
