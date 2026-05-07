/**
 * V2 实验业务模块类型定义
 * 对应表：exp_library / exp_library_grade / exp_library_video /
 *         exp_msg / exp_grade / exp_video / exp_pic /
 *         exp_material / exp_step / exp_result / exp_security /
 *         exp_reference / exp_scientist / exp_simulation_record
 */

// ─── 枚举 ────────────────────────────────────────────────
/** 必做/选做：y 必做，n 选做 */
export type ExpChooseType = "y" | "n";
/** 草稿/发布/停用 */
export type ExpLibraryStatus = "t" | "y" | "n";
/** 作业类型 */
export type ExpTaskType = "hw" | "tk" | "self";
/** 发布人类型 */
export type ExpCreateUserType = "Teacher" | "Student";

// ─── 标准试验库 exp_library ──────────────────────────────
export interface ExpLibraryRecord {
  libExpId: string;
  libExpName: string;
  chooseType: ExpChooseType | null;
  subjectId: string | null;
  schoolLevelId: string | null;
  comments: string | null;
  status: ExpLibraryStatus | null;
  createUserId: string | null;
  /** JOIN sys_user.user_name，列表/详情查询时填充 */
  displayOwnerName?: string | null;
  createTime: string | null;
  updateUserId: string | null;
  updateTime: string | null;
  isDeleted: 0 | 1;
  /** JOIN 聚合：适用年级列表 */
  grades?: ExpLibraryGradeRecord[];
  /** JOIN 聚合：视频列表 */
  videos?: ExpLibraryVideoRecord[];
}

export interface ExpLibraryGradeRecord {
  seqId: string;
  libExpId: string;
  gradeId: string;
  sortOrder: number | null;
}

export interface ExpLibraryVideoRecord {
  seqId: string;
  expId: string;
  videoUrl: string | null;
  sortOrder: number | null;
  createTime: string | null;
}

export interface CreateExpLibraryInput {
  /** 可选：显式 `lib_exp_id`；缺省由 `libExpName` 自动生成。 */
  libExpId?: string;
  libExpName: string;
  chooseType?: ExpChooseType;
  subjectId?: string;
  schoolLevelId?: string;
  comments?: string;
  status?: ExpLibraryStatus;
  gradeIds?: string[];
}

/** PATCH：仅出现的字段写入库；`gradeIds` 出现则整包替换子表行（含空数组表示清空年级）。 */
export type PatchExpLibraryInput = {
  libExpName?: string;
  chooseType?: ExpChooseType | null;
  subjectId?: string | null;
  schoolLevelId?: string | null;
  comments?: string | null;
  status?: ExpLibraryStatus;
  gradeIds?: string[];
};

export type ExpLibraryListQuery = {
  keyword?: string;
  subjectId?: string;
  /** 多选：IN；与 `subjectId` 并存时以本列表为准 */
  subjectIds?: string[];
  schoolLevelId?: string;
  schoolLevelIds?: string[];
  gradeId?: string;
  gradeIds?: string[];
  chooseType?: ExpChooseType;
  status?: ExpLibraryStatus;
  page?: number;
  pageSize?: number;
};

// ─── 试验实例 exp_msg ────────────────────────────────────
export interface ExpMsgRecord {
  expId: string;
  expName: string;
  chooseType: ExpChooseType | null;
  subjectId: string | null;
  schoolLevelId: string | null;
  gradeId: string | null;
  difficultyId: string | null;
  expPrinciple: string | null;
  expCaution: string | null;
  expDanger: string | null;
  classHour: number | null;
  coursebookId: string | null;
  unitId: string | null;
  createUserType: ExpCreateUserType | null;
  createUserId: string | null;
  /** JOIN sys_user.user_name，列表/详情查询时填充 */
  displayOwnerName?: string | null;
  createTime: string | null;
  confirmUserId: string | null;
  confirmTime: string | null;
  confirmComments: string | null;
  /** 驳回长文；`confirm_comments` 仍为短摘要（≤200） */
  rejectReason: string | null;
  status: ExpLibraryStatus | null;
  standardExpId: string | null;
  linkExpId: string | null;
  expTaskType: ExpTaskType | null;
  likeNum: number;
  notlikeNum: number;
  collectionNum: number;
  evaluateNum: number;
  simulatorUrl: string | null;
  /** 列表聚合：封面图 URL（可由实验首图/视频归一得到） */
  logoUrl: string | null;
  /** 列表聚合：首条 `exp_video.video_url`，便于卡片封面 */
  coverVideoUrl: string | null;
  /** 列表聚合：首条 `exp_pic.pic_url`，实验图片封面（优先于 coverVideoUrl） */
  coverPicUrl: string | null;
  updateUserId: string | null;
  updateTime: string | null;
  isDeleted: 0 | 1;
  /** 可选：课程任务信息（由列表/详情联表聚合得到） */
  taskInfo?: ExperimentTaskInfo | null;
}

