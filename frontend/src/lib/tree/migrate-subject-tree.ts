import { SUBJECT_TREE_ROOT } from "@/data/subject-tree";
import type { SubjectNode } from "@/types/subject";
import type { TreeNode, TreeState } from "@/types/tree";

export const SUBJECT_TREE_LEGACY_STORAGE_KEY = "bs-lab:subject-tree-root:v2";
export const GLOBAL_TREE_STORAGE_KEY = "bs-lab:global-tree:v1";

function phaseMeta(node: SubjectNode) {
  return { kind: "phase", phase: node.phase, source: "subject-tree" } as const;
}

function disciplineMeta(node: SubjectNode) {
  return { kind: "discipline", phase: node.phase, discipline: node.discipline, source: "subject-tree" } as const;
}

function gradeMeta(opts: { phase?: string; discipline?: string; gradeCode: string }) {
  return { kind: "grade", phase: opts.phase, discipline: opts.discipline, gradeCode: opts.gradeCode, source: "subject-tree" } as const;
}

export function migrateSubjectTreeToGenericTree(subjectTree: SubjectNode[]): TreeState {
  const toTree = (n: SubjectNode): TreeNode => {
    if (n.type === "phase") {
      return {
        id: n.id,
        label: n.label,
        meta: phaseMeta(n),
        children: (n.children ?? []).map(toTree),
      };
    }
    // discipline node in legacy model
    const gradeChildren: TreeNode[] = (n.grades ?? []).map((g) => ({
      id: `${n.id}::${g.code}`,
      label: g.label,
      meta: gradeMeta({ phase: n.phase, discipline: n.discipline, gradeCode: g.code }),
      children: [],
    }));
    const disciplineChildren: TreeNode[] = (n.children ?? []).map(toTree);
    return {
      id: n.id,
      label: n.label,
      meta: disciplineMeta(n),
      children: [...gradeChildren, ...disciplineChildren],
    };
  };
  return subjectTree.map(toTree);
}

export function defaultGlobalTreeState(): TreeState {
  return migrateSubjectTreeToGenericTree(SUBJECT_TREE_ROOT);
}

