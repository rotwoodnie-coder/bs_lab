import type { RichMediaEmbed } from "@bs-lab/ui";

import type { V2ExpDraftPutBody } from "@/lib/v2/v2-exp-api";

import type {
  ExperimentMaterialDraft,
  ExperimentReferenceCitationDraft,
  ExperimentResultEntryDraft,
  ExperimentScientistStoryDraft,
  ExperimentStepDraft,
} from "../types";
import { composeExpPrincipleForDb, composeStepCommentsForDb } from "./exp-editor-text-fences";

export type BuildV2ExpDraftPutBodyArgs = {
  /** 对齐 exp_msg.exp_name */
  expName: string;
  /** 对齐 exp_msg.choose_type */
  chooseType: "y" | "n" | null;
  /** 对齐 exp_msg.subject_id */
  subjectId: string | null;
  /** 对齐 exp_msg.school_level_id */
  schoolLevelId: string | null;
  /** 对齐 exp_msg.grade_id */
  gradeId: string | null;
  /** 对齐 exp_msg.exp_task_type */
  expTaskType: "hw" | "tk" | "self" | null;
  summary: string;
  curriculum: string;
  teachingContextContent: string;
  teachingContextEmbeds: RichMediaEmbed[];
  coursebookId: string;
  unitId: string;
  principle: string;
  principleEmbeds: RichMediaEmbed[];
  safetyNotes: string;
  safetyEmbeds: RichMediaEmbed[];
  dangerNotes: string;
  dangerEmbeds: RichMediaEmbed[];
  durationMin: string;
  difficultyId: string;
  materials: ExperimentMaterialDraft[];
  steps: ExperimentStepDraft[];
  resultEntries: ExperimentResultEntryDraft[];
  referenceCitations: ExperimentReferenceCitationDraft[];
  referenceRichText: string;
  referenceRichEmbeds: RichMediaEmbed[];
  scientistStories: ExperimentScientistStoryDraft[];
  simulatorUrl: string;
  mainVideoId: string | null;
  mainVideoUrl: string;
  mainVideoEmbeds: RichMediaEmbed[];
};

function durationMinToClassHour(durationMin: string): number | null {
  const m = Number.parseInt(String(durationMin).trim(), 10);
  if (!Number.isFinite(m) || m <= 0) return null;
  return Math.round((m / 45) * 100) / 100;
}

function pickMainVideoUrl(url: string, embeds: RichMediaEmbed[]): string {
  const fromEmbeds = embeds.find((e) => e.kind === "video" && (e.src ?? "").trim());
  if (fromEmbeds?.src?.trim()) return fromEmbeds.src.trim().slice(0, 200);
  return (url ?? "").trim().slice(0, 200);
}

/** HTTP body：key 与库表列一致（snake_case） */
export function buildV2ExpDraftPutBody(a: BuildV2ExpDraftPutBodyArgs): V2ExpDraftPutBody {
  const mv = pickMainVideoUrl(a.mainVideoUrl, a.mainVideoEmbeds);
  const subjectId = (a.subjectId ?? "").trim().slice(0, 32) || null;
  const schoolLevelId = (a.schoolLevelId ?? "").trim().slice(0, 32) || null;
  const gradeId = (a.gradeId ?? "").trim().slice(0, 32) || null;
  const materials = a.materials.map((m, idx) => ({
    material_id: m.libraryMaterialId?.trim().slice(0, 32) || null,
    material_name: (m.nameLab ?? "").trim().slice(0, 60) || null,
    is_self: m.libraryMaterialId ? ("n" as const) : ("y" as const),
    material_num: (() => {
      const q = Number.parseInt(String(m.quantity ?? "").trim(), 10);
      return Number.isFinite(q) ? q : null;
    })(),
    material_unit: (m.materialType ?? "").trim().slice(0, 32) || null,
    material_prop_id: null,
    material_type_id: null,
    main_pic_url: ((m.thumbnailUrl ?? m.imageUrl ?? "") as string).trim().slice(0, 200) || null,
    exp_purpose: null,
    additional_comments: (m.nameHomeSubstitute ?? "").trim().slice(0, 200) || null,
    comments: (m.notes ?? "").trim().slice(0, 200) || null,
    sort_order: idx,
  }));
  const steps = a.steps.map((s, idx) => ({
    step_name: (s.title ?? "").trim().slice(0, 60) || null,
    step_comments: composeStepCommentsForDb(s.content, s.contentEmbeds),
    sort_order: idx,
  }));
  const results = a.resultEntries.map((r, idx) => ({
    result_name: (r.title ?? "").trim().slice(0, 60) || null,
    result_comments: composeStepCommentsForDb(r.content, r.contentEmbeds),
    sort_order: idx,
  }));
  const references = a.referenceCitations.map((c, idx) => ({
    reference_name: (c.citedExperimentTitle ?? "").trim().slice(0, 200) || null,
    reference_source: (c.sourceOrLink ?? "").trim().slice(0, 200) || null,
    reference_comments: (c.note ?? "").trim() || null,
    sort_order: idx,
  }));
  const scientists = a.scientistStories.map((s, idx) => ({
    scientist_name: (s.scientistName ?? "").trim().slice(0, 60) || null,
    story_name: (s.storyName ?? "").trim().slice(0, 60) || null,
    story_comments: (s.storyComments ?? "").trim().slice(0, 200) || null,
    sort_order: idx,
  }));
  const fileId = (a.mainVideoId ?? "").trim().slice(0, 32) || null;
  const videos = mv ? [{ video_url: mv, sort_order: 0, file_id: fileId }] : [];
  const firstScientistStory = a.scientistStories[0]?.storyComments ?? "";
  const simulatorUrl = (a.simulatorUrl ?? "").trim().slice(0, 200);
  const difficultyId = (a.difficultyId ?? "").trim().slice(0, 32);
  const coursebookId = (a.coursebookId ?? "").trim().slice(0, 32);
  const unitId = (a.unitId ?? "").trim().slice(0, 32);

  return {
    exp_name: (a.expName ?? "").trim().slice(0, 100) || "未命名实验",
    choose_type: a.chooseType,
    subject_id: subjectId,
    school_level_id: schoolLevelId,
    grade_id: gradeId,
    difficulty_id: difficultyId || null,
    coursebook_id: coursebookId || null,
    unit_id: unitId || null,
    exp_principle: composeExpPrincipleForDb({
      principle: a.principle,
      principleEmbeds: a.principleEmbeds,
      summary: a.summary,
      teachingContextContent: a.teachingContextContent,
      teachingContextEmbeds: a.teachingContextEmbeds,
      curriculum: a.curriculum,
      safetyNotes: a.safetyNotes,
      safetyEmbeds: a.safetyEmbeds,
      dangerNotes: a.dangerNotes,
      dangerEmbeds: a.dangerEmbeds,
      referenceRichText: a.referenceRichText,
      referenceRichEmbeds: a.referenceRichEmbeds,
      // 兼容旧围栏：镜像首条科学家故事到 exp_principle 围栏中
      scientistStory: firstScientistStory,
      scientistStoryEmbeds: [],
    }),
    exp_caution: (a.safetyNotes ?? "").trim().slice(0, 200) || null,
    exp_danger: (a.dangerNotes ?? "").trim().slice(0, 200) || null,
    class_hour: durationMinToClassHour(a.durationMin),
    simulator_url: simulatorUrl || null,
    exp_task_type: a.expTaskType ?? null,
    materials,
    steps,
    results,
    references,
    scientists,
    videos,
  };
}
