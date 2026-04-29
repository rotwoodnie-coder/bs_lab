import type { ExperimentResultEntryDraft, ExperimentStepDraft } from "../types";

/** 兼容旧数据或部分合并：保证 RichMediaEditor 所需字段存在 */
export function normalizeStepDraft(step: ExperimentStepDraft): ExperimentStepDraft {
  return {
    ...step,
    content: step.content ?? "",
    contentEmbeds: Array.isArray(step.contentEmbeds) ? step.contentEmbeds : [],
  };
}

export function normalizeResultEntryDraft(entry: ExperimentResultEntryDraft): ExperimentResultEntryDraft {
  return {
    ...entry,
    title: entry.title ?? "",
    content: entry.content ?? "",
    contentEmbeds: Array.isArray(entry.contentEmbeds) ? entry.contentEmbeds : [],
  };
}

/** 富文本块是否有文字或嵌入媒体 */
export function richBlockFilled(block: { content?: string | null; contentEmbeds?: unknown }): boolean {
  if ((block.content ?? "").trim().length > 0) return true;
  const embeds = Array.isArray(block.contentEmbeds) ? block.contentEmbeds : [];
  return embeds.some((e: { src?: string }) => (e.src ?? "").trim().length > 0);
}

/** 步骤正文是否已有文字或任意带地址的嵌入媒体 */
export function stepContentFilled(step: ExperimentStepDraft): boolean {
  return richBlockFilled(step);
}

/** 单条实验结果是否满足标题 + 正文（含富媒体） */
export function resultEntryFilled(entry: ExperimentResultEntryDraft): boolean {
  return entry.title.trim().length > 0 && richBlockFilled(entry);
}
