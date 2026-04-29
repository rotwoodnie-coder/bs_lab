import type { RichMediaEmbed } from "@bs-lab/ui";

import { getExperimentalMaterialSafetyLevel, type ExperimentalMaterialRecord } from "@/data/experimental-materials";
import { SUBJECT_TREE_ROOT } from "@/data/subject-tree";
import { INITIAL_EXPERIMENTAL_MATERIALS_FIXTURE } from "@/test-fixtures/experimental-materials.fixture";

export type ExperimentSchema = {
  basicInfo: {
    title: string;
    participation: "required" | "optional";
    summary: string;
  };
  teachingContext: {
    curriculum: string;
    textbook: string;
    objectives: string[];
    gradeText: string;
    inferredSubjectNodeId: string | null;
  };
  designSteps: {
    materialsText: string[];
    stepsText: string[];
    resultText: string;
    safetyText: string;
  };
};

export type ParsedExperimentForm = {
  title: string;
  summary: string;
  participation: "required" | "optional";
  curriculum: string;
  textbook: string;
  objectives: string;
  materials: {
    id: string;
    name: string;
    hazard: "normal" | "warning" | "danger";
    substitute: string;
    imageUrl?: string;
    matchedLibraryId?: string;
    matchScore?: number;
  }[];
  steps: {
    id: string;
    title: string;
    content: string;
    contentEmbeds: RichMediaEmbed[];
    expectedResult: string;
  }[];
  resultEntries: {
    id: string;
    title: string;
    content: string;
    contentEmbeds: RichMediaEmbed[];
  }[];
  safetyNotes: string;
  referenceText: string;
  scienceStory: string;
  phase: "primary" | "junior" | "senior";
  discipline: "science" | "physics" | "chemistry" | "biology";
  gradeCode: string;
  inferredSubjectNodeId: string | null;
  parseWarnings: string[];
};

type ParserOptions = {
  materialsLibrary?: ExperimentalMaterialRecord[];
};

const SECTION_ORDER = [
  "实验名称",
  "选做/必做",
  "对照课标",
  "对照教材",
  "实验目的",
  "实验材料",
  "实验步骤",
  "实验结果",
  "实验注意事项",
  "实验参考",
  "科学家故事",
] as const;

function normalizeText(raw: string): string {
  return raw
    .replace(/\r/g, "\n")
    .replace(/\n{2,}/g, "\n")
    .replace(/--\s*\d+\s*of\s*\d+\s*--/gi, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\u00a0/g, " ")
    .trim();
}

function markerRegex(marker: string): RegExp {
  return new RegExp(`【\\s*${marker}\\s*】`);
}

function extractSection(text: string, marker: (typeof SECTION_ORDER)[number]): string {
  const startMatch = markerRegex(marker).exec(text);
  if (!startMatch) return "";

  const afterStart = text.slice(startMatch.index + startMatch[0].length);
  let endIdx = afterStart.length;
  for (const nextMarker of SECTION_ORDER) {
    if (nextMarker === marker) continue;
    const nextMatch = markerRegex(nextMarker).exec(afterStart);
    if (nextMatch && nextMatch.index < endIdx) endIdx = nextMatch.index;
  }

  return afterStart.slice(0, endIdx).trim();
}

function splitList(text: string): string[] {
  return text
    .split(/\n|、|，|,|；|;/)
    .map((part) => part.replace(/^[\s•\-]+|[\s。；;，,]+$/g, "").trim())
    .filter(Boolean);
}

function parseObjectives(text: string): string[] {
  const byLine = text
    .split("\n")
    .map((line) => line.replace(/^[①②③④⑤⑥⑦⑧⑨⑩\d]+[\.、\)]?\s*/, "").trim())
    .filter(Boolean);
  return byLine.length > 0 ? byLine : splitList(text);
}

