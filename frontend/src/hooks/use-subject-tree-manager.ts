import * as React from "react";

import { SUBJECT_TREE_ROOT } from "@/data/subject-tree";
import type { SubjectNode } from "@/types/subject";

const STORAGE_KEY = "bs-lab:subject-tree-root:v2";

function safeClone<T>(v: T): T {
  if (typeof structuredClone === "function") return structuredClone(v);
  return JSON.parse(JSON.stringify(v)) as T;
}

function readTreeFromStorage(): SubjectNode[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SubjectNode[];
    if (!Array.isArray(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeTreeToStorage(tree: SubjectNode[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tree));
  } catch {
    /* ignore */
  }
}

function newId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return `${prefix}-${crypto.randomUUID()}`;
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

type MoveDirection = "up" | "down";

function moveInArray<T>(arr: T[], index: number, dir: MoveDirection): T[] {
  const next = [...arr];
  const j = dir === "up" ? index - 1 : index + 1;
  if (j < 0 || j >= next.length) return next;
  const tmp = next[index];
  next[index] = next[j];
  next[j] = tmp;
  return next;
}

function mapTree(tree: SubjectNode[], fn: (n: SubjectNode) => SubjectNode): SubjectNode[] {
  const walk = (n: SubjectNode): SubjectNode => {
    const mapped = fn({ ...n });
    const children = mapped.children ? mapped.children.map(walk) : undefined;
    return children ? { ...mapped, children } : mapped;
  };
  return tree.map(walk);
}

function findNode(tree: SubjectNode[], id: string): SubjectNode | null {
  const stack: SubjectNode[] = [...tree];
  while (stack.length) {
    const cur = stack.shift()!;
    if (cur.id === id) return cur;
    if (cur.children?.length) stack.unshift(...cur.children);
  }
  return null;
}

type SubjectTreeUpdate =
  | { type: "add"; parentId: string; nodeId: string }
  | { type: "rename"; nodeId: string }
  | { type: "move"; nodeId: string; direction: MoveDirection }
  | { type: "delete"; nodeId: string }
  | { type: "reset" };

export function useSubjectTreeManager(opts?: {
  onDataUpdate?: (info: { tree: SubjectNode[]; update: SubjectTreeUpdate }) => void;
}) {
  const [tree, setTree] = React.useState<SubjectNode[]>(() => safeClone(readTreeFromStorage() ?? SUBJECT_TREE_ROOT));
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    const stored = readTreeFromStorage();
    if (stored) setTree(safeClone(stored));
  }, []);

  const commit = React.useCallback(
    (next: SubjectNode[], update: SubjectTreeUpdate) => {
      setTree(next);
      writeTreeToStorage(next);
      opts?.onDataUpdate?.({ tree: next, update });
    },
    [opts],
  );

  const addChild = React.useCallback(
    async (parentId: string, payload: { label: string; type: "discipline" | "grade"; gradeCode?: string }) => {
      setBusy(true);
      try {
        const parent = findNode(tree, parentId);
        if (!parent) return;
        const next = safeClone(tree);
        const createdId = newId(payload.type);

        const createNode = (): SubjectNode => {
          if (payload.type === "discipline") {
            return {
              id: createdId,
              label: payload.label,
              type: "discipline",
              phase: parent.phase,
              discipline: parent.discipline,
              grades: [],
            };
          }
          return {
            id: createdId,
            label: payload.label,
            type: "discipline",
            phase: parent.phase,
            discipline: parent.discipline,
            grades: [{ code: payload.gradeCode ?? createdId.slice(0, 8), label: payload.label }],
          };
        };

        const inserted = mapTree(next, (n) => {
          if (n.id !== parentId) return n;
          const children = [...(n.children ?? [])];
          if (payload.type === "discipline") children.push(createNode());
          else {
            // for "grade", attach to discipline via grades field
            const grades = [...(n.grades ?? [])];
            grades.push({ code: payload.gradeCode ?? createdId.slice(0, 8), label: payload.label });
            return { ...n, grades };
          }
          return { ...n, children };
        });

        commit(inserted, { type: "add", parentId, nodeId: createdId });
      } finally {
        setBusy(false);
      }
    },
    [commit, tree],
  );

  const renameNode = React.useCallback(
    async (nodeId: string, nextLabel: string) => {
      setBusy(true);
      try {
        const next = mapTree(safeClone(tree), (n) => (n.id === nodeId ? { ...n, label: nextLabel } : n));
        commit(next, { type: "rename", nodeId });
      } finally {
        setBusy(false);
      }
    },
    [commit, tree],
  );

  const moveNode = React.useCallback(
    async (nodeId: string, direction: MoveDirection) => {
      setBusy(true);
      try {
        const next = safeClone(tree);

        // move discipline among phase children
        for (const phase of next) {
          const idx = (phase.children ?? []).findIndex((c) => c.id === nodeId);
          if (idx >= 0 && phase.children) {
            phase.children = moveInArray([...phase.children], idx, direction);
            commit(next, { type: "move", nodeId, direction });
            return;
          }
        }

        // move grade within a discipline's grades
        for (const phase of next) {
          for (const d of phase.children ?? []) {
            const idx = (d.grades ?? []).findIndex((g) => `${d.id}::${g.code}` === nodeId || g.code === nodeId);
            if (idx >= 0) {
              const moved = moveInArray([...(d.grades ?? [])], idx, direction);
              d.grades = moved;
              commit(next, { type: "move", nodeId, direction });
              return;
            }
          }
        }
      } finally {
        setBusy(false);
      }
    },
    [commit, tree],
  );

  const deleteNode = React.useCallback(
    async (nodeId: string) => {
      setBusy(true);
      try {
        const next = safeClone(tree);

        // delete discipline node
        for (const phase of next) {
          if (!phase.children?.length) continue;
          const hit = phase.children.some((c) => c.id === nodeId);
          if (hit) {
            phase.children = phase.children.filter((c) => c.id !== nodeId);
            commit(next, { type: "delete", nodeId });
            return;
          }
        }

        // delete grade by code marker: `${disciplineId}::${gradeCode}`
        if (nodeId.includes("::")) {
          const [disciplineId, gradeCode] = nodeId.split("::");
          for (const phase of next) {
            for (const d of phase.children ?? []) {
              if (d.id !== disciplineId) continue;
              d.grades = (d.grades ?? []).filter((g) => g.code !== gradeCode);
              commit(next, { type: "delete", nodeId });
              return;
            }
          }
        }
      } finally {
        setBusy(false);
      }
    },
    [commit, tree],
  );

  const reset = React.useCallback(async () => {
    setBusy(true);
    try {
      const next = safeClone(SUBJECT_TREE_ROOT);
      commit(next, { type: "reset" });
    } finally {
      setBusy(false);
    }
  }, [commit]);

  return { tree, busy, addChild, renameNode, moveNode, deleteNode, reset };
}

