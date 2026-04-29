import { SUBJECT_TREE_ROOT } from "@/data/subject-tree";
import type { TreeNode, TreeState } from "@/types/tree";

/**
 * 实验管理「学科树」：学段 → 年级 → 学科（叶子 id 仍为 `disciplineId::gradeCode`，与 URL/筛选一致）。
 */
export function defaultGradeFirstGlobalTreeState(): TreeState {
  const phases = SUBJECT_TREE_ROOT.filter((p) => p.type === "phase" && p.phase);
  return phases.map((phaseNode) => {
    const phase = phaseNode.phase!;
    const codeToLabel = new Map<string, string>();
    for (const d of phaseNode.children ?? []) {
      for (const g of d.grades ?? []) {
        if (!codeToLabel.has(g.code)) codeToLabel.set(g.code, g.label);
      }
    }
    const codes = [...codeToLabel.keys()].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    const gradeGroups: TreeNode[] = codes.map((code) => {
      const label = codeToLabel.get(code) ?? code;
      const discChildren: TreeNode[] = (phaseNode.children ?? [])
        .filter((d) => d.type === "discipline" && (d.grades ?? []).some((g) => g.code === code))
        .map((d) => ({
          id: `${d.id}::${code}`,
          label: d.label,
          meta: {
            kind: "discipline",
            phase: d.phase,
            discipline: d.discipline,
            gradeCode: code,
            source: "subject-tree-grade-first",
          },
          children: [],
        }));
      return {
        id: `group-${phase}-${code}`,
        label,
        meta: { kind: "gradeGroup", phase, gradeCode: code, source: "subject-tree-grade-first" },
        children: discChildren,
      };
    });
    return {
      id: phaseNode.id,
      label: phaseNode.label,
      meta: { kind: "phase", phase, source: "subject-tree" },
      children: gradeGroups,
    };
  });
}

/** 模块级常量，避免父组件每次 render 传入新引用导致树状态重置 */
export const GRADE_FIRST_SUBJECT_TREE_INITIAL = defaultGradeFirstGlobalTreeState();
