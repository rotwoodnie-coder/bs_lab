"use client";

import { INITIAL_MOCK_ACADEMIC_YEAR } from "@/lib/academic-context";
import { normalizeSession, readUnifiedStore, writeUnifiedStore } from "../unified-mock-store.core";
import { ensureUnifiedStoreSeeded } from "../unified-mock-store.seed";
import type { AiSessionGuideStyle, UnifiedSessionMock } from "../unified-mock-store.types";
import { newSessionId } from "./ids";
import { getUnifiedTask } from "./tasks";

export function listUnifiedSessions(): UnifiedSessionMock[] {
  ensureUnifiedStoreSeeded();
  return readUnifiedStore().sessions.map((x) => normalizeSession(x as UnifiedSessionMock));
}

export function getUnifiedSession(sessionId: string): UnifiedSessionMock | undefined {
  ensureUnifiedStoreSeeded();
  const raw = readUnifiedStore().sessions.find((x) => x.sessionId === sessionId);
  return raw ? normalizeSession(raw as UnifiedSessionMock) : undefined;
}

export type UnifiedSessionCreateInput = {
  parentUserId: string;
  studentUserId: string;
  experimentId: string;
  taskId?: string;
  guideStyle?: AiSessionGuideStyle;
};

export function createUnifiedSession(input: UnifiedSessionCreateInput): UnifiedSessionMock {
  ensureUnifiedStoreSeeded();
  const s = readUnifiedStore();
  const ay = s.academicMeta?.currentAcademicYear ?? INITIAL_MOCK_ACADEMIC_YEAR;
  const session: UnifiedSessionMock = {
    sessionId: newSessionId(),
    taskId: input.taskId,
    experimentId: input.experimentId,
    studentUserId: input.studentUserId,
    parentUserId: input.parentUserId,
    workIds: [],
    guideStyle: input.guideStyle ?? "gentle",
    startedAt: new Date().toISOString(),
    parent_attested_at: null,
    completion_status: "ongoing",
    errorCount: 0,
    materialShortageReported: false,
    report_url: null,
    teacher_feedback: null,
    evaluation_status: "none",
    academic_year: ay,
    is_archived: false,
  };
  writeUnifiedStore({ ...s, sessions: [session, ...s.sessions] });
  return session;
}

/**
 * 按任务一键开会话：`experimentId` / `guideStyle` 与任务对齐（TeachingTask.aiStyle → ExperimentSession.guideStyle）。
 */
export function createSessionWithTask(params: {
  taskId: string;
  studentUserId: string;
  parentUserId: string;
}): UnifiedSessionMock {
  ensureUnifiedStoreSeeded();
  const task = getUnifiedTask(params.taskId);
  if (!task) throw new Error("unified-mock: task not found for createSessionWithTask");
  if (task.studentUserIds.length > 0 && !task.studentUserIds.includes(params.studentUserId)) {
    throw new Error("unified-mock: student not in task audience");
  }
  return createUnifiedSession({
    taskId: task.taskId,
    experimentId: task.experimentId,
    studentUserId: params.studentUserId,
    parentUserId: params.parentUserId,
    guideStyle: task.aiStyle ?? "gentle",
  });
}

export function appendWorkIdToUnifiedSession(sessionId: string, workId: string): UnifiedSessionMock | null {
  ensureUnifiedStoreSeeded();
  const s = readUnifiedStore();
  const si = s.sessions.findIndex((x) => x.sessionId === sessionId);
  if (si < 0) return null;
  const sess = normalizeSession(s.sessions[si] as UnifiedSessionMock);
  if (sess.workIds.includes(workId)) return sess;
  const sessions = [...s.sessions];
  sessions[si] = { ...sess, workIds: [...sess.workIds, workId] };
  writeUnifiedStore({ ...s, sessions });
  return normalizeSession(sessions[si] as UnifiedSessionMock);
}

export function updateUnifiedSessionGuideStyle(sessionId: string, guideStyle: AiSessionGuideStyle): UnifiedSessionMock | null {
  ensureUnifiedStoreSeeded();
  const s = readUnifiedStore();
  const idx = s.sessions.findIndex((x) => x.sessionId === sessionId);
  if (idx < 0) return null;
  const cur = normalizeSession(s.sessions[idx] as UnifiedSessionMock);
  const next = { ...cur, guideStyle };
  const sessions = [...s.sessions];
  sessions[idx] = next;
  writeUnifiedStore({ ...s, sessions });
  return next;
}

/** 家长「确认孩子已完成并背书」 */
export function attestParentSession(sessionId: string): UnifiedSessionMock | null {
  ensureUnifiedStoreSeeded();
  const s = readUnifiedStore();
  const idx = s.sessions.findIndex((x) => x.sessionId === sessionId);
  if (idx < 0) return null;
  const cur = normalizeSession(s.sessions[idx] as UnifiedSessionMock);
  const next: UnifiedSessionMock = {
    ...cur,
    parent_attested_at: new Date().toISOString(),
    completion_status: "parent_confirmed",
  };
  const sessions = [...s.sessions];
  sessions[idx] = next;
  writeUnifiedStore({ ...s, sessions });
  return next;
}

/** ：模拟互动中错误预警累计 */
export function incrementSessionErrorCount(sessionId: string, delta = 1): UnifiedSessionMock | null {
  ensureUnifiedStoreSeeded();
  const s = readUnifiedStore();
  const idx = s.sessions.findIndex((x) => x.sessionId === sessionId);
  if (idx < 0) return null;
  const cur = normalizeSession(s.sessions[idx] as UnifiedSessionMock);
  const next = { ...cur, errorCount: Math.max(0, cur.errorCount + delta) };
  const sessions = [...s.sessions];
  sessions[idx] = next;
  writeUnifiedStore({ ...s, sessions });
  return next;
}

export function setSessionMaterialShortageReported(sessionId: string, value: boolean): UnifiedSessionMock | null {
  ensureUnifiedStoreSeeded();
  const s = readUnifiedStore();
  const idx = s.sessions.findIndex((x) => x.sessionId === sessionId);
  if (idx < 0) return null;
  const cur = normalizeSession(s.sessions[idx] as UnifiedSessionMock);
  const next = { ...cur, materialShortageReported: value };
  const sessions = [...s.sessions];
  sessions[idx] = next;
  writeUnifiedStore({ ...s, sessions });
  return next;
}

export type UnifiedSessionPatch = Partial<
  Pick<
    UnifiedSessionMock,
    "report_url" | "teacher_feedback" | "teacher_star_rating" | "evaluation_status" | "completion_status"
  >
>;

/** 批改回传、报告链接等；写入 evaluated 时派发 `bs-lab-session-evaluated` */
export function updateUnifiedSession(sessionId: string, patch: UnifiedSessionPatch): UnifiedSessionMock | null {
  ensureUnifiedStoreSeeded();
  const s = readUnifiedStore();
  const idx = s.sessions.findIndex((x) => x.sessionId === sessionId);
  if (idx < 0) return null;
  const cur = normalizeSession(s.sessions[idx] as UnifiedSessionMock);
  const wasEval = cur.evaluation_status === "evaluated";
  const next: UnifiedSessionMock = { ...cur, ...patch };
  const sessions = [...s.sessions];
  sessions[idx] = next;
  writeUnifiedStore({ ...s, sessions });
  const normalized = normalizeSession(next);
  if (!wasEval && normalized.evaluation_status === "evaluated" && typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("bs-lab-session-evaluated", { detail: { sessionId } }));
  }
  return normalized;
}

