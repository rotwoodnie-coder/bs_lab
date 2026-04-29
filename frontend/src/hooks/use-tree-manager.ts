import * as React from "react";

import type { TreeNode, TreeNodeId, TreeState } from "@/types/tree";
import {
  defaultGlobalTreeState,
  GLOBAL_TREE_STORAGE_KEY,
  migrateSubjectTreeToGenericTree,
  SUBJECT_TREE_LEGACY_STORAGE_KEY,
} from "@/lib/tree/migrate-subject-tree";
import { deleteNode, insertNode, moveNode, renameNode } from "@/lib/tree/ops";
import type { SubjectNode } from "@/types/subject";

function safeClone<T>(v: T): T {
  if (typeof structuredClone === "function") return structuredClone(v);
  return JSON.parse(JSON.stringify(v)) as T;
}

function readFromStorage<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeToStorage(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

function newId(prefix = "node") {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return `${prefix}-${crypto.randomUUID()}`;
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export type TreeManagerUpdate =
  | { type: "add"; parentId: TreeNodeId | null; nodeId: TreeNodeId }
  | { type: "rename"; nodeId: TreeNodeId }
  | { type: "delete"; nodeId: TreeNodeId }
  | { type: "move"; nodeId: TreeNodeId; parentId: TreeNodeId | null; index: number }
  | { type: "reset" };

export function useTreeManager(opts?: {
  storageKey?: string;
  initialState?: TreeState;
  /** 为 true 时：无本地快照则不再从 legacy subject-tree 迁移，保留 `initialState` */
  skipLegacyHydration?: boolean;
  onDataUpdate?: (info: { tree: TreeState; update: TreeManagerUpdate }) => void;
}) {
  const storageKey = opts?.storageKey ?? GLOBAL_TREE_STORAGE_KEY;
  const initialState = opts?.initialState ?? defaultGlobalTreeState();

  const [tree, setTree] = React.useState<TreeState>(() => safeClone(readFromStorage<TreeState>(storageKey) ?? initialState));
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    const stored = readFromStorage<TreeState>(storageKey);
    if (stored) {
      setTree(safeClone(stored));
      return;
    }
    if (opts?.skipLegacyHydration) return;
    // One-time migration路径：若存在旧 subject-tree，则迁入 global tree（默认键）。
    const legacy = readFromStorage<SubjectNode[]>(SUBJECT_TREE_LEGACY_STORAGE_KEY);
    if (legacy && legacy.length > 0) {
      const migrated = migrateSubjectTreeToGenericTree(legacy);
      setTree(safeClone(migrated));
      writeToStorage(storageKey, migrated);
    }
  }, [storageKey, opts?.skipLegacyHydration]);

  const commit = React.useCallback(
    (next: TreeState, update: TreeManagerUpdate) => {
      setTree(next);
      writeToStorage(storageKey, next);
      opts?.onDataUpdate?.({ tree: next, update });
    },
    [opts, storageKey],
  );

  const setTreeState = React.useCallback(
    async (next: TreeState) => {
      commit(next, { type: "reset" });
    },
    [commit],
  );

  const addChild = React.useCallback(
    async (parentId: TreeNodeId | null, payload: { label: string; meta?: Record<string, unknown> }) => {
      setBusy(true);
      try {
        const createdId = newId("node");
        const node: TreeNode = { id: createdId, label: payload.label.trim() || "未命名", meta: payload.meta, children: [] };
        const next = insertNode(tree, parentId, node);
        commit(next, { type: "add", parentId, nodeId: createdId });
        return createdId;
      } finally {
        setBusy(false);
      }
    },
    [commit, tree],
  );

  const rename = React.useCallback(
    async (nodeId: TreeNodeId, nextLabel: string) => {
      setBusy(true);
      try {
        const next = renameNode(tree, nodeId, nextLabel);
        commit(next, { type: "rename", nodeId });
      } finally {
        setBusy(false);
      }
    },
    [commit, tree],
  );

  const remove = React.useCallback(
    async (nodeId: TreeNodeId) => {
      setBusy(true);
      try {
        const next = deleteNode(tree, nodeId);
        commit(next, { type: "delete", nodeId });
      } finally {
        setBusy(false);
      }
    },
    [commit, tree],
  );

  const move = React.useCallback(
    async (nodeId: TreeNodeId, target: { parentId: TreeNodeId | null; index: number }) => {
      setBusy(true);
      try {
        const next = moveNode(tree, nodeId, target);
        commit(next, { type: "move", nodeId, parentId: target.parentId, index: target.index });
      } finally {
        setBusy(false);
      }
    },
    [commit, tree],
  );

  const reset = React.useCallback(async () => {
    setBusy(true);
    try {
      const next = safeClone(initialState);
      commit(next, { type: "reset" });
    } finally {
      setBusy(false);
    }
  }, [commit, initialState]);

  return { tree, busy, setTree: setTreeState, addChild, renameNode: rename, deleteNode: remove, moveNode: move, reset };
}

