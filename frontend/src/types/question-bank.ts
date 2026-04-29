/** 题库条目自动来源（课标 / 教师实验内容 / 教研员实验库） */
export type QuestionBankSource = "curriculum" | "teacher_experiment" | "researcher_library";

/** 题库条目流转状态（：候选 / 入库 / 驳回） */
export type QuestionBankReviewStatus = "pending" | "approved" | "rejected";

export type QuestionBankChoice = {
  id: string;
  label: string;
};

/** 单道客观题（用） */
export type QuestionBankItem = {
  id: string;
  /** 题干（实验指示 / 知识要点） */
  stem: string;
  choices: QuestionBankChoice[];
  /** choices 中下标 */
  correctIndex: number;
  source: QuestionBankSource;
  /** 人类可读来源说明 */
  sourceDetail: string;
  /** 用于与学生年级、教学计划匹配，如「七年级」「3~4年级」 */
  gradeLabels: string[];
  subjectLabel: string;
  /** 课标溯源 id（与课标管理/标准题库联动） */
  standardId?: string;
  /** 课标溯源标题（用于展示） */
  standardTitle?: string;
  /** 关联教学计划周次或单元（） */
  planWeek?: string;
  reviewStatus: QuestionBankReviewStatus;
  /** 教师驳回时可写原因（） */
  rejectReason?: string;
};

export type QuestionBankApprovalMap = Record<string, Exclude<QuestionBankReviewStatus, "pending">>;
