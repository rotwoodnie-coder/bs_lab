/**
 * 与 `docs/contracts/api-contract.md` 中 parent-sessions / parent-reports 请求体字段一致。
 * 会话资源标识：后端创建响应为 `id`，与 `parent-reports` 的 `sessionId` 指向同一值；前端统一用 `sessionId` 命名以降低歧义。
 */

/** POST /v1/parent-sessions */
export type ParentSessionCreateBody = {
  parentUserId: string;
  studentUserId: string;
  experimentId: string;
  workId?: string;
};

/** POST /v1/parent-reports */
export type ParentReportCreateBody = {
  sessionId: string;
  summary: string;
  strengths: string[];
  improvements: string[];
  nextRecommendations: string[];
  shareCopy?: string;
  /** 扩展：成就卡 · 教师评语 */
  teacherComment?: string;
};

/** GET /v1/parent-reports?sessionId= 的读模型（与后端 ParentReportRecord 字段名一致） */
export type ParentReportRecord = {
  id: string;
  sessionId: string;
  summary: string;
  strengths: string[];
  improvements: string[];
  nextRecommendations: string[];
  shareCopy?: string;
  createdAt: string;
  /** 扩展：成就卡 · 教师评语 */
  teacherComment?: string;
};

/** POST /v1/works（过程素材归档用） */
export type WorkCreateBody = {
  studentUserId: string;
  experimentId: string;
  videoUrl: string;
  description?: string;
};
