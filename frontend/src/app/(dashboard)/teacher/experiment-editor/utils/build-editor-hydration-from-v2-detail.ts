import type { RichMediaEmbed } from "@bs-lab/ui";

import { SUBJECT_CASCADE } from "@/data/subject-tree";
import type { V2DictGradeItem, V2DictItem, V2ExpMsgDetail } from "@/lib/v2/v2-exp-api";
import type { SubjectDiscipline } from "@/types/subject";

import type {
  ExperimentMaterialDraft,
  ExperimentReferenceCitationDraft,
  ExperimentResultEntryDraft,
  ExperimentScientistStoryDraft,
  ExperimentStepDraft,
  PhaseKey,
} from "../types";
import { normalizeResultEntryDraft, normalizeStepDraft } from "./step-content-filled";
import { splitPrincipleStored, splitStepStored } from "./exp-editor-text-fences";

export type EditorHydrationFromV2Payload = {
  /** 对齐 exp_msg.exp_name */
  expName: string;
  /** 对齐 exp_msg.choose_type */
  chooseType: "y" | "n" | null;
  /** 对齐 exp_msg.exp_task_type */
  expTaskType: "hw" | "tk" | "self" | null;
  /** 对齐 exp_msg.subject_id */
  subjectId: string | null;
  /** 对齐 exp_msg.school_level_id */
  schoolLevelId: string | null;
  /** 对齐 exp_msg.grade_id */
  gradeId: string | null;
  phase: PhaseKey;
  discipline: SubjectDiscipline;
  selectedGradeCodes: string[];
  title: string;
  summary: string;
  durationMin: string;
  simulatorUrl: string;
  difficultyId: string;
  mainVideoUrl: string;
  mainVideoId: string | null;
  participation: "required" | "optional";
  curriculum: string;
  teachingContextContent: string;
  teachingContextEmbeds: RichMediaEmbed[];
  principle: string;
  principleEmbeds: RichMediaEmbed[];
  safetyNotes: string;
  safetyEmbeds: RichMediaEmbed[];
  dangerNotes: string;
  dangerEmbeds: RichMediaEmbed[];
  scientistStories: ExperimentScientistStoryDraft[];
  referenceCitations: ExperimentReferenceCitationDraft[];
  referenceRichText: string;
  referenceRichEmbeds: RichMediaEmbed[];
  materials: ExperimentMaterialDraft[];
  steps: ExperimentStepDraft[];
  resultEntries: ExperimentResultEntryDraft[];
  creatorName: string;
  coursebookId: string;
  unitId: string;
};

function classHourToDurationMin(ch: number | null | undefined): string {
  if (ch == null || Number.isNaN(Number(ch))) return "45";
  return String(Math.max(5, Math.round(Number(ch) * 45)));
}

export function resolvePhaseDisciplineGradesFromV2Detail(
  detail: V2ExpMsgDetail,
  subjects: V2DictItem[],
  grades: V2DictGradeItem[],
): { phase: PhaseKey; discipline: SubjectDiscipline; selectedGradeCodes: string[] } {
  const sn = detail.subjectId ? (subjects.find((s) => s.id === detail.subjectId)?.name ?? "").trim() : "";
  const gn = detail.gradeId ? (grades.find((g) => g.id === detail.gradeId)?.name ?? "").trim() : "";

  if (sn) {
    for (const ph of SUBJECT_CASCADE) {
      for (const disc of ph.disciplines) {
        if (disc.label !== sn) continue;
        if (detail.gradeId) {
          // 返回 DB grade ID 而非静态 code
          return { phase: ph.phase as PhaseKey, discipline: disc.discipline, selectedGradeCodes: [detail.gradeId] };
        }
        return { phase: ph.phase as PhaseKey, discipline: disc.discipline, selectedGradeCodes: [] };
      }
    }
  }
  if (gn) {
    for (const ph of SUBJECT_CASCADE) {
      for (const disc of ph.disciplines) {
        const gr = disc.grades.find((g) => g.label === gn);
        if (gr) return { phase: ph.phase as PhaseKey, discipline: disc.discipline, selectedGradeCodes: detail.gradeId ? [detail.gradeId] : [] };
      }
    }
  }
  return { phase: "senior", discipline: "physics", selectedGradeCodes: [] };
}

