"use client";

import * as React from "react";
import type { RichMediaEmbed } from "@bs-lab/ui";

import type { EducationPhase, SubjectDiscipline } from "@/types/subject";

import type {
  ExperimentMaterialDraft,
  ExperimentReferenceCitationDraft,
  ExperimentResultEntryDraft,
  ExperimentStepDraft,
} from "../types";
import { referenceCitationRowFilled } from "../utils/reference-citation-filled";
import { resultEntryFilled, richBlockFilled, stepContentFilled } from "../utils/step-content-filled";
import { EDITOR_ANCHORS } from "./editor-bootstrap-utils";

type ChecklistInput = {
  subjectId: string | null;
  chooseType: "y" | "n" | null;
  expName: string;
  phase: EducationPhase;
  discipline: SubjectDiscipline;
  creatorName: string;
  selectedGradeCodes: string[];
  curriculum: string;
  teachingContextContent: string;
  teachingContextEmbeds: RichMediaEmbed[];
  principle: string;
  principleImage: string;
  principleVideo: string;
  principleEmbeds: RichMediaEmbed[];
  materials: ExperimentMaterialDraft[];
  steps: ExperimentStepDraft[];
  resultEntries: ExperimentResultEntryDraft[];
  safetyNotes: string;
  safetyEmbeds: RichMediaEmbed[];
  dangerNotes: string;
  dangerEmbeds: RichMediaEmbed[];
  referenceCitations: ExperimentReferenceCitationDraft[];
  referenceVideo: string;
  referenceRichText?: string;
  referenceRichEmbeds?: RichMediaEmbed[];
  scienceStory: string;
  scienceStoryEmbeds?: RichMediaEmbed[];
  scientistName: string;
  summary: string;
  durationMin: string;
};

