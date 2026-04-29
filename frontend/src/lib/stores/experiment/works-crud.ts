"use client";

import { incrementExperimentMgmtCopyCount } from "@/lib/experiment-mgmt-mock-store";
import { normalizeSession, normalizeWork, readUnifiedStore, writeUnifiedStore } from "../unified-mock-store.core";
import { ensureUnifiedStoreSeeded } from "../unified-mock-store.seed";
import type { TeacherWorkRubricMock, UnifiedSessionMock, UnifiedWorkMock, UnifiedWorkTeacherStatus } from "../unified-mock-store.types";
import { UNIFIED_MOCK_CAPTURE_MEDIA_URL } from "../unified-mock-store.types";
import { calculateWorkSuggestion } from "./ai";
import { newWorkId } from "./ids";

export function listUnifiedWorks(): UnifiedWorkMock[] {
  ensureUnifiedStoreSeeded();
  return readUnifiedStore().works.map((w) => normalizeWork(w));
}

export function getUnifiedWork(workId: string): UnifiedWorkMock | undefined {
  ensureUnifiedStoreSeeded();
  const w = readUnifiedStore().works.find((x) => x.workId === workId);
  return w ? normalizeWork(w) : undefined;
}

export function listUnifiedWorksForSession(sessionId: string): UnifiedWorkMock[] {
  return listUnifiedWorks()
    .filter((w) => w.sessionId === sessionId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/**
 * 提交过程素材并 **立即写入规则预审**（闭环 A4）：媒体全空 → `ai_suggestion.status === "error"`。
 * 推荐新代码统一走此入口；`createUnifiedCaptureWork` 为其薄封装（默认带占位媒体）。
 */
export function submitWorkWithAudit(params: {
  sessionId: string;
  experimentId: string;
  studentUserId: string;
  taskId?: string;
  title?: string;
  description?: string;
  /** 均缺省或空串时视为无媒体，触发预审 error */
  photoUrl?: string | null;
  videoUrl?: string | null;
}): UnifiedWorkMock {
  ensureUnifiedStoreSeeded();
  const s = readUnifiedStore();
  const si = s.sessions.findIndex((x) => x.sessionId === params.sessionId);
  if (si < 0) throw new Error("unified-mock: session not found");

  const photo = params.photoUrl?.trim();
  const video = params.videoUrl?.trim();
  const mediaMock: { photoUrl?: string; videoUrl?: string } = {};
  if (photo) mediaMock.photoUrl = photo;
  if (video) mediaMock.videoUrl = video;

  const base: UnifiedWorkMock = {
    workId: newWorkId(),
    sessionId: params.sessionId,
    experimentId: params.experimentId,
    kind: "capture",
    studentUserId: params.studentUserId,
    title: params.title?.trim() || "过程抓拍",
    description: params.description,
    mediaMock,
    createdAt: new Date().toISOString(),
    taskId: params.taskId,
    teacherReviewStatus: "pending_review",
  };

  const session = normalizeSession(s.sessions[si] as UnifiedSessionMock);
  const ai_suggestion = calculateWorkSuggestion(session, base);
  const ay = s.academicMeta?.currentAcademicYear;
  const work: UnifiedWorkMock = {
    ...base,
    ai_suggestion,
    academic_year: ay,
    is_archived: false,
  };

  const sessions = [...s.sessions];
  sessions[si] = { ...session, workIds: [...session.workIds, work.workId] };

  writeUnifiedStore({
    ...s,
    sessions,
    works: [work, ...s.works],
  });
  incrementExperimentMgmtCopyCount(params.experimentId);
  return work;
}

/**
 * 过程抓拍：默认带占位媒体，保证旧路径不因空媒体而报错；预审仍写入 `ai_suggestion`。
 */
export function createUnifiedCaptureWork(params: {
  sessionId: string;
  experimentId: string;
  studentUserId: string;
  taskId?: string;
  description?: string;
  mediaUrl?: string;
}): UnifiedWorkMock {
  return submitWorkWithAudit({
    sessionId: params.sessionId,
    experimentId: params.experimentId,
    studentUserId: params.studentUserId,
    taskId: params.taskId,
    description: params.description,
    title: "过程抓拍",
    videoUrl: params.mediaUrl ?? UNIFIED_MOCK_CAPTURE_MEDIA_URL,
  });
}

export function updateUnifiedWorkTeacherStatus(
  workId: string,
  status: Exclude<UnifiedWorkTeacherStatus, "pending_review">,
): UnifiedWorkMock | null {
  ensureUnifiedStoreSeeded();
  const s = readUnifiedStore();
  const idx = s.works.findIndex((w) => w.workId === workId);
  if (idx < 0) return null;
  const cur = s.works[idx]!;
  if (cur.teacherReviewStatus !== "pending_review") return cur;
  const next = { ...cur, teacherReviewStatus: status as UnifiedWorkTeacherStatus };
  const works = [...s.works];
  works[idx] = next;

  let sessions = s.sessions;
  if (status === "published") {
    const si = s.sessions.findIndex((x) => x.sessionId === cur.sessionId);
    if (si >= 0) {
      const se = normalizeSession(s.sessions[si] as UnifiedSessionMock);
      sessions = [...s.sessions];
      sessions[si] = { ...se, completion_status: "completed" };
    }
  }

  writeUnifiedStore({ ...s, works, sessions });
  return next;
}

export function updateUnifiedWorkTeacherRubric(
  workId: string,
  patch: { teacherRubric?: TeacherWorkRubricMock; teacherQuickNote?: string },
): UnifiedWorkMock | null {
  ensureUnifiedStoreSeeded();
  const s = readUnifiedStore();
  const idx = s.works.findIndex((w) => w.workId === workId);
  if (idx < 0) return null;
  const cur = s.works[idx]!;
  const next = { ...cur, ...patch };
  const works = [...s.works];
  works[idx] = next;
  writeUnifiedStore({ ...s, works });
  return next;
}

/** 批量结课：通过审核并将会话标为 completed（与单条通过一致） */
export function bulkPublishWorks(workIds: string[]): void {
  ensureUnifiedStoreSeeded();
  if (workIds.length === 0) return;
  const s = readUnifiedStore();
  const sessionIds = new Set<string>();
  const works = s.works.map((w) => {
    if (!workIds.includes(w.workId)) return w;
    if (w.teacherReviewStatus !== "pending_review") return w;
    sessionIds.add(w.sessionId);
    return { ...w, teacherReviewStatus: "published" as const };
  });
  const sessions = s.sessions.map((raw) => {
    const se = normalizeSession(raw as UnifiedSessionMock);
    if (sessionIds.has(se.sessionId)) {
      return { ...se, completion_status: "completed" as const };
    }
    return se;
  });
  writeUnifiedStore({ ...s, works, sessions });
}

