"use client";

import { EDITOR_PEER_WORKFLOW_LABEL, editorPeerLifecycleForRow } from "@/app/(dashboard)/teacher/experiment-editor/utils/editor-peer-row-types";
import { readExperimentMgmtRows } from "@/lib/experiment-mgmt-mock-store";
import type { AssignableExperimentOption } from "../unified-mock-store.types";
import { BAOSHAN_ASSIGNABLE_META, BAOSHAN_EXPERIMENT_ID_SET } from "../unified-mock-store.types";
import { ensureUnifiedStoreSeeded } from "../unified-mock-store.seed";

/** 区本宝山种子或 experiment-mgmt 中 workflowStatus === published 方可下发 */
export function isExperimentPublishedForAssignment(experimentId: string): boolean {
  if (BAOSHAN_EXPERIMENT_ID_SET.has(experimentId)) return true;
  const row = readExperimentMgmtRows().find((r) => r.id === experimentId);
  if (!row) return false;
  const lifecycle = editorPeerLifecycleForRow(row);
  return lifecycle === "PUBLISHED" || lifecycle === "STANDARD";
}

export function getExperimentAssignmentBlockReason(experimentId: string): string | null {
  if (isExperimentPublishedForAssignment(experimentId)) return null;
  if (BAOSHAN_EXPERIMENT_ID_SET.has(experimentId)) return null;
  const row = readExperimentMgmtRows().find((r) => r.id === experimentId);
  if (!row) {
    return "该实验不在台账中或未配置 id，请从「已上架」列表或区本条目选择。";
  }
  return `「${row.title}」当前为「${EDITOR_PEER_WORKFLOW_LABEL[row.workflowStatus]}」，需教研审核上架后方可下发。`;
}

/** 教师「从实验库新建」下拉：仅已上架台账 + 宝山种子 */
export function listAssignableExperimentsForTeacher(): AssignableExperimentOption[] {
  ensureUnifiedStoreSeeded();
  const byId = new Map<string, AssignableExperimentOption>();
  for (const r of readExperimentMgmtRows()) {
    const lifecycle = editorPeerLifecycleForRow(r);
    if (lifecycle !== "PUBLISHED" && lifecycle !== "STANDARD") continue;
    byId.set(r.id, {
      id: r.id,
      title: r.title,
      gradeLabel: r.gradeLabels[0] ?? "—",
      subjectLabel: r.subjectLabel.replace(/^高中 · /, "").trim() || r.subjectLabel,
    });
  }
  for (const id of BAOSHAN_EXPERIMENT_ID_SET) {
    const meta = BAOSHAN_ASSIGNABLE_META[id];
    if (meta) byId.set(id, { id, ...meta });
  }
  return [...byId.values()].sort((a, b) => a.title.localeCompare(b.title, "zh-CN"));
}

