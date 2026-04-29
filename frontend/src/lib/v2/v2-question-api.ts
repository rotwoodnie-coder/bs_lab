/**
 * V2 题库 API 薄封装
 * 仅保留：类型声明 + 路径常量 + 对 apiService 的调用
 */
import { createV2ApiService, type V2ApiListPage } from "@/lib/v2/apiService";
import type { CoreApiActor } from "@/lib/core-api-shared";

export interface V2QuestionSelectItem {
  selectId: string;
  questionId: string;
  selectContent: string;
  sortOrder: number | null;
  isRight: "y" | "n";
}

export interface V2QuestionItem {
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
  chooseType: string | null;
  status: "y" | "n" | "t" | null;
  rejectReason: string | null;
  displayOwnerName?: string | null;
  createUserId: string | null;
  createTime: string | null;
  updateUserId: string | null;
  updateTime: string | null;
  isDeleted: 0 | 1;
  selects?: V2QuestionSelectItem[];
}

export type V2QuestionDetail = V2QuestionItem & {
  displayOwnerName: string | null;
  selects: V2QuestionSelectItem[];
};

export type V2QuestionListPage = V2ApiListPage<V2QuestionItem>;

export type V2QuestionQuery = {
  keyword?: string;
  teacherUserId?: string;
  classId?: string;
  difficultyTypeId?: string;
  questionTypeId?: string;
  unitId?: string;
  status?: "y" | "n" | "t";
  page?: number;
  pageSize?: number;
};

export type CreateQuestionInput = {
  questionId?: string;
  questionContent: string;
  teacherUserId?: string;
  classId?: string;
  difficultyTypeId?: string;
  questionTypeId?: string;
  questionCapacityId?: string;
  unitId?: string;
  knowledgeId?: string;
  knowledgeContent?: string;
  chooseType?: string;
  selects?: Array<{ selectContent: string; sortOrder?: number; isRight: "y" | "n" }>;
};

export type UpdateQuestionInput = {
  questionContent?: string;
  teacherUserId?: string | null;
  classId?: string | null;
  difficultyTypeId?: string | null;
  questionTypeId?: string | null;
  questionCapacityId?: string | null;
  unitId?: string | null;
  knowledgeId?: string | null;
  knowledgeContent?: string | null;
  chooseType?: string | null;
  updaterId: string;
  selects?: Array<{
    selectId?: string;
    selectContent: string;
    sortOrder?: number;
    isRight: "y" | "n";
  }>;
};

const QUESTION_PATH = "/v2/question";

export function fetchV2QuestionList(actor: CoreApiActor, query: V2QuestionQuery = {}): Promise<V2QuestionListPage> {
  return createV2ApiService(actor).get<V2QuestionListPage>(QUESTION_PATH, query);
}

export function fetchV2QuestionById(actor: CoreApiActor, questionId: string): Promise<V2QuestionDetail> {
  return createV2ApiService(actor).get<V2QuestionDetail>(`${QUESTION_PATH}/${encodeURIComponent(questionId)}`);
}

export function createV2Question(actor: CoreApiActor, input: CreateQuestionInput): Promise<V2QuestionItem> {
  return createV2ApiService(actor).post<V2QuestionItem>(QUESTION_PATH, input);
}

export function patchV2Question(actor: CoreApiActor, questionId: string, patch: Omit<UpdateQuestionInput, "updaterId">): Promise<V2QuestionItem> {
  return createV2ApiService(actor).patch<V2QuestionItem>(`${QUESTION_PATH}/${encodeURIComponent(questionId)}`, { ...patch, updaterId: actor.userId });
}

export function deleteV2Question(actor: CoreApiActor, questionId: string): Promise<{ questionId: string; deleted: boolean }> {
  return createV2ApiService(actor).delete<{ questionId: string; deleted: boolean }>(`${QUESTION_PATH}/${encodeURIComponent(questionId)}`, { updaterId: actor.userId });
}

export function updateV2QuestionStatus(
  actor: CoreApiActor,
  questionId: string,
  status: "y" | "n" | "t",
  rejectReason?: string,
): Promise<{ questionId: string; status: string }> {
  return createV2ApiService(actor).patch<{ questionId: string; status: string }>(`${QUESTION_PATH}/${encodeURIComponent(questionId)}/status`, {
    status,
    updaterId: actor.userId,
    ...(rejectReason !== undefined ? { rejectReason } : {}),
  });
}
