import { SUBJECT_CASCADE } from "@/data/subject-tree";
import type { V2DictGradeItem, V2DictItem, V2ExpLibraryItem } from "@/lib/v2/v2-exp-api";
import type { SubjectDiscipline } from "@/types/subject";

import type { ExperimentMaterialDraft, ExperimentReferenceCitationDraft, ExperimentResultEntryDraft, ExperimentStepDraft, PhaseKey } from "../types";
import type { EditorHydrationFromV2Payload } from "./build-editor-hydration-from-v2-detail";
import { splitPrincipleStored } from "./exp-editor-text-fences";
import { normalizeResultEntryDraft, normalizeStepDraft } from "./step-content-filled";

export function resolvePhaseDisciplineGradesFromV2Library(
  item: V2ExpLibraryItem,
  subjects: V2DictItem[],
  grades: V2DictGradeItem[],
): { phase: PhaseKey; discipline: SubjectDiscipline; selectedGradeCodes: string[] } {
  const sn = item.subjectId ? (subjects.find((s) => s.id === item.subjectId)?.name ?? "").trim() : "";
  let phase: PhaseKey = "senior";
  let discipline: SubjectDiscipline = "physics";
  if (sn) {
    outer: for (const ph of SUBJECT_CASCADE) {
      for (const disc of ph.disciplines) {
        if (disc.label === sn) {
          phase = ph.phase as PhaseKey;
          discipline = disc.discipline;
          break outer;
        }
      }
    }
  }
  const codes: string[] = [];
  for (const gr of item.grades ?? []) {
    const gid = gr.gradeId?.trim();
    if (gid) codes.push(gid);
  }
  const unique = [...new Set(codes)];
  return { phase, discipline, selectedGradeCodes: unique };
}

function plainOneLine(text: string | null | undefined): string {
  return String(text ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** 每次调用生成唯一后缀，确保占位 ID 不重复 */
let libPlaceholderSeq = 0;
function nextLibPlaceholderId(prefix: string): string {
  libPlaceholderSeq += 1;
  return `${prefix}${Date.now()}-${libPlaceholderSeq}`;
}

/**
 * 将标准试验库单条（含 `grades`）映射为编辑器可写入状态；库表无视频/材料/步骤子表，以占位与 `comments` 为主。
 */
export function buildEditorHydrationFromV2Library(
  item: V2ExpLibraryItem,
  ctx: { grades: V2DictGradeItem[]; subjects: V2DictItem[]; userName: string },
): EditorHydrationFromV2Payload {
  const tax = resolvePhaseDisciplineGradesFromV2Library(item, ctx.subjects, ctx.grades);
  const parsed = splitPrincipleStored(item.comments ?? "");
  const plainComments = plainOneLine(item.comments);
  const summaryOneLiner =
    parsed.summary.trim() ||
    (plainComments.length > 160 ? `${plainComments.slice(0, 157)}…` : plainComments);
  const stepHint =
    plainComments.length > 0 && plainComments.length < 700
      ? plainComments
      : "本条目来自标准试验库，步骤与材料明细请结合课标与校本要求补充。";

  const materials: ExperimentMaterialDraft[] = [
    {
      id: nextLibPlaceholderId("m-lib-"),
      nameLab: "（请补充实验材料）",
      quantity: "",
      materialType: "实验材料",
      nameHomeSubstitute: "",
      hazardFlags: [],
      safetyReminder: "",
      notes: "",
      thumbnailUrl: "",
    },
  ];

  const steps: ExperimentStepDraft[] = [
    normalizeStepDraft({
      id: nextLibPlaceholderId("s-lib-"),
      title: "实验步骤",
      content: stepHint,
      contentEmbeds: [],
      expectedResult: "",
    }),
  ];

  const resultEntries: ExperimentResultEntryDraft[] = [
    normalizeResultEntryDraft({
      id: nextLibPlaceholderId("r-lib-"),
      title: "评价摘要",
      content: "",
      contentEmbeds: [],
    }),
  ];

  const referenceCitations: ExperimentReferenceCitationDraft[] = [];

  return {
    expName: (item.libExpName ?? "").trim() || "未命名标准试验",
    chooseType: item.chooseType ?? null,
    expTaskType: null,
    subjectId: (item.subjectId ?? "").trim() || null,
    schoolLevelId: (item.schoolLevelId ?? "").trim() || null,
    gradeId: (item.grades?.[0]?.gradeId ?? "").trim() || null,
    ...tax,
    title: (item.libExpName ?? "").trim() || "未命名标准试验",
    summary: summaryOneLiner,
    durationMin: "45",
    simulatorUrl: "",
    difficultyId: "",
    mainVideoUrl: "",
    mainVideoId: null,
    participation: item.chooseType === "y" ? "required" : "optional",
    curriculum: parsed.curriculum.trim() ? parsed.curriculum : `标准试验库 · ${item.libExpId}`,
    teachingContextContent: parsed.teachingContextContent.trim()
      ? parsed.teachingContextContent
      : plainComments.slice(0, 2000),
    teachingContextEmbeds: parsed.teachingContextEmbeds,
    principle: parsed.principle.trim() ? parsed.principle : plainComments.slice(0, 4000),
    principleEmbeds: parsed.principleEmbeds,
    safetyNotes: parsed.safetyNotes,
    safetyEmbeds: parsed.safetyEmbeds,
    dangerNotes: parsed.dangerNotes,
    dangerEmbeds: parsed.dangerEmbeds,
    scientistStories: parsed.scientistStory?.trim()
      ? [{ id: nextLibPlaceholderId("sci-lib-"), scientistName: "", storyName: "", storyComments: parsed.scientistStory }]
      : [],
    referenceCitations,
    referenceRichText: parsed.referenceRichText,
    referenceRichEmbeds: parsed.referenceRichEmbeds,
    materials,
    steps,
    resultEntries,
    materialSecurityIds: [],
    gradeIds: tax.selectedGradeCodes,
    referenceVideos: [],
    creatorName: ctx.userName,
    coursebookId: "",
    unitId: "",
  };
}
