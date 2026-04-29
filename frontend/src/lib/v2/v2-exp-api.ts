/**
 * V2 实验业务 API 薄封装
 * 仅保留：类型声明 + 路径常量 + 对 apiService 的调用
 *
 * 常见错误码预留：
 * - 4001 内容过长
 * - 4002 实验名称不能为空
 */
import { createV2ApiService, type V2ApiListPage } from "@/lib/v2/apiService";
import type { CoreApiActor } from "@/lib/core-api-shared";

export type V2ChooseType = "y" | "n";
export type V2ExpChooseType = V2ChooseType;
export type V2ExpLibraryQuery = V2ExpLibraryListQuery;
export type V2ExpFileType = V2DictItem;
export type V2ExpOrgType = V2DictItem;
export type V2ExpPrefTitle = V2DictItem;
export function fetchV2Difficulties(actor: CoreApiActor): Promise<V2DictItem[]> { return fetchV2DifficultyTypes(actor); }
export function fetchV2FileTypes(actor: CoreApiActor): Promise<V2DictItem[]> { return fetchV2MaterialTypes(actor); }
export function fetchV2OrgTypes(actor: CoreApiActor): Promise<V2DictItem[]> { return fetchV2SchoolLevels(actor); }
export function fetchV2PrefTitles(actor: CoreApiActor): Promise<V2DictItem[]> { return fetchV2QuestionCapacities(actor); }
export function fetchV2Roles(actor: CoreApiActor): Promise<V2DictItem[]> { return fetchV2QuestionTypes(actor); }
export type V2ExpStatus = "t" | "y" | "n";
export type V2ExpTaskType = "hw" | "tk" | "self";
export type V2ExpCreateUserType = "Teacher" | "Student";

export type PublishCourseTaskInput = {
  draftId: string;
  targetClassId: string;
  deadline?: string | null;
  requirement?: string | null;
};

export type V2DictItem = { id: string; name: string; sortOrder?: number | null; comments?: string | null; status?: string | null };
export type V2DictGradeItem = { id: string; name: string; levelId?: string | null; sortOrder?: number | null; comments?: string | null };

export interface V2ExpLibraryGradeRow {
  seqId: string;
  libExpId: string;
  gradeId: string;
  sortOrder?: number | null;
}

export interface V2ExpLibraryItem {
  libExpId: string;
  libExpName: string;
  chooseType: V2ExpChooseType | null;
  subjectId: string | null;
  schoolLevelId: string | null;
  comments: string | null;
  status: V2ExpStatus | null;
  createUserId: string | null;
  displayOwnerName?: string | null;
  createTime: string | null;
  updateTime: string | null;
  isDeleted: 0 | 1;
  grades?: V2ExpLibraryGradeRow[];
}

export type V2ExpLibraryListPage = V2ApiListPage<V2ExpLibraryItem>;

export type V2ExpLibraryListQuery = {
  keyword?: string;
  subjectId?: string;
  subjectIds?: string[];
  schoolLevelId?: string;
  schoolLevelIds?: string[];
  gradeId?: string;
  gradeIds?: string[];
  chooseType?: V2ExpChooseType;
  status?: V2ExpStatus;
  page?: number;
  pageSize?: number;
};

export type V2ExpMsgVideoRow = {
  seqId: string;
  videoUrl: string | null;
  expId: string;
  sortOrder: number | null;
  fileId: string | null;
};

export type V2ExpMsgPicRow = {
  seqId: string;
  picUrl: string | null;
  expId: string;
  sortOrder: number | null;
  fileId: string | null;
};

export type V2ExpMsgMaterialRow = {
  expMaterialId: string;
  expId: string;
  materialId?: string | null;
  materialName: string | null;
  isSelf?: "y" | "n";
  mainPicUrl: string | null;
  comments: string | null;
  sortOrder: number | null;
};

export type V2ExpMsgStepRow = {
  stepId: string;
  expId: string;
  stepName: string | null;
  stepComments: string | null;
  sortOrder: number | null;
};

export type V2ExpMsgResultRow = {
  resultId: string;
  expId: string;
  resultName: string | null;
  resultComments: string | null;
  sortOrder: number | null;
};

