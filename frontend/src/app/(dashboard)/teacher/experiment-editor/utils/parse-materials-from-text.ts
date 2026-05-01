import type { ExperimentMaterialDraft } from "../types";

const UNIT_WORDS = [
  "个", "根", "把", "只", "条", "块", "片", "粒", "颗", "株",
  "包", "瓶", "盒", "杯", "碗", "袋", "勺", "滴", "支", "段",
  "节", "排", "组", "套", "台", "架", "份", "张", "对", "双",
  "枚", "卷", "圈", "捆", "堆", "串", "桶", "坛", "罐", "管",
  "板", "本", "页", "层", "面", "口", "顶", "棵", "朵", "盏",
  "盘", "碟", "盆",
  "毫升", "升", "克", "千克", "公斤", "斤", "两", "米", "厘米", "毫米",
  "小袋", "小瓶", "小包", "小份", "大袋", "大瓶", "大包",
].join("|");

/**
 * 从字符串尾部抽取「数字 + 单位词」作为数量，返回剥离后的名称与数量。
 * 例如 "玻璃搅拌棒1 根" → { stem: "玻璃搅拌棒", qty: "1根" }
 */
function extractTrailingQuantity(text: string): { stem: string; qty: string } | null {
  const m = text.trim().match(
    new RegExp(`^(.+?)[\\s　]*(\\d+(?:\\.\\d+)?)[\\s　]*(${UNIT_WORDS})$`),
  );
  if (m) return { stem: m[1].trim(), qty: m[2] + m[3] };
  return null;
}

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

  // 1) 尝试抽取尾部数量（数字 + 单位词）
  const qMatch = extractTrailingQuantity(t);
  if (qMatch) {
    base.quantity = qMatch.qty;
    t = qMatch.stem;
    if (!t) return null;
  }

  // 2) 尝试抽括号内容作为备注
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
 * 每段自动识别尾部「数字+单位词」作为数量，带括号的说明写入备注。
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
