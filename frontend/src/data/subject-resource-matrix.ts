import { SUBJECT_TREE_ROOT } from "@/data/subject-tree";
import type { EducationPhase, SubjectDiscipline, SubjectNode } from "@/types/subject";

/** 非物质材料候选项（实验编排中的非实体资源，数据） */
export const INTANGIBLE_MATERIAL_CATALOG = [
  "虚拟仿真资源",
  "安全规范文档",
  "数字化实验记录单",
  "教师讲解脚本",
  "评价量规模板",
  "探究任务单（PDF）",
] as const;

export type DisciplineCardModel = SubjectNode & {
  phase: EducationPhase;
  phaseLabel: string;
};

function stableHash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/** 用：各年级已上架实验数量（稳定种子 + 可选轻量波动） */
export function publishedExperimentCount(
  disciplineId: string,
  gradeCode: string,
  tick: number,
): number {
  const base = 5 + (stableHash(`${disciplineId}|${gradeCode}`) % 38);
  const bump = tick % 3;
  return base + bump;
}

export function flattenDisciplineCards(): DisciplineCardModel[] {
  const out: DisciplineCardModel[] = [];
  for (const phaseNode of SUBJECT_TREE_ROOT) {
    if (phaseNode.type !== "phase" || !phaseNode.phase) continue;
    const phaseLabel = phaseNode.label;
    const phase = phaseNode.phase;
    for (const ch of phaseNode.children ?? []) {
      if (ch.type !== "discipline" || !ch.discipline) continue;
      out.push({
        ...ch,
        phase,
        phaseLabel,
      });
    }
  }
  return out;
}

export function defaultIntangibleSelection(
  discipline: SubjectDiscipline,
  gradeCode: string,
): string[] {
  const start = stableHash(`${discipline}|${gradeCode}`) % INTANGIBLE_MATERIAL_CATALOG.length;
  const n = 2 + (stableHash(gradeCode) % 2);
  const res: string[] = [];
  for (let i = 0; i < n; i++) {
    res.push(INTANGIBLE_MATERIAL_CATALOG[(start + i) % INTANGIBLE_MATERIAL_CATALOG.length]!);
  }
  return res;
}