function parseSteps(text: string): string[] {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const stepLines = lines
    .filter((line) => /^(\(?[一二三四五六七八九十]+\)?|[①②③④⑤⑥⑦⑧⑨⑩]|\d+)[\.、\)]/.test(line))
    .map((line) => line.replace(/^(\(?[一二三四五六七八九十]+\)?|[①②③④⑤⑥⑦⑧⑨⑩]|\d+)[\.、\)]\s*/, ""));
  return stepLines.length > 0 ? stepLines : lines;
}

function parseParticipation(text: string): "required" | "optional" {
  return text.includes("必做") ? "required" : "optional";
}

function parseGradeRange(text: string): { min: number; max: number; raw: string } | null {
  const arabic = text.match(/(\d+)\s*[-~至]\s*(\d+)\s*年级/);
  if (arabic) {
    const min = Number(arabic[1]);
    const max = Number(arabic[2]);
    if (Number.isFinite(min) && Number.isFinite(max)) {
      return { min, max, raw: arabic[0] };
    }
  }
  return null;
}

function inferSubjectNodeId(curriculumText: string): string | null {
  const range = parseGradeRange(curriculumText);
  const hasWaterTheme = /空气与水|水的特征|物质/.test(curriculumText);
  if (range && range.max <= 5 && hasWaterTheme) return "primary-science";
  if (range && range.max <= 9) return "junior-physics";
  return "senior-physics";
}

function inferPhaseAndDiscipline(nodeId: string | null): {
  phase: "primary" | "junior" | "senior";
  discipline: "science" | "physics" | "chemistry" | "biology";
} {
  const hit = SUBJECT_TREE_ROOT.flatMap((p) => p.children ?? []).find((n) => n.id === nodeId);
  if (!hit?.phase || !hit.discipline) {
    return { phase: "senior", discipline: "physics" };
  }
  return {
    phase: hit.phase,
    discipline: hit.discipline,
  };
}

function normalizeName(value: string): string {
  return value.replace(/[^\p{L}\p{N}]/gu, "").toLowerCase();
}

function scoreMaterialMatch(needle: string, candidate: string): number {
  if (!needle || !candidate) return 0;
  if (needle === candidate) return 1;
  if (needle.includes(candidate) || candidate.includes(needle)) return 0.88;
  const setA = new Set(needle);
  const setB = new Set(candidate);
  const intersection = [...setA].filter((c) => setB.has(c)).length;
  const union = new Set([...setA, ...setB]).size;
  return union > 0 ? intersection / union : 0;
}

function matchMaterial(
  materialName: string,
  materialsLibrary: ExperimentalMaterialRecord[],
): { matchedLibraryId?: string; substitute: string; hazard: "normal" | "warning" | "danger"; imageUrl?: string; score: number } {
  const normalizedNeedle = normalizeName(materialName);
  let bestScore = 0;
  let best: ExperimentalMaterialRecord | null = null;

  for (const row of materialsLibrary) {
    const nameScore = scoreMaterialMatch(normalizedNeedle, normalizeName(row.name));
    const alternativeScore = scoreMaterialMatch(normalizedNeedle, normalizeName(row.homeAlternative));
    const usageScore = scoreMaterialMatch(normalizedNeedle, normalizeName(row.usage));
    const score = Math.max(nameScore, alternativeScore, usageScore);
    if (score > bestScore) {
      bestScore = score;
      best = row;
    }
  }

  if (!best || bestScore < 0.35) {
    return {
      substitute: "",
      hazard: "normal",
      score: 0,
    };
  }

  return {
    matchedLibraryId: best.id,
    substitute: best.homeAlternative,
    hazard: getExperimentalMaterialSafetyLevel(best),
    imageUrl: best.photoUrl || "",
    score: Number(bestScore.toFixed(2)),
  };
}

function inferGradeCode(curriculumText: string): string {
  const range = parseGradeRange(curriculumText);
  if (!range) return "S10";
  if (range.max <= 5) return `P${range.min}`;
  if (range.max <= 9) return `J${range.min}`;
  return `S${range.min}`;
}

