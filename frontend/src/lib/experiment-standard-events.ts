"use client";

/** 教研员「提拔区本标准」后跨页面广播（闭环 B 最小联动） */

export const EXPERIMENT_STANDARD_PROMOTED_EVENT = "bs-lab:experiment-standard-promoted" as const;

export type ExperimentStandardPromotedDetail = {
  experimentId: string;
  isStandard: boolean;
  contentVersion?: number;
};

export function emitExperimentStandardPromoted(detail: ExperimentStandardPromotedDetail) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(EXPERIMENT_STANDARD_PROMOTED_EVENT, { detail }));
}

export function subscribeExperimentStandardPromoted(
  handler: (detail: ExperimentStandardPromotedDetail) => void,
): () => void {
  if (typeof window === "undefined") return () => {};
  const fn = (e: Event) => {
    const ce = e as CustomEvent<ExperimentStandardPromotedDetail>;
    if (ce.detail) handler(ce.detail);
  };
  window.addEventListener(EXPERIMENT_STANDARD_PROMOTED_EVENT, fn);
  return () => window.removeEventListener(EXPERIMENT_STANDARD_PROMOTED_EVENT, fn);
}
