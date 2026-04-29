/**
 * V2 学生成长足迹类型定义
 * 对应 GET /v2/student/footprints 返回值
 */

export type FootprintStatus = "completed" | "pending_review" | "in_progress";

export interface StudentFootprintItem {
  seqId: string;
  expId: string;
  expName: string;
  teacherName: string;
  submitDate: string | null;
  markResult: string | null;
  markComments: string | null;
  status: FootprintStatus;
}
