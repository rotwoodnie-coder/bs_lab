/**
 * 教学维度控制台：前端调用的 API 与主库 V2 表契约。
 *
 * 表结构权威：`database/migrations/bs_exp_data.sql`（`database/baseline/README.md` 当前生效行）
 * （`data_school_level`、`data_school_grade`、`data_school_subject`、`data_school_grade_subject`）。
 *
 * 实现位置：`frontend/src/app/api/edu/*`（Next Route Handler，`DATABASE_URL` 主库）。
 */

export const EDU_DIMENSION_API_PREFIX = "/api/edu";

/**
 * 生成教学维度 API 的完整请求 URL。
 * - 默认：同源相对路径 `/api/edu/...`（本地 Next 与 BFF 同端口时推荐）。
 * - 若经独立网关暴露 BFF，可设置 `NEXT_PUBLIC_EDU_DIMENSION_API_ORIGIN`（如 `https://console.example.com`，无尾斜杠）。
 */
export function eduDimensionFetchUrl(path: string): string {
  const origin = (process.env.NEXT_PUBLIC_EDU_DIMENSION_API_ORIGIN ?? "").trim().replace(/\/+$/, "");
  const sub = path.startsWith("/") ? path : `/${path}`;
  const relative = `${EDU_DIMENSION_API_PREFIX}${sub}`;
  return origin ? `${origin}${relative}` : relative;
}

/** 与 0024 表设计对照，用于自检 / Code Review（非运行时逻辑） */
export type EduDimensionV2RouteContract = {
  method: string;
  pathPattern: string;
  tablesRead: readonly string[];
  tablesWrite: readonly string[];
  notes?: string;
};

export const EDU_DIMENSION_V2_ROUTE_REGISTRY: readonly EduDimensionV2RouteContract[] = [
  {
    method: "GET",
    pathPattern: "/dimensions",
    tablesRead: ["data_school_level", "data_school_grade", "data_school_subject", "data_school_grade_subject"],
    tablesWrite: [],
    notes: "聚合为 SchoolDimensionSnapshot；学段键来自年级 school_level_id 及快照推导",
  },
  {
    method: "PATCH",
    pathPattern: "/stages/sort",
    tablesRead: [],
    tablesWrite: ["data_school_level.sort_order"],
    notes: "body.levelIdsInOrder（兼容 stageIdsInOrder）→ data_school_level.level_id",
  },
  {
    method: "PATCH",
    pathPattern: "/stage-subjects/sort",
    tablesRead: [],
    tablesWrite: ["data_school_subject.sort_order"],
    notes: "relationIdsInOrder 为 levelId:subjectId（linkKey）；写全局学科序",
  },
  {
    method: "POST",
    pathPattern: "/stage-subjects",
    tablesRead: ["data_school_grade"],
    tablesWrite: ["data_school_grade_subject"],
    notes: "body.levelId（兼容 stageId）+ subjectId；按学段下年级批量插入年级-学科行",
  },
  {
    method: "PATCH",
    pathPattern: "/stage-subjects/{relationId}/status",
    tablesRead: ["data_school_grade"],
    tablesWrite: ["data_school_grade_subject"],
    notes: "relationId = stageId:subjectId",
  },
  {
    method: "PUT",
    pathPattern: "/stage-subject-grades/{subjectId}",
    tablesRead: ["data_school_grade"],
    tablesWrite: ["data_school_grade_subject"],
    notes: "body.levelId（兼容 stageId）+ gradeIds 维护矩阵行",
  },
  {
    method: "POST",
    pathPattern: "/grades",
    tablesRead: ["data_school_grade"],
    tablesWrite: ["data_school_grade"],
    notes: "grade_id=code，school_level_id/comments 可空",
  },
  {
    method: "PATCH",
    pathPattern: "/grades/{gradeId}",
    tablesRead: [],
    tablesWrite: ["data_school_grade", "data_school_grade_subject"],
    notes: "改 grade_id 时同步 grade_subject 外键",
  },
  {
    method: "DELETE",
    pathPattern: "/grades/{gradeId}",
    tablesRead: [],
    tablesWrite: ["data_school_grade_subject", "data_school_grade"],
    notes: "先删关联再删年级",
  },
  {
    method: "POST",
    pathPattern: "/subjects",
    tablesRead: ["data_school_subject"],
    tablesWrite: ["data_school_subject"],
    notes: "subject_id=code",
  },
  {
    method: "PATCH",
    pathPattern: "/stage-grades/sort",
    tablesRead: [],
    tablesWrite: ["data_school_grade.sort_order"],
    notes: "限定 effective 学段下的年级",
  },
  {
    method: "PATCH",
    pathPattern: "/stage-grades/{gradeId}/status",
    tablesRead: ["data_school_grade_subject", "data_school_grade"],
    tablesWrite: ["data_school_grade", "data_school_grade_subject"],
    notes: "启停年级并补全 grade_subject",
  },
  {
    method: "POST",
    pathPattern: "/stage-grades/scheme",
    tablesRead: ["data_school_grade", "data_school_level"],
    tablesWrite: [],
    notes: "学制预览",
  },
  {
    method: "PATCH",
    pathPattern: "/stage-grades/scheme",
    tablesRead: ["data_school_grade"],
    tablesWrite: ["data_school_grade.school_level_id", "data_school_grade.status", "data_school_grade.sort_order"],
    notes: "应用学制方案",
  },
] as const;
