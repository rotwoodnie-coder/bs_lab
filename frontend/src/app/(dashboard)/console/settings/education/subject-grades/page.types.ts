import type { TreeItem } from "@bs-lab/ui";

/**
 * 与 `database/migrations/bs_exp_data.sql`（及已合并编号迁移）中 `data_school_*` 一致；
 * 前端命名 = 库列 camelCase。`levelSubjects` / `levelGrades` / `gradeSubjectMatrix` 为
 * `data_school_grade_subject` 与年级学段解析的聚合，无表时为空（见控制台页快照补全逻辑）。
 */

/** `data_school_level` */
export type DataSchoolLevel = {
  levelId: string;
  levelName: string;
  comments: string | null;
  /** 列 `status`：y / n */
  status: string;
  sortOrder: number;
  /** 库表无；旧数据迁移或扩展时可存在 */
  iconPath?: string | null;
};

/** `data_school_subject`（业务主键即 `subject_id`，无单独 code 列） */
export type DataSchoolSubject = {
  subjectId: string;
  subjectName: string;
  comments: string | null;
  status: string;
  sortOrder: number;
  iconPath?: string | null;
};

/** `data_school_grade` */
export type DataSchoolGrade = {
  gradeId: string;
  gradeName: string;
  schoolLevelId: string | null;
  comments: string | null;
  status: string;
  sortOrder: number;
};

/**
 * 聚合：某 `level_id` 下某 `subject_id` 是否在矩阵中启用（由 `data_school_grade_subject` 多行折叠）。
 * `linkKey` = `` `${levelId}:${subjectId}` ``，用于本地乐观更新与 URL 段，非库主键。
 */
export type LevelSubjectSummary = {
  linkKey: string;
  levelId: string;
  subjectId: string;
  sortOrder: number;
  /** 折叠后的行级启用（0/1），与库单列 y/n 不同语义 */
  lineActive: 0 | 1;
};

/** 聚合：某 `level_id` 下某 `grade_id` */
export type LevelGradeSummary = {
  linkKey: string;
  levelId: string;
  gradeId: string;
  sortOrder: number;
  lineActive: 0 | 1;
};

/** `data_school_grade_subject` 一行 + 解析出的 `level_id`（来自年级学段） */
export type GradeSubjectMatrixRow = {
  seqId: string;
  levelId: string;
  subjectId: string;
  gradeId: string;
  sortOrder: number;
  lineActive: 0 | 1;
};

export type SchoolDimensionSnapshot = {
  levels: DataSchoolLevel[];
  subjects: DataSchoolSubject[];
  grades: DataSchoolGrade[];
  levelSubjects: LevelSubjectSummary[];
  levelGrades: LevelGradeSummary[];
  gradeSubjectMatrix: GradeSubjectMatrixRow[];
};

/** 树节点：`data_school_level` 为根，下挂年级 / 学科 */
export type SchoolLevelTreeNodeData = {
  nodeType: "level" | "grade" | "subject";
  levelId: string;
  gradeId?: string;
  subjectId?: string;
  subjectIconPath?: string;
  /** 后台 `data_school_level.icon_path`；无则前端按学段名使用默认图标 */
  levelIconPath?: string | null;
  /** 与 `LevelSubjectSummary.linkKey` 一致时使用 */
  relationId?: string;
  sortOrder: number;
};

export type SchoolLevelTreeNode = TreeItem<SchoolLevelTreeNodeData>;

/**
 * 学段树与右侧列表联动：点击学段根为 `null`（学段由 `onSelectLevel` 同步）；
 * 仅年级：`{ levelId, gradeId }`；学科（及可选年级）：带 `subjectId`。
 */
export type EduStageTreeListContext = null | {
  levelId: string;
  gradeId?: string;
  subjectId?: string;
};

export type SubjectCardRow = {
  linkKey: string;
  levelId: string;
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  subjectIconPath: string;
  sortOrder: number;
  lineActive: 0 | 1;
};

export type GradeDrawerModel = {
  levelId: string;
  levelName: string;
  subjectId: string;
  subjectName: string;
  selectedGradeIds: string[];
};

export function ynToLineActive(status: string | null | undefined): 0 | 1 {
  return status != null && String(status).trim().toLowerCase() === "n" ? 0 : 1;
}

export function lineActiveToYn(v: 0 | 1): "y" | "n" {
  return v === 1 ? "y" : "n";
}

/** 年级矩阵 / 抽屉等 UI：`id` 对应 `grade_id` */
export type EduGrade = { id: string; name: string; code: string; status: 0 | 1 };
