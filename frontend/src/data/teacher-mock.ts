/**
 * 老师端数据：仅用于前端交互与信息架构验证，后续可替换为真实 API。
 */

export type TeacherMockContext = {
  displayName: string;
  schoolName: string;
  subjectLabel: string;
  /** 当前任教学科编码（） */
  subjectCode: string;
};

export type TeacherMockClass = {
  id: string;
  name: string;
  studentCount: number;
  gradeLabel: string;
};

export type TeacherMockAssignmentStatus = "draft" | "published" | "closed" | "archived";

export type TeacherMockAssignment = {
  id: string;
  /** 与 unified-mock-store / 资源库 id 对齐 */
  experimentId: string;
  title: string;
  experimentTitle: string;
  gradeLabel: string;
  classIds: string[];
  /** 若下发到实验小组，则为小组 id 列表（与 classIds 可并存用于展示血缘） */
  groupIds?: string[];
  /** 任务级 AI 引导风格，与 `UnifiedTaskMock.aiStyle` 对齐 */
  aiStyle?: "gentle" | "rigorous" | "playful";
  dueAt: string;
  status: TeacherMockAssignmentStatus;
  /** 应提交 / 已提交 */
  expectedSubmissions: number;
  submitted: number;
  pendingTeacherReview: number;
};

export type TeacherMockSubmissionStatus =
  | "submitted"
  | "ai_passed"
  | "ai_rejected"
  | "manual_approved"
  | "manual_rejected";

export type TeacherMockSubmission = {
  id: string;
  studentName: string;
  className: string;
  experimentTitle: string;
  submittedAt: string;
  status: TeacherMockSubmissionStatus;
  aiSummary: string;
};

export type TeacherMockDisputeStatus = "open" | "resolved";

export type TeacherMockDispute = {
  id: string;
  workTitle: string;
  studentName: string;
  likes: number;
  dislikes: number;
  views: number;
  favorites: number;
  commentSnippet: string;
  status: TeacherMockDisputeStatus;
};

/** 实验素材文件形态（枚举，后续可对接 MIME / 对象存储） */
export type TeacherMockMaterialKind =
  | "word"
  | "ppt"
  | "pdf"
  | "image"
  | "video"
  | "spreadsheet";

/** 主要使用角色（与平台角色对应，用） */
export type TeacherMockMaterialAudience = "teacher" | "student" | "researcher";

export type TeacherMockMaterial = {
  id: string;
  title: string;
  kind: TeacherMockMaterialKind;
  /** 面向哪些角色分发或引用（） */
  audiences: readonly TeacherMockMaterialAudience[];
  linkedExperimentTitle: string | null;
  updatedAt: string;
};

export const TEACHER_MOCK_CONTEXT: TeacherMockContext = {
  displayName: "王老师",
  schoolName: "市实验小学 · 本部",
  subjectLabel: "小学科学",
  subjectCode: "science",
};

export const TEACHER_MOCK_CLASSES: TeacherMockClass[] = [
  { id: "c1", name: "三年级（3）班", studentCount: 46, gradeLabel: "三年级" },
  { id: "c2", name: "三年级（7）班", studentCount: 44, gradeLabel: "三年级" },
  { id: "c3", name: "四年级（2）班", studentCount: 42, gradeLabel: "四年级" },
];

/** 行政班花名册（ id，与 unified-mock-store 中学生 Mock 对齐）；人数为节选便于勾选 */
export type TeacherMockClassRosterEntry = { userId: string; displayName: string };

export const TEACHER_MOCK_CLASS_ROSTERS: Record<string, TeacherMockClassRosterEntry[]> = {
  c1: [
    { userId: "S20261234", displayName: "学生" },
    { userId: "stu-c1-002", displayName: "李同学" },
    { userId: "stu-c1-003", displayName: "王同学" },
    { userId: "stu-c1-004", displayName: "赵同学" },
    { userId: "stu-c1-005", displayName: "钱同学" },
    { userId: "stu-c1-006", displayName: "孙同学" },
    { userId: "stu-c1-007", displayName: "周同学" },
    { userId: "stu-c1-008", displayName: "吴同学" },
  ],
  c2: [
    { userId: "stu-c2-001", displayName: "郑同学" },
    { userId: "stu-c2-002", displayName: "冯同学" },
    { userId: "stu-c2-003", displayName: "陈同学" },
    { userId: "stu-c2-004", displayName: "褚同学" },
    { userId: "stu-c2-005", displayName: "卫同学" },
    { userId: "stu-c2-006", displayName: "蒋同学" },
  ],
  c3: [
    { userId: "stu-c3-001", displayName: "沈同学" },
    { userId: "stu-c3-002", displayName: "韩同学" },
    { userId: "stu-c3-003", displayName: "杨同学" },
    { userId: "stu-c3-004", displayName: "朱同学" },
    { userId: "stu-c3-005", displayName: "秦同学" },
  ],
};

