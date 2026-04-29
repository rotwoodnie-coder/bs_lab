"use client";

import * as React from "react";

import type { RichMediaEmbed } from "@bs-lab/ui";

import type { ExperimentReferenceCitationDraft, ExperimentScientistStoryDraft } from "../types";

function newCitationId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `cit-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function newScientistId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `sci-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function useEditorAuxiliaryReference() {
  const [referenceCitations, setReferenceCitations] = React.useState<ExperimentReferenceCitationDraft[]>([]);
  const [referenceVideo, setReferenceVideo] = React.useState("");
  const [referenceRichText, setReferenceRichText] = React.useState("");
  const [referenceRichEmbeds, setReferenceRichEmbeds] = React.useState<RichMediaEmbed[]>([]);
  const [scientistStories, setScientistStories] = React.useState<ExperimentScientistStoryDraft[]>([]);

  const addReferenceCitation = React.useCallback(() => {
    setReferenceCitations((prev) => [
      ...prev,
      { id: newCitationId(), citedExperimentTitle: "", sourceOrLink: "", note: "" },
    ]);
  }, []);

  const removeReferenceCitation = React.useCallback((id: string) => {
    setReferenceCitations((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const updateReferenceCitation = React.useCallback(
    (id: string, field: keyof Pick<ExperimentReferenceCitationDraft, "citedExperimentTitle" | "sourceOrLink" | "note">, value: string) => {
      setReferenceCitations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)),
      );
    },
    [],
  );

  const addScientistStory = React.useCallback(() => {
    setScientistStories((prev) => [
      ...prev,
      { id: newScientistId(), scientistName: "", storyName: "", storyComments: "" },
    ]);
  }, []);

  const removeScientistStory = React.useCallback((id: string) => {
    setScientistStories((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const updateScientistStory = React.useCallback(
    (
      id: string,
      field: keyof Pick<ExperimentScientistStoryDraft, "scientistName" | "storyName" | "storyComments">,
      value: string,
    ) => {
      setScientistStories((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
    },
    [],
  );

  return {
    referenceCitations,
    setReferenceCitations,
    referenceVideo,
    setReferenceVideo,
    referenceRichText,
    setReferenceRichText,
    referenceRichEmbeds,
    setReferenceRichEmbeds,
    scientistStories,
    setScientistStories,
    addReferenceCitation,
    removeReferenceCitation,
    updateReferenceCitation,
    addScientistStory,
    removeScientistStory,
    updateScientistStory,
  };
}
