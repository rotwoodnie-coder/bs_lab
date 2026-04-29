"use client";

import { incrementExperimentMgmtTaskCount } from "@/lib/experiment-mgmt-mock-store";
import { getExperimentAssignmentBlockReason } from "./assignment";
import { normalizeSession, readUnifiedStore, writeUnifiedStore } from "../unified-mock-store.core";
import { ensureUnifiedStoreSeeded } from "../unified-mock-store.seed";
import type { LabGroupMock, UnifiedTaskMock } from "../unified-mock-store.types";
import { INITIAL_MOCK_ACADEMIC_YEAR } from "@/lib/academic-context";
import { newTaskId } from "./ids";
import { getMockStudentUser } from "../user/users";

// ——— Tasks ———

export function listUnifiedTasks(): UnifiedTaskMock[] {
  ensureUnifiedStoreSeeded();
  return readUnifiedStore().tasks;
}

export function getUnifiedTask(taskId: string): UnifiedTaskMock | undefined {
  ensureUnifiedStoreSeeded();
  return readUnifiedStore().tasks.find((t) => t.taskId === taskId);
}

function resolveStudentIdsFromLabGroups(labGroups: LabGroupMock[], groupIds: string[]): string[] {
  const set = new Set<string>();
  for (const gid of groupIds) {
    const g = labGroups.find((x) => x.groupId === gid);
    if (!g) continue;
    for (const uid of g.memberUserIds) set.add(uid);
  }
  return [...set];
}

function adminClassIdsFromLabGroups(labGroups: LabGroupMock[], groupIds: string[]): string[] {
  const set = new Set<string>();
  for (const gid of groupIds) {
    const g = labGroups.find((x) => x.groupId === gid);
    if (g) set.add(g.adminClassId);
  }
  return [...set];
}

export function createUnifiedTask(input: Omit<UnifiedTaskMock, "taskId"> & { taskId?: string }): UnifiedTaskMock {
  ensureUnifiedStoreSeeded();
  const block = getExperimentAssignmentBlockReason(input.experimentId);
  if (block) {
    throw new Error(`unified-mock: ${block}`);
  }
  const s = readUnifiedStore();
  const gidList = (input.groupIds ?? []).filter(Boolean);
  let studentUserIds = [...(input.studentUserIds ?? [])];
  let classIds = [...(input.classIds ?? [])];
  if (gidList.length > 0) {
    const fromGroups = resolveStudentIdsFromLabGroups(s.labGroups, gidList);
    if (fromGroups.length > 0) studentUserIds = fromGroups;
    const ac = adminClassIdsFromLabGroups(s.labGroups, gidList);
    if (ac.length > 0) classIds = [...new Set([...classIds, ...ac])];
  }
  const ay = s.academicMeta?.currentAcademicYear ?? INITIAL_MOCK_ACADEMIC_YEAR;
  const task: UnifiedTaskMock = {
    ...input,
    classIds,
    groupIds: gidList.length > 0 ? gidList : input.groupIds,
    studentUserIds,
    taskId: input.taskId ?? newTaskId(),
    academic_year: input.academic_year ?? ay,
  };
  writeUnifiedStore({ ...s, tasks: [task, ...s.tasks] });
  incrementExperimentMgmtTaskCount(task.experimentId);
  return task;
}

export function updateUnifiedTask(
  taskId: string,
  patch: Partial<
    Pick<
      UnifiedTaskMock,
      "status" | "dueAt" | "title" | "classIds" | "studentUserIds" | "groupIds" | "aiStyle"
    >
  >,
): UnifiedTaskMock | null {
  ensureUnifiedStoreSeeded();
  const s = readUnifiedStore();
  const idx = s.tasks.findIndex((t) => t.taskId === taskId);
  if (idx < 0) return null;
  const next = { ...s.tasks[idx]!, ...patch };
  const tasks = [...s.tasks];
  tasks[idx] = next;
  writeUnifiedStore({ ...s, tasks });
  return next;
}

function expectedSubmissionsForClasses(classIds: string[]): number {
  // 待接入真实行政班 API
  return classIds.length > 0 ? 40 : 0;
}

