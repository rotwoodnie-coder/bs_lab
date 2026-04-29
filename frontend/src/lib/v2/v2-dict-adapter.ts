/**
 * V2 字典适配层
 *
 * 目标：把后端 /v2/dict/* 的原始返回统一收口为前端通用可消费结构，
 * 避免各页面自行处理扩展字段和映射规则。
 */
import type { V2DictGradeItem, V2DictItem } from "@/lib/v2/v2-exp-api";

export type DictOption = {
  id: string;
  name: string;
  sortOrder?: number | null;
  comments?: string | null;
  meta?: Record<string, unknown>;
};

export type DictTreeNode = DictOption & {
  children?: DictTreeNode[];
};

function asString(v: unknown): string {
  return typeof v === "string" ? v : String(v ?? "");
}

function asNumberOrNull(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

export function toDictOption(item: V2DictItem): DictOption {
  const { id, name, sortOrder, comments, ...rest } = item as V2DictItem & Record<string, unknown>;
  return {
    id: asString(id),
    name: asString(name),
    sortOrder: asNumberOrNull(sortOrder ?? null),
    comments: typeof comments === "string" ? comments : null,
    meta: Object.keys(rest).length > 0 ? rest : undefined,
  };
}

export function toDictOptions(items: V2DictItem[]): DictOption[] {
  return items.map(toDictOption);
}

export function toGradeOption(item: V2DictGradeItem): DictOption & { levelId: string } {
  const base = toDictOption(item);
  return {
    ...base,
    levelId: asString(item.levelId),
  };
}

export function buildSubjectTree(
  phases: Array<DictOption & { phase: string }>,
  disciplines: Array<DictOption & { phase: string; discipline: string }>,
  grades: Array<DictOption & { levelId: string }>,
): DictTreeNode[] {
  const phaseMap = new Map<string, DictTreeNode>();

  for (const phase of phases) {
    phaseMap.set(phase.id, { ...phase, children: [] });
  }

  const disciplineMap = new Map<string, DictTreeNode>();
  for (const disc of disciplines) {
    const node = { ...disc, children: [] as DictTreeNode[] };
    disciplineMap.set(`${disc.phase}:${disc.discipline}`, node);
    const parent = phaseMap.get(disc.phase);
    if (parent) parent.children!.push(node);
  }

  for (const grade of grades) {
    const parentKey = grade.levelId;
    const parent = phaseMap.get(parentKey) ?? null;
    if (!parent) continue;
    const gradeNode: DictTreeNode = { ...grade };
    parent.children = parent.children ?? [];
    parent.children.push(gradeNode);
  }

  return Array.from(phaseMap.values());
}

export function normalizeDictName(value: unknown): string {
  return asString(value).trim();
}