export type ExperimentTaskStatus = "draft" | "published" | "closed" | "unknown";

/** `exp_course_task` 聚合到实验卡片上的任务信息 */
export type ExperimentTaskInfo = {
  taskId: string;
  draftId: string;
  targetClassId: string;
  targetClassName: string | null;
  status: ExperimentTaskStatus;
  publishedAt: string | null;
  deadline: string | null;
  requirement: string | null;
};

export interface CreateExpMsgInput {
  /** 可选：显式 `exp_id`；缺省由 `expName` 自动生成。 */
  expId?: string;
  expName: string;
  chooseType?: ExpChooseType;
  subjectId?: string;
  schoolLevelId?: string;
  gradeId?: string;
  difficultyId?: string;
  expPrinciple?: string;
  expCaution?: string;
  expDanger?: string;
  classHour?: number;
  coursebookId?: string;
  unitId?: string;
  createUserType?: ExpCreateUserType;
  standardExpId?: string;
  expTaskType?: ExpTaskType;
  simulatorUrl?: string;
}

/** 教研评审：仅允许 status 由 t → y / n，写入 confirm_* */
export type PatchExpMsgReviewInput = {
  status: "y" | "n";
  /** 审批意见，驳回/通过时写入 `confirm_comments`；status=n 时至少 4 字符 */
  confirm_comments?: string | null;
};

/** `PUT /v2/exp/:id/draft` 子行；key 与对应表列一致（snake_case） */
export type PutExpMsgDraftMaterialInput = {
  material_id?: string | null;
  material_name?: string | null;
  is_self?: "y" | "n";
  material_num?: number | null;
  material_unit?: string | null;
  material_prop_id?: string | null;
  material_type_id?: string | null;
  main_pic_url?: string | null;
  exp_purpose?: string | null;
  additional_comments?: string | null;
  comments?: string | null;
  sort_order?: number | null;
  security_list?: Array<{ security_id: string; security_level?: number | null }>;
};

export type PutExpMsgDraftStepInput = {
  step_name?: string | null;
  step_comments?: string | null;
  sort_order?: number | null;
};

export type PutExpMsgDraftResultInput = {
  result_name?: string | null;
  result_comments?: string | null;
  sort_order?: number | null;
};

export type PutExpMsgDraftReferenceInput = {
  reference_name?: string | null;
  reference_source?: string | null;
  reference_comments?: string | null;
  sort_order?: number | null;
};

export type PutExpMsgDraftScientistInput = {
  scientist_name?: string | null;
  story_name?: string | null;
  story_comments?: string | null;
  sort_order?: number | null;
};

export type PutExpMsgDraftVideoInput = {
  video_url?: string | null;
  sort_order?: number | null;
  file_id?: string | null;
};

/**
 * 教师草稿整包保存：请求体 key 与 `exp_msg` / 子表列一致（snake_case）。
 * 某子表 key 出现（含空数组）时先删后插该子表；未出现则不改子表。
 */
export type PutExpMsgDraftInput = {
  exp_name?: string;
  choose_type?: ExpChooseType | null;
  subject_id?: string | null;
  school_level_id?: string | null;
  grade_id?: string | null;
  difficulty_id?: string | null;
  standard_exp_id?: string | null;
  exp_principle?: string | null;
  exp_caution?: string | null;
  exp_danger?: string | null;
  class_hour?: number | null;
  coursebook_id?: string | null;
  unit_id?: string | null;
  exp_task_type?: ExpTaskType | null;
  simulator_url?: string | null;
  materials?: PutExpMsgDraftMaterialInput[];
  steps?: PutExpMsgDraftStepInput[];
  results?: PutExpMsgDraftResultInput[];
  references?: PutExpMsgDraftReferenceInput[];
  scientists?: PutExpMsgDraftScientistInput[];
  videos?: PutExpMsgDraftVideoInput[];
  security?: PutExpMsgDraftSecurityInput[];
  grades?: PutExpMsgDraftGradeInput[];
  material_pics?: PutExpMsgDraftMaterialPicInput[];
  reference_videos?: PutExpMsgDraftReferenceVideoInput[];
};

