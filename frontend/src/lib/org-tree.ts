import type { OrgNode } from "@/types/org";

export function flattenOrgNodes(roots: readonly OrgNode[]): OrgNode[] {
  const out: OrgNode[] = [];
  const walk = (n: OrgNode) => {
    out.push(n);
    for (const c of n.children ?? []) walk(c);
  };
  for (const r of roots) walk(r);
  return out;
}

export function findOrgPathInRoots(roots: readonly OrgNode[], targetId: string): OrgNode[] | null {
  for (const r of roots) {
    const path = findOrgPath(r, targetId);
    if (path) return path;
  }
  return null;
}

export function findOrgPath(root: OrgNode, targetId: string): OrgNode[] | null {
  if (root.id === targetId) return [root];
  for (const c of root.children ?? []) {
    const sub = findOrgPath(c, targetId);
    if (sub) return [root, ...sub];
  }
  return null;
}

