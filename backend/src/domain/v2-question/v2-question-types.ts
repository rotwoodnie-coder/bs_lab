export type QuestionChooseType = "S" | "M";

export interface QuestionMsgRecord {
  questionId: string;
  questionContent: string;
  teacherUserId: string | null;
  classId: string | null;
  difficultyTypeId: string | null;
  difficultyTypeName?: string | null;
  questionTypeId: string | null;
  questionTypeName?: string | null;
  questionCapacityId: string | null;
  questionCapacityName?: string | null;
  unitId: string | null;
  knowledgeId: string | null;
  knowledgeContent: string | null;
  chooseType: QuestionChooseType | null;
  status: string | null;
  rejectReason: string | null;
  /** JOIN sys_user.user_name，列表/详情查询时填充 */
  displayOwnerName?: string | null;
  createUserId: string | null;
  createTime: string | null;
  updateUserId: string | null;
  updateTime: string | null;
  isDeleted: 0 | 1;
  selects?: QuestionOptionRecord[];
}

export interface QuestionOptionRecord {
  selectId: string;
  questionId: string;
  selectContent: string;
  sortOrder: number | null;
  isRight: "y" | "n";
}

export interface CreateQuestionInput {
  questionId?: string;
  questionContent: string;
  teacherUserId?: string | null;
  classId?: string | null;
  difficultyTypeId?: string | null;
  questionTypeId?: string | null;
  questionCapacityId?: string | null;
  unitId?: string | null;
  knowledgeId?: string | null;
  knowledgeContent?: string | null;
  chooseType?: QuestionChooseType | null;
  status?: string | null;
  rejectReason?: string | null;
  expId?: string | null;
  /** 选项（推荐使用该字段） */
  options?: Array<{
    selectId?: string;
    selectContent: string;
    sortOrder?: number | null;
    isRight?: "y" | "n";
  }>;
  /** 兼容旧命名：等价于 options */
  selects?: Array<{
    selectId?: string;
    selectContent: string;
    sortOrder?: number | null;
    isRight?: "y" | "n";
  }>;
  /** 兼容仓库层 patch 传入更新人 */
  updaterId?: string;
}

export type SaveQuestionInput = CreateQuestionInput;

export type QuestionListQuery = {
  keyword?: string;
  difficultyTypeId?: string;
  questionTypeId?: string;
  questionCapacityId?: string;
  unitId?: string;
  teacherUserId?: string;
  classId?: string;
  status?: string;
  page?: number;
  pageSize?: number;
};

export type QuestionListPage = {
  items: QuestionMsgRecord[];
  total: number;
  page: number;
  pageSize: number;
};

// ─── 兼容旧命名（仓库层仍在使用 Exp* 前缀）────────────────
export type ExpQuestionRecord = QuestionMsgRecord;
export type ExpQuestionSelectRecord = QuestionOptionRecord;
export type CreateExpQuestionInput = CreateQuestionInput;
export type UpdateExpQuestionInput = Partial<CreateQuestionInput> & { questionId?: string };
export type CreateSelectInput = NonNullable<CreateQuestionInput["options"]>[number];
