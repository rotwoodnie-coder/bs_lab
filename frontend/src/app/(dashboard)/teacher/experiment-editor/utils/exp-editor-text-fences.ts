import type { RichMediaEmbed } from "@bs-lab/ui";

/** 与 `exp_msg.exp_principle` 中摘要/课标/教学背景分段对齐（勿改字符串，否则历史数据无法解析） */
export const BS_EDITOR_SUMMARY = "<!--bs_editor_summary-->";
export const BS_EDITOR_TEACHING = "<!--bs_editor_teaching-->";
export const BS_EDITOR_CURRICULUM = "<!--bs_editor_curriculum-->";
/** 追加分段（2026-04 起新增；仅扩展，不影响旧数据解析） */
export const BS_EDITOR_SAFETY = "<!--bs_editor_safety-->";
export const BS_EDITOR_DANGER = "<!--bs_editor_danger-->";
export const BS_EDITOR_REFERENCE_RICH = "<!--bs_editor_reference_rich-->";
export const BS_EDITOR_SCIENTIST_STORY = "<!--bs_editor_scientist_story-->";

const BS_EMBED_VIDEO = "<!--bs_embed:video-->";
const BS_EMBED_IMAGE = "<!--bs_embed:image-->";

export function appendRichEmbedsToPlainText(base: string, embeds: RichMediaEmbed[]): string {
  let s = base.trimEnd();
  for (const e of embeds) {
    const src = (e.src ?? "").trim();
    if (!src) continue;
    if (e.kind === "video") s += `\n\n${BS_EMBED_VIDEO}${src}`;
    else if (e.kind === "image") s += `\n\n${BS_EMBED_IMAGE}${src}`;
  }
  return s;
}

/** 从正文尾段解析 `appendRichEmbedsToPlainText` 写入的 embed 标记 */
export function splitEmbedsFromSuffix(text: string): { text: string; embeds: RichMediaEmbed[] } {
  const embeds: RichMediaEmbed[] = [];
  let last = 0;
  let out = "";
  const re = /\n*<!--bs_embed:(video|image)-->\s*([^\n]+)/g;
  const s = text;
  let m: RegExpExecArray | null;
  let n = 0;
  while ((m = re.exec(s)) !== null) {
    out += s.slice(last, m.index);
    const kind = m[1] === "video" ? "video" : "image";
    const src = (m[2] ?? "").trim();
    if (src) embeds.push({ id: `hydrated-emb-${n++}`, kind, src });
    last = re.lastIndex;
  }
  out += s.slice(last);
  return { text: out.trimEnd(), embeds };
}

export function splitPrincipleStored(raw: string | null | undefined): {
  principle: string;
  principleEmbeds: RichMediaEmbed[];
  summary: string;
  teachingContextContent: string;
  teachingContextEmbeds: RichMediaEmbed[];
  curriculum: string;
  safetyNotes: string;
  safetyEmbeds: RichMediaEmbed[];
  dangerNotes: string;
  dangerEmbeds: RichMediaEmbed[];
  referenceRichText: string;
  referenceRichEmbeds: RichMediaEmbed[];
  scientistStory: string;
  scientistStoryEmbeds: RichMediaEmbed[];
} {
  const full = String(raw ?? "");
  const partsSummary = full.split(BS_EDITOR_SUMMARY);
  const head = partsSummary[0] ?? "";
  const afterSummary = partsSummary.length > 1 ? partsSummary.slice(1).join(BS_EDITOR_SUMMARY).trim() : "";
  const partsTeaching = afterSummary.split(BS_EDITOR_TEACHING);
  const summary = (partsTeaching[0] ?? "").trim();
  const afterTeaching = partsTeaching.length > 1 ? partsTeaching.slice(1).join(BS_EDITOR_TEACHING).trim() : "";
  const partsCurr = afterTeaching.split(BS_EDITOR_CURRICULUM);
  const teachingRaw = (partsCurr[0] ?? "").trim();
  const afterCurriculum = partsCurr.length > 1 ? partsCurr.slice(1).join(BS_EDITOR_CURRICULUM).trim() : "";

  const partsSafety = afterCurriculum.split(BS_EDITOR_SAFETY);
  const curriculum = (partsSafety[0] ?? "").trim();
  const afterSafety = partsSafety.length > 1 ? partsSafety.slice(1).join(BS_EDITOR_SAFETY).trim() : "";

  const partsDanger = afterSafety.split(BS_EDITOR_DANGER);
  const safetyRaw = (partsDanger[0] ?? "").trim();
  const afterDanger = partsDanger.length > 1 ? partsDanger.slice(1).join(BS_EDITOR_DANGER).trim() : "";

  const partsRef = afterDanger.split(BS_EDITOR_REFERENCE_RICH);
  const dangerRaw = (partsRef[0] ?? "").trim();
  const afterRef = partsRef.length > 1 ? partsRef.slice(1).join(BS_EDITOR_REFERENCE_RICH).trim() : "";

  const partsStory = afterRef.split(BS_EDITOR_SCIENTIST_STORY);
  const referenceRaw = (partsStory[0] ?? "").trim();
  const storyRaw = partsStory.length > 1 ? partsStory.slice(1).join(BS_EDITOR_SCIENTIST_STORY).trim() : "";

  const { text: teachingContextContent, embeds: teachingContextEmbeds } = splitEmbedsFromSuffix(teachingRaw);
  const { text: safetyNotes, embeds: safetyEmbeds } = splitEmbedsFromSuffix(safetyRaw);
  const { text: dangerNotes, embeds: dangerEmbeds } = splitEmbedsFromSuffix(dangerRaw);
  const { text: referenceRichText, embeds: referenceRichEmbeds } = splitEmbedsFromSuffix(referenceRaw);
  const { text: scientistStory, embeds: scientistStoryEmbeds } = splitEmbedsFromSuffix(storyRaw);
  const { text: principle, embeds: principleEmbeds } = splitEmbedsFromSuffix(head);
  return {
    principle: principle.trim(),
    principleEmbeds,
    summary,
    teachingContextContent: teachingContextContent.trim(),
    teachingContextEmbeds,
    curriculum,
    safetyNotes: safetyNotes.trim(),
    safetyEmbeds,
    dangerNotes: dangerNotes.trim(),
    dangerEmbeds,
    referenceRichText: referenceRichText.trim(),
    referenceRichEmbeds,
    scientistStory: scientistStory.trim(),
    scientistStoryEmbeds,
  };
}