function expectedAudienceCountForTask(t: UnifiedTaskMock): number {
  if (t.studentUserIds?.length) return t.studentUserIds.length;
  return expectedSubmissionsForClasses(t.classIds);
}

function countWorksForTask(taskId: string): number {
  return readUnifiedStore().works.filter((w) => w.taskId === taskId).length;
}

function countPendingReviewForTask(taskId: string): number {
  return readUnifiedStore().works.filter((w) => w.taskId === taskId && w.teacherReviewStatus === "pending_review").length;
}

/** 教师作业列表：与 TeacherMockAssignment 对齐 */
export function listUnifiedTasksAsTeacherAssignments(): TeacherMockAssignment[] {
  ensureUnifiedStoreSeeded();
  return listUnifiedTasks().map((t) => {
    const expected = expectedAudienceCountForTask(t);
    const submitted = countWorksForTask(t.taskId);
    const pendingTeacherReview = countPendingReviewForTask(t.taskId);
    return {
      id: t.taskId,
      title: t.title,
      experimentId: t.experimentId,
      experimentTitle: t.experimentTitle,
      gradeLabel: t.gradeLabel,
      classIds: t.classIds,
      groupIds: t.groupIds,
      aiStyle: t.aiStyle,
      dueAt: t.dueAt,
      status: t.status,
      expectedSubmissions: expected > 0 ? expected : 40,
      submitted,
      pendingTeacherReview,
    };
  });
}

/** 已发布任务是否对该学生可见（显式名单 ∪ 行政班 ∪ 实验小组） */
export function isPublishedTaskVisibleToStudent(task: UnifiedTaskMock, studentUserId: string): boolean {
  if (task.status !== "published") return false;
  if (task.studentUserIds.length > 0) return task.studentUserIds.includes(studentUserId);
  const stu = getMockStudentUser(studentUserId);
  if (!stu?.adminClassId) return false;
  if (task.classIds.includes(stu.adminClassId)) return true;
  if (stu.groupId && (task.groupIds ?? []).includes(stu.groupId)) return true;
  return false;
}

export function listPublishedTasksForStudent(studentUserId: string): UnifiedTaskMock[] {
  ensureUnifiedStoreSeeded();
  return listUnifiedTasks().filter((t) => isPublishedTaskVisibleToStudent(t, studentUserId));
}

/**
 * 家长任务真源：与该家长有过会话的学生 + 其可见的已发布任务，去重合并。
 */
export function listUnifiedTasksByParentId(parentUserId: string): UnifiedTaskMock[] {
  ensureUnifiedStoreSeeded();
  const map = new Map<string, UnifiedTaskMock>();
  const studentIds = new Set<string>();
  for (const raw of readUnifiedStore().sessions) {
    const se = normalizeSession(raw);
    if (se.parentUserId !== parentUserId) continue;
    studentIds.add(se.studentUserId);
    if (se.taskId) {
      const t = getUnifiedTask(se.taskId);
      if (t && t.status === "published") map.set(t.taskId, t);
    }
  }
  for (const sid of studentIds) {
    for (const t of listPublishedTasksForStudent(sid)) {
      map.set(t.taskId, t);
    }
  }
  return [...map.values()].sort((a, b) => (a.dueAt < b.dueAt ? 1 : a.dueAt > b.dueAt ? -1 : 0));
}

/** 某行政班维度：已发布且仍进行中的任务数（：含指向该班或该班下小组的任务） */
export function countActivePublishedTasksForAdminClass(adminClassId: string): number {
  ensureUnifiedStoreSeeded();
  const { tasks, labGroups } = readUnifiedStore();
  const groupIdsInClass = new Set(labGroups.filter((g) => g.adminClassId === adminClassId).map((g) => g.groupId));
  return tasks.filter((t) => {
    if (t.status !== "published") return false;
    if (t.classIds.includes(adminClassId)) return true;
    return (t.groupIds ?? []).some((gid) => groupIdsInClass.has(gid));
  }).length;
}