/** 校管「未分班池」初始种子（进入行政班后写入 adminClassId + orgClassNodeId） */
export const TEACHER_MOCK_UNASSIGNED_POOL: TeacherMockClassRosterEntry[] = [
  { userId: "stu-pool-001", displayName: "池同学甲" },
  { userId: "stu-pool-002", displayName: "池同学乙" },
  { userId: "stu-pool-003", displayName: "池同学丙" },
  { userId: "stu-pool-004", displayName: "池同学丁" },
];

export const TEACHER_MOCK_ASSIGNMENTS: TeacherMockAssignment[] = [
  {
    id: "a1",
    experimentId: "lib1",
    title: "Week4 · 伏安法测电阻",
    experimentTitle: "伏安法与电表内阻对结果的影响",
    gradeLabel: "三年级",
    classIds: ["c1", "c2"],
    dueAt: "2026-04-18T23:59:00",
    status: "published",
    expectedSubmissions: 90,
    submitted: 62,
    pendingTeacherReview: 11,
  },
  {
    id: "a2",
    experimentId: "lib2",
    title: "期中复习 · 抛体运动",
    experimentTitle: "平抛轨迹与初速度测定",
    gradeLabel: "三年级",
    classIds: ["c1"],
    dueAt: "2026-04-14T22:00:00",
    status: "published",
    expectedSubmissions: 46,
    submitted: 41,
    pendingTeacherReview: 3,
  },
  {
    id: "a3",
    experimentId: "lib3",
    title: "草稿 · 单摆与 g",
    experimentTitle: "单摆周期与重力加速度",
    gradeLabel: "四年级",
    classIds: ["c3"],
    dueAt: "2026-04-25T23:59:00",
    status: "draft",
    expectedSubmissions: 0,
    submitted: 0,
    pendingTeacherReview: 0,
  },
];

export const TEACHER_MOCK_SUBMISSIONS: TeacherMockSubmission[] = [
  {
    id: "w1",
    studentName: "李思齐",
    className: "三年级（3）班",
    experimentTitle: "伏安法与电表内阻对结果的影响",
    submittedAt: "2026-04-11T20:12:00",
    status: "ai_passed",
    aiSummary: "步骤完整，读数区间合理；建议补充误差分析一句。",
  },
  {
    id: "w2",
    studentName: "周予安",
    className: "三年级（7）班",
    experimentTitle: "伏安法与电表内阻对结果的影响",
    submittedAt: "2026-04-11T19:40:00",
    status: "submitted",
    aiSummary: "待模型预检（队列）。",
  },
  {
    id: "w3",
    studentName: "陈墨",
    className: "三年级（3）班",
    experimentTitle: "平抛轨迹与初速度测定",
    submittedAt: "2026-04-10T21:05:00",
    status: "ai_rejected",
    aiSummary: "轨迹点过少，拟合不可靠；需补录至少 8 组数据。",
  },
];

export const TEACHER_MOCK_DISPUTES: TeacherMockDispute[] = [
  {
    id: "d1",
    workTitle: "伏安法 · 数据记录与作图",
    studentName: "赵可",
    likes: 28,
    dislikes: 19,
    views: 412,
    favorites: 33,
    commentSnippet: "有人认为读数间隔太密，有人觉得正合适……",
    status: "open",
  },
  {
    id: "d2",
    workTitle: "平抛 · 手机慢动作测时",
    studentName: "孙乐",
    likes: 41,
    dislikes: 6,
    views: 289,
    favorites: 52,
    commentSnippet: "争议较小，系统建议维持展示。",
    status: "resolved",
  },
];

export const TEACHER_MOCK_EXPERIMENT_LIBRARY_SNIPPET = [
  { id: "lib1", title: "观察描述常见物体的特征", gradeLabel: "一年级", subjectLabel: "科学" },
  { id: "lib2", title: "观察常见材料的外部特征", gradeLabel: "二年级", subjectLabel: "科学" },
  { id: "lib3", title: "用尺子测量物体的长度", gradeLabel: "三年级", subjectLabel: "科学" },
] as const;
