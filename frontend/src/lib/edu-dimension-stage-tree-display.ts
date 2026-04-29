import type { SchoolLevelTreeNode } from "@/app/(dashboard)/console/settings/education/subject-grades/page.types";

/** 叶子记 1，父节点为子节点计数之和（用于展示「当前条目数」与裁剪空枝）。 */
export function buildStageTreeDisplayCountMap(nodes: SchoolLevelTreeNode[]): Map<string, number> {
  const map = new Map<string, number>();

  const walk = (item: SchoolLevelTreeNode): number => {
    const children = (item.children as SchoolLevelTreeNode[] | undefined) ?? [];
    if (children.length === 0) {
      map.set(item.id, 1);
      return 1;
    }
    let sum = 0;
    for (const ch of children) {
      sum += walk(ch);
    }
    map.set(item.id, sum);
    return sum;
  };

  for (const n of nodes) {
    walk(n);
  }
  return map;
}

/** 移除计数为 0 的节点；父节点在子节点全部被移除后一并移除。 */
export function pruneStageTreeByDisplayCounts(
  nodes: SchoolLevelTreeNode[],
  countById: Map<string, number>,
): SchoolLevelTreeNode[] {
  const out: SchoolLevelTreeNode[] = [];
  for (const item of nodes) {
    const self = countById.get(item.id) ?? 0;
    if (self <= 0) continue;
    const raw = (item.children as SchoolLevelTreeNode[] | undefined) ?? [];
    if (raw.length === 0) {
      out.push(item);
      continue;
    }
    const nextChildren = pruneStageTreeByDisplayCounts(raw, countById);
    if (nextChildren.length === 0) continue;
    out.push({ ...item, children: nextChildren });
  }
  return out;
}

export function applyStageTreeDisplayTransforms(
  source: SchoolLevelTreeNode[],
  hideZeroCount: boolean,
): { tree: SchoolLevelTreeNode[]; countById: Map<string, number> } {
  const countById = buildStageTreeDisplayCountMap(source);
  if (!hideZeroCount) {
    return { tree: source, countById };
  }
  const tree = pruneStageTreeByDisplayCounts(source, countById);
  const recount = buildStageTreeDisplayCountMap(tree);
  return { tree, countById: recount };
}
