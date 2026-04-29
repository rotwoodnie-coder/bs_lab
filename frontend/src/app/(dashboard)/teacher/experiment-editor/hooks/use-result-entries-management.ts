"use client";

import * as React from "react";

import type { RichMediaValue } from "@bs-lab/ui";

import type { ExperimentResultEntryDraft } from "../types";

type EntryField = keyof Omit<ExperimentResultEntryDraft, "id">;

export function useResultEntriesManagement() {
  const [resultEntries, setResultEntries] = React.useState<ExperimentResultEntryDraft[]>([
    { id: "r1", title: "结果 1", content: "", contentEmbeds: [] },
  ]);

  const addResultEntry = React.useCallback(() => {
    setResultEntries((prev) => [
      ...prev,
      { id: `r${Date.now()}`, title: "", content: "", contentEmbeds: [] },
    ]);
  }, []);

  const removeResultEntry = React.useCallback((id: string) => {
    setResultEntries((prev) => (prev.length <= 1 ? prev : prev.filter((x) => x.id !== id)));
  }, []);

  const updateResultEntry = React.useCallback(
    <K extends EntryField>(id: string, field: K, value: ExperimentResultEntryDraft[K]) => {
      setResultEntries((prev) => prev.map((x) => (x.id === id ? { ...x, [field]: value } : x)));
    },
    [],
  );

  const updateResultRichContent = React.useCallback((id: string, next: RichMediaValue) => {
    const embeds = Array.isArray(next.embeds) ? next.embeds : [];
    setResultEntries((prev) =>
      prev.map((x) => (x.id === id ? { ...x, content: next.text ?? "", contentEmbeds: embeds } : x)),
    );
  }, []);

  const reorderResultEntry = React.useCallback((fromIndex: number, toIndex: number) => {
    setResultEntries((prev) => {
      if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return prev;
      if (fromIndex >= prev.length || toIndex >= prev.length) return prev;
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      if (!moved) return prev;
      next.splice(toIndex, 0, moved);
      return next;
    });
  }, []);

  return {
    resultEntries,
    setResultEntries,
    addResultEntry,
    removeResultEntry,
    updateResultEntry,
    updateResultRichContent,
    reorderResultEntry,
  };
}
