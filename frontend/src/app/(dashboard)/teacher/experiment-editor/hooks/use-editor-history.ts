import * as React from "react";

export type EditorHistoryState<T> = {
  present: T;
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  set: (next: T) => void;
  reset: (next: T) => void;
};

/**
 * 撤销/重做通用封装。
 *
 * 约束：为了保证“行为 100% 等价”，本 feature 当前不会强制把它接入到页面状态；
 * 仅提供可复用能力，后续接入时应确保与现有受控表单交互一致。
 */
export function useEditorHistory<T>(initial: T): EditorHistoryState<T> {
  const [past, setPast] = React.useState<T[]>([]);
  const [present, setPresent] = React.useState<T>(initial);
  const [future, setFuture] = React.useState<T[]>([]);

  const canUndo = past.length > 0;
  const canRedo = future.length > 0;

  const undo = React.useCallback(() => {
    setPast((p) => {
      if (p.length === 0) return p;
      const prev = p[p.length - 1]!;
      setFuture((f) => [present, ...f]);
      setPresent(prev);
      return p.slice(0, -1);
    });
  }, [present]);

  const redo = React.useCallback(() => {
    setFuture((f) => {
      if (f.length === 0) return f;
      const next = f[0]!;
      setPast((p) => [...p, present]);
      setPresent(next);
      return f.slice(1);
    });
  }, [present]);

  const set = React.useCallback(
    (next: T) => {
      setPast((p) => [...p, present]);
      setPresent(next);
      setFuture([]);
    },
    [present],
  );

  const reset = React.useCallback((next: T) => {
    setPast([]);
    setPresent(next);
    setFuture([]);
  }, []);

  return { present, canUndo, canRedo, undo, redo, set, reset };
}

