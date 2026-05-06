export interface LinkedExperimentMeta {
  expId: string;
  expName: string;
  sourceType: "standard";
}

export interface ExperimentFillPayload {
  expName?: string;
  subjectId?: string;
  schoolLevelId?: string;
  gradeId?: string;
  chooseType?: "y" | "n" | null;
  expTaskType?: "hw" | "tk" | "self" | null;
  difficultyId?: string;
  summary?: string;
  curriculum?: string;
  teachingContextContent?: string;
  principle?: string;
  safetyNotes?: string;
  dangerNotes?: string;
  durationMin?: number | string;
  simulatorUrl?: string;
  coursebookId?: string;
  unitId?: string;
  mainVideoUrl?: string;
  mainVideoEmbeds?: Array<{ id: string; kind: "image" | "video"; src: string; caption?: string }>;
  materials?: unknown[];
  steps?: unknown[];
  resultEntries?: unknown[];
  referenceCitations?: unknown[];
  scientistStories?: unknown[];
}

export type FillStrategy = "replace" | "mergeIfEmpty" | "merge" | "ask";