export function buildEditorHydrationFromV2Detail(
  detail: V2ExpMsgDetail,
  ctx: { grades: V2DictGradeItem[]; subjects: V2DictItem[]; userName: string },
): EditorHydrationFromV2Payload {
  const tax = resolvePhaseDisciplineGradesFromV2Detail(detail, ctx.subjects, ctx.grades);
  const parsed = splitPrincipleStored(detail.expPrinciple ?? "");
  const firstVideo = detail.videos?.[0];
  const vid = (firstVideo?.videoUrl ?? "").trim();
  const mainVideoId = firstVideo?.fileId?.trim() ?? null;

  const materials: ExperimentMaterialDraft[] = (detail.materials ?? []).map((m, idx) => {
    const row = m as {
      expMaterialId?: string;
      materialId?: string | null;
      materialName?: string | null;
      isSelf?: "y" | "n";
      mainPicUrl?: string | null;
      comments?: string | null;
    };
    const pic = (row.mainPicUrl ?? "").trim();
    return {
      id: row.expMaterialId ?? `m-${idx + 1}`,
      libraryMaterialId: row.materialId?.trim() || undefined,
      nameLab: (row.materialName ?? "").trim() || `材料${idx + 1}`,
      quantity: "1",
      materialType: "实验材料",
      nameHomeSubstitute: "",
      hazardFlags: [] as string[],
      safetyReminder: "",
      notes: (row.comments ?? "").trim(),
      imageUrl: pic,
      thumbnailUrl: pic,
    };
  });

  const steps: ExperimentStepDraft[] = (detail.steps ?? []).map((s, idx) => {
    const sc = splitStepStored(s.stepComments ?? "");
    return normalizeStepDraft({
      id: s.stepId ?? `s-${idx + 1}`,
      title: (s.stepName ?? "").trim() || `步骤${idx + 1}`,
      content: sc.content,
      contentEmbeds: sc.contentEmbeds,
      expectedResult: "",
    });
  });

  const resultRows = detail.results ?? [];
  const resultEntries: ExperimentResultEntryDraft[] =
    resultRows.length > 0
      ? resultRows.map((r, idx) => {
          const sc = splitStepStored(r.resultComments ?? "");
          return normalizeResultEntryDraft({
            id: r.resultId ?? `r-${idx + 1}`,
            title: (r.resultName ?? "").trim() || `结果${idx + 1}`,
            content: sc.content,
            contentEmbeds: sc.contentEmbeds,
          });
        })
      : [
          normalizeResultEntryDraft({
            id: "r-hydrated-1",
            title: "评价摘要",
            content: "",
            contentEmbeds: [],
          }),
        ];

  const referenceCitations: ExperimentReferenceCitationDraft[] = (detail.references ?? []).map((r, idx) => ({
    id: r.seqId || `cit-${idx + 1}`,
    citedExperimentTitle: (r.referenceName ?? "").trim(),
    sourceOrLink: (r.referenceSource ?? "").trim(),
    note: (r.referenceComments ?? "") || "",
  }));

  const scientistStories: ExperimentScientistStoryDraft[] = (detail.scientists ?? []).map((s, idx) => ({
    id: s.seqId || `sci-${idx + 1}`,
    scientistName: (s.scientistName ?? "").trim(),
    storyName: (s.storyName ?? "").trim(),
    storyComments: (s.storyComments ?? "") || "",
  }));
  const legacyStory = parsed.scientistStory || "";
  const scientistStoriesHydrated =
    scientistStories.length > 0
      ? scientistStories
      : legacyStory.trim()
        ? [{ id: "sci-legacy-1", scientistName: "", storyName: "", storyComments: legacyStory }]
        : [];

  const fallbackName = (detail.expName ?? "").trim() || (detail as V2ExpMsgDetail & { title?: string }).title?.trim() || "未命名实验";
  return {
    expName: fallbackName,
    chooseType: detail.chooseType ?? null,
    expTaskType: detail.expTaskType ?? null,
    subjectId: (detail.subjectId ?? "").trim() || null,
    schoolLevelId: (detail.schoolLevelId ?? "").trim() || null,
    gradeId: (detail.gradeId ?? "").trim() || null,
    ...tax,
    title: (detail.expName ?? "").trim() || "未命名实验",
    summary: parsed.summary,
    durationMin: classHourToDurationMin(detail.classHour),
    simulatorUrl: (detail.simulatorUrl ?? "").trim(),
    difficultyId: (detail.difficultyId ?? "").trim(),
    mainVideoUrl: vid,
    mainVideoId,
    participation: detail.chooseType === "y" ? "required" : "optional",
    curriculum: parsed.curriculum,
    teachingContextContent: parsed.teachingContextContent,
    teachingContextEmbeds: parsed.teachingContextEmbeds,
    principle: parsed.principle,
    principleEmbeds: parsed.principleEmbeds,
    safetyNotes: parsed.safetyNotes || (detail.expCaution ?? "").trim(),
    safetyEmbeds: parsed.safetyEmbeds,
    dangerNotes: parsed.dangerNotes || (detail.expDanger ?? "").trim(),
    dangerEmbeds: parsed.dangerEmbeds,
    scientistStories: scientistStoriesHydrated,
    referenceCitations,
    referenceRichText: parsed.referenceRichText,
    referenceRichEmbeds: parsed.referenceRichEmbeds,
    materials,
    steps,
    resultEntries,
    creatorName: (detail.displayOwnerName ?? ctx.userName).trim() || ctx.userName,
    coursebookId: (detail.coursebookId ?? "").trim(),
    unitId: (detail.unitId ?? "").trim(),
  };
}