export type V2ExpMsgReferenceRow = {
  seqId: string;
  expId: string;
  referenceName: string | null;
  referenceSource: string | null;
  referenceComments: string | null;
  sortOrder: number | null;
};

export type V2ExpMsgScientistRow = {
  seqId: string;
  expId: string;
  scientistName: string | null;
  storyName: string | null;
  storyComments: string | null;
  sortOrder: number | null;
};

/** 列表项可选携带的发布/任务摘要（后端扩展字段）。 */
export type V2ExpMsgTaskInfo = {
  status?: string | null;
  targetClassId?: string | null;
  targetClassName?: string | null;
  publishedAt?: string | null;
  deadline?: string | null;
};

export interface V2ExpMsgItem {
  expId: string;
  expName: string;
  chooseType: V2ExpChooseType | null;
  subjectId: string | null;
  schoolLevelId: string | null;
  gradeId: string | null;
  difficultyId: string | null;
  expPrinciple: string | null;
  expCaution: string | null;
  expDanger: string | null;
  classHour: number | null;
  createUserType: V2ExpCreateUserType | null;
  createUserId: string | null;
  displayOwnerName?: string | null;
  createTime: string | null;
  confirmUserId: string | null;
  confirmTime: string | null;
  confirmComments: string | null;
  rejectReason: string | null;
  status: V2ExpStatus | null;
  standardExpId: string | null;
  linkExpId: string | null;
  expTaskType: V2ExpTaskType | null;
  likeNum: number;
  notlikeNum: number;
  collectionNum: number;
  evaluateNum: number;
  coursebookId: string | null;
  unitId: string | null;
  simulatorUrl: string | null;
  coverVideoUrl: string | null;
  updateUserId: string | null;
  updateTime: string | null;
  isDeleted?: 0 | 1;
  taskInfo?: V2ExpMsgTaskInfo | null;
}

export type V2ExpMsgDetail = V2ExpMsgItem & {
  displayOwnerName?: string | null;
  videos: V2ExpMsgVideoRow[];
  pics: V2ExpMsgPicRow[];
  materials: V2ExpMsgMaterialRow[];
  steps: V2ExpMsgStepRow[];
  results: V2ExpMsgResultRow[];
  references: V2ExpMsgReferenceRow[];
  scientists: V2ExpMsgScientistRow[];
};

export type V2ExpMsgListPage = V2ApiListPage<V2ExpMsgItem>;

export type V2ExpMsgQuery = {
  keyword?: string;
  subjectId?: string;
  subjectIds?: string[];
  schoolLevelId?: string;
  schoolLevelIds?: string[];
  gradeId?: string;
  gradeIds?: string[];
  difficultyId?: string;
  status?: V2ExpStatus;
  createUserId?: string;
  expTaskType?: V2ExpTaskType;
  page?: number;
  pageSize?: number;
};

export type CreateV2ExpLibraryInput = {
  libExpId?: string;
  libExpName: string;
  chooseType?: V2ExpChooseType;
  subjectId?: string;
  schoolLevelId?: string;
  comments?: string;
  status?: V2ExpStatus;
  gradeIds?: string[];
};

export type PatchV2ExpLibraryInput = {
  libExpName?: string;
  chooseType?: V2ExpChooseType | null;
  subjectId?: string | null;
  schoolLevelId?: string | null;
  comments?: string | null;
  status?: V2ExpStatus;
  gradeIds?: string[];
};

export type CreateV2ExpInput = {
  expName: string;
  subjectId?: string;
  schoolLevelId?: string;
  gradeId?: string;
  standardExpId?: string;
};

export type PatchV2ExpMsgReviewBody = {
  status: "y" | "n";
  confirm_comments?: string | null;
  reject_reason?: string | null;
};

export type V2ExpDraftMaterialRowPut = {
  material_id: string | null;
  material_name: string | null;
  is_self: "y" | "n";
  material_num: number | null;
  material_unit: string | null;
  material_prop_id: string | null;
  material_type_id: string | null;
  main_pic_url: string | null;
  exp_purpose: string | null;
  additional_comments: string | null;
  comments: string | null;
  sort_order: number | null;
};

export type V2ExpDraftStepRowPut = {
  step_name: string | null;
  step_comments: string | null;
  sort_order: number | null;
};

