"use client";

/**
 * 学年更替编排（Mock）：快照冻结 → 身份跃迁 → 档案隔离。
 * 真源在 `unified-mock-store`；此处暴露产品常量、入口与跨模块事件。
 */

import {
  ACADEMIC_YEAR_CHANGED_EVENT,
  INITIAL_MOCK_ACADEMIC_YEAR,
  type AcademicYearChangedDetail,
} from "@/lib/academic-context";
import { simulateAcademicPromotionInUnifiedStore } from "@/lib/unified-mock-store";

/** 与 PRD 一致：当前（初始）学年标签 */
export const CURRENT_ACADEMIC_YEAR = INITIAL_MOCK_ACADEMIC_YEAR;

const RESEARCHER_YEAR_LABEL_KEY = "bs-lab:researcher-catalog-academic-year-label";

export type SimulateAcademicPromotionResult = {
  oldYear: string;
  newYear: string;
  snapshotKey: string;
};

/**
 * 执行一轮学年更替：统一仓变更 + 快照写入 localStorage + 派发 `ACADEMIC_YEAR_CHANGED_EVENT`。
 */
export function simulateAcademicPromotion(): SimulateAcademicPromotionResult {
  const result = simulateAcademicPromotionInUnifiedStore();
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(RESEARCHER_YEAR_LABEL_KEY, result.newYear);
    } catch {
      /* ignore */
    }
    window.dispatchEvent(
      new CustomEvent(ACADEMIC_YEAR_CHANGED_EVENT, {
        detail: { academicYear: result.newYear, previousYear: result.oldYear } satisfies AcademicYearChangedDetail,
      }),
    );
  }
  return result;
}

export function readResearcherCatalogAcademicYearLabel(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(RESEARCHER_YEAR_LABEL_KEY);
  } catch {
    return null;
  }
}

export function subscribeAcademicYearChanged(cb: (d: AcademicYearChangedDetail) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = (e: Event) => {
    const ce = e as CustomEvent<AcademicYearChangedDetail>;
    if (ce.detail) cb(ce.detail);
  };
  window.addEventListener(ACADEMIC_YEAR_CHANGED_EVENT, handler);
  return () => window.removeEventListener(ACADEMIC_YEAR_CHANGED_EVENT, handler);
}
