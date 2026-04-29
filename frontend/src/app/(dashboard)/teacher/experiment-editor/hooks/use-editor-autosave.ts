"use client";

import * as React from "react";

import { sonnerToast } from "@bs-lab/ui";

type SaveStatus = "idle" | "saving" | "saved" | "error";

type UseEditorAutosaveArgs = {
  enabled: boolean;
  data: Record<string, unknown>;
  onSaveDraft: (options?: { silent?: boolean }) => boolean | Promise<boolean>;
  delayMs?: number;
};

export function useEditorAutosave({
  enabled,
  data,
  onSaveDraft,
  delayMs = 1200,
}: UseEditorAutosaveArgs) {
  const serialized = React.useMemo(() => JSON.stringify(data), [data]);
  const [status, setStatus] = React.useState<SaveStatus>("idle");
  const [hasPendingChanges, setHasPendingChanges] = React.useState(false);
  const [lastSavedAt, setLastSavedAt] = React.useState<number | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const timerRef = React.useRef<number | null>(null);
  const baselineRef = React.useRef<string | null>(null);
  const autosaveHintShownRef = React.useRef(false);

  React.useEffect(() => {
    if (!enabled) return;
    if (autosaveHintShownRef.current) return;
    autosaveHintShownRef.current = true;
    sonnerToast.message("已启用自动保存草稿", { description: "输入内容会自动暂存，仍可手动提交审核。" });
  }, [enabled]);

  React.useEffect(() => {
    if (!enabled) return;
    if (baselineRef.current === null) {
      baselineRef.current = serialized;
    }
  }, [enabled, serialized]);

  React.useEffect(() => {
    if (!enabled) {
      setStatus("idle");
      setHasPendingChanges(false);
      setErrorMessage(null);
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = null;
      return;
    }
    if (baselineRef.current === null || serialized === baselineRef.current) return;

    setStatus("saving");
    setHasPendingChanges(true);
    setErrorMessage(null);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      void (async () => {
        try {
          const saved = await onSaveDraft({ silent: true });
          if (!saved) throw new Error("草稿保存未完成");
          baselineRef.current = serialized;
          setLastSavedAt(Date.now());
          setHasPendingChanges(false);
          setStatus("saved");
        } catch (error) {
          setStatus("error");
          setErrorMessage(error instanceof Error ? error.message : "自动保存失败");
        }
      })();
    }, delayMs);

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [delayMs, enabled, onSaveDraft, serialized]);

  React.useEffect(() => {
    if (!enabled) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasPendingChanges) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [enabled, hasPendingChanges]);

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

  return {
    status,
    statusText,
    hasPendingChanges,
    lastSavedAt,
    errorMessage,
  };
}