export type V2ExpDraftResultRowPut = {
  result_name: string | null;
  result_comments: string | null;
  sort_order: number | null;
};

export type V2ExpDraftReferenceRowPut = {
  reference_name: string | null;
  reference_source: string | null;
  reference_comments: string | null;
  sort_order: number | null;
};

export type V2ExpDraftScientistRowPut = {
  scientist_name: string | null;
  story_name: string | null;
  story_comments: string | null;
  sort_order: number | null;
};

export type V2ExpDraftVideoRowPut = {
  video_url: string | null;
  sort_order: number | null;
  file_id: string | null;
};

/** 对齐 exp_msg + 子表（snake_case），用于 /v2/exp/:id/draft PUT body */
export type V2ExpDraftPutBody = {
  exp_name: string;
  choose_type: "y" | "n" | null;
  subject_id: string | null;
  school_level_id: string | null;
  grade_id: string | null;
  difficulty_id: string | null;
  coursebook_id: string | null;
  unit_id: string | null;
  exp_principle: string | null;
  exp_caution: string | null;
  exp_danger: string | null;
  class_hour: number | null;
  simulator_url: string | null;
  materials: V2ExpDraftMaterialRowPut[];
  steps: V2ExpDraftStepRowPut[];
  results: V2ExpDraftResultRowPut[];
  references: V2ExpDraftReferenceRowPut[];
  scientists: V2ExpDraftScientistRowPut[];
  videos: V2ExpDraftVideoRowPut[];
};

export type PutV2ExpDraftBody = V2ExpDraftPutBody;

const EXP_LIBRARY_PATH = "/v2/exp-library";
const EXP_PATH = "/v2/exp";

function normalizeQuery(query: Record<string, unknown>): Record<string, string | number | boolean | null | undefined> {
  const out: Record<string, string | number | boolean | null | undefined> = {};
  for (const [key, value] of Object.entries(query)) {
    if (Array.isArray(value)) continue;
    out[key] = value as string | number | boolean | null | undefined;
  }
  return out;
}

export function fetchV2ExpLibraryList(actor: CoreApiActor, query: V2ExpLibraryListQuery = {}): Promise<V2ExpLibraryListPage> {
  return createV2ApiService(actor).get<V2ExpLibraryListPage>(EXP_LIBRARY_PATH, normalizeQuery(query));
}

export async function fetchV2ExpLibraryAll(
  actor: CoreApiActor,
  baseQuery: Omit<V2ExpLibraryListQuery, "page" | "pageSize"> = {},
): Promise<V2ExpLibraryItem[]> {
  const pageSize = 100;
  let page = 1;
  const out: V2ExpLibraryItem[] = [];
  const api = createV2ApiService(actor);
  while (true) {
    const pageData = await api.get<V2ExpLibraryListPage>(EXP_LIBRARY_PATH, normalizeQuery({ ...baseQuery, page, pageSize }));
    out.push(...pageData.items);
    if (pageData.items.length < pageSize || out.length >= pageData.total) break;
    page += 1;
  }
  return out;
}

export function fetchV2ExpLibraryById(actor: CoreApiActor, libExpId: string): Promise<V2ExpLibraryItem> {
  return createV2ApiService(actor).get<V2ExpLibraryItem>(`${EXP_LIBRARY_PATH}/${encodeURIComponent(libExpId)}`);
}

export function patchV2ExpLibrary(actor: CoreApiActor, libExpId: string, body: PatchV2ExpLibraryInput): Promise<V2ExpLibraryItem> {
  return createV2ApiService(actor).patch<V2ExpLibraryItem>(`${EXP_LIBRARY_PATH}/${encodeURIComponent(libExpId)}`, body);
}

export function createV2ExpLibrary(actor: CoreApiActor, input: CreateV2ExpLibraryInput): Promise<V2ExpLibraryItem> {
  return createV2ApiService(actor).post<V2ExpLibraryItem>(EXP_LIBRARY_PATH, input);
}

export function fetchV2ExpList(actor: CoreApiActor, query: V2ExpMsgQuery = {}): Promise<V2ExpMsgListPage> {
  return createV2ApiService(actor).get<V2ExpMsgListPage>(EXP_PATH, normalizeQuery(query));
}