export type ExpMsgListQuery = {
  keyword?: string;
  subjectId?: string;
  /** 多选：与 `subjectId` 二选一优先使用本字段 */
  subjectIds?: string[];
  schoolLevelId?: string;
  /** 多选学段（库 `school_level_id`） */
  schoolLevelIds?: string[];
  gradeId?: string;
  /** 多选年级（库 `grade_id`） */
  gradeIds?: string[];
  difficultyId?: string;
  status?: ExpLibraryStatus;
  /** 按创建人类型过滤：Teacher / Student */
  createUserType?: ExpCreateUserType;
  createUserId?: string;
  expTaskType?: ExpTaskType;
  /** 按章节 ID 过滤：仅返回 unit_id 属于该章的实验 */
  chapterId?: string;
  /** 按小节 ID 精确过滤 */
  unitId?: string;
  /** 按教材 ID 过滤：返回该教材下所有已挂载的实验 */
  coursebookId?: string;
  page?: number;
  pageSize?: number;
};

// ─── 试验附件：视频 / 图片 ────────────────────────────────
export interface ExpVideoRecord {
  seqId: string;
  videoUrl: string | null;
  expId: string;
  sortOrder: number | null;
  fileId: string | null;
}

export interface ExpPicRecord {
  seqId: string;
  picUrl: string | null;
  expId: string;
  sortOrder: number | null;
  fileId: string | null;
}

// ─── 试验材料明细 exp_material ───────────────────────────
export interface ExpMaterialRecord {
  expMaterialId: string;
  expId: string;
  materialId: string | null;
  materialName: string | null;
  isSelf: "y" | "n";
  materialNum: number | null;
  materialUnit: string | null;
  materialPropId: string | null;
  materialTypeId: string | null;
  mainPicUrl: string | null;
  expPurpose: string | null;
  additionalComments: string | null;
  comments: string | null;
  sortOrder: number | null;
  createTime: string | null;
  /** 材料级安全标签（来自 exp_material_security） */
  materialSecurityList?: Array<{ securityId: string; securityLevel: number | null }>;
  /** 材料图片（来自 exp_material_pic） */
  pics?: Array<{ seqId: string; expMaterialId: string; materialUrl: string | null; sortOrder: number | null }>;
}

// ─── 试验步骤 / 结果 ──────────────────────────────────────
export interface ExpStepRecord {
  stepId: string;
  expId: string;
  stepName: string | null;
  stepComments: string | null;
  sortOrder: number | null;
}

export interface ExpResultRecord {
  resultId: string;
  expId: string;
  resultName: string | null;
  resultComments: string | null;
  sortOrder: number | null;
}

// ─── 试验引用 ────────────────────────────────────────────
export interface ExpReferenceRecord {
  seqId: string;
  expId: string;
  referenceName: string | null;
  referenceSource: string | null;
  referenceComments: string | null;
  sortOrder: number | null;
}

// ─── 科学家故事 ──────────────────────────────────────────
export interface ExpScientistRecord {
  seqId: string;
  expId: string;
  scientistName: string | null;
  storyName: string | null;
  storyComments: string | null;
  sortOrder: number | null;
}

// ─── 实验安全性 ──────────────────────────────────────────
export interface ExpSecurityRecord {
  seqId: string;
  expId: string;
  securityId: string;
  sortOrder: number | null;
  securityLevel: number | null;
}

export type PutExpMsgDraftSecurityInput = {
  security_id: string;
  security_level?: number | null;
  sort_order?: number | null;
};

export type PutExpMsgDraftGradeInput = {
  grade_id: string;
  sort_order?: number | null;
};

export type PutExpMsgDraftMaterialPicInput = {
  material_url: string | null;
  sort_order?: number | null;
};

export type PutExpMsgDraftReferenceVideoInput = {
  video_url: string | null;
  sort_order?: number | null;
  file_id?: string | null;
};

// ─── 模拟试验记录 ────────────────────────────────────────
export interface ExpSimulationRecord {
  seqId: string;
  expId: string;
  userId: string;
  beginTime: string | null;
  endTime: string | null;
  score: number | null;
}

// ─── 详情聚合 ────────────────────────────────────────────
export interface ExpMsgDetail extends ExpMsgRecord {
  videos: ExpVideoRecord[];
  pics: ExpPicRecord[];
  materials: ExpMaterialRecord[];
  steps: ExpStepRecord[];
  results: ExpResultRecord[];
  references: ExpReferenceRecord[];
  scientists: ExpScientistRecord[];
  /** 实验整体已选安全标签 */
  security: ExpSecurityRecord[];
  /** 从 exp_material_security 聚合的唯一 security_id 列表（供前端勾选候选） */
  materialSecurityIds: string[];
  /** 适用年级（多选）来自 exp_grade 表 */
  gradeIds: string[];
  /** 材料图片关联 */
  materialPics: Array<{ seqId: string; expMaterialId: string; materialUrl: string | null; sortOrder: number | null }>;
  /** 参考引用视频 */
  referenceVideos: Array<{ seqId: string; videoUrl: string | null; expId: string; sortOrder: number | null; fileId: string | null }>;
}
