/** 课标页「采纳为实验大纲」→ 实验课程管理页一次性预填（sessionStorage + ?prefillAiOutline=1） */

export const EXPERIMENT_EDITOR_AI_OUTLINE_STORAGE_KEY = "bs-lab:experiment-editor-ai-outline-v1";

export type ExperimentEditorAiOutlinePrefill = {
  title: string;
  summary: string;
  objectives: string;
  scienceStory: string;
  curriculumNote: string;
};
