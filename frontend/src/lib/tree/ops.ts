import type { TreeNode, TreeNodeId, TreeState } from "@/types/tree";

export type TreePathSegment = { id: TreeNodeId; index: number };
export type TreePath = TreePathSegment[];

function childrenOf(node: TreeNode): TreeNode[] {
  return node.children ? [...node.children] : [];
}

function cloneNode(node: TreeNode): TreeNode {
  return {
    ...node,
    meta: node.meta ? { ...node.meta } : undefined,
    children: node.children ? node.children.map(cloneNode) : undefined,
  };
}

function cloneState(state: TreeState): TreeState {
  return state.map(cloneNode);
}

export function findNodePath(state: TreeState, nodeId: TreeNodeId): TreePath | null {
  const dfs = (nodes: TreeNode[], base: TreePath): TreePath | null => {
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i]!;
      const nextBase = [...base, { id: n.id, index: i }];
      if (n.id === nodeId) return nextBase;
      if (n.children?.length) {
        const hit = dfs(n.children, nextBase);
        if (hit) return hit;
      }
    }
    return null;
  };
  return dfs(state, []);
}

export function getNodeById(state: TreeState, nodeId: TreeNodeId): TreeNode | null {
  const path = findNodePath(state, nodeId);
  if (!path) return null;
  let nodes: TreeNode[] = state;
  for (const seg of path) {
    const n = nodes[seg.index];
    if (!n || n.id !== seg.id) return null;
    if (seg.id === nodeId) return n;
    nodes = n.children ?? [];
  }
  return null;
}

export function renameNode(state: TreeState, nodeId: TreeNodeId, label: string): TreeState {
  const nextLabel = label.trim();
  if (!nextLabel) return state;
  const next = cloneState(state);
  const node = getNodeById(next, nodeId);
  if (!node) return state;
  node.label = nextLabel;
  return next;
}

export function insertNode(state: TreeState, parentId: TreeNodeId | null, node: TreeNode, index?: number): TreeState {
  const next = cloneState(state);
  const n = cloneNode(node);

  if (!parentId) {
    const at = index == null ? next.length : Math.max(0, Math.min(next.length, index));
    next.splice(at, 0, n);
    return next;
  }

  const parent = getNodeById(next, parentId);
  if (!parent) return state;
  const kids = childrenOf(parent);
  const at = index == null ? kids.length : Math.max(0, Math.min(kids.length, index));
  kids.splice(at, 0, n);
  parent.children = kids;
  return next;
}

export function deleteNode(state: TreeState, nodeId: TreeNodeId): TreeState {
  const path = findNodePath(state, nodeId);
  if (!path) return state;
  const next = cloneState(state);
  if (path.length === 1) {
    next.splice(path[0]!.index, 1);
    return next;
  }
  const parentSeg = path[path.length - 2]!;
  const parent = getNodeById(next, parentSeg.id);
  if (!parent) return state;
  const kids = childrenOf(parent);
  kids.splice(path[path.length - 1]!.index, 1);
  parent.children = kids;
  return next;
}

function collectDescendantIds(node: TreeNode): Set<TreeNodeId> {
  const out = new Set<TreeNodeId>();
  const stack: TreeNode[] = [...(node.children ?? [])];
  while (stack.length) {
    const cur = stack.pop()!;
    out.add(cur.id);
    if (cur.children?.length) stack.push(...cur.children);
  }
  return out;
}

export type MoveTarget = {
  parentId: TreeNodeId | null;
  index: number;
};

/**
 * Move a node (and its whole subtree) under a new parent at a given index.
 * - parentId=null means move to root.
 * - Prevents moving a node into its own descendant subtree.
 */
export function moveNode(state: TreeState, nodeId: TreeNodeId, target: MoveTarget): TreeState {
  const fromPath = findNodePath(state, nodeId);
  if (!fromPath) return state;
  const currentNode = getNodeById(state, nodeId);
  if (!currentNode) return state;

  if (target.parentId) {
    const descendants = collectDescendantIds(currentNode);
    if (descendants.has(target.parentId)) return state;
    if (target.parentId === nodeId) return state;
  }

  const next = cloneState(state);
  const moving = getNodeById(next, nodeId);
  if (!moving) return state;

  // Remove from old location.
  const fromPath2 = findNodePath(next, nodeId);
  if (!fromPath2) return state;
  if (fromPath2.length === 1) {
    next.splice(fromPath2[0]!.index, 1);
  } else {
    const parentSeg = fromPath2[fromPath2.length - 2]!;
    const parent = getNodeById(next, parentSeg.id);
    if (!parent) return state;
    const kids = childrenOf(parent);
    kids.splice(fromPath2[fromPath2.length - 1]!.index, 1);
    parent.children = kids;
  }

  // Insert into new location.
  if (!target.parentId) {
    const at = Math.max(0, Math.min(next.length, target.index));
    next.splice(at, 0, moving);
    return next;
  }
  const newParent = getNodeById(next, target.parentId);
  if (!newParent) return state;
  const kids = childrenOf(newParent);
  const at = Math.max(0, Math.min(kids.length, target.index));
  kids.splice(at, 0, moving);
  newParent.children = kids;
  return next;
}

export function reorderSiblings(
  state: TreeState,
  parentId: TreeNodeId | null,
  fromIndex: number,
  toIndex: number,
): TreeState {
  if (fromIndex === toIndex) return state;
  const next = cloneState(state);
  const arr = parentId ? childrenOf(getNodeById(next, parentId) ?? ({} as TreeNode)) : next;
  if (parentId) {
    const parent = getNodeById(next, parentId);
    if (!parent) return state;
    const kids = childrenOf(parent);
    const max = kids.length - 1;
    const from = Math.max(0, Math.min(max, fromIndex));
    const to = Math.max(0, Math.min(max, toIndex));
    const [item] = kids.splice(from, 1);
    if (!item) return state;
    kids.splice(to, 0, item);
    parent.children = kids;
    return next;
  }
  const max = next.length - 1;
  const from = Math.max(0, Math.min(max, fromIndex));
  const to = Math.max(0, Math.min(max, toIndex));
  const [item] = next.splice(from, 1);
  if (!item) return state;
  next.splice(to, 0, item);
  return next;
}

