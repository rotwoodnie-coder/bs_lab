"use client";

import type { WorkflowEvent } from "@/lib/workflow-events-api";

type WorkflowEventFilter = { resourceType?: string; resourceId?: string };

/** 进程内环形缓冲，不读不写 localStorage（全库真实性 / 无本地持久化） */
let memoryEvents: WorkflowEvent[] = [];
const MEMORY_CAP = 2000;

function nowIso(): string {
  return new Date().toISOString();
}

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `mem-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function appendLocalWorkflowEvent(
  input: Omit<WorkflowEvent, "id" | "createdAt">,
): WorkflowEvent {
  const event: WorkflowEvent = { ...input, id: newId(), createdAt: nowIso() };
  memoryEvents = [event, ...memoryEvents].slice(0, MEMORY_CAP);
  return event;
}

export function readLocalWorkflowEvents(orgId: string, filter?: WorkflowEventFilter): WorkflowEvent[] {
  const rt = filter?.resourceType?.trim();
  const rid = filter?.resourceId?.trim();
  return memoryEvents
    .filter((e) => e.orgId === orgId)
    .filter((e) => (rt ? e.resourceType === rt : true))
    .filter((e) => (rid ? e.resourceId === rid : true))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}
