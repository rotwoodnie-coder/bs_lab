"use client";

import { normalizeSession, readUnifiedStore } from "../unified-mock-store.core";
import { ensureUnifiedStoreSeeded } from "../unified-mock-store.seed";
import type { UnifiedSessionMock } from "../unified-mock-store.types";
import { getEffectiveWorkSuggestion } from "./ai";

/**
 * 某任务下全部作品的规则预审聚合（教师任务列表「红/绿灯」示意）。
 * **绿灯** = `pass`；**红灯** = `warning` + `error`（含缺媒体等规则异常）。
 */
export function getAiPrecheckStatsForTaskId(taskId: string): {
  /** 预审通过（绿灯） */
  greenPass: number;
  /** 预警 + 异常（红灯合计） */
  redNonPass: number;
  pass: number;
  warning: number;
  error: number;
  workCount: number;
} {
  ensureUnifiedStoreSeeded();
  const store = readUnifiedStore();
  const works = store.works.filter((w) => w.taskId === taskId);
  const sessionMap = new Map(store.sessions.map((s) => [s.sessionId, s]));
  let pass = 0;
  let warning = 0;
  let error = 0;
  for (const w of works) {
    const rawSess = sessionMap.get(w.sessionId);
    if (!rawSess) continue;
    const sess = normalizeSession(rawSess as UnifiedSessionMock);
    const sug = getEffectiveWorkSuggestion(sess, w);
    if (sug.status === "pass") pass += 1;
    else if (sug.status === "warning") warning += 1;
    else error += 1;
  }
  const redNonPass = warning + error;
  return {
    greenPass: pass,
    redNonPass,
    pass,
    warning,
    error,
    workCount: works.length,
  };
}

/** 班级学情：按实验聚合材料难凑反馈次数（与 listUnifiedSessions 同源） */
export function listMaterialShortageByExperiment(): { experimentId: string; shortageCount: number }[] {
  ensureUnifiedStoreSeeded();
  const map = new Map<string, number>();
  for (const raw of readUnifiedStore().sessions) {
    const se = normalizeSession(raw as UnifiedSessionMock);
    if (!se.materialShortageReported) continue;
    map.set(se.experimentId, (map.get(se.experimentId) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([experimentId, shortageCount]) => ({ experimentId, shortageCount }))
    .sort((a, b) => b.shortageCount - a.shortageCount);
}

