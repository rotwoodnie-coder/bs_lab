"use client";

import type { InboxMessage, InboxMessageCategory } from "@/types/inbox-message";

let inMemoryMessages: InboxMessage[] = [];

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((fn) => fn());
}

export function subscribeInboxOverlay(listener: () => void) {
  listeners.add(listener);
  return () => void listeners.delete(listener);
}

function readRaw(): InboxMessage[] {
  return [...inMemoryMessages];
}

export function readInboxOverlayMessages(): InboxMessage[] {
  return readRaw();
}

export function appendInboxOverlayMessage(msg: InboxMessage) {
  const next = [msg, ...readRaw()];
  inMemoryMessages = next;
  notify();
}

/** M-R-02：评审意见回流至教师消息（收件人为「教师」） */
export function notifyTeacherExperimentReviewResult(params: {
  experimentTitle: string;
  experimentId: string;
  approved: boolean;
  comment: string;
  score: number;
}) {
  const id = `msg-rv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const summary = params.approved
    ? `「${params.experimentTitle}」已通过区本评审`
    : `「${params.experimentTitle}」需按意见修改`;
  const body = `您好：\n\n${
    params.approved ? "您的实验课程已通过教研评审。" : "您的实验课程需按下列意见修改后再提交。"
  }\n\n综合分：${params.score}\n教研意见：${params.comment || "（无补充）"}\n实验 ID：${params.experimentId}\n\n区教研室（）`;
  const msg: InboxMessage = {
    id,
    sender: { name: "区教研室·评审", subtitle: "教研" },
    receiver: { name: "教师" },
    summary,
    content: body,
    isRead: false,
    category: "task" as InboxMessageCategory,
    sentAtLabel: "刚刚",
  };
  appendInboxOverlayMessage(msg);
}
