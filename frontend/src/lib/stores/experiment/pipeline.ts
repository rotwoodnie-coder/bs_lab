"use client";

import type { StudentWorkItem, StudentWorkStatus } from "@/types/student-work";
import type { UnifiedWorkMock, UnifiedWorkTeacherStatus } from "../unified-mock-store.types";
import { ensureUnifiedStoreSeeded } from "../unified-mock-store.seed";
import { listUnifiedWorks } from "./works-crud";
import { getUnifiedTask } from "./tasks";

function experimentTitleForWork(w: UnifiedWorkMock): string {
  if (w.taskId) {
    const t = getUnifiedTask(w.taskId);
    if (t) return t.experimentTitle;
  }
  return w.title;
}

function toStudentWorkStatus(u: UnifiedWorkTeacherStatus): StudentWorkStatus {
  if (u === "published") return "published";
  if (u === "rejected") return "rejected";
  return "pending_review";
}

function demoSchoolNameForWorkId(workId: string): string {
  const schools = ["宝山实验学校", "行知中学", "吴淞中学", "上大附中"];
  let h = 0;
  for (let i = 0; i < workId.length; i += 1) h = (h + workId.charCodeAt(i)) % 997;
  return schools[h % schools.length]!;
}

export function getUnifiedWorksAsStudentWorkItems(): StudentWorkItem[] {
  ensureUnifiedStoreSeeded();
  return listUnifiedWorks()
    .filter((w) => w.kind === "capture" && !w.is_archived)
    .map((w) => {
      const preview = w.mediaMock.photoUrl ?? w.mediaMock.videoUrl ?? "";
      return {
        id: w.workId,
        sourceExperimentId: w.experimentId,
        sourceExperimentTitle: experimentTitleForWork(w),
        title: w.title,
        studentLabel: `${w.studentUserId} · 亲子抓拍`,
        status: toStudentWorkStatus(w.teacherReviewStatus),
        createdAt: w.createdAt,
        hasMockVideo: Boolean(w.mediaMock.videoUrl),
        sessionId: w.sessionId,
        taskId: w.taskId,
        kind: "capture" as const,
        capturePreviewUrl: preview,
        schoolName: demoSchoolNameForWorkId(w.workId),
      };
    });
}

/** 合并统一仓抓拍与 legacy 拍同款队列，供教师端订阅 */
export function mergePipelineStudentWorks(legacy: StudentWorkItem[]): StudentWorkItem[] {
  const unifiedItems = getUnifiedWorksAsStudentWorkItems();
  const map = new Map<string, StudentWorkItem>();
  for (const w of legacy) {
    map.set(w.id, w);
  }
  for (const w of unifiedItems) {
    map.set(w.id, w);
  }
  return [...map.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function isUnifiedMockWorkId(id: string): boolean {
  return id.startsWith("umw-");
}

