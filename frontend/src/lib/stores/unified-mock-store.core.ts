"use client";

import type {
  ClassDisplayOverride,
  LabGroupMock,
  MockStudentUser,
  SessionCompletionStatus,
  UnifiedAcademicMeta,
  UnifiedSessionMock,
  UnifiedStoreShape,
  UnifiedTaskMock,
  UnifiedWorkMock,
} from "./unified-mock-store.types";
let inMemoryStore: UnifiedStoreShape | null = null;

const listeners = new Set<() => void>();

export function subscribeUnifiedMock(listener: () => void) {
  listeners.add(listener);
  return () => void listeners.delete(listener);
}

function ping() {
  listeners.forEach((fn) => fn());
}

function emptyStore(): UnifiedStoreShape {
  return { tasks: [], sessions: [], works: [], labGroups: [], studentUsers: [] };
}

const INITIAL_ACADEMIC_YEAR = "2025-2026";

function normalizeStudentUsers(users: MockStudentUser[]): MockStudentUser[] {
  return users.map((u) => ({
    ...u,
    gradeLevel: u.gradeLevel ?? undefined,
    isActive: u.isActive !== false,
    role: u.role ?? "student",
  }));
}

function seedStudentUsers(): MockStudentUser[] {
  return [];
}

function normalizeStoreShape(partial: Partial<UnifiedStoreShape>): UnifiedStoreShape {
  const classDisplayOverrides =
    partial.classDisplayOverrides &&
    typeof partial.classDisplayOverrides === "object" &&
    !Array.isArray(partial.classDisplayOverrides)
      ? (partial.classDisplayOverrides as Record<string, ClassDisplayOverride>)
      : {};
  return {
    tasks: Array.isArray(partial.tasks) ? partial.tasks : [],
    sessions: Array.isArray(partial.sessions) ? partial.sessions : [],
    works: Array.isArray(partial.works) ? partial.works : [],
    labGroups: Array.isArray(partial.labGroups) ? partial.labGroups : [],
    studentUsers: Array.isArray(partial.studentUsers) ? partial.studentUsers : [],
    academicMeta: partial.academicMeta,
    classDisplayOverrides,
  };
}

function ensureCohortLayer(store: UnifiedStoreShape): UnifiedStoreShape {
  if (store.studentUsers.length > 0) return store;
  return { ...store, studentUsers: seedStudentUsers(), labGroups: store.labGroups ?? [] };
}

export function readUnifiedStore(): UnifiedStoreShape {
  const base = inMemoryStore ?? emptyStore();
  const merged = normalizeStoreShape(base as unknown as Partial<UnifiedStoreShape>);
  const withCohort = ensureCohortLayer(merged);
  const meta =
    withCohort.academicMeta?.currentAcademicYear?.trim()
      ? withCohort.academicMeta
      : { currentAcademicYear: INITIAL_ACADEMIC_YEAR };
  const normalized = {
    ...withCohort,
    academicMeta: meta,
    studentUsers: normalizeStudentUsers(withCohort.studentUsers),
  };
  inMemoryStore = normalized;
  return normalized;
}

export function writeUnifiedStore(next: UnifiedStoreShape) {
  inMemoryStore = next;
  ping();
}

export function persistStoreIfMissingAcademicMeta() {
  void 0;
}

/** 旧版仅有 tasks/sessions/works 的 localStorage，补齐 cohort 层并落盘 */
export function persistCohortIfStale() {
  void 0;
}

/** 读库后补齐旧数据缺省字段 */
export function normalizeSession(raw: UnifiedSessionMock): UnifiedSessionMock {
  const completion = raw.completion_status;
  const completion_status: SessionCompletionStatus =
    completion === "completed" ||
    completion === "parent_confirmed" ||
    completion === "interrupted_by_new_year"
      ? completion
      : "ongoing";
  return {
    sessionId: raw.sessionId,
    taskId: raw.taskId,
    experimentId: raw.experimentId,
    studentUserId: raw.studentUserId,
    parentUserId: raw.parentUserId,
    workIds: Array.isArray(raw.workIds) ? raw.workIds : [],
    guideStyle: raw.guideStyle ?? "gentle",
    startedAt: raw.startedAt,
    parent_attested_at: raw.parent_attested_at ?? null,
    completion_status,
    errorCount: typeof raw.errorCount === "number" ? raw.errorCount : 0,
    materialShortageReported: Boolean(raw.materialShortageReported),
    report_url: raw.report_url ?? null,
    teacher_feedback: raw.teacher_feedback ?? null,
    teacher_star_rating:
      typeof raw.teacher_star_rating === "number" && Number.isFinite(raw.teacher_star_rating)
        ? raw.teacher_star_rating
        : undefined,
    evaluation_status: raw.evaluation_status === "evaluated" ? "evaluated" : "none",
    academic_year: raw.academic_year ?? INITIAL_ACADEMIC_YEAR,
    is_archived: Boolean(raw.is_archived),
  };
}

export function normalizeWork(raw: UnifiedWorkMock): UnifiedWorkMock {
  return {
    ...raw,
    academic_year: raw.academic_year ?? INITIAL_ACADEMIC_YEAR,
    is_archived: Boolean(raw.is_archived),
  };
}

// seeding 逻辑已拆分到 `unified-mock-store.seed.ts`
