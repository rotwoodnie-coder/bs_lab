import type { ParentFamilyBinding } from "@/lib/parent/parent-family-binding-mock";
import { DEMO_PARENT_USER_ID } from "@/lib/parent/demo-parent-ids";
import {
  getUnifiedTask,
  isPublishedTaskVisibleToStudent,
  listUnifiedTasksByParentId,
  type UnifiedTaskMock,
} from "@/lib/unified-mock-store";

/** 家长任务中心视角：taskId 与教师 unified 任务同源 */

export type ParentAssignmentMock = {
  id: string;
  studentUserId: string;
  experimentId: string;
  title: string;
  status: "pending" | "in_progress" | "done";
  dueLabel: string;
};

function dueLabel(iso: string): string {
  try {
    return new Date(iso).toLocaleString("zh-CN", {
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function taskToParentRow(t: UnifiedTaskMock, studentUserId: string): ParentAssignmentMock {
  return {
    id: t.taskId,
    studentUserId,
    experimentId: t.experimentId,
    title: t.title,
    status: "pending",
    dueLabel: dueLabel(t.dueAt),
  };
}

/** 与 `listUnifiedTasksByParentId` + 学生可见性过滤后的任务列表 */
export function listAssignmentsForParentAndStudent(parentUserId: string, studentUserId: string): ParentAssignmentMock[] {
  return listUnifiedTasksByParentId(parentUserId)
    .filter((t) => isPublishedTaskVisibleToStudent(t, studentUserId))
    .map((t) => taskToParentRow(t, studentUserId));
}

export function listAssignmentsForStudent(studentUserId: string): ParentAssignmentMock[] {
  return listAssignmentsForParentAndStudent(DEMO_PARENT_USER_ID, studentUserId);
}

export function listAssignmentsForBinding(binding: ParentFamilyBinding | null): ParentAssignmentMock[] {
  if (!binding) return [];
  return listAssignmentsForParentAndStudent(DEMO_PARENT_USER_ID, binding.studentUserId);
}

export function findAssignmentById(id: string, studentUserId?: string): ParentAssignmentMock | undefined {
  const t = getUnifiedTask(id);
  if (!t || t.status !== "published") return undefined;
  const sid = studentUserId ?? t.studentUserIds[0] ?? "S20261234";
  if (!isPublishedTaskVisibleToStudent(t, sid)) return undefined;
  return taskToParentRow(t, sid);
}