export function fetchV2ExpDetail(actor: CoreApiActor, expId: string): Promise<V2ExpMsgDetail> {
  return createV2ApiService(actor).get<V2ExpMsgDetail>(`${EXP_PATH}/${encodeURIComponent(expId)}`);
}

export function fetchV2SchoolSubjects(actor: CoreApiActor): Promise<V2DictItem[]> {
  return createV2ApiService(actor).get<V2DictItem[]>("/v2/dict/school-subjects");
}

export function fetchV2SchoolLevels(actor: CoreApiActor): Promise<V2DictItem[]> {
  return createV2ApiService(actor).get<V2DictItem[]>("/v2/dict/school-levels");
}

export function fetchV2SchoolGrades(actor: CoreApiActor): Promise<V2DictGradeItem[]> {
  return createV2ApiService(actor).get<V2DictGradeItem[]>("/v2/dict/school-grades");
}

export function fetchV2DifficultyTypes(actor: CoreApiActor): Promise<V2DictItem[]> {
  return createV2ApiService(actor).get<V2DictItem[]>("/v2/dict/difficulty-types");
}

export function fetchV2QuestionTypes(actor: CoreApiActor): Promise<V2DictItem[]> {
  return createV2ApiService(actor).get<V2DictItem[]>("/v2/dict/question-types");
}

export function fetchV2QuestionCapacities(actor: CoreApiActor): Promise<V2DictItem[]> {
  return createV2ApiService(actor).get<V2DictItem[]>("/v2/dict/question-capacities");
}

export function fetchV2MaterialTypes(actor: CoreApiActor): Promise<V2DictItem[]> {
  return createV2ApiService(actor).get<V2DictItem[]>('/v2/dict/material-types');
}

export function fetchV2MaterialProps(actor: CoreApiActor): Promise<V2DictItem[]> {
  return createV2ApiService(actor).get<V2DictItem[]>('/v2/dict/material-props');
}

export function fetchV2MaterialUnits(actor: CoreApiActor): Promise<V2DictItem[]> {
  return createV2ApiService(actor).get<V2DictItem[]>('/v2/dict/material-units');
}

export function fetchV2MaterialSecurities(actor: CoreApiActor): Promise<V2DictItem[]> {
  return createV2ApiService(actor).get<V2DictItem[]>('/v2/dict/material-securities');
}

export function patchV2ExpMsgReview(actor: CoreApiActor, expId: string, body: PatchV2ExpMsgReviewBody): Promise<V2ExpMsgItem> {
  return createV2ApiService(actor).patch<V2ExpMsgItem>(`${EXP_PATH}/${encodeURIComponent(expId)}`, body);
}

export function createV2Exp(actor: CoreApiActor, input: CreateV2ExpInput): Promise<V2ExpMsgItem> {
  return createV2ApiService(actor).post<V2ExpMsgItem>(EXP_PATH, { ...input, createUserType: "Teacher" });
}

export function putV2ExpDraft(actor: CoreApiActor, expId: string, body: PutV2ExpDraftBody): Promise<V2ExpMsgItem> {
  return createV2ApiService(actor).put<V2ExpMsgItem>(`${EXP_PATH}/${encodeURIComponent(expId)}/draft`, body);
}

export function deleteV2Exp(actor: CoreApiActor, expId: string): Promise<{ expId: string } | null> {
  return createV2ApiService(actor).delete<{ expId: string } | null>(`${EXP_PATH}/${encodeURIComponent(expId)}`);
}

export function publishCourseTask(actor: CoreApiActor, body: PublishCourseTaskInput): Promise<{ draftId: string; targetClassId: string; status: string }> {
  return createV2ApiService(actor).post<{ draftId: string; targetClassId: string; status: string }>(
    `${EXP_PATH}/publish-course-task`,
    body,
  );
}

/** 实验统计（按学科/年级分组计数），用于学科树节点上的统计数字 */
export type ExpStats = {
  total: number;
  bySubject: Record<string, number>;
  byGradeSubject: Record<string, number>;
};

export function fetchV2ExpStats(actor: CoreApiActor): Promise<ExpStats> {
  return createV2ApiService(actor).get<ExpStats>(`${EXP_PATH}/stats`);
}
