/**
 * 站内消息（用）：与产品思维导图字段对齐。
 * — 发起人、接收人、内容、阅读状态、消息分类（系统 / 任务 / 社交 / 作业）
 */
export type InboxMessageCategory = "system" | "task" | "social" | "homework";

export type InboxMessageParticipant = {
  name: string;
  /** 可选：如「平台」「教研组」 */
  subtitle?: string;
};

export type InboxMessage = {
  id: string;
  sender: InboxMessageParticipant;
  receiver: InboxMessageParticipant;
  /** 列表摘要；完整正文见 content */
  summary: string;
  content: string;
  isRead: boolean;
  category: InboxMessageCategory;
  /** 展示用时间戳 */
  sentAtLabel: string;
};

export const INBOX_CATEGORY_LABEL: Record<InboxMessageCategory, string> = {
  system: "系统消息",
  task: "任务消息",
  social: "社交消息",
  homework: "作业消息",
};
