"use client";

import * as React from "react";

import { appendDistrictModelFeed } from "@/lib/district-sample-feed-mock-store";
import { incrementExperimentMgmtCopyCount } from "@/lib/experiment-mgmt-mock-store";
import {
  isUnifiedMockWorkId,
  mergePipelineStudentWorks,
  subscribeUnifiedMock,
  updateUnifiedWorkTeacherStatus,
} from "@/lib/unified-mock-store";
import type { StudentWorkItem, StudentWorkStatus } from "@/types/student-work";

let inMemoryWorks: StudentWorkItem[] = [];

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((fn) => fn());
}

export function subscribeWorksPipeline(listener: () => void) {
  listeners.add(listener);
  return () => void listeners.delete(listener);
}

export function readStudentWorks(): StudentWorkItem[] {
  return [...inMemoryWorks];
}

export function writeStudentWorks(items: StudentWorkItem[]) {
  inMemoryWorks = [...items];
  notify();
}

function newId(): string {
  return `sw-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * 学生：拍同款 → 模拟上传短视频 → 进入待审核。
 */
export function submitSameStyleWork(params: {
  sourceExperimentId: string;
  sourceExperimentTitle: string;
  title?: string;
  studentLabel?: string;
  schoolName?: string;
}): StudentWorkItem {
  const items = readStudentWorks();
  const item: StudentWorkItem = {
    id: newId(),
    sourceExperimentId: params.sourceExperimentId,
    sourceExperimentTitle: params.sourceExperimentTitle,
    title: params.title?.trim() || `拍同款 · ${params.sourceExperimentTitle}`,
    studentLabel: params.studentLabel ?? "我（学生）",
    status: "pending_review",
    createdAt: new Date().toISOString(),
    hasMockVideo: true,
    kind: "same_style_submission",
    schoolName: params.schoolName ?? "宝山实验学校",
  };
  writeStudentWorks([item, ...items]);
  incrementExperimentMgmtCopyCount(params.sourceExperimentId);
  return item;
}

/** 教研员：将作品标为全区样板并写入实验圈 Feed（Mock） */
export function markStudentWorkAsDistrictSample(workId: string): StudentWorkItem | null {
  const merged = mergePipelineStudentWorks(readStudentWorks());
  const cur = merged.find((w) => w.id === workId);
  if (!cur) return null;
  const school = cur.schoolName ?? "本校";
  appendDistrictModelFeed({
    id: `df-${workId}-${Date.now()}`,
    title: cur.title,
    snippet: `全区样板推荐 · ${school}`,
    schoolName: school,
    workId,
  });
  if (!isUnifiedMockWorkId(workId)) {
    const items = readStudentWorks();
    const idx = items.findIndex((w) => w.id === workId);
    if (idx < 0) return { ...cur, isDistrictSample: true };
    const next: StudentWorkItem = { ...items[idx]!, isDistrictSample: true };
    const copy = [...items];
    copy[idx] = next;
    writeStudentWorks(copy);
    return next;
  }
  return { ...cur, isDistrictSample: true };
}

/**
 * 教研/教师：在评审页通过 → 上架实验圈 Feed，并提示亲子报告（Mock）。
 */
export function approveStudentWork(id: string): StudentWorkItem | null {
  if (isUnifiedMockWorkId(id)) {
    updateUnifiedWorkTeacherStatus(id, "published");
    return mergePipelineStudentWorks(readStudentWorks()).find((w) => w.id === id) ?? null;
  }
  const items = readStudentWorks();
  const idx = items.findIndex((w) => w.id === id);
  if (idx < 0) return null;
  const cur = items[idx]!;
  if (cur.status !== "pending_review") return cur;
  const next: StudentWorkItem = { ...cur, status: "published" as StudentWorkStatus };
  const rest = [...items];
  rest[idx] = next;
  writeStudentWorks(rest);
  return next;
}

export function rejectStudentWork(id: string): StudentWorkItem | null {
  if (isUnifiedMockWorkId(id)) {
    updateUnifiedWorkTeacherStatus(id, "rejected");
    return mergePipelineStudentWorks(readStudentWorks()).find((w) => w.id === id) ?? null;
  }
  const items = readStudentWorks();
  const idx = items.findIndex((w) => w.id === id);
  if (idx < 0) return null;
  const cur = items[idx]!;
  const next: StudentWorkItem = { ...cur, status: "rejected" };
  const rest = [...items];
  rest[idx] = next;
  writeStudentWorks(rest);
  return next;
}

function readMergedWorks(): StudentWorkItem[] {
  return mergePipelineStudentWorks(readStudentWorks());
}

export function useStudentWorksPipeline() {
  const [works, setWorks] = React.useState<StudentWorkItem[]>([]);

  React.useEffect(() => {
    setWorks(readMergedWorks());
    const unsubLegacy = subscribeWorksPipeline(() => setWorks(readMergedWorks()));
    const unsubUnified = subscribeUnifiedMock(() => setWorks(readMergedWorks()));
    return () => {
      unsubLegacy();
      unsubUnified();
    };
  }, []);

  const pending = React.useMemo(() => works.filter((w) => w.status === "pending_review"), [works]);
  const published = React.useMemo(() => works.filter((w) => w.status === "published"), [works]);

  return {
    works,
    pending,
    published,
    submitSameStyle: submitSameStyleWork,
    approve: approveStudentWork,
    reject: rejectStudentWork,
    markDistrictSample: markStudentWorkAsDistrictSample,
  };
}
