"use client";

import * as React from "react";

import { GlobalTree } from "@/components/business/tree/global-tree";
import type { SubjectPath, SubjectSelection } from "@/lib/subject-taxonomy";
import type { TreeNodeId, TreeState } from "@/types/tree";
import type { EducationPhase, SubjectDiscipline } from "@/types/subject";

type SubjectMetrics = {
  count?: number;
  attention?: boolean;
};

function parsePhase(phase: string): EducationPhase | null {
  if (phase === "primary" || phase === "junior" || phase === "senior") return phase;
  return null;
}

function parseDiscipline(d: string): SubjectDiscipline | null {
  if (d === "science" || d === "physics" || d === "chemistry" || d === "biology") return d;
  return null;
}

function nodeIdToSelection(nodeId: string | null): SubjectSelection | null {
  if (!nodeId) return null;
  if (nodeId.startsWith("phase-")) {
    const phase = parsePhase(nodeId.slice("phase-".length));
    if (!phase) return null;
    return { kind: "phase", phase };
  }
  if (nodeId.includes("::")) {
    const [disciplineNodeId, gradeCode] = nodeId.split("::");
    if (!disciplineNodeId || !gradeCode) return null;
    const [phaseRaw, disciplineRaw] = disciplineNodeId.split("-");
    const phase = parsePhase(phaseRaw ?? "");
    const discipline = parseDiscipline(disciplineRaw ?? "");
    if (!phase || !discipline) return null;
    return { kind: "leaf", leaf: { nodeId: disciplineNodeId, phase, discipline, gradeCode } };
  }
  const [phaseRaw, disciplineRaw] = nodeId.split("-");
  const phase = parsePhase(phaseRaw ?? "");
  const discipline = parseDiscipline(disciplineRaw ?? "");
  if (!phase || !discipline) return null;
  return { kind: "discipline", nodeId, phase, discipline };
}

function selectionToNodeId(sel: SubjectSelection | null): string | null {
  if (!sel) return null;
  if (sel.kind === "phase") return `phase-${sel.phase}`;
  if (sel.kind === "discipline") return sel.nodeId;
  return `${sel.leaf.nodeId}::${sel.leaf.gradeCode}`;
}

export function SubjectSelectionTree(props: {
  /** 独立存储键时可切换树结构（如实验管理年级优先）而不影响其它页 */
  storageKey?: string;
  initialTreeState?: TreeState;
  skipLegacyTreeHydration?: boolean;
  value: SubjectSelection | null;
  onChange: (next: SubjectSelection | null) => void;
  isEditMode?: boolean;
  onEditModeChange?: (next: boolean) => void;
  className?: string;
  showEditToggle?: boolean;
  onSubjectPatch?: (patch: { op: "add"; parentId: string | null; label: string; createdNodeId: string }) => void;
  bottomSlot?: React.ReactNode;
  metrics?: {
    phase?: (phase: EducationPhase) => SubjectMetrics;
    discipline?: (nodeId: string) => SubjectMetrics;
    leaf?: (leaf: SubjectPath) => SubjectMetrics;
  };
  /** 外部触发：收起全部节点（token 变化即触发一次） */
  collapseAllToken?: number;
}) {
  const selectedId = React.useMemo(() => selectionToNodeId(props.value), [props.value]);

  const onSelectId = React.useCallback(
    (id: TreeNodeId | null) => {
      if (id != null && String(id).startsWith("group-")) return;
      props.onChange(nodeIdToSelection(id));
    },
    [props.onChange],
  );

  const metrics = React.useCallback(
    (nodeId: TreeNodeId) => {
      const sel = nodeIdToSelection(nodeId);
      if (!sel) return {};
      if (sel.kind === "phase") return props.metrics?.phase?.(sel.phase) ?? {};
      if (sel.kind === "discipline") return props.metrics?.discipline?.(sel.nodeId) ?? {};
      return props.metrics?.leaf?.(sel.leaf) ?? {};
    },
    [props.metrics?.phase, props.metrics?.discipline, props.metrics?.leaf],
  );

  return (
    <GlobalTree
      storageKey={props.storageKey}
      initialTreeState={props.initialTreeState}
      skipLegacyTreeHydration={props.skipLegacyTreeHydration}
      className={props.className}
      selectedId={selectedId}
      onSelectId={onSelectId}
      isEditMode={props.isEditMode}
      onEditModeChange={props.onEditModeChange}
      showEditToggle={props.showEditToggle}
      onSubjectPatch={props.onSubjectPatch}
      bottomSlot={props.bottomSlot}
      collapseAllToken={props.collapseAllToken}
      metrics={metrics}
    />
  );
}

