import { SUBJECT_TREE_ROOT } from "@/data/subject-tree";
import type { EducationPhase, SubjectDiscipline, SubjectNode } from "@/types/subject";

let LABEL_INDEX:
  | Map<
      string,
      {
        nodeId: string;
        phase: EducationPhase;
        discipline: SubjectDiscipline;
        gradeCode: string;
      }
    >
  | null = null;

function getLabelIndex() {
  if (LABEL_INDEX) return LABEL_INDEX;
  const map = new Map<
    string,
    { nodeId: string; phase: EducationPhase; discipline: SubjectDiscipline; gradeCode: string }
  >();
  for (const phaseNode of SUBJECT_TREE_ROOT) {
    if (!phaseNode.phase) continue;
    const phaseLabel = phaseNode.label;
    for (const disciplineNode of phaseNode.children ?? []) {
      if (disciplineNode.type !== "discipline" || !disciplineNode.discipline) continue;
      const disciplineLabel = disciplineNode.label;
      for (const g of disciplineNode.grades ?? []) {
        const key = `${phaseLabel}||${disciplineLabel}||${g.label}`;
        map.set(key, {
          nodeId: disciplineNode.id,
          phase: phaseNode.phase,
          discipline: disciplineNode.discipline,
          gradeCode: g.code,
        });
      }
    }
  }
  LABEL_INDEX = map;
  return map;
}

export type SubjectPath = {
  /** discipline node id, e.g. `senior-physics` */
  nodeId: string;
  phase: EducationPhase;
  discipline: SubjectDiscipline;
  /** grade code, e.g. `S2` */
  gradeCode: string;
};

export type SubjectSelection =
  | { kind: "phase"; phase: EducationPhase }
  | { kind: "discipline"; nodeId: string; phase: EducationPhase; discipline: SubjectDiscipline }
  | { kind: "leaf"; leaf: SubjectPath };

export type SubjectLeaf = SubjectPath & {
  phaseLabel: string;
  disciplineLabel: string;
  gradeLabel: string;
};

export type SubjectTreeVisibility = {
  /** allowlist discipline node ids; omit means allow all */
  allowedNodeIds?: readonly string[];
  /** fine-grained filter for leaves */
  predicate?: (leaf: SubjectLeaf) => boolean;
};

export const SUBJECT_QUERY_KEY = "subject";

export function encodeSubjectLeafToQuery(leaf: SubjectPath): string {
  return `${leaf.nodeId}::${leaf.gradeCode}`;
}

export function decodeSubjectLeafFromQuery(raw: string | null): SubjectPath | null {
  if (!raw) return null;
  const [nodeId, gradeCode] = raw.split("::");
  if (!nodeId || !gradeCode) return null;
  const node = findDisciplineNode(nodeId);
  if (!node || !node.phase || !node.discipline) return null;
  const gradeHit = (node.grades ?? []).some((g) => g.code === gradeCode);
  if (!gradeHit) return null;
  return { nodeId, phase: node.phase, discipline: node.discipline, gradeCode };
}

export function encodeSubjectSelectionToQuery(sel: SubjectSelection): string {
  if (sel.kind === "phase") return `phase:${sel.phase}`;
  if (sel.kind === "discipline") return `discipline:${sel.nodeId}`;
  return `leaf:${encodeSubjectLeafToQuery(sel.leaf)}`;
}

export function decodeSubjectSelectionFromQuery(raw: string | null): SubjectSelection | null {
  if (!raw) return null;
  if (raw.startsWith("phase:")) {
    const phase = raw.slice("phase:".length) as EducationPhase;
    if (!phase) return null;
    if (!SUBJECT_TREE_ROOT.some((p) => p.phase === phase)) return null;
    return { kind: "phase", phase };
  }
  if (raw.startsWith("discipline:")) {
    const nodeId = raw.slice("discipline:".length);
    if (!nodeId) return null;
    const node = findDisciplineNode(nodeId);
    if (!node || !node.phase || !node.discipline) return null;
    return { kind: "discipline", nodeId, phase: node.phase, discipline: node.discipline };
  }
  if (raw.startsWith("leaf:")) {
    const leaf = decodeSubjectLeafFromQuery(raw.slice("leaf:".length));
    if (!leaf) return null;
    return { kind: "leaf", leaf };
  }
  // Back-compat: treat as leaf encoding
  const leaf = decodeSubjectLeafFromQuery(raw);
  return leaf ? { kind: "leaf", leaf } : null;
}

export function readSubjectLeafFromSearchParams(params: URLSearchParams): SubjectPath | null {
  return decodeSubjectLeafFromQuery(params.get(SUBJECT_QUERY_KEY));
}

export function writeSubjectLeafToSearchParams(params: URLSearchParams, leaf: SubjectPath | null): URLSearchParams {
  const next = new URLSearchParams(params);
  if (!leaf) next.delete(SUBJECT_QUERY_KEY);
  else next.set(SUBJECT_QUERY_KEY, encodeSubjectLeafToQuery(leaf));
  return next;
}

