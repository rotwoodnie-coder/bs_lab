/**
 * 学生「拍同款」作品流水线（Mock），与后续 `works` 契约对齐预留字段名。
 */
export type StudentWorkStatus = "pending_review" | "published" | "rejected";

export type StudentWorkKind = "capture" | "same_style_submission";

export type StudentWorkItem = {
  id: string;
  /** 关联探究实验台账 id（与 mock-experiment-details 等对齐） */
  sourceExperimentId: string;
  sourceExperimentTitle: string;
  /** 展示用标题（可与源实验不同，如二创说明） */
  title: string;
  studentLabel: string;
  status: StudentWorkStatus;
  /** ISO 时间戳 */
  createdAt: string;
  /** ：已上传短视频（无真实文件 URL） */
  hasMockVideo: boolean;
  /** 统一 Mock 仓：亲子过程抓拍 */
  sessionId?: string;
  taskId?: string;
  kind?: StudentWorkKind;
  capturePreviewUrl?: string;

  /** 跨校巡检：学校展示名（Mock） */
  schoolName?: string;

  /** 全区样板（教研标注） */
  isDistrictSample?: boolean;
};
