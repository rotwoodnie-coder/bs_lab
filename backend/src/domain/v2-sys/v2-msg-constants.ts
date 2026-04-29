/**
 * 消息系统常量定义
 *
 * 消息四分类（与 `data_msg_type` 种子对齐）：
 *   Msg_Sys      — 系统通知/账号变更/权限调整
 *   Msg_Task     — 任务/教研审批/协同流程
 *   Msg_Homework — 作业发布/批改/提交提醒
 *   Msg_Socialize— 社交/互动/私信
 *
 * 推送范围模式：
 *   ByRole    — 按 role_id（含 Subj_* 学科前缀批量匹配）
 *   ByUserIds — 按指定用户数组
 *   ByOrg     — 按组织树广播
 */

// ─── 消息类型 ──────────────────────────────────────────────
export const MSG_TYPE = {
  SYS: "Msg_Sys",
  TASK: "Msg_Task",
  HOMEWORK: "Msg_Homework",
  SOCIALIZE: "Msg_Socialize",
} as const;

export type MsgType = (typeof MSG_TYPE)[keyof typeof MSG_TYPE];

// ─── 业务子类（biz_type） ─────────────────────────────────
export const BIZ_TYPE = {
  // Msg_Sys 子类
  ACCOUNT_CHANGE: "ACCOUNT_CHANGE",
  ROLE_CHANGE: "ROLE_CHANGE",
  PERMISSION_CHANGE: "PERMISSION_CHANGE",
  SYSTEM_ANNOUNCEMENT: "SYSTEM_ANNOUNCEMENT",

  // Msg_Task 子类
  RESEARCH_APPROVE: "RESEARCH_APPROVE",
  TEACHER_TASK_ASSIGN: "TEACHER_TASK_ASSIGN",
  EXPERIMENT_PUBLISH: "EXPERIMENT_PUBLISH",

  // Msg_Homework 子类
  HOMEWORK_PUBLISH: "HOMEWORK_PUBLISH",
  HOMEWORK_SUBMIT: "HOMEWORK_SUBMIT",
  HOMEWORK_GRADE: "HOMEWORK_GRADE",

  // Msg_Socialize 子类
  COMMENT: "COMMENT",
  LIKE: "LIKE",
  DIRECT_MESSAGE: "DIRECT_MESSAGE",
} as const;

export type BizType = (typeof BIZ_TYPE)[keyof typeof BIZ_TYPE];

// ─── 推送范围模式 ──────────────────────────────────────────
export type PushTargetByRole = { mode: "ByRole"; roleId: string };
export type PushTargetByUserIds = { mode: "ByUserIds"; userIds: string[] };
export type PushTargetByOrg = { mode: "ByOrg"; orgId: string };
export type PushTarget = PushTargetByRole | PushTargetByUserIds | PushTargetByOrg;
