import type { V2QuestionItem } from "@/lib/v2/v2-question-api";

export type OptRow = { selectId?: string; selectContent: string; isRight: "y" | "n" };

export function emptyOptRows(): OptRow[] {
  return [
    { selectContent: "", isRight: "n" },
    { selectContent: "", isRight: "n" },
  ];
}

export function optRowsFromQuestion(q: V2QuestionItem | null): OptRow[] {
  const s = q?.selects;
  if (s && s.length > 0) {
    return s.map((x) => ({ selectId: x.selectId, selectContent: x.selectContent, isRight: x.isRight }));
  }
  return emptyOptRows();
}

export function nullIfEmpty(v: string): string | null {
  const t = v.trim();
  return t === "" ? null : t;
}

export function undefinedIfEmpty(v: string): string | undefined {
  const t = v.trim();
  return t === "" ? undefined : t;
}
