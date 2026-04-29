/**
 * V2 家长任务类型定义
 * 对应 GET /v2/parent/tasks 返回值
 * 比 StudentTaskItem 多 studentName / className 字段
 */

export type ParentTaskStatus = "pending" | "submitted" | "marked";

export interface ParentTaskItem {
  seqId: string;
  workId: string;
  expId: string;
  teacherExpId: string;
  expName: string;
  teacherUserId: string;
  teacherName: string;
  studentUserId: string;
  studentName: string;
  classId: string;
  className: string;
  requireDate: string | null;
  submitDate: string | null;
  markResult: string | null;
  markComments: string | null;
  status: ParentTaskStatus;
}
