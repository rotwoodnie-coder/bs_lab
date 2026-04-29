"use client";

import * as React from "react";
import type { RichMediaEmbed } from "@bs-lab/ui";

import type {
  ExperimentMaterialDraft,
  ExperimentReferenceCitationDraft,
  ExperimentResultEntryDraft,
  ExperimentScientistStoryDraft,
  ExperimentStepDraft,
} from "../types";

type ExperimentEditorStoreState = {
  expName: string;
  subjectId: string | null;
  schoolLevelId: string | null;
  gradeId: string | null;
  chooseType: "y" | "n" | null;
  difficulty: "basic" | "intermediate" | "advanced";
  summary: string;
  simulatorUrl: string;
  difficultyId: string;
  durationMin: string;
  mainVideoUrl: string;
  mainVideoEmbeds: RichMediaEmbed[];
  principle: string;
  principleImage: string;
  principleVideo: string;
  principleEmbeds: RichMediaEmbed[];
  curriculum: string;
  teachingContextContent: string;
  teachingContextEmbeds: RichMediaEmbed[];
  safetyNotes: string;
  safetyEmbeds: RichMediaEmbed[];
  dangerNotes: string;
  dangerEmbeds: RichMediaEmbed[];
  teachingRefTextbookVersion: string;
  teachingRefUnit: string;
  teachingRefLessonPeriod: string;
  coursebookId: string;
  unitId: string;
  materials: ExperimentMaterialDraft[];
  steps: ExperimentStepDraft[];
  resultEntries: ExperimentResultEntryDraft[];
  referenceCitations: ExperimentReferenceCitationDraft[];
  referenceRichText: string;
  referenceRichEmbeds: RichMediaEmbed[];
  scientistStories: ExperimentScientistStoryDraft[];
};

const initialState: ExperimentEditorStoreState = {
  expName: "",
  subjectId: null,
  schoolLevelId: null,
  gradeId: null,
  chooseType: null,
  difficulty: "intermediate",
  summary: "",
  simulatorUrl: "",
  difficultyId: "",
  durationMin: "45",
  mainVideoUrl: "",
  mainVideoEmbeds: [],
  principle: "",
  principleImage: "",
  principleVideo: "",
  principleEmbeds: [],
  curriculum: "",
  teachingContextContent: "",
  teachingContextEmbeds: [],
  safetyNotes: "",
  safetyEmbeds: [],
  dangerNotes: "",
  dangerEmbeds: [],
  teachingRefTextbookVersion: "",
  teachingRefUnit: "",
  teachingRefLessonPeriod: "",
  coursebookId: "",
  unitId: "",
  materials: [],
  steps: [],
  resultEntries: [],
  referenceCitations: [],
  referenceRichText: "",
  referenceRichEmbeds: [],
  scientistStories: [],
};

type Action =
  | { type: "patch"; payload: Partial<ExperimentEditorStoreState> }
  | { type: "reset"; payload?: Partial<ExperimentEditorStoreState> };

function reducer(state: ExperimentEditorStoreState, action: Action): ExperimentEditorStoreState {
  switch (action.type) {
    case "patch":
      return { ...state, ...action.payload };
    case "reset":
      return { ...initialState, ...(action.payload ?? {}) };
    default:
      return state;
  }
}

export function useEditorStore(initialPatch?: Partial<ExperimentEditorStoreState>) {
  const [state, dispatch] = React.useReducer(reducer, { ...initialState, ...(initialPatch ?? {}) });

  const patch = React.useCallback((payload: Partial<ExperimentEditorStoreState>) => {
    dispatch({ type: "patch", payload });
  }, []);

  const reset = React.useCallback((payload?: Partial<ExperimentEditorStoreState>) => {
    dispatch({ type: "reset", payload });
  }, []);

  return { state, patch, reset };
}

export type { ExperimentEditorStoreState };
export { initialState as experimentEditorInitialState };