export function composeExpPrincipleForDb(input: {
  principle: string;
  principleEmbeds: RichMediaEmbed[];
  summary: string;
  teachingContextContent: string;
  teachingContextEmbeds: RichMediaEmbed[];
  curriculum: string;
  safetyNotes: string;
  safetyEmbeds: RichMediaEmbed[];
  dangerNotes: string;
  dangerEmbeds: RichMediaEmbed[];
  referenceRichText: string;
  referenceRichEmbeds: RichMediaEmbed[];
  scientistStory: string;
  scientistStoryEmbeds: RichMediaEmbed[];
}): string {
  let body = appendRichEmbedsToPlainText(input.principle.trim(), input.principleEmbeds);
  if (input.summary.trim()) body += `\n\n${BS_EDITOR_SUMMARY}\n${input.summary.trim()}`;
  {
    const teaching = appendRichEmbedsToPlainText(input.teachingContextContent.trim(), input.teachingContextEmbeds);
    if (teaching.trim()) body += `\n\n${BS_EDITOR_TEACHING}\n${teaching.trim()}`;
  }
  if (input.curriculum.trim()) body += `\n\n${BS_EDITOR_CURRICULUM}\n${input.curriculum.trim()}`;
  {
    const safety = appendRichEmbedsToPlainText(input.safetyNotes.trim(), input.safetyEmbeds);
    if (safety.trim()) body += `\n\n${BS_EDITOR_SAFETY}\n${safety.trim()}`;
  }
  {
    const danger = appendRichEmbedsToPlainText(input.dangerNotes.trim(), input.dangerEmbeds);
    if (danger.trim()) body += `\n\n${BS_EDITOR_DANGER}\n${danger.trim()}`;
  }
  {
    const refRich = appendRichEmbedsToPlainText(input.referenceRichText.trim(), input.referenceRichEmbeds);
    if (refRich.trim()) body += `\n\n${BS_EDITOR_REFERENCE_RICH}\n${refRich.trim()}`;
  }
  {
    const story = appendRichEmbedsToPlainText(input.scientistStory.trim(), input.scientistStoryEmbeds);
    if (story.trim()) body += `\n\n${BS_EDITOR_SCIENTIST_STORY}\n${story.trim()}`;
  }
  return body || " ";
}

export function splitStepStored(raw: string | null | undefined): { content: string; contentEmbeds: RichMediaEmbed[] } {
  const { text, embeds } = splitEmbedsFromSuffix(String(raw ?? ""));
  return { content: text.trim(), contentEmbeds: embeds };
}

export function sanitizeAndNormalizeRichText(content: string, embeds: RichMediaEmbed[]): { text: string; embeds: RichMediaEmbed[] } {
  /** 不 trim 全文：保留 `exp_msg` 内 `<!--bs_editor_*-->` 等围栏与前后空白，避免回存破坏分段结构 */
  return {
    text: String(content ?? "").replace(/\r\n/g, "\n"),
    embeds: embeds.filter((item) => Boolean((item.src ?? "").trim())),
  };
}

export function composeStepCommentsForDb(content: string, embeds: RichMediaEmbed[]): string {
  const normalized = sanitizeAndNormalizeRichText(content, embeds);
  return appendRichEmbedsToPlainText(normalized.text, normalized.embeds) || " ";
}
