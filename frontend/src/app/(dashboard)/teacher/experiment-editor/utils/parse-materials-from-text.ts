import type { ExperimentMaterialDraft } from "../types";

function splitAtTopLevelSeparators(raw: string): string[] {
  const parts: string[] = [];
  let buf = "";
  let depth = 0;
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (ch === "（" || ch === "(") depth++;
    if (ch === "）" || ch === ")") depth = Math.max(0, depth - 1);
    if (
      depth === 0 &&
      (ch === "、" || ch === "，" || ch === "；" || ch === ";" || ch === "\n")
    ) {
      if (buf.trim()) parts.push(buf.trim());
      buf = "";
    } else {
      buf += ch;
    }
  }
  if (buf.trim()) parts.push(buf.trim());
  return parts;
}

function findClosingParen(s: string, openIdx: number): number {
  const chOpen = s[openIdx];
  if (chOpen !== "（" && chOpen !== "(") return -1;
  const isFullWidth = chOpen === "（";
  let depth = 1;
  for (let i = openIdx + 1; i < s.length; i++) {
    const ch = s[i];
    if ((isFullWidth && ch === "（") || (!isFullWidth && ch === "(")) depth++;
    else if ((isFullWidth && ch === "）") || (!isFullWidth && ch === ")")) {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function extractQuantityHint(text: string): string | undefined {
  const compact = text.replace(/\s+/g, "");
  const patterns: RegExp[] = [
    /每组\d+[-～－~]\d+株/,
    /每组\d+株/,
    /\d+[-～－~]\d+[株个孔]/,
    /扎\d+[-～－~]\d+个孔?/,
    /扎\d+[-～－~]\d+个小孔/,
    /\d+[-～－~]\d+个小孔/,
  ];
  for (const re of patterns) {
    const m = compact.match(re);
    if (m) return m[0];
  }
  return undefined;
}

function stripTrailingPunct(s: string): string {
  return s.replace(/[。．.、，,\s]+$/u, "").trim();
}

function segmentToDraft(seg: string): Omit<ExperimentMaterialDraft, "id"> | null {
  const base: Omit<ExperimentMaterialDraft, "id"> = {
    nameLab: "",
    quantity: "1",
    materialType: "实验材料",
    nameHomeSubstitute: "",
    hazardFlags: [],
    safetyReminder: "",
    notes: "",
    thumbnailUrl: "",
  };

  let t = stripTrailingPunct(seg);
  if (!t) return null;

  const qHint = extractQuantityHint(t);
  if (qHint) base.quantity = qHint;

  const fw = t.indexOf("（");
  const asc = t.indexOf("(");
  let open = -1;
  if (fw >= 0 && asc >= 0) open = Math.min(fw, asc);
  else open = fw >= 0 ? fw : asc >= 0 ? asc : -1;

  if (open >= 0) {
    const close = findClosingParen(t, open);
    if (close > open) {
      const name = stripTrailingPunct(t.slice(0, open));
      const inner = t.slice(open + 1, close).trim();
      const after = stripTrailingPunct(t.slice(close + 1).replace(/^[，、；;]+/, ""));
      let notes = inner;
      if (after) notes = notes ? `${notes}；${after}` : after;
      base.nameLab = name || t;
      base.notes = notes;
      return base;
    }
  }

  base.nameLab = t;
  return base;
}

/**
 * 将一段综合描述拆成多条材料草稿（按顶层顿号/逗号/分号/换行，括号内分隔不参与拆分）。
 */
export function parseMaterialsFromFreeText(raw: string): Omit<ExperimentMaterialDraft, "id">[] {
  const normalized = raw.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];

  const segments = splitAtTopLevelSeparators(normalized);
  const out: Omit<ExperimentMaterialDraft, "id">[] = [];
  for (const seg of segments) {
    const draft = segmentToDraft(seg);
    if (draft && draft.nameLab.trim()) out.push(draft);
  }
  return out;
}
