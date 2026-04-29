import type { ExperimentReferenceCitationDraft } from "../types";

export function referenceCitationRowFilled(c: ExperimentReferenceCitationDraft): boolean {
  return c.citedExperimentTitle.trim().length > 0;
}

/** 附加属性：实验参考与科学家故事均应有最低限度内容 */
export function auxiliaryReferenceSectionFilled(
  citations: ExperimentReferenceCitationDraft[],
  referenceVideo: string,
  scienceStory: string,
  scientistName: string,
): boolean {
  const referenceOk =
    citations.some(referenceCitationRowFilled) || referenceVideo.trim().length > 0;
  const storyOk = scienceStory.trim().length > 0 || scientistName.trim().length > 0;
  return referenceOk && storyOk;
}