export function readSubjectSelectionFromSearchParams(params: URLSearchParams): SubjectSelection | null {
  return decodeSubjectSelectionFromQuery(params.get(SUBJECT_QUERY_KEY));
}

export function writeSubjectSelectionToSearchParams(
  params: URLSearchParams,
  sel: SubjectSelection | null,
): URLSearchParams {
  const next = new URLSearchParams(params);
  if (!sel) next.delete(SUBJECT_QUERY_KEY);
  else next.set(SUBJECT_QUERY_KEY, encodeSubjectSelectionToQuery(sel));
  return next;
}

export function findDisciplineNode(nodeId: string): SubjectNode | null {
  for (const phaseNode of SUBJECT_TREE_ROOT) {
    for (const d of phaseNode.children ?? []) {
      if (d.id === nodeId) return d;
    }
  }
  return null;
}

export function listSubjectLeaves(visibility?: SubjectTreeVisibility): SubjectLeaf[] {
  const allowed = visibility?.allowedNodeIds ? new Set(visibility.allowedNodeIds) : null;
  const out: SubjectLeaf[] = [];
  for (const phaseNode of SUBJECT_TREE_ROOT) {
    if (phaseNode.type !== "phase" || !phaseNode.phase) continue;
    const phase = phaseNode.phase;
    const phaseLabel = phaseNode.label;
    for (const d of phaseNode.children ?? []) {
      if (d.type !== "discipline" || !d.discipline) continue;
      if (allowed && !allowed.has(d.id)) continue;
      const discipline = d.discipline;
      const disciplineLabel = d.label;
      for (const g of d.grades ?? []) {
        const leaf: SubjectLeaf = {
          nodeId: d.id,
          phase,
          discipline,
          gradeCode: g.code,
          phaseLabel,
          disciplineLabel,
          gradeLabel: g.label,
        };
        if (visibility?.predicate && !visibility.predicate(leaf)) continue;
        out.push(leaf);
      }
    }
  }
  return out;
}

export function labelsForSubjectLeaf(leaf: SubjectLeaf | SubjectPath): {
  phaseLabel: string;
  disciplineLabel: string;
  gradeLabel: string;
} {
  if ("phaseLabel" in leaf && "disciplineLabel" in leaf && "gradeLabel" in leaf) {
    return { phaseLabel: leaf.phaseLabel, disciplineLabel: leaf.disciplineLabel, gradeLabel: leaf.gradeLabel };
  }
  const node = findDisciplineNode(leaf.nodeId);
  if (!node) return { phaseLabel: "", disciplineLabel: "", gradeLabel: "" };
  const phaseLabel = SUBJECT_TREE_ROOT.find((p) => p.phase === leaf.phase)?.label ?? "";
  const gradeLabel = (node.grades ?? []).find((g) => g.code === leaf.gradeCode)?.label ?? "";
  return { phaseLabel, disciplineLabel: node.label, gradeLabel };
}

export function subjectLeafEquals(a: SubjectPath | null, b: SubjectPath | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return a.nodeId === b.nodeId && a.gradeCode === b.gradeCode;
}

export function subjectSelectionEquals(a: SubjectSelection | null, b: SubjectSelection | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  if (a.kind !== b.kind) return false;
  if (a.kind === "phase" && b.kind === "phase") return a.phase === b.phase;
  if (a.kind === "discipline" && b.kind === "discipline") return a.nodeId === b.nodeId;
  if (a.kind === "leaf" && b.kind === "leaf") return subjectLeafEquals(a.leaf, b.leaf);
  return false;
}

export function selectionMatchesLeaf(sel: SubjectSelection | null, leaf: SubjectPath): boolean {
  if (!sel) return true;
  if (sel.kind === "leaf") return subjectLeafEquals(sel.leaf, leaf);
  if (sel.kind === "discipline") return sel.nodeId === leaf.nodeId;
  return sel.phase === leaf.phase;
}

/**
 * Parse row labels like `高中 · 物理` + `高一` into a SubjectPath.
 * Returns null when labels cannot be mapped into the subject taxonomy.
 */
export function subjectPathFromLabels(opts: {
  subjectLabel: string;
  gradeLabel: string;
}): SubjectPath | null {
  const [phaseLabelRaw, disciplineLabelRaw] = opts.subjectLabel.split("·");
  const phaseLabel = phaseLabelRaw?.trim() ?? "";
  const disciplineLabel = disciplineLabelRaw?.trim() ?? "";
  if (!phaseLabel || !disciplineLabel) return null;

  const hit = getLabelIndex().get(`${phaseLabel}||${disciplineLabel}||${opts.gradeLabel}`);
  if (!hit) return null;
  return { nodeId: hit.nodeId, phase: hit.phase, discipline: hit.discipline, gradeCode: hit.gradeCode };
}

