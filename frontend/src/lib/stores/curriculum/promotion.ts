"use client";

import { INITIAL_MOCK_ACADEMIC_YEAR, nextAcademicYearLabel } from "@/lib/academic-context";
import { normalizeSession, normalizeWork, readUnifiedStore, writeUnifiedStore } from "../unified-mock-store.core";
import { ensureUnifiedStoreSeeded } from "../unified-mock-store.seed";
import type { ClassDisplayOverride, MockStudentUser } from "../unified-mock-store.types";
import { syncStudentGroupIdsFromLabGroups } from "../user/lab-groups";

const GRADE_LABEL_TO_LEVEL: Record<string, number> = {
  一年级: 1,
  二年级: 2,
  三年级: 3,
  四年级: 4,
  五年级: 5,
};

function effectiveGradeLabelForPromotion(
  adminClassId: string | null,
  overrides: Record<string, ClassDisplayOverride>,
): string {
  if (!adminClassId) return "三年级";
  const o = overrides[adminClassId];
  return (o?.gradeLabel ?? "三年级").trim();
}

function gradeLabelToLevel(label: string): number {
  return GRADE_LABEL_TO_LEVEL[label.trim()] ?? 3;
}

function bumpGradeLabel(gradeLabel: string): string {
  const g = gradeLabel.trim();
  if (g === "一年级") return "二年级";
  if (g === "二年级") return "三年级";
  if (g === "三年级") return "四年级";
  if (g === "四年级") return "五年级";
  return "五年级";
}

function bumpClassDisplayName(name: string, fromGrade: string, toGrade: string): string {
  if (fromGrade === toGrade) return name;
  return name.split(fromGrade).join(toGrade);
}

/**
 * 学年更替（Mock）：快照 → 任务封存与会话结算 → 档案标记 → 学生升年级/毕业 → 行政班展示名策略 A。
 * 事件派发请在 `simulateAcademicPromotion`（data-management）中统一处理。
 */
export function simulateAcademicPromotionInUnifiedStore(): {
  oldYear: string;
  newYear: string;
  snapshotKey: string;
} {
  ensureUnifiedStoreSeeded();
  const s = readUnifiedStore();
  const oldYear = s.academicMeta?.currentAcademicYear ?? INITIAL_MOCK_ACADEMIC_YEAR;
  const newYear = nextAcademicYearLabel(oldYear);

  let tasks = s.tasks.map((t) => ({
    ...t,
    academic_year: t.academic_year ?? oldYear,
  }));

  let sessions = s.sessions.map((raw) => {
    const se = normalizeSession(raw);
    return { ...se, academic_year: se.academic_year ?? oldYear };
  });

  let works = s.works.map((w) => {
    const nw = normalizeWork(w);
    return { ...nw, academic_year: nw.academic_year ?? oldYear };
  });

  const snapshotKey = `backup_${oldYear.replace(/[^\dA-Za-z]+/g, "_")}_final`;
  if (typeof window !== "undefined") {
    const snapshot = {
      kind: "bs-lab-academic-snapshot-v1",
      exportedAt: new Date().toISOString(),
      academicYear: oldYear,
      nextAcademicYear: newYear,
      studentUsers: s.studentUsers,
      classDisplayOverrides: s.classDisplayOverrides ?? {},
      taskSnapshot: tasks.map((t) => ({
        taskId: t.taskId,
        status: t.status,
        academic_year: t.academic_year,
      })),
      sessionCount: sessions.length,
      workCount: works.length,
    };
    try {
      window.localStorage.setItem(`bs-lab:academic-snapshot:${snapshotKey}`, JSON.stringify(snapshot));
    } catch {
      /* ignore */
    }
  }

  tasks = tasks.map((t) => {
    if (t.status === "draft" || t.status === "published") {
      return { ...t, status: "archived" as const };
    }
    return t;
  });

  sessions = sessions.map((se) => {
    let completion_status = se.completion_status;
    if (completion_status === "ongoing") completion_status = "interrupted_by_new_year";
    const is_archived = se.academic_year === oldYear ? true : se.is_archived;
    return { ...se, completion_status, is_archived };
  });

  works = works.map((w) => ({
    ...w,
    is_archived: w.academic_year === oldYear ? true : w.is_archived,
  }));

  const ovrBefore = { ...(s.classDisplayOverrides ?? {}) };
  const ovr: Record<string, ClassDisplayOverride> = { ...ovrBefore };
  // 学年升级已清空 Mock 数据，等待真实行政班来自 API
  void ovrBefore;

  let studentUsers: MockStudentUser[] = s.studentUsers.map(
    (u): MockStudentUser => {
      const label = effectiveGradeLabelForPromotion(u.adminClassId, ovrBefore);
      const gl = typeof u.gradeLevel === "number" && Number.isFinite(u.gradeLevel) ? u.gradeLevel : gradeLabelToLevel(label);
      const nextGl = gl + 1;
      if (nextGl > 5) {
        return { ...u, gradeLevel: nextGl, isActive: false, role: "alumni", groupId: null };
      }
      return { ...u, gradeLevel: nextGl, isActive: true, role: "student", groupId: null };
    },
  );
  studentUsers = syncStudentGroupIdsFromLabGroups([], studentUsers);

  writeUnifiedStore({
    ...s,
    tasks,
    sessions,
    works,
    studentUsers,
    labGroups: [],
    academicMeta: { currentAcademicYear: newYear, lastPromotionAt: new Date().toISOString() },
    classDisplayOverrides: ovr,
  });

  return { oldYear, newYear, snapshotKey };
}

