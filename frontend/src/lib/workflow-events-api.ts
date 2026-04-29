"use client";

import type { ApiActor } from "@/lib/new-core-api";
import { readLocalWorkflowEvents } from "@/lib/workflow-events-local";

export type WorkflowEvent = {
  id: string;
  orgId: string;
  type: string;
  actorId: string;
  actorName: string;
  resourceType: string;
  resourceId: string;
  payload: Record<string, unknown>;
  createdAt: string;
};

export async function listWorkflowEvents(
  actor: ApiActor,
  limit = 30,
  filter?: { resourceType?: string; resourceId?: string },
): Promise<WorkflowEvent[]> {
  const localEvents = readLocalWorkflowEvents(actor.orgId, filter);
  const merged = [...localEvents];
  merged.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return merged.slice(0, limit);
}

