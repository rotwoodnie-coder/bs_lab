"use client";

import type { AiSuggestionStatus, AiWorkSuggestion, UnifiedSessionMock, UnifiedWorkMock } from "../unified-mock-store.types";
import { normalizeSession } from "../unified-mock-store.core";
import { ensureUnifiedStoreSeeded } from "../unified-mock-store.seed";

function workMediaIsEmpty(work: UnifiedWorkMock): boolean {
  const p = work.mediaMock.photoUrl?.trim();
  const v = work.mediaMock.videoUrl?.trim();
  return !p && !v;
}

/**
 * P0 规则预审：优先缺媒体 → error；其次错误预警过多 → warning；否则 pass。
 */
export function calculateWorkSuggestion(session: UnifiedSessionMock, work: UnifiedWorkMock): AiWorkSuggestion {
  const s = normalizeSession(session);
  const flags: string[] = [];
  if (s.errorCount > 3) flags.push("错题较多");
  if (workMediaIsEmpty(work)) {
    return {
      status: "error",
      reason: "缺关键帧或媒体为空",
      flags,
    };
  }
  if (s.errorCount > 3) {
    return {
      status: "warning",
      reason: "互动中错误预警较多",
      flags,
    };
  }
  return {
    status: "pass",
    reason: "规则预审：未发现异常",
    flags: [],
  };
}

export function getEffectiveWorkSuggestion(session: UnifiedSessionMock, work: UnifiedWorkMock): AiWorkSuggestion {
  return work.ai_suggestion ?? calculateWorkSuggestion(session, work);
}

/** 供教师抽屉「AI 摘要」：基于会话日志的 Mock 一句话 */
export function buildSessionLogSummary(session: UnifiedSessionMock, work: UnifiedWorkMock): string {
  const s = normalizeSession(session);
  const bits: string[] = [];
  if (s.errorCount > 0) bits.push(`互动累计错误预警 ${s.errorCount} 次`);
  if (s.parent_attested_at) bits.push("家长已陪同确认");
  if (s.materialShortageReported) bits.push("家长反馈材料难凑齐");
  bits.push(`已归档素材「${work.title}」`);
  return `${bits.join("；")}。建议结合预审标签优先处理异常项。`;
}

export function suggestionSortPriority(status: AiSuggestionStatus): number {
  if (status === "error") return 0;
  if (status === "warning") return 1;
  return 2;
}

export function ensureAiSeeded() {
  // 保持行为等价：原实现依赖 ensureSeeded() 触发 store 初始化
  ensureUnifiedStoreSeeded();
}

