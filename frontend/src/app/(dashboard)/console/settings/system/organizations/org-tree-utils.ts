import type { V2SysOrgItem } from "@/lib/v2/v2-sys-api";

export { buildOrgTreeFromFlat } from "@/lib/v2/build-org-tree-from-flat";

export function findOrgInTree(tree: V2SysOrgItem[], id: string): V2SysOrgItem | undefined {
  for (const node of tree) {
    if (node.orgId === id) return node;
    if (node.children?.length) {
      const found = findOrgInTree(node.children, id);
      if (found) return found;
    }
  }
  return undefined;
}

export function buildOrgPath(tree: V2SysOrgItem[], id: string): V2SysOrgItem[] {
  for (const node of tree) {
    if (node.orgId === id) return [node];
    if (node.children?.length) {
      const sub = buildOrgPath(node.children, id);
      if (sub.length > 0) return [node, ...sub];
    }
  }
  return [];
}

/** 扁平化子树（不含根节点本身），便于在学校节点下查找年级/班级等后代。 */
export function flattenOrgDescendants(root: V2SysOrgItem | undefined): V2SysOrgItem[] {
  if (!root?.children?.length) return [];
  const out: V2SysOrgItem[] = [];
  const stack = [...root.children];
  while (stack.length > 0) {
    const n = stack.pop();
    if (!n) continue;
    out.push(n);
    if (n.children?.length) stack.push(...n.children);
  }
  return out;
}
