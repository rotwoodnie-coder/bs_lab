import type { CatalogCore } from "@/lib/experiment-catalog-api";

import type { SchoolDimensionSnapshot, SchoolLevelTreeNode } from "../education/subject-grades/page.types";

function collectLevelTreeNodes(roots: SchoolLevelTreeNode[]): Map<string, SchoolLevelTreeNode> {
  const m = new Map<string, SchoolLevelTreeNode>();
  const walk = (items: SchoolLevelTreeNode[]) => {
    for (const n of items) {
      m.set(n.id, n);
      const ch = n.children as SchoolLevelTreeNode[] | undefined;
      if (ch?.length) walk(ch);
    }
  };
  walk(roots);
  return m;
}

function gradeSortOrder(snapshot: SchoolDimensionSnapshot, gradeId: string): number {
  return snapshot.grades.find((g) => g.gradeId === gradeId)?.sortOrder ?? -1;
}

/** 目录行是否包含指定年级（映射表真源）。 */
function rowCoversGrade(snapshot: SchoolDimensionSnapshot, row: CatalogCore, gradeId: string): boolean {
  const ids = row.gradeIds ?? [];
  if (ids.length > 0) return ids.some((id) => String(id) === String(gradeId));
  const g = gradeSortOrder(snapshot, gradeId);
  return g >= 0;
}

/** 判断目录行是否属于当前选中的教学架构树节点（与教学维度 ID 对齐）。 */
export function catalogRowMatchesArchitectureNode(
  row: CatalogCore,
  node: SchoolLevelTreeNode,
  snapshot: SchoolDimensionSnapshot | null,
): boolean {
  if (!snapshot) return true;
  if (node.nodeType === "level") {
    return row.stageId === node.levelId;
  }
  if (node.nodeType === "grade") {
    if (row.stageId !== node.levelId || !node.gradeId) return false;
    if (node.subjectId && row.subjectId !== node.subjectId) return false;
    return rowCoversGrade(snapshot, row, node.gradeId);
  }
  if (node.nodeType === "subject") {
    if (row.stageId !== node.levelId || row.subjectId !== node.subjectId) return false;
    if (node.gradeId) return rowCoversGrade(snapshot, row, node.gradeId);
    return true;
  }
  return false;
}

export function filterCatalogByArchitectureSelection(
  items: CatalogCore[],
  nodeId: string | null,
  treeRoots: SchoolLevelTreeNode[],
  snapshot: SchoolDimensionSnapshot | null,
): CatalogCore[] {
  if (!nodeId || !snapshot) return items;
  const map = collectLevelTreeNodes(treeRoots);
  const node = map.get(nodeId);
  if (!node) return items;
  return items.filter((r) => catalogRowMatchesArchitectureNode(r, node, snapshot));
}

export function catalogArchitectureNodeMetrics(
  items: CatalogCore[],
  treeRoots: SchoolLevelTreeNode[],
  snapshot: SchoolDimensionSnapshot | null,
): (nodeId: string) => { count: number } {
  const map = collectLevelTreeNodes(treeRoots);
  return (nodeId: string) => {
    const node = map.get(nodeId);
    if (!node || !snapshot) return { count: 0 };
    const count = items.filter((row) => catalogRowMatchesArchitectureNode(row, node, snapshot)).length;
    return { count };
  };
}
