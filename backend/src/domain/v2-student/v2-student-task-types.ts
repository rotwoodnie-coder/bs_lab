/**
 * V2 学生任务类型定义
 * 对应 GET /v2/student/tasks 返回值
 */

export type StudentTaskStatus = "pending" | "submitted" | "marked";

export interface StudentTaskItem {
  seqId: string;
  workId: string;
  expId: string;
  teacherExpId: string;
  expName: string;
  teacherUserId: string;
  teacherName: string;
  classId: string;
  requireDate: string | null;
  submitDate: string | null;
  markResult: string | null;
  markComments: string | null;
  status: StudentTaskStatus;
}
