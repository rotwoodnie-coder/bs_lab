"use client";

export type ResearchGroupStatsSnapshot = {
  avgCompletionPct: number;
  sessionCount: number;
  completedCount: number;
  computedAt: string;
};

export type ResearchGroupFocus = { focusExperimentIds?: string[] };

export function computeResearchGroupStatsSnapshot(_group: ResearchGroupFocus): ResearchGroupStatsSnapshot {
  return {
    avgCompletionPct: 0,
    sessionCount: 0,
    completedCount: 0,
    computedAt: new Date().toISOString(),
  };
}

export const RESEARCH_GROUP_COMPLETION_THRESHOLD_PCT = 80;
