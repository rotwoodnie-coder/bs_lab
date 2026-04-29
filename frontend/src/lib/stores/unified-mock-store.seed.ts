"use client";

import { INITIAL_MOCK_ACADEMIC_YEAR } from "@/lib/academic-context";
import type { UnifiedSessionMock, UnifiedTaskMock } from "./unified-mock-store.types";
import { BAOSHAN_100_EXPERIMENT_IDS } from "./unified-mock-store.types";
import {
  persistCohortIfStale,
  persistStoreIfMissingAcademicMeta,
  readUnifiedStore,
  writeUnifiedStore,
} from "./unified-mock-store.core";

function buildBaoshanSeedTasks(): UnifiedTaskMock[] {
  const due = new Date();
  due.setDate(due.getDate() + 10);
  const iso = due.toISOString();
  const demoStudent = "S20261234";
  return [
    {
      taskId: "task-baoshan-100-001",
      experimentId: BAOSHAN_100_EXPERIMENT_IDS.obsFeatures,
      title: "宝山100 · 观察描述常见物体的特征",
      experimentTitle: "观察描述常见物体的特征",
      gradeLabel: "小学科学 · 1~2年级",
      classIds: ["c1"],
      dueAt: iso,
      status: "published",
      createdByTeacherId: "teacher-demo-1",
      studentUserIds: [demoStudent],
    },
    {
      taskId: "task-baoshan-100-002",
      experimentId: BAOSHAN_100_EXPERIMENT_IDS.materialFeatures,
      title: "宝山100 · 观察常见材料的外部特征",
      experimentTitle: "观察常见材料的外部特征",
      gradeLabel: "小学科学 · 1~2年级",
      classIds: ["c1"],
      dueAt: iso,
      status: "published",
      createdByTeacherId: "teacher-demo-1",
      studentUserIds: [demoStudent],
    },
    {
      taskId: "task-baoshan-100-003",
      experimentId: BAOSHAN_100_EXPERIMENT_IDS.rulerLength,
      title: "宝山100 · 用尺子测量物体的长度",
      experimentTitle: "用尺子测量物体的长度",
      gradeLabel: "小学科学 · 3~4年级",
      classIds: ["c1"],
      dueAt: iso,
      status: "published",
      createdByTeacherId: "teacher-demo-1",
      studentUserIds: [demoStudent],
    },
  ];
}

function ensureSessionSeedFromTasks() {
  const s = readUnifiedStore();
  if (s.sessions.length > 0 || s.tasks.length === 0) return;
  const demoStudent = "S20261234";
  /** 与 `DEMO_PARENT_USER_ID`、profile 一致，便于家长端任务与会话同源 */
  const parent = "P20260012";
  const attestedAt = new Date().toISOString();
  const ay = s.academicMeta?.currentAcademicYear ?? INITIAL_MOCK_ACADEMIC_YEAR;
  const sessions: UnifiedSessionMock[] = s.tasks.flatMap((t, idx) => {
    const base = {
      taskId: t.taskId,
      experimentId: t.experimentId,
      studentUserId: demoStudent,
      parentUserId: parent,
      workIds: [] as string[],
      guideStyle: "gentle" as const,
      startedAt: new Date().toISOString(),
      parent_attested_at: null as string | null,
      errorCount: idx === 0 ? 2 : 0,
      materialShortageReported: idx % 2 === 0,
      evaluation_status: "none" as const,
      academic_year: t.academic_year ?? ay,
      is_archived: false,
    };
    return [
      {
        ...base,
        sessionId: `seed-sess-${t.taskId}-a`,
        completion_status: "completed" as const,
        parent_attested_at: attestedAt,
      },
      {
        ...base,
        sessionId: `seed-sess-${t.taskId}-b`,
        completion_status: idx % 2 === 0 ? ("parent_confirmed" as const) : ("ongoing" as const),
        parent_attested_at: idx % 2 === 0 ? attestedAt : null,
      },
    ];
  });
  writeUnifiedStore({ ...s, sessions });
}

let seeded = false;

export function ensureUnifiedStoreSeeded() {
  if (seeded || typeof window === "undefined") return;
  seeded = true;
  persistCohortIfStale();
  persistStoreIfMissingAcademicMeta();
  const cur = readUnifiedStore();
  if (cur.tasks.length > 0) {
    ensureSessionSeedFromTasks();
    return;
  }
  writeUnifiedStore({
    ...cur,
    academicMeta: { currentAcademicYear: INITIAL_MOCK_ACADEMIC_YEAR },
    tasks: buildBaoshanSeedTasks().map((t) => ({
      ...t,
      academic_year: INITIAL_MOCK_ACADEMIC_YEAR,
    })),
  });
  ensureSessionSeedFromTasks();
}