export function useEditorBootstrapChecklist(p: ChecklistInput) {
  const checklist = React.useMemo(
    () => [
      { label: "实验名称", ok: p.expName.trim().length > 0 },
      { label: "学科", ok: Boolean(p.subjectId?.trim()) },
      { label: "年级", ok: p.selectedGradeCodes.length > 0 },
      { label: "选做/必做", ok: Boolean(p.chooseType) },
      { label: "对照课标", ok: p.curriculum.trim().length > 0 },
      {
        label: "对照教材",
        ok: richBlockFilled({ content: p.teachingContextContent, contentEmbeds: p.teachingContextEmbeds }),
      },
      {
        label: "实验原理（文字/视频，图可选）",
        ok:
          p.principle.trim().length > 0 &&
          p.principleEmbeds.some((item) => item.kind === "video" && item.src.trim().length > 0),
      },
      { label: "实验材料（配图可选）", ok: p.materials.some((item) => item.nameLab.trim().length > 0) },
      {
        label: "实验步骤",
        ok: p.steps.some((item) => item.title.trim().length > 0 && stepContentFilled(item)),
      },
      { label: "实验结果", ok: p.resultEntries.some((item) => resultEntryFilled(item)) },
      {
        label: "安全提示",
        ok: richBlockFilled({ content: p.safetyNotes, contentEmbeds: p.safetyEmbeds }),
      },
      {
        label: "危险属性提示（高危）",
        ok: richBlockFilled({ content: p.dangerNotes, contentEmbeds: p.dangerEmbeds }),
      },
      {
        label: "实验参考（引用或视频）",
        ok: p.referenceCitations.some((c) => referenceCitationRowFilled(c)) || p.referenceVideo.trim().length > 0,
      },
      {
        label: "中国科学家故事",
        ok:
          richBlockFilled({ content: p.scienceStory, contentEmbeds: p.scienceStoryEmbeds ?? [] }) ||
          p.scientistName.trim().length > 0,
      },
    ],
    [
      p.chooseType,
      p.creatorName,
      p.curriculum,
      p.expName,
      p.selectedGradeCodes,
      p.materials,
      p.principle,
      p.principleEmbeds,
      p.referenceCitations,
      p.referenceVideo,
      p.scientistName,
      p.resultEntries,
      p.safetyNotes,
      p.safetyEmbeds,
      p.dangerNotes,
      p.dangerEmbeds,
      p.subjectId,
      p.scienceStory,
      p.scienceStoryEmbeds,
      p.steps,
      p.teachingContextContent,
      p.teachingContextEmbeds,
    ],
  );
  const checklistDone = checklist.filter((item) => item.ok).length;
  const completionPct = Math.round((checklistDone / checklist.length) * 100);

  const sectionStatusMap = React.useMemo(() => {
    const subjectDone = Boolean(p.subjectId?.trim()) && p.selectedGradeCodes.length > 0;
    const basicDone =
      p.expName.trim().length > 0 &&
      p.summary.trim().length > 0 &&
      p.durationMin.trim().length > 0 &&
      Boolean(p.chooseType) &&
      p.principle.trim().length > 0 &&
      p.principleEmbeds.some((item) => item.kind === "video" && item.src.trim().length > 0);
    const teachingDone =
      p.curriculum.trim().length > 0 &&
      richBlockFilled({ content: p.teachingContextContent, contentEmbeds: p.teachingContextEmbeds });
    const materialsDone = p.materials.some((item) => item.nameLab.trim().length > 0);
    const stepsDone = p.steps.some((item) => item.title.trim().length > 0 && stepContentFilled(item));
    const resultDone = p.resultEntries.some((item) => resultEntryFilled(item));
    const safetyDone = richBlockFilled({ content: p.safetyNotes, contentEmbeds: p.safetyEmbeds });
    const experimentReferenceDone =
      p.referenceCitations.some((c) => referenceCitationRowFilled(c)) || p.referenceVideo.trim().length > 0;
    const scientistStoryDone =
      richBlockFilled({ content: p.scienceStory, contentEmbeds: p.scienceStoryEmbeds ?? [] }) || p.scientistName.trim().length > 0;
    return {
      subject: { completed: subjectDone, progressPct: subjectDone ? 100 : 40 },
      basic: { completed: basicDone, progressPct: basicDone ? 100 : 55 },
      materials: { completed: materialsDone, progressPct: materialsDone ? 100 : 50 },
      steps: { completed: stepsDone, progressPct: stepsDone ? 100 : 50 },
      result: { completed: resultDone, progressPct: resultDone ? 100 : 50 },
      safety: { completed: safetyDone, progressPct: safetyDone ? 100 : 50 },
      teachingContext: { completed: teachingDone, progressPct: teachingDone ? 100 : 45 },
      experimentReference: {
        completed: experimentReferenceDone,
        progressPct: experimentReferenceDone ? 100 : 30,
      },
      scientistStory: {
        completed: scientistStoryDone,
        progressPct: scientistStoryDone ? 100 : 30,
      },
    } as const;
  }, [
    p.chooseType,
    p.curriculum,
    p.durationMin,
    p.selectedGradeCodes,
    p.materials,
    p.principle,
    p.principleEmbeds,
    p.referenceCitations,
    p.referenceVideo,
    p.scientistName,
    p.resultEntries,
    p.safetyNotes,
    p.safetyEmbeds,
    p.dangerNotes,
    p.dangerEmbeds,
    p.subjectId,
    p.scienceStory,
    p.scienceStoryEmbeds,
    p.steps,
    p.summary,
    p.teachingContextContent,
    p.teachingContextEmbeds,
    p.creatorName,
    p.expName,
  ]);

  const anchorsWithStatus = React.useMemo(
    () =>
      EDITOR_ANCHORS.map((item) => {
        const status = sectionStatusMap[item.id as keyof typeof sectionStatusMap];
        return {
          ...item,
          progressPct: status?.progressPct ?? 0,
          completed: status?.completed ?? false,
        };
      }),
    [sectionStatusMap],
  );

  return { checklist, completionPct, anchorsWithStatus };
}
