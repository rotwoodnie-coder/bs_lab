"use client";

import { readExperimentMgmtRows, writeExperimentMgmtRows } from "@/lib/experiment-mgmt-mock-store";
import { emitExperimentStandardPromoted } from "@/lib/experiment-standard-events";

/**
 * 闭环 B：评审通过后，将方案标记为区本标准谱系中的「采纳范例」并递增版本。
 * 成功后广播 `emitExperimentStandardPromoted`，供任务中心等订阅（Mock 联动层）。
 */
export function promoteExperimentToDistrictStandard(
  experimentId: string,
  opts?: { commentary?: string },
): boolean {
  if (typeof window === "undefined") return false;
  const rows = readExperimentMgmtRows();
  const idx = rows.findIndex((r) => r.id === experimentId);
  if (idx < 0) return false;
  const row = rows[idx]!;
  const tags = [...new Set([...row.tags, "采纳范例"])];
  const nextContentVersion = (row.contentVersion ?? 1) + 1;
  const next = {
    ...row,
    isStandard: true,
    tags,
    contentVersion: nextContentVersion,
    lastReviewComment: opts?.commentary?.trim() || row.lastReviewComment,
  };
  const copy = [...rows];
  copy[idx] = next;
  writeExperimentMgmtRows(copy);
  emitExperimentStandardPromoted({
    experimentId,
    isStandard: true,
    contentVersion: nextContentVersion,
  });
  return true;
}
