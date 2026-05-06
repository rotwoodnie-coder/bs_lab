"use client";

import * as React from "react";
import { useEditorStore } from "./use-editor-store";
import { useShallow } from "zustand/react/shallow";
import { sonnerToast } from "@bs-lab/ui";

type SaveStatus = "idle" | "saving" | "saved" | "error";

export type AutosaveResult = {
  status: SaveStatus;
  statusText: string;
  hasPendingChanges: boolean;
  lastSavedAt: number | null;
  errorMessage: string | null;
};

type DraftSnapshot = {
  expName: string;
  subjectId: string | null;
  schoolLevelId: string | null;
  gradeId: string | null;
  chooseType: "y" | "n" | null;
  expTaskType: "hw" | "tk" | "self" | null;
  difficultyId: string;
  summary: string;
  durationMin: string;
  simulatorUrl: string;
  curriculum: string;
  coursebookId: string;
  unitId: string;
  principle: string;
  safetyNotes: string;
  dangerNotes: string;
  materials: unknown[];
  steps: unknown[];
  resultEntries: unknown[];
  referenceCitations: unknown[];
  scientistStories: unknown[];
};

function snapshotSelector(s: {
  expName: string;
  subjectId: string | null;
  schoolLevelId: string | null;
  gradeId: string | null;
  chooseType: "y" | "n" | null;
  expTaskType: "hw" | "tk" | "self" | null;
  difficultyId: string;
  summary: string;
  durationMin: string;
  simulatorUrl: string;
  curriculum: string;
  coursebookId: string;
  unitId: string;
  principle: string;
  safetyNotes: string;
  dangerNotes: string;
  materials: unknown[];
  steps: unknown[];
  resultEntries: unknown[];
  referenceCitations: unknown[];
  scientistStories: unknown[];
}): DraftSnapshot {
  return {
    expName: s.expName,
    subjectId: s.subjectId,
    schoolLevelId: s.schoolLevelId,
    gradeId: s.gradeId,
    chooseType: s.chooseType,
    expTaskType: s.expTaskType,
    difficultyId: s.difficultyId,
    summary: s.summary,
    durationMin: s.durationMin,
    simulatorUrl: s.simulatorUrl,
    curriculum: s.curriculum,
    coursebookId: s.coursebookId,
    unitId: s.unitId,
    principle: s.principle,
    safetyNotes: s.safetyNotes,
    dangerNotes: s.dangerNotes,
    materials: s.materials,
    steps: s.steps,
    resultEntries: s.resultEntries,
    referenceCitations: s.referenceCitations,
    scientistStories: s.scientistStories,
  };
}

function serializeSnapshot(s: DraftSnapshot): string {
  return JSON.stringify(s);
}

/**
 * 基于 Zustand store 的自动保存 hook。
 * 检测 store 中草稿字段变化，2 秒防抖后自动调用 store.saveDraft()。
 * 保存中锁定防止重复触发，保存失败保留用户修改并给出提示。
 */
export function useEditorAutosave(opts: {
  enabled: boolean;
}): AutosaveResult {
  const snapshot = useEditorStore(useShallow(snapshotSelector));
  const saveDraft = useEditorStore((s) => s.saveDraft);

  const timerRef = React.useRef<number | null>(null);
  const savingRef = React.useRef(false);
  const autosaveHintShownRef = React.useRef(false);
  const baselineRef = React.useRef<string>("");
  const lastSavedAtRef = React.useRef<number | null>(null);

  const [status, setStatus] = React.useState<SaveStatus>("idle");
  const [hasPendingChanges, setHasPendingChanges] = React.useState(false);
  const [lastSavedAt, setLastSavedAt] = React.useState<number | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // 首次启用时提示
  React.useEffect(() => {
    if (!opts.enabled) return;
    if (autosaveHintShownRef.current) return;
    autosaveHintShownRef.current = true;
    sonnerToast.message("已启用自动保存草稿", { description: "输入内容会自动暂存，仍可手动提交审核。" });
  }, [opts.enabled]);

  // 设置 baseline（初始快照）
  React.useEffect(() => {
    if (!opts.enabled) return;
    if (baselineRef.current !== "") return;
    baselineRef.current = serializeSnapshot(snapshot);
  }, [opts.enabled, snapshot]);

  // 检测变化，防抖保存
  React.useEffect(() => {
    if (!opts.enabled) {
      setStatus("idle");
      setHasPendingChanges(false);
      setErrorMessage(null);
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = null;
      return;
    }

    const serialized = serializeSnapshot(snapshot);
    if (baselineRef.current === "" || serialized === baselineRef.current) return;

    setStatus("saving");
    setHasPendingChanges(true);
    setErrorMessage(null);

    if (timerRef.current) window.clearTimeout(timerRef.current);

    timerRef.current = window.setTimeout(async () => {
      if (savingRef.current) return;
      savingRef.current = true;
      try {
        const saved = await saveDraft({ silent: true });
        if (saved) {
          baselineRef.current = serialized;
          lastSavedAtRef.current = Date.now();
          setLastSavedAt(Date.now());
          setHasPendingChanges(false);
          setStatus("saved");
        } else {
          setStatus("error");
          setErrorMessage("草稿保存未完成");
        }
      } catch (err) {
        setStatus("error");
        setErrorMessage(err instanceof Error ? err.message : "自动保存失败");
      } finally {
        savingRef.current = false;
      }
    }, 2000);

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [opts.enabled, snapshot, saveDraft]);

  // 页面离开时提示未保存
  React.useEffect(() => {
    if (!opts.enabled) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasPendingChanges) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [opts.enabled, hasPendingChanges]);

  const statusText = React.useMemo(() => {
    if (status === "saving") return "自动保存中…";
    if (status === "saved" && lastSavedAt) {
      const time = new Date(lastSavedAt).toLocaleTimeString("zh-CN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      return `已自动保存 ${time}`;
    }
    if (status === "error") return `自动保存失败：${errorMessage ?? "未知错误"}`;
    return "自动保存待命";
  }, [errorMessage, lastSavedAt, status]);

  return { status, statusText, hasPendingChanges, lastSavedAt, errorMessage };
}
