import type { V2ExpMsgDetail, V2ExpMsgItem } from "@/lib/v2/v2-exp-api";
import type { ExperimentFillPayload } from "@/types/experiment-link";
import { splitPrincipleStored } from "@/app/(dashboard)/teacher/experiment-editor/utils/exp-editor-text-fences";

function trimOrUndefined(value: string | null | undefined): string | undefined {
  return value?.trim() || undefined;
}

function pickText(detailValue: string | null | undefined, fallbackValue: string | null | undefined): string | undefined {
  return trimOrUndefined(detailValue) ?? trimOrUndefined(fallbackValue);
}

function pickNumber(detailValue: number | null | undefined, fallbackValue: number | null | undefined): number | undefined {
  return detailValue ?? fallbackValue ?? undefined;
}

export function buildExperimentAutofillPayload(
  detail: V2ExpMsgDetail,
  fallback?: Pick<V2ExpMsgItem, "expName" | "subjectId" | "schoolLevelId" | "gradeId" | "difficultyId" | "coursebookId" | "unitId" | "coverVideoUrl" | "chooseType" | "expTaskType" | "classHour" | "simulatorUrl">,
): ExperimentFillPayload {
  // 解析 exp_principle 中的复合字段（摘要、课标、教学背景、安全提示等围栏分隔内容）
  const parsed = splitPrincipleStored(detail.expPrinciple ?? "");

  return {
    expName: pickText(detail.expName, fallback?.expName),
    subjectId: pickText(detail.subjectId, fallback?.subjectId),
    schoolLevelId: pickText(detail.schoolLevelId, fallback?.schoolLevelId),
    gradeId: pickText(detail.gradeId, fallback?.gradeId),
    chooseType: detail.chooseType ?? fallback?.chooseType ?? null,
    expTaskType: detail.expTaskType ?? fallback?.expTaskType ?? null,
    difficultyId: pickText(detail.difficultyId, fallback?.difficultyId),
    // summary / curriculum / teachingContextContent 从 exp_principle 围栏中解析，不是顶层字段或 coursebookId
    summary: trimOrUndefined(parsed.summary) ?? undefined,
    curriculum: trimOrUndefined(parsed.curriculum) ?? undefined,
    teachingContextContent: trimOrUndefined(parsed.teachingContextContent) ?? undefined,
    principle: trimOrUndefined(parsed.principle) ?? trimOrUndefined(detail.expPrinciple) ?? undefined,
    // safetyNotes / dangerNotes 使用数据库独立字段 exp_caution / exp_danger
    safetyNotes: trimOrUndefined(detail.expCaution),
    dangerNotes: trimOrUndefined(detail.expDanger),
    durationMin:
      pickNumber(detail.classHour, fallback?.classHour) == null
        ? undefined
        : Math.round(Number(pickNumber(detail.classHour, fallback?.classHour)) * 45),
    simulatorUrl: pickText(detail.simulatorUrl, fallback?.simulatorUrl),
    coursebookId: pickText(detail.coursebookId, fallback?.coursebookId),
    unitId: pickText(detail.unitId, fallback?.unitId),
    mainVideoUrl: pickText(detail.coverVideoUrl, fallback?.coverVideoUrl),
    mainVideoEmbeds: pickText(detail.coverVideoUrl, fallback?.coverVideoUrl)
      ? [{ id: `autofill-video-${detail.expId}`, kind: "video", src: pickText(detail.coverVideoUrl, fallback?.coverVideoUrl)! }]
      : undefined,
    materials: detail.materials,
    steps: detail.steps,
    resultEntries: detail.results,
    referenceCitations: detail.references,
    scientistStories: detail.scientists,
  };
}
