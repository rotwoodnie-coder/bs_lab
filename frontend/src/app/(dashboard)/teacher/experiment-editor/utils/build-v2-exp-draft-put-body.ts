import type { RichMediaEmbed } from "@bs-lab/ui";

import type { V2ExpDraftPutBody, V2ExpDraftReferenceVideoRowPut } from "@/lib/v2/v2-exp-api";

import type {
  ExperimentMaterialDraft,
  ExperimentReferenceCitationDraft,
  ExperimentReferenceVideoDraft,
  ExperimentResultEntryDraft,
  ExperimentScientistStoryDraft,
  ExperimentSecurityDraft,
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
  /** 对齐 exp_msg.standard_exp_id */
  standardExpId?: string | null;
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
  /** 实验安全标识：用户勾选后存入 exp_security */
  security: ExperimentSecurityDraft[];
  simulatorUrl: string;
  mainVideoId: string | null;
  mainVideoUrl: string;
  mainVideoEmbeds: RichMediaEmbed[];
  gradeIds: string[];
  referenceVideos: ExperimentReferenceVideoDraft[];
  /** 材料图片列表 */
  materialPics?: Array<{ materialUrl: string; sortOrder?: number }>;
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
      const v = (m.numValue ?? "").trim();
      if (v) {
        const q = Number.parseInt(v, 10);
        return Number.isFinite(q) ? q : null;
      }
      const q = Number.parseInt(String(m.quantity ?? "").trim(), 10);
      return Number.isFinite(q) ? q : null;
    })(),
    material_unit: (m.unitId ?? "").trim().slice(0, 32) || null,
    material_prop_id: (m.materialPropId ?? "").trim().slice(0, 32) || null,
    material_type_id: (m.materialTypeId ?? "").trim().slice(0, 32) || null,
    main_pic_url: ((m.thumbnailUrl ?? m.imageUrl ?? "") as string).trim().slice(0, 200) || null,
    exp_purpose: (m.expPurpose ?? "").trim().slice(0, 200) || null,
    additional_comments: (m.nameHomeSubstitute ?? "").trim().slice(0, 200) || null,
    comments: (m.notes ?? "").trim().slice(0, 200) || null,
    sort_order: idx,
    security_list: ((m as any).materialSecurityList as Array<{ securityId: string; securityLevel: number | null }> | undefined)
      ?.map((s) => ({
        security_id: s.securityId,
        security_level: s.securityLevel ?? null,
      })) ?? [],
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
  const security = a.security
    .filter((s) => s.selected)
    .map((s, idx) => ({
      security_id: s.securityId.trim(),
      security_level: s.securityLevel,
      sort_order: idx,
    }));
  const firstScientistStory = a.scientistStories[0]?.storyComments ?? "";
  const simulatorUrl = (a.simulatorUrl ?? "").trim().slice(0, 200);
  const difficultyId = (a.difficultyId ?? "").trim().slice(0, 32);
  const coursebookId = (a.coursebookId ?? "").trim().slice(0, 32);
  const unitId = (a.unitId ?? "").trim().slice(0, 32);
  const grades = a.gradeIds
    .map((gid, idx) => ({ grade_id: gid.trim().slice(0, 32), sort_order: idx }))
    .filter((g) => g.grade_id.length > 0);
  const referenceVideos: V2ExpDraftReferenceVideoRowPut[] = (a.referenceVideos ?? [])
    .map((rv, idx) => {
      const url = rv.videoUrl.trim().slice(0, 200);
      if (!url) return null;
      return {
        seq_id: rv.id?.trim() ? rv.id.trim().slice(0, 32) : undefined,
        video_url: url,
        file_id: rv.fileId?.trim().slice(0, 32) || undefined,
        sort_order: rv.sortOrder ?? idx,
      } as V2ExpDraftReferenceVideoRowPut;
    })
    .filter((rv): rv is V2ExpDraftReferenceVideoRowPut => rv !== null);
  // 从每个材料中提取图片列表，扁平化为 material_pics
  const materialPics = (a.materialPics ?? [])
    .map((mp, idx) => ({ material_url: mp.materialUrl.trim().slice(0, 200) || null, sort_order: mp.sortOrder ?? idx }))
    .filter((mp) => mp.material_url != null);

  return {
    exp_name: (a.expName ?? "").trim().slice(0, 100) || "未命名实验",
    choose_type: a.chooseType,
    subject_id: subjectId,
    school_level_id: schoolLevelId,
    grade_id: gradeId,
    difficulty_id: difficultyId || null,
    standard_exp_id: (a.standardExpId ?? "").trim().slice(0, 32) || null,
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
    security,
    grades,
    material_pics: materialPics,
    reference_videos: referenceVideos,
  };
}
