"use client";

import type { WorkCreateBody } from "@/types/parent-contract";

let inMemoryWorks: ParentProcessWorkRecord[] = [];

/** 占位 media URL，满足 POST /v1/works 的 videoUrl 形态且无需外链图片域名。 */
export const MOCK_PROCESS_CAPTURE_VIDEO_URL =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect fill="#525252" width="120" height="120" rx="12"/><text x="60" y="68" text-anchor="middle" fill="#fafafa" font-size="11" font-family="system-ui">Mock</text></svg>`,
  );

export type ParentProcessWorkRecord = WorkCreateBody & { id: string; createdAt: string };

function readAll(): ParentProcessWorkRecord[] {
  return [...inMemoryWorks];
}

function writeAll(items: ParentProcessWorkRecord[]) {
  inMemoryWorks = [...items];
}

function newId(): string {
  return `work-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** 会话内「拍照记录」：写入与 POST /v1/works 一致的字段（Mock 用占位 media URL）。 */
export function appendProcessCaptureWork(body: WorkCreateBody): ParentProcessWorkRecord {
  const record: ParentProcessWorkRecord = {
    id: newId(),
    ...body,
    createdAt: new Date().toISOString(),
  };
  writeAll([record, ...readAll()]);
  return record;
}

export function listWorksForStudentExperiment(
  studentUserId: string,
  experimentId: string,
): ParentProcessWorkRecord[] {
  return readAll().filter((w) => w.studentUserId === studentUserId && w.experimentId === experimentId);
}
