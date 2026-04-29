"use client";

import * as React from "react";

import {
  appendWorkIdToUnifiedSession,
  createSessionWithTask,
  createUnifiedSession,
  getUnifiedSession,
  listUnifiedSessions,
  subscribeUnifiedMock,
  type SessionCompletionStatus,
  type UnifiedSessionMock,
} from "@/lib/unified-mock-store";
import type { ParentSessionCreateBody, ParentReportCreateBody, ParentReportRecord } from "@/types/parent-contract";

let inMemoryReports: ParentReportRecord[] = [];

const listeners = new Set<() => void>();
function notify() {
  listeners.forEach((fn) => fn());
}

export function subscribeParentSessionsMock(listener: () => void) {
  listeners.add(listener);
  const unsubUnified = subscribeUnifiedMock(listener);
  return () => {
    listeners.delete(listener);
    unsubUnified();
  };
}

export type ParentSessionStored = ParentSessionCreateBody & {
  sessionId: string;
  startedAt: string;
  taskId?: string;
  parentAttestedAt: string | null;
  completionStatus: SessionCompletionStatus;
  errorCount: number;
  materialShortageReported: boolean;
};

function toStored(u: UnifiedSessionMock): ParentSessionStored {
  const workId = u.workIds.length > 0 ? u.workIds[u.workIds.length - 1] : undefined;
  return {
    parentUserId: u.parentUserId,
    studentUserId: u.studentUserId,
    experimentId: u.experimentId,
    workId,
    sessionId: u.sessionId,
    startedAt: u.startedAt,
    taskId: u.taskId,
    parentAttestedAt: u.parent_attested_at,
    completionStatus: u.completion_status,
    errorCount: u.errorCount,
    materialShortageReported: Boolean(u.materialShortageReported),
  };
}

function readReports(): ParentReportRecord[] {
  return [...inMemoryReports];
}

function writeReports(items: ParentReportRecord[]) {
  inMemoryReports = [...items];
  notify();
}

function newReportId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `pr-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createParentSessionMock(body: ParentSessionCreateBody & { taskId?: string }): ParentSessionStored {
  let u: UnifiedSessionMock;
  if (body.taskId) {
    try {
      u = createSessionWithTask({
        taskId: body.taskId,
        studentUserId: body.studentUserId,
        parentUserId: body.parentUserId,
      });
    } catch {
      u = createUnifiedSession({
        parentUserId: body.parentUserId,
        studentUserId: body.studentUserId,
        experimentId: body.experimentId,
        taskId: body.taskId,
      });
    }
  } else {
    u = createUnifiedSession({
      parentUserId: body.parentUserId,
      studentUserId: body.studentUserId,
      experimentId: body.experimentId,
      taskId: body.taskId,
    });
  }
  return toStored(u);
}

/** 兼容旧流程：仅追加 session.workIds（抓拍请优先用 createUnifiedCaptureWork） */
export function updateParentSessionWorkId(sessionId: string, workId: string): ParentSessionStored | null {
  const next = appendWorkIdToUnifiedSession(sessionId, workId);
  return next ? toStored(next) : null;
}

export function getParentSessionMock(sessionId: string): ParentSessionStored | undefined {
  const u = getUnifiedSession(sessionId);
  if (!u) return undefined;
  return toStored(u);
}

export function listParentSessionsMock(): ParentSessionStored[] {
  return listUnifiedSessions().map(toStored);
}

export function createParentReportMock(body: ParentReportCreateBody): ParentReportRecord {
  const existing = readReports().find((r) => r.sessionId === body.sessionId);
  if (existing) return existing;
  const report: ParentReportRecord = {
    id: newReportId(),
    sessionId: body.sessionId,
    summary: body.summary,
    strengths: body.strengths,
    improvements: body.improvements,
    nextRecommendations: body.nextRecommendations,
    shareCopy: body.shareCopy,
    teacherComment: body.teacherComment,
    createdAt: new Date().toISOString(),
  };
  writeReports([report, ...readReports()]);
  return report;
}

export function getParentReportMock(sessionId: string): ParentReportRecord | undefined {
  return readReports().find((r) => r.sessionId === sessionId);
}

/** 教师批改后写入成就卡契约字段；已存在则合并 teacherComment */
export function mergeTeacherEvaluationIntoParentReport(params: {
  sessionId: string;
  teacherComment: string;
  summary?: string;
}): ParentReportRecord {
  const items = readReports();
  const existing = items.find((r) => r.sessionId === params.sessionId);
  if (existing) {
    const next: ParentReportRecord = {
      ...existing,
      teacherComment: params.teacherComment.trim() || existing.teacherComment,
    };
    writeReports(items.map((r) => (r.sessionId === params.sessionId ? next : r)));
    return next;
  }
  return createParentReportMock({
    sessionId: params.sessionId,
    summary:
      params.summary ??
      "本次亲子探究已完成，老师已查阅过程素材并给出结构化评价与寄语。",
    strengths: ["完成实验过程记录与亲子协作"],
    improvements: ["可持续关注生活中的相关现象"],
    nextRecommendations: ["欢迎继续完成老师下发的下一项探究"],
    teacherComment: params.teacherComment.trim() || undefined,
  });
}

export function listParentReportsMock(): ParentReportRecord[] {
  return readReports();
}

export function useParentSessionsMockState() {
  const [, bump] = React.useReducer((n) => n + 1, 0);
  React.useEffect(() => subscribeParentSessionsMock(() => bump()), []);
  return {
    sessions: listParentSessionsMock(),
    reports: listParentReportsMock(),
  };
}