export function parseExperimentPdfToForm(rawPdfText: string, options: ParserOptions = {}): {
  schema: ExperimentSchema;
  form: ParsedExperimentForm;
} {
  const text = normalizeText(rawPdfText);

  const titleSec = extractSection(text, "实验名称");
  const participationSec = extractSection(text, "选做/必做");
  const curriculumSec = extractSection(text, "对照课标");
  const textbookSec = extractSection(text, "对照教材");
  const objectivesSec = extractSection(text, "实验目的");
  const materialsSec = extractSection(text, "实验材料");
  const stepsSec = extractSection(text, "实验步骤");
  const resultSec = extractSection(text, "实验结果");
  const safetySec = extractSection(text, "实验注意事项");
  const referenceSec = extractSection(text, "实验参考");
  const storySec = extractSection(text, "科学家故事");

  const inferredSubjectNodeId = inferSubjectNodeId(curriculumSec);
  const { phase, discipline } = inferPhaseAndDiscipline(inferredSubjectNodeId);
  const gradeCode = inferGradeCode(curriculumSec);
  const objectiveList = parseObjectives(objectivesSec);
  const materialList = splitList(materialsSec);
  const stepList = parseSteps(stepsSec);
  const materialsLibrary = options.materialsLibrary ?? INITIAL_EXPERIMENTAL_MATERIALS_FIXTURE;
  const parseWarnings: string[] = [];

  if (!titleSec) parseWarnings.push("未识别到【实验名称】。");
  if (stepList.length === 0) parseWarnings.push("未识别到实验步骤。");
  if (!materialsSec) parseWarnings.push("未识别到【实验材料】。");
  if (!curriculumSec) parseWarnings.push("未识别到【对照课标】。");

  const materials = materialList.map((name, idx) => {
    const matched = matchMaterial(name, materialsLibrary);
    return {
      id: `m${idx + 1}`,
      name,
      hazard: matched.hazard,
      substitute: matched.substitute,
      imageUrl: matched.imageUrl,
      matchedLibraryId: matched.matchedLibraryId,
      matchScore: matched.score || undefined,
    };
  });

  const steps = stepList.map((content, idx) => ({
    id: `s${idx + 1}`,
    title: `步骤 ${idx + 1}`,
    content,
    contentEmbeds: [] as RichMediaEmbed[],
    expectedResult: "",
  }));

  const schema: ExperimentSchema = {
    basicInfo: {
      title: titleSec || "未命名实验",
      participation: parseParticipation(participationSec),
      summary: `${titleSec || "实验"}：基于 PDF 自动解析生成。`,
    },
    teachingContext: {
      curriculum: curriculumSec,
      textbook: textbookSec,
      objectives: objectiveList,
      gradeText: parseGradeRange(curriculumSec)?.raw ?? "",
      inferredSubjectNodeId,
    },
    designSteps: {
      materialsText: materialList,
      stepsText: stepList,
      resultText: resultSec,
      safetyText: safetySec,
    },
  };

  const form: ParsedExperimentForm = {
    title: schema.basicInfo.title,
    summary: schema.basicInfo.summary,
    participation: schema.basicInfo.participation,
    curriculum: schema.teachingContext.curriculum,
    textbook: schema.teachingContext.textbook,
    objectives: schema.teachingContext.objectives.join("\n"),
    materials: materials.length > 0 ? materials : [{ id: "m1", name: "", hazard: "normal", substitute: "" }],
    steps:
      steps.length > 0 ? steps : [{ id: "s1", title: "步骤 1", content: "", contentEmbeds: [], expectedResult: "" }],
    resultEntries:
      resultSec.trim().length > 0
        ? [{ id: "r1", title: "解析结果", content: resultSec, contentEmbeds: [] as RichMediaEmbed[] }]
        : [{ id: "r1", title: "", content: "", contentEmbeds: [] as RichMediaEmbed[] }],
    safetyNotes: safetySec,
    referenceText: referenceSec,
    scienceStory: storySec,
    phase,
    discipline,
    gradeCode,
    inferredSubjectNodeId,
    parseWarnings,
  };

  return { schema, form };
}
