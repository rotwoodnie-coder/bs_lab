import * as React from "react";

import type { RichMediaValue } from "@bs-lab/ui";

import type { ExperimentMaterialDraft, ExperimentStepDraft } from "../types";

type StepField = keyof Omit<ExperimentStepDraft, "id">;
type MaterialField = keyof Omit<ExperimentMaterialDraft, "id">;

export function useStepManagement() {
  const [materials, setMaterials] = React.useState<ExperimentMaterialDraft[]>([
    {
      id: "m1",
      nameLab: "铁架台",
      quantity: "1",
      materialType: "器材",
      nameHomeSubstitute: "",
      hazardFlags: [],
      safetyReminder: "",
      notes: "",
      thumbnailUrl: "",
    },
  ]);
  const [steps, setSteps] = React.useState<ExperimentStepDraft[]>([
    {
      id: "s1",
      title: "搭建装置",
      content: "固定悬点并确认摆球稳定。",
      contentEmbeds: [],
      expectedResult: "",
    },
  ]);

  const addMaterial = React.useCallback(() => {
    setMaterials((prev) => [
      ...prev,
      {
        id: `m${Date.now()}`,
        nameLab: "",
        quantity: "1",
        materialType: "器材",
        nameHomeSubstitute: "",
        hazardFlags: [],
        safetyReminder: "",
        notes: "",
        thumbnailUrl: "",
      },
    ]);
  }, []);

  const appendMaterial = React.useCallback((draft: Omit<ExperimentMaterialDraft, "id">) => {
    setMaterials((prev) => [...prev, { id: `m${Date.now()}`, ...draft }]);
  }, []);

  const appendMaterials = React.useCallback((drafts: Omit<ExperimentMaterialDraft, "id">[]) => {
    const base = Date.now();
    setMaterials((prev) => [
      ...prev,
      ...drafts.map((draft, idx) => ({
        id: `m${base + idx}`,
        ...draft,
      })),
    ]);
  }, []);

  const removeMaterial = React.useCallback((id: string) => {
    setMaterials((prev) => (prev.length <= 1 ? prev : prev.filter((x) => x.id !== id)));
  }, []);

  const updateMaterial = React.useCallback(
    <K extends MaterialField>(id: string, field: K, value: ExperimentMaterialDraft[K]) => {
      setMaterials((prev) => prev.map((x) => (x.id === id ? { ...x, [field]: value } : x)));
    },
    [],
  );

  const addStep = React.useCallback(() => {
    setSteps((prev) => [
      ...prev,
      { id: `s${Date.now()}`, title: "", content: "", contentEmbeds: [], expectedResult: "" },
    ]);
  }, []);

  const updateStepRichContent = React.useCallback((id: string, next: RichMediaValue) => {
    const embeds = Array.isArray(next.embeds) ? next.embeds : [];
    setSteps((prev) =>
      prev.map((x) => (x.id === id ? { ...x, content: next.text ?? "", contentEmbeds: embeds } : x)),
    );
  }, []);

  const removeStep = React.useCallback((id: string) => {
    setSteps((prev) => (prev.length <= 1 ? prev : prev.filter((x) => x.id !== id)));
  }, []);

  const updateStep = React.useCallback(
    <K extends StepField>(id: string, field: K, value: ExperimentStepDraft[K]) => {
      setSteps((prev) => prev.map((x) => (x.id === id ? { ...x, [field]: value } : x)));
    },
    [],
  );

  const reorderStep = React.useCallback((fromIndex: number, toIndex: number) => {
    setSteps((prev) => {
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
    materials,
    setMaterials,
    steps,
    setSteps,
    addMaterial,
    appendMaterial,
    appendMaterials,
    removeMaterial,
    updateMaterial,
    addStep,
    removeStep,
    updateStep,
    updateStepRichContent,
    reorderStep,
  };
}

