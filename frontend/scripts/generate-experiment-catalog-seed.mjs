import "./generate-experiment-catalog-seed-v2.mjs";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "csv-parse/sync";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const csvPath = path.join(root, "src/data/experiment-teaching-catalog.csv");
const seedDir = path.join(root, "src/data/experiment-teaching-catalog.seed");
const segmentsDir = path.join(seedDir, "segments");
const listOutputPath = path.join(root, "src/data/primary-science-experiment-list.generated.ts");

const SUBJECT_ID = "catalog-subj-science-list";

const gradeMap = new Map([
  [1, "一年级"],
  [2, "二年级"],
  [3, "三年级"],
  [4, "四年级"],
  [5, "五年级"],
  [6, "六年级"],
  [7, "七年级"],
  [8, "八年级"],
  [9, "九年级"],
]);

function parseRange(rawRange) {
  const s = String(rawRange ?? "").trim();
  const m = s.match(/(\d+)\s*[-~～]\s*(\d+)/);
  if (m) {
    const a = Number(m[1]);
    const b = Number(m[2]);
    return { from: Math.min(a, b), to: Math.max(a, b) };
  }
  const single = s.match(/(\d+)/);
  if (single) {
    const n = Number(single[1]);
    return { from: n, to: n };
  }
  return { from: 1, to: 1 };
}

function expandGrades(rangeRaw) {
  const { from, to } = parseRange(rangeRaw);
  const out = [];
  for (let i = from; i <= to; i++) out.push(gradeMap.get(i) ?? `${i}年级`);
  return out;
}

function minGrade(rangeRaw) {
  return parseRange(rangeRaw).from;
}

function phaseOf(rangeRaw) {
  const { to } = parseRange(rangeRaw);
  return to <= 6 ? "小学" : "初中";
}

function mandatoryZh(raw) {
  return String(raw ?? "").trim() === "选做" ? "选做" : "必做";
}

function toCatalogKey(row) {
  return `grade-${minGrade(row.suggestedGradeRange)}`;
}

const csvRaw = fs.readFileSync(csvPath, "utf8").replace(/^\uFEFF/, "");
const records = parse(csvRaw, { columns: true, skip_empty_lines: true, trim: true, bom: true });

const rows = records
  .map((item) => {
    const gradeRangeRaw = String(item["年级"] ?? "").trim();
    const experimentName = String(item["实验名称"] ?? "").trim();
    if (!gradeRangeRaw || !experimentName) return null;
    const zh = mandatoryZh(item["必做/选做"]);
    const grades = expandGrades(gradeRangeRaw);
    return {
      subjectId: SUBJECT_ID,
      phase: phaseOf(gradeRangeRaw),
      level1Theme: gradeRangeRaw,
      level2Theme: zh,
      applicableGrades: grades,
      requirements: "",
      basicExperiments: [experimentName],
      activityType: zh,
      requiredFlag: zh,
      suggestedGradeRange: gradeRangeRaw,
      experimentName,
      mandatory: zh === "必做" ? "mandatory" : "optional",
    };
  })
  .filter(Boolean);

const ROWS_PER_SEGMENT = 24;
const segmentCount = Math.max(1, Math.ceil(rows.length / ROWS_PER_SEGMENT));
fs.mkdirSync(segmentsDir, { recursive: true });

const keyToSegmentIds = new Map();
for (let i = 0; i < segmentCount; i++) {
  const slice = rows.slice(i * ROWS_PER_SEGMENT, (i + 1) * ROWS_PER_SEGMENT);
  for (const row of slice) {
    const key = toCatalogKey(row);
    if (!keyToSegmentIds.has(key)) keyToSegmentIds.set(key, new Set());
    keyToSegmentIds.get(key).add(i);
  }
}

for (let i = 0; i < segmentCount; i++) {
  const slice = rows.slice(i * ROWS_PER_SEGMENT, (i + 1) * ROWS_PER_SEGMENT);
  const body = `/* eslint-disable max-len */
import type { CurriculumStandardRow } from "@/types/curriculum-standard";

export const CATALOG_SEGMENT_INDEX = ${i} as const;

export const CATALOG_SEGMENT_ROWS: readonly Omit<CurriculumStandardRow, "id" | "updatedAt">[] = ${JSON.stringify(
    slice.map((row) => ({
      subjectId: row.subjectId,
      phase: row.phase,
      level1Theme: row.level1Theme,
      level2Theme: row.level2Theme,
      applicableGrades: row.applicableGrades,
      requirements: row.requirements,
      basicExperiments: row.basicExperiments,
      activityType: row.activityType,
      requiredFlag: row.requiredFlag,
      suggestedGradeRange: row.suggestedGradeRange,
    })),
    null,
    2,
  )} as const;
`;
  fs.writeFileSync(path.join(segmentsDir, `segment-${String(i).padStart(3, "0")}.ts`), body, "utf8");
}

const gradeOptions = [...new Set(rows.flatMap((row) => row.applicableGrades))];
const activityOptions = [...new Set(rows.map((row) => row.activityType))];

fs.writeFileSync(
  path.join(seedDir, "catalog-metadata.part-a.ts"),
  `import type { CurriculumSubject } from "@/types/curriculum-standard";

export const EXPERIMENT_CATALOG_SUBJECTS: readonly CurriculumSubject[] = [
  { id: "${SUBJECT_ID}", name: "科学试验列表", description: "按老师提供CSV重构" },
] as const;

export const CATALOG_SUGGESTED_GRADE_OPTIONS = ${JSON.stringify(gradeOptions)} as const;
export const CATALOG_ACTIVITY_TYPE_OPTIONS = ${JSON.stringify(activityOptions)} as const;
`,
  "utf8",
);

const keyToSegObj = Object.fromEntries([...keyToSegmentIds.entries()].map(([k, v]) => [k, [...v].sort((a, b) => a - b)]));
const orderedKeys = [...keyToSegmentIds.keys()].sort((a, b) => Number(a.split("-")[1]) - Number(b.split("-")[1]));

fs.writeFileSync(
  path.join(seedDir, "catalog-row-key.ts"),
  `import type { CurriculumStandardRow } from "@/types/curriculum-standard";

export type CatalogPhaseGradeKey = \`grade-\${number}\`;

function parseMinGrade(gradeStr: string | undefined): number {
  const s = (gradeStr ?? "").trim();
  const m = s.match(/(\\d+)\\s*[-~～]\\s*(\\d+)/);
  if (m) return Math.min(Number(m[1]), Number(m[2]));
  const single = s.match(/(\\d+)/);
  if (single) return Number(single[1]);
  return 1;
}

export function rowCatalogKey(row: Pick<CurriculumStandardRow, "suggestedGradeRange">): CatalogPhaseGradeKey {
  return \`grade-\${parseMinGrade(row.suggestedGradeRange)}\` as CatalogPhaseGradeKey;
}
`,
  "utf8",
);

fs.writeFileSync(
  path.join(seedDir, "catalog-index.ts"),
  `import type { CurriculumStandardRow } from "@/types/curriculum-standard";
import { rowCatalogKey, type CatalogPhaseGradeKey } from "./catalog-row-key";

export type CatalogSeedRow = Omit<CurriculumStandardRow, "id" | "updatedAt">;
export const CATALOG_SEGMENT_COUNT = ${segmentCount} as const;
export const CATALOG_PHASE_GRADE_KEYS_ORDERED = ${JSON.stringify(orderedKeys)} as readonly CatalogPhaseGradeKey[];
export const CATALOG_KEY_TO_SEGMENT_IDS: Readonly<Record<CatalogPhaseGradeKey, readonly number[]>> = ${JSON.stringify(
    keyToSegObj,
  )} as Readonly<Record<CatalogPhaseGradeKey, readonly number[]>>;

export async function loadCatalogSegmentByIndex(segmentIndex: number): Promise<readonly CatalogSeedRow[]> {
  if (segmentIndex < 0 || segmentIndex >= CATALOG_SEGMENT_COUNT) throw new Error(\`catalog segment out of range: \${segmentIndex}\`);
  const id = String(segmentIndex).padStart(3, "0");
  const m = await import(\`./segments/segment-\${id}.ts\`);
  return m.CATALOG_SEGMENT_ROWS;
}

export async function loadAllExperimentCatalogSeedRows(): Promise<readonly CatalogSeedRow[]> {
  const out: CatalogSeedRow[] = [];
  for (let i = 0; i < CATALOG_SEGMENT_COUNT; i++) out.push(...(await loadCatalogSegmentByIndex(i)));
  return out;
}

export function createCatalogRowsLoaderForPhaseGradeKey(key: CatalogPhaseGradeKey): () => Promise<readonly CatalogSeedRow[]> {
  const ids = CATALOG_KEY_TO_SEGMENT_IDS[key];
  if (!ids?.length) return async () => [];
  return async () => {
    const acc: CatalogSeedRow[] = [];
    for (const seg of ids) {
      const segRows = await loadCatalogSegmentByIndex(seg);
      for (const r of segRows) if (rowCatalogKey(r) === key) acc.push(r);
    }
    return acc;
  };
}

export const CATALOG_LAZY_LOADERS: Readonly<Record<CatalogPhaseGradeKey, () => Promise<readonly CatalogSeedRow[]>>> =
  Object.fromEntries(CATALOG_PHASE_GRADE_KEYS_ORDERED.map((k) => [k, createCatalogRowsLoaderForPhaseGradeKey(k)]))
    as Readonly<Record<CatalogPhaseGradeKey, () => Promise<readonly CatalogSeedRow[]>>>;
`,
  "utf8",
);

fs.writeFileSync(
  path.join(seedDir, "index.ts"),
  `export { EXPERIMENT_CATALOG_SUBJECTS, CATALOG_SUGGESTED_GRADE_OPTIONS, CATALOG_ACTIVITY_TYPE_OPTIONS } from "./catalog-metadata.part-a";
export { rowCatalogKey, type CatalogPhaseGradeKey } from "./catalog-row-key";
export {
  CATALOG_SEGMENT_COUNT,
  CATALOG_PHASE_GRADE_KEYS_ORDERED,
  CATALOG_KEY_TO_SEGMENT_IDS,
  loadCatalogSegmentByIndex,
  loadAllExperimentCatalogSeedRows,
  createCatalogRowsLoaderForPhaseGradeKey,
  CATALOG_LAZY_LOADERS,
  type CatalogSeedRow,
} from "./catalog-index";
export { PRIMARY_SCIENCE_SEED_ROW_COUNT } from "./catalog-stats.generated";
`,
  "utf8",
);

fs.writeFileSync(
  path.join(seedDir, "catalog-stats.generated.ts"),
  `export const PRIMARY_SCIENCE_SEED_ROW_COUNT = ${rows.length} as const;\n`,
  "utf8",
);

fs.writeFileSync(
  listOutputPath,
  `export type PrimaryScienceExperimentListItem = {
  id: string;
  experimentName: string;
  gradeRangeRaw: string;
  gradeLabels: string[];
  mandatory: "mandatory" | "optional";
};

export const PRIMARY_SCIENCE_EXPERIMENT_LIST: readonly PrimaryScienceExperimentListItem[] = ${JSON.stringify(
    rows.map((row, i) => ({
      id: `exp-${String(i + 1).padStart(3, "0")}`,
      experimentName: row.experimentName,
      gradeRangeRaw: row.suggestedGradeRange,
      gradeLabels: row.applicableGrades,
      mandatory: row.mandatory,
    })),
    null,
    2,
  )} as const;
`,
  "utf8",
);

console.log("Wrote experiment list seed:", rows.length, "rows");

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "csv-parse/sync";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const csvPath = path.join(root, "src/data/experiment-teaching-catalog.csv");
const seedDir = path.join(root, "src/data/experiment-teaching-catalog.seed");
const segmentsDir = path.join(seedDir, "segments");
const listOutputPath = path.join(root, "src/data/primary-science-experiment-list.generated.ts");

const SUBJECT_ID = "catalog-subj-science-list";

const gradeMap = new Map([
  [1, "一年级"],
  [2, "二年级"],
  [3, "三年级"],
  [4, "四年级"],
  [5, "五年级"],
  [6, "六年级"],
  [7, "七年级"],
  [8, "八年级"],
  [9, "九年级"],
]);

function parseRange(rawRange) {
  const s = String(rawRange ?? "").trim();
  const m = s.match(/(\d+)\s*[-~～]\s*(\d+)/);
  if (m) {
    const a = Number(m[1]);
    const b = Number(m[2]);
    return { from: Math.min(a, b), to: Math.max(a, b) };
  }
  const single = s.match(/(\d+)/);
  if (single) {
    const n = Number(single[1]);
    return { from: n, to: n };
  }
  return { from: 1, to: 1 };
}

function expandGrades(rangeRaw) {
  const { from, to } = parseRange(rangeRaw);
  const out = [];
  for (let i = from; i <= to; i++) out.push(gradeMap.get(i) ?? `${i}年级`);
  return out;
}

function minGrade(rangeRaw) {
  return parseRange(rangeRaw).from;
}

function phaseOf(rangeRaw) {
  const { to } = parseRange(rangeRaw);
  return to <= 6 ? "小学" : "初中";
}

function mandatoryZh(raw) {
  return String(raw ?? "").trim() === "选做" ? "选做" : "必做";
}

function toCatalogKey(row) {
  return `grade-${minGrade(row.suggestedGradeRange)}`;
}

const csvRaw = fs.readFileSync(csvPath, "utf8").replace(/^\uFEFF/, "");
const records = parse(csvRaw, { columns: true, skip_empty_lines: true, trim: true, bom: true });

const rows = records
  .map((item) => {
    const gradeRangeRaw = String(item["年级"] ?? "").trim();
    const experimentName = String(item["实验名称"] ?? "").trim();
    if (!gradeRangeRaw || !experimentName) return null;
    const zh = mandatoryZh(item["必做/选做"]);
    const grades = expandGrades(gradeRangeRaw);
    return {
      subjectId: SUBJECT_ID,
      phase: phaseOf(gradeRangeRaw),
      level1Theme: gradeRangeRaw,
      level2Theme: zh,
      applicableGrades: grades,
      requirements: "",
      basicExperiments: [experimentName],
      activityType: zh,
      requiredFlag: zh,
      suggestedGradeRange: gradeRangeRaw,
      experimentName,
      mandatory: zh === "必做" ? "mandatory" : "optional",
    };
  })
  .filter(Boolean);

const ROWS_PER_SEGMENT = 24;
const segmentCount = Math.max(1, Math.ceil(rows.length / ROWS_PER_SEGMENT));
fs.mkdirSync(segmentsDir, { recursive: true });

const keyToSegmentIds = new Map();
for (let i = 0; i < segmentCount; i++) {
  const slice = rows.slice(i * ROWS_PER_SEGMENT, (i + 1) * ROWS_PER_SEGMENT);
  for (const row of slice) {
    const key = toCatalogKey(row);
    if (!keyToSegmentIds.has(key)) keyToSegmentIds.set(key, new Set());
    keyToSegmentIds.get(key).add(i);
  }
}

for (let i = 0; i < segmentCount; i++) {
  const slice = rows.slice(i * ROWS_PER_SEGMENT, (i + 1) * ROWS_PER_SEGMENT);
  const body = `/* eslint-disable max-len */
import type { CurriculumStandardRow } from "@/types/curriculum-standard";

export const CATALOG_SEGMENT_INDEX = ${i} as const;

export const CATALOG_SEGMENT_ROWS: readonly Omit<CurriculumStandardRow, "id" | "updatedAt">[] = ${JSON.stringify(
    slice.map((row) => ({
      subjectId: row.subjectId,
      phase: row.phase,
      level1Theme: row.level1Theme,
      level2Theme: row.level2Theme,
      applicableGrades: row.applicableGrades,
      requirements: row.requirements,
      basicExperiments: row.basicExperiments,
      activityType: row.activityType,
      requiredFlag: row.requiredFlag,
      suggestedGradeRange: row.suggestedGradeRange,
    })),
    null,
    2,
  )} as const;
`;
  fs.writeFileSync(path.join(segmentsDir, `segment-${String(i).padStart(3, "0")}.ts`), body, "utf8");
}

const gradeOptions = [...new Set(rows.flatMap((row) => row.applicableGrades))];
const activityOptions = [...new Set(rows.map((row) => row.activityType))];

fs.writeFileSync(
  path.join(seedDir, "catalog-metadata.part-a.ts"),
  `import type { CurriculumSubject } from "@/types/curriculum-standard";

export const EXPERIMENT_CATALOG_SUBJECTS: readonly CurriculumSubject[] = [
  { id: "${SUBJECT_ID}", name: "科学试验列表", description: "按老师提供CSV重构" },
] as const;

export const CATALOG_SUGGESTED_GRADE_OPTIONS = ${JSON.stringify(gradeOptions)} as const;
export const CATALOG_ACTIVITY_TYPE_OPTIONS = ${JSON.stringify(activityOptions)} as const;
`,
  "utf8",
);

const keyToSegObj = Object.fromEntries([...keyToSegmentIds.entries()].map(([k, v]) => [k, [...v].sort((a, b) => a - b)]));
const orderedKeys = [...keyToSegmentIds.keys()].sort((a, b) => Number(a.split("-")[1]) - Number(b.split("-")[1]));

fs.writeFileSync(
  path.join(seedDir, "catalog-row-key.ts"),
  `import type { CurriculumStandardRow } from "@/types/curriculum-standard";

export type CatalogPhaseGradeKey = \`grade-\${number}\`;

function parseMinGrade(gradeStr: string | undefined): number {
  const s = (gradeStr ?? "").trim();
  const m = s.match(/(\\d+)\\s*[-~～]\\s*(\\d+)/);
  if (m) return Math.min(Number(m[1]), Number(m[2]));
  const single = s.match(/(\\d+)/);
  if (single) return Number(single[1]);
  return 1;
}

export function rowCatalogKey(row: Pick<CurriculumStandardRow, "suggestedGradeRange">): CatalogPhaseGradeKey {
  return \`grade-\${parseMinGrade(row.suggestedGradeRange)}\` as CatalogPhaseGradeKey;
}
`,
  "utf8",
);

fs.writeFileSync(
  path.join(seedDir, "catalog-index.ts"),
  `import type { CurriculumStandardRow } from "@/types/curriculum-standard";
import { rowCatalogKey, type CatalogPhaseGradeKey } from "./catalog-row-key";

export type CatalogSeedRow = Omit<CurriculumStandardRow, "id" | "updatedAt">;
export const CATALOG_SEGMENT_COUNT = ${segmentCount} as const;
export const CATALOG_PHASE_GRADE_KEYS_ORDERED = ${JSON.stringify(orderedKeys)} as readonly CatalogPhaseGradeKey[];
export const CATALOG_KEY_TO_SEGMENT_IDS: Readonly<Record<CatalogPhaseGradeKey, readonly number[]>> = ${JSON.stringify(
    keyToSegObj,
  )} as Readonly<Record<CatalogPhaseGradeKey, readonly number[]>>;

export async function loadCatalogSegmentByIndex(segmentIndex: number): Promise<readonly CatalogSeedRow[]> {
  if (segmentIndex < 0 || segmentIndex >= CATALOG_SEGMENT_COUNT) throw new Error(\`catalog segment out of range: \${segmentIndex}\`);
  const id = String(segmentIndex).padStart(3, "0");
  const m = await import(\`./segments/segment-\${id}.ts\`);
  return m.CATALOG_SEGMENT_ROWS;
}

export async function loadAllExperimentCatalogSeedRows(): Promise<readonly CatalogSeedRow[]> {
  const out: CatalogSeedRow[] = [];
  for (let i = 0; i < CATALOG_SEGMENT_COUNT; i++) out.push(...(await loadCatalogSegmentByIndex(i)));
  return out;
}

export function createCatalogRowsLoaderForPhaseGradeKey(key: CatalogPhaseGradeKey): () => Promise<readonly CatalogSeedRow[]> {
  const ids = CATALOG_KEY_TO_SEGMENT_IDS[key];
  if (!ids?.length) return async () => [];
  return async () => {
    const acc: CatalogSeedRow[] = [];
    for (const seg of ids) {
      const segRows = await loadCatalogSegmentByIndex(seg);
      for (const r of segRows) if (rowCatalogKey(r) === key) acc.push(r);
    }
    return acc;
  };
}

export const CATALOG_LAZY_LOADERS: Readonly<Record<CatalogPhaseGradeKey, () => Promise<readonly CatalogSeedRow[]>>> =
  Object.fromEntries(CATALOG_PHASE_GRADE_KEYS_ORDERED.map((k) => [k, createCatalogRowsLoaderForPhaseGradeKey(k)]))
    as Readonly<Record<CatalogPhaseGradeKey, () => Promise<readonly CatalogSeedRow[]>>>;
`,
  "utf8",
);

fs.writeFileSync(
  path.join(seedDir, "index.ts"),
  `export { EXPERIMENT_CATALOG_SUBJECTS, CATALOG_SUGGESTED_GRADE_OPTIONS, CATALOG_ACTIVITY_TYPE_OPTIONS } from "./catalog-metadata.part-a";
export { rowCatalogKey, type CatalogPhaseGradeKey } from "./catalog-row-key";
export {
  CATALOG_SEGMENT_COUNT,
  CATALOG_PHASE_GRADE_KEYS_ORDERED,
  CATALOG_KEY_TO_SEGMENT_IDS,
  loadCatalogSegmentByIndex,
  loadAllExperimentCatalogSeedRows,
  createCatalogRowsLoaderForPhaseGradeKey,
  CATALOG_LAZY_LOADERS,
  type CatalogSeedRow,
} from "./catalog-index";
export { PRIMARY_SCIENCE_SEED_ROW_COUNT } from "./catalog-stats.generated";
`,
  "utf8",
);

fs.writeFileSync(
  path.join(seedDir, "catalog-stats.generated.ts"),
  `export const PRIMARY_SCIENCE_SEED_ROW_COUNT = ${rows.length} as const;\n`,
  "utf8",
);

fs.writeFileSync(
  listOutputPath,
  `export type PrimaryScienceExperimentListItem = {
  id: string;
  experimentName: string;
  gradeRangeRaw: string;
  gradeLabels: string[];
  mandatory: "mandatory" | "optional";
};

export const PRIMARY_SCIENCE_EXPERIMENT_LIST: readonly PrimaryScienceExperimentListItem[] = ${JSON.stringify(
    rows.map((row, i) => ({
      id: `exp-${String(i + 1).padStart(3, "0")}`,
      experimentName: row.experimentName,
      gradeRangeRaw: row.suggestedGradeRange,
      gradeLabels: row.applicableGrades,
      mandatory: row.mandatory,
    })),
    null,
    2,
  )} as const;
`,
  "utf8",
);

console.log("Wrote experiment list seed:", rows.length, "rows");

/**
 * 从试验列表 CSV 生成 TypeScript 种子模块（分段 + catalog-index）。
 * 输入列：年级,实验名称,必做/选做
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "csv-parse/sync";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const csvPath = path.join(root, "src/data/experiment-teaching-catalog.csv");
const seedDir = path.join(root, "src/data/experiment-teaching-catalog.seed");
const segmentsDir = path.join(seedDir, "segments");
const listOutputPath = path.join(root, "src/data/primary-science-experiment-list.generated.ts");

const SUBJECT_ID = "catalog-subj-science-list";
const SUBJECT_NAME = "科学试验列表";

function escapeTsString(s) {
  return JSON.stringify(s ?? "");
}

function normalizeMandatory(raw) {
  return String(raw ?? "").trim() === "选做" ? "选做" : "必做";
}

function gradeNumToLabel(n) {
  const map = {
    1: "一年级",
    2: "二年级",
    3: "三年级",
    4: "四年级",
    5: "五年级",
    6: "六年级",
    7: "七年级",
    8: "八年级",
    9: "九年级",
  };
  return map[n] ?? `${n}年级`;
}

function parseRangeNumbers(rangeRaw) {
  const s = String(rangeRaw ?? "").trim();
  const m = s.match(/(\d+)\s*[-~～]\s*(\d+)/);
  if (m) {
    const a = Number(m[1]);
    const b = Number(m[2]);
    if (Number.isFinite(a) && Number.isFinite(b)) {
      const from = Math.min(a, b);
      const to = Math.max(a, b);
      return { from, to };
    }
  }
  const single = s.match(/(\d+)/);
  if (single) {
    const n = Number(single[1]);
    if (Number.isFinite(n)) return { from: n, to: n };
  }
  return { from: 1, to: 1 };
}

function expandGradeLabels(rangeRaw) {
  const { from, to } = parseRangeNumbers(rangeRaw);
  const out = [];
  for (let i = from; i <= to; i++) out.push(gradeNumToLabel(i));
  return out;
}

function inferPhase(rangeRaw) {
  const { from, to } = parseRangeNumbers(rangeRaw);
  if (to <= 6) return "小学";
  if (from >= 7) return "初中";
  return "小学";
}

function parseMinGrade(rangeRaw) {
  return parseRangeNumbers(rangeRaw).from;
}

function rowCatalogKey(row) {
  const n = parseMinGrade(row.suggestedGradeRange);
  return `grade-${n}`;
}

const raw = fs.readFileSync(csvPath, "utf8").replace(/^\uFEFF/, "");
const records = parse(raw, {
  columns: true,
  skip_empty_lines: true,
  trim: true,
  relax_column_count: true,
  relax_quotes: true,
  bom: true,
});

const colGrade = "年级";
const colExperiment = "实验名称";
const colMandatory = "必做/选做";

const rowObjects = records
  .map((record) => {
    const gradeRangeRaw = String(record[colGrade] ?? "").trim();
    const experimentName = String(record[colExperiment] ?? "").trim();
    if (!gradeRangeRaw || !experimentName) return null;
    const mandatoryZh = normalizeMandatory(record[colMandatory]);
    const mandatory = mandatoryZh === "必做" ? "mandatory" : "optional";
    const applicableGrades = expandGradeLabels(gradeRangeRaw);
    const phase = inferPhase(gradeRangeRaw);
    return {
      subjectId: SUBJECT_ID,
      phase,
      level1Theme: gradeRangeRaw,
      level2Theme: mandatoryZh,
      requirements: "",
      basicExperiments: [experimentName],
      activityType: mandatoryZh,
      requiredFlag: mandatoryZh,
      suggestedGradeRange: gradeRangeRaw,
      applicableGrades,
      gradeRangeRaw,
      experimentName,
      mandatory,
    };
  })
  .filter(Boolean);

const gradeOptions = [...new Set(rowObjects.flatMap((x) => x.applicableGrades))];
const activityTypeOptions = [...new Set(rowObjects.map((x) => x.activityType))];

const ROWS_PER_SEGMENT = 24;
const segmentCount = Math.max(1, Math.ceil(rowObjects.length / ROWS_PER_SEGMENT));
fs.mkdirSync(segmentsDir, { recursive: true });

const keyToSegmentIds = new Map();
for (let si = 0; si < segmentCount; si++) {
  const start = si * ROWS_PER_SEGMENT;
  const slice = rowObjects.slice(start, start + ROWS_PER_SEGMENT);
  for (const row of slice) {
    const key = rowCatalogKey(row);
    if (!keyToSegmentIds.has(key)) keyToSegmentIds.set(key, new Set());
    keyToSegmentIds.get(key).add(si);
  }
}

for (let si = 0; si < segmentCount; si++) {
  const start = si * ROWS_PER_SEGMENT;
  const slice = rowObjects.slice(start, start + ROWS_PER_SEGMENT);
  let body = `/* eslint-disable max-len */
/**
 * 自动生成分片 ${si + 1}/${segmentCount}（来源：scripts/generate-experiment-catalog-seed.mjs）
 */
import type { CurriculumStandardRow } from "@/types/curriculum-standard";

export const CATALOG_SEGMENT_INDEX = ${si} as const;

export const CATALOG_SEGMENT_ROWS: readonly Omit<CurriculumStandardRow, "id" | "updatedAt">[] = [
`;
  for (const row of slice) {
    body += `  {
    subjectId: ${escapeTsString(row.subjectId)},
    phase: ${escapeTsString(row.phase)},
    level1Theme: ${escapeTsString(row.level1Theme)},
    level2Theme: ${escapeTsString(row.level2Theme)},
    applicableGrades: ${JSON.stringify(row.applicableGrades)},
    requirements: ${escapeTsString(row.requirements)},
    basicExperiments: ${JSON.stringify(row.basicExperiments)},
    activityType: ${escapeTsString(row.activityType)},
    requiredFlag: ${escapeTsString(row.requiredFlag)},
    suggestedGradeRange: ${escapeTsString(row.suggestedGradeRange)},
  },
`;
  }
  body += `] as const;
`;
  const fileName = `segment-${String(si).padStart(3, "0")}.ts`;
  fs.writeFileSync(path.join(segmentsDir, fileName), body, "utf8");
}

const metadataTs = `/* eslint-disable max-len */
/**
 * 自动生成（来源：scripts/generate-experiment-catalog-seed.mjs + experiment-teaching-catalog.csv）
 */
import type { CurriculumSubject } from "@/types/curriculum-standard";

export const EXPERIMENT_CATALOG_SUBJECTS: readonly CurriculumSubject[] = [
  {
    id: ${escapeTsString(SUBJECT_ID)},
    name: ${escapeTsString(SUBJECT_NAME)},
    description: "按老师提供试验列表重构（年级/实验名称/必做选做）",
  },
] as const;

export const CATALOG_SUGGESTED_GRADE_OPTIONS = ${JSON.stringify(gradeOptions)} as const;

export const CATALOG_ACTIVITY_TYPE_OPTIONS = ${JSON.stringify(activityTypeOptions)} as const;
`;
fs.writeFileSync(path.join(seedDir, "catalog-metadata.part-a.ts"), metadataTs, "utf8");

const keyToSegObj = {};
for (const [k, set] of keyToSegmentIds) {
  keyToSegObj[k] = [...set].sort((a, b) => a - b);
}
const sortedKeys = [...keyToSegmentIds.keys()].sort((a, b) => Number(a.split("-")[1]) - Number(b.split("-")[1]));

const catalogRowKeyTs = `/**
 * 试验列表种子行 -> 年级索引键（grade-1 ... grade-9）。
 */
import type { CurriculumStandardRow } from "@/types/curriculum-standard";

export type CatalogPhaseGradeKey = \`grade-\${number}\`;

function parseMinGrade(gradeStr: string | undefined): number {
  const s = (gradeStr ?? "").trim();
  const m = s.match(/(\\d+)\\s*[-~～]\\s*(\\d+)/);
  if (m) return Math.min(Number(m[1]), Number(m[2]));
  const single = s.match(/(\\d+)/);
  if (single) return Number(single[1]);
  return 1;
}

export function rowCatalogKey(
  row: Pick<CurriculumStandardRow, "suggestedGradeRange">,
): CatalogPhaseGradeKey {
  return \`grade-\${parseMinGrade(row.suggestedGradeRange)}\` as CatalogPhaseGradeKey;
}
`;
fs.writeFileSync(path.join(seedDir, "catalog-row-key.ts"), catalogRowKeyTs, "utf8");

const catalogIndexTs = `/* eslint-disable @typescript-eslint/consistent-type-imports */
/**
 * 试验列表分段加载入口（由 generate-experiment-catalog-seed.mjs 生成）。
 */
import type { CurriculumStandardRow } from "@/types/curriculum-standard";

import { rowCatalogKey, type CatalogPhaseGradeKey } from "./catalog-row-key";

export type CatalogSeedRow = Omit<CurriculumStandardRow, "id" | "updatedAt">;

export const CATALOG_SEGMENT_COUNT = ${segmentCount} as const;

export const CATALOG_PHASE_GRADE_KEYS_ORDERED = ${JSON.stringify(sortedKeys)} as readonly CatalogPhaseGradeKey[];

export const CATALOG_KEY_TO_SEGMENT_IDS: Readonly<
  Record<CatalogPhaseGradeKey, readonly number[]>
> = ${JSON.stringify(keyToSegObj)} as Readonly<Record<CatalogPhaseGradeKey, readonly number[]>>;

export async function loadCatalogSegmentByIndex(segmentIndex: number): Promise<readonly CatalogSeedRow[]> {
  if (segmentIndex < 0 || segmentIndex >= CATALOG_SEGMENT_COUNT) {
    throw new Error(\`catalog segment out of range: \${segmentIndex}\`);
  }
  const id = String(segmentIndex).padStart(3, "0");
  const m = await import(\`./segments/segment-\${id}.ts\`);
  return m.CATALOG_SEGMENT_ROWS;
}

export async function loadAllExperimentCatalogSeedRows(): Promise<readonly CatalogSeedRow[]> {
  const out: CatalogSeedRow[] = [];
  for (let i = 0; i < CATALOG_SEGMENT_COUNT; i++) {
    out.push(...(await loadCatalogSegmentByIndex(i)));
  }
  return out;
}

export function createCatalogRowsLoaderForPhaseGradeKey(
  key: CatalogPhaseGradeKey,
): () => Promise<readonly CatalogSeedRow[]> {
  const ids = CATALOG_KEY_TO_SEGMENT_IDS[key];
  if (!ids?.length) return async () => [];
  return async () => {
    const acc: CatalogSeedRow[] = [];
    for (const seg of ids) {
      const rows = await loadCatalogSegmentByIndex(seg);
      for (const r of rows) {
        if (rowCatalogKey(r) === key) acc.push(r);
      }
    }
    return acc;
  };
}

export const CATALOG_LAZY_LOADERS: Readonly<
  Record<CatalogPhaseGradeKey, () => Promise<readonly CatalogSeedRow[]>>
> = Object.fromEntries(
  CATALOG_PHASE_GRADE_KEYS_ORDERED.map((k) => [k, createCatalogRowsLoaderForPhaseGradeKey(k)]),
) as Readonly<Record<CatalogPhaseGradeKey, () => Promise<readonly CatalogSeedRow[]>>>;
`;
fs.writeFileSync(path.join(seedDir, "catalog-index.ts"), catalogIndexTs, "utf8");

const seedIndexTs = `export {
  EXPERIMENT_CATALOG_SUBJECTS,
  CATALOG_SUGGESTED_GRADE_OPTIONS,
  CATALOG_ACTIVITY_TYPE_OPTIONS,
} from "./catalog-metadata.part-a";

export { rowCatalogKey, type CatalogPhaseGradeKey } from "./catalog-row-key";

export {
  CATALOG_SEGMENT_COUNT,
  CATALOG_PHASE_GRADE_KEYS_ORDERED,
  CATALOG_KEY_TO_SEGMENT_IDS,
  loadCatalogSegmentByIndex,
  loadAllExperimentCatalogSeedRows,
  createCatalogRowsLoaderForPhaseGradeKey,
  CATALOG_LAZY_LOADERS,
  type CatalogSeedRow,
} from "./catalog-index";

export { PRIMARY_SCIENCE_SEED_ROW_COUNT } from "./catalog-stats.generated";
`;
fs.writeFileSync(path.join(seedDir, "index.ts"), seedIndexTs, "utf8");

const statsTs = `/**
 * 由 scripts/generate-experiment-catalog-seed.mjs 自动生成（请勿手改）
 */
export const PRIMARY_SCIENCE_SEED_ROW_COUNT = ${rowObjects.length} as const;
`;
fs.writeFileSync(path.join(seedDir, "catalog-stats.generated.ts"), statsTs, "utf8");

const listTs = `/**
 * 由 scripts/generate-experiment-catalog-seed.mjs 自动生成（请勿手改）
 */
export type PrimaryScienceExperimentListItem = {
  id: string;
  experimentName: string;
  gradeRangeRaw: string;
  gradeLabels: string[];
  mandatory: "mandatory" | "optional";
};

export const PRIMARY_SCIENCE_EXPERIMENT_LIST: readonly PrimaryScienceExperimentListItem[] = ${JSON.stringify(
  rowObjects.map((row, i) => ({
    id: `exp-${String(i + 1).padStart(3, "0")}`,
    experimentName: row.experimentName,
    gradeRangeRaw: row.gradeRangeRaw,
    gradeLabels: row.applicableGrades,
    mandatory: row.mandatory,
  })),
  null,
  2,
)} as const;
`;
fs.writeFileSync(listOutputPath, listTs, "utf8");

console.log("Wrote experiment list seed:", "rows", rowObjects.length, "segments", segmentCount, "keys", sortedKeys.length);

/**
 * 从 CSV 生成 TypeScript 种子模块（分段 + catalog-index，支持按需 dynamic import）。
 * 运行：node scripts/generate-experiment-catalog-seed.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "csv-parse/sync";
import iconv from "iconv-lite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const csvPath = path.join(root, "src/data/experiment-teaching-catalog.csv");
const seedDir = path.join(root, "src/data/experiment-teaching-catalog.seed");
const segmentsDir = path.join(seedDir, "segments");

function escapeTsString(s) {
  return JSON.stringify(s ?? "");
}

/** 与 catalog-row-key.ts 保持语义一致（生成期用于 manifest） */
function phaseSlug(phase) {
  const p = String(phase ?? "").trim();
  if (p === "小学") return "primary";
  if (p === "初中") return "junior";
  if (p === "高中") return "senior";
  return "primary";
}

function parseMinGrade(gradeStr) {
  const s = String(gradeStr ?? "").trim();
  if (!s) return 1;
  const range = s.match(/(\d+)\s*[~～]\s*(\d+)/);
  if (range) return Math.min(Number(range[1]), Number(range[2]));
  const arabic = s.match(/(\d+)\s*年级/);
  if (arabic) return Number(arabic[1]);
  const cn = s.match(/([一二三四五六七八九])\s*年级/);
  if (cn) {
    const map = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 };
    const n = map[cn[1]];
    if (typeof n === "number") return n;
  }
  if (/高\s*一|高一/.test(s)) return 10;
  if (/高\s*二|高二/.test(s)) return 11;
  if (/高\s*三|高三/.test(s)) return 12;
  return 1;
}

function rowCatalogKey(row) {
  return `${phaseSlug(row.phase)}-${parseMinGrade(row.suggestedGradeRange)}`;
}

const buf = fs.readFileSync(csvPath);
const utfTry = buf.toString("utf8").replace(/^\uFEFF/, "");
const firstLine = utfTry.split(/\r?\n/)[0] ?? "";
let raw = utfTry;
if (!firstLine.startsWith("学科,")) {
  raw = iconv.decode(buf, "gbk");
}
const records = parse(raw, {
  columns: true,
  skip_empty_lines: true,
  trim: true,
  relax_column_count: true,
  relax_quotes: true,
  bom: true,
});

const col学科 = "学科";
const col学段 = "学段";
const col一级 = "一级主题";
const col二级 = "二级主题";
const col课标 = "课标要求";
const col实验 = "基本实验活动";
const col类型 = "活动类型";
const col年级 = "建议年级";

/** @type {Map<string, { phases: Set<string> }>} */
const subjectMap = new Map();
/** @type {typeof records} */
const rawRows = [];

for (const r of records) {
  const 学科 = r[col学科];
  if (!学科) continue;
  if (!subjectMap.has(学科)) {
    subjectMap.set(学科, { phases: new Set() });
  }
  subjectMap.get(学科).phases.add(r[col学段] || "");
  rawRows.push(r);
}

function subjectPhaseOrder(name) {
  if (name.startsWith("小学")) return 0;
  if (name.startsWith("初中")) return 1;
  if (name.startsWith("高中")) return 2;
  return 3;
}
const subjectNames = [...subjectMap.keys()].sort((a, b) => {
  const pa = subjectPhaseOrder(a);
  const pb = subjectPhaseOrder(b);
  if (pa !== pb) return pa - pb;
  return a.localeCompare(b, "zh-CN");
});
/** @type {Map<string, string>} */
const nameToId = new Map();
subjectNames.forEach((name, i) => {
  nameToId.set(name, `catalog-subj-${i}`);
});

const gradeUniq = new Set();
const typeUniq = new Set();
for (const r of rawRows) {
  const g = (r[col年级] || "").trim();
  if (g) gradeUniq.add(g);
  const ty = (r[col类型] || "").trim();
  if (ty) typeUniq.add(ty);
}
for (const t of [...typeUniq]) {
  if (gradeUniq.has(t)) typeUniq.delete(t);
}
const sortedGrades = [...gradeUniq].sort((a, b) => a.localeCompare(b, "zh-CN"));
const sortedTypes = [...typeUniq].sort((a, b) => a.localeCompare(b, "zh-CN"));

/** @type {{ subjectId: string; phase: string; level1Theme: string; level2Theme: string; requirements: string; basicExperiments: string[]; activityType: string; suggestedGradeRange: string; applicableGrades: string[] }[]} */
const rowObjects = [];
for (const r of rawRows) {
  const sid = nameToId.get(r[col学科]);
  const 实验 = (r[col实验] || "").trim();
  const exp = 实验 ? [实验] : [];
  let 年级 = (r[col年级] || "").trim();
  let 活动类型 = (r[col类型] || "").trim();
  /** 部分 CSV 行「建议年级」为空而「活动类型」误填为「7年级」等，做列错位补救 */
  if (!年级 && /年级/.test(活动类型)) {
    年级 = 活动类型;
    活动类型 = "";
  }
  const grades = 年级 ? [年级] : [];
  rowObjects.push({
    subjectId: sid,
    phase: r[col学段] || "",
    level1Theme: r[col一级] || "",
    level2Theme: r[col二级] || "",
    requirements: r[col课标] || "",
    basicExperiments: exp,
    activityType: 活动类型,
    suggestedGradeRange: 年级,
    applicableGrades: grades,
  });
}

/** 目标：每分片 <300 行硬门禁 — 按行数估算（每条目约 11 行） */
const ROWS_PER_SEGMENT = 24;
const segmentCount = Math.max(1, Math.ceil(rowObjects.length / ROWS_PER_SEGMENT));

fs.mkdirSync(segmentsDir, { recursive: true });

/** @type {Map<string, Set<number>>} */
const keyToSegmentIds = new Map();

for (let si = 0; si < segmentCount; si++) {
  const start = si * ROWS_PER_SEGMENT;
  const slice = rowObjects.slice(start, start + ROWS_PER_SEGMENT);
  for (const row of slice) {
    const k = rowCatalogKey(row);
    if (!keyToSegmentIds.has(k)) keyToSegmentIds.set(k, new Set());
    keyToSegmentIds.get(k).add(si);
  }
}

for (let si = 0; si < segmentCount; si++) {
  const start = si * ROWS_PER_SEGMENT;
  const slice = rowObjects.slice(start, start + ROWS_PER_SEGMENT);
  let body = `/* eslint-disable max-len */
/**
 * 自动生成分片 ${si + 1}/${segmentCount}（来源：scripts/generate-experiment-catalog-seed.mjs）
 */
import type { CurriculumStandardRow } from "@/types/curriculum-standard";

export const CATALOG_SEGMENT_INDEX = ${si} as const;

export const CATALOG_SEGMENT_ROWS: readonly Omit<CurriculumStandardRow, "id" | "updatedAt">[] = [
`;
  for (const row of slice) {
    body += `  {
    subjectId: ${escapeTsString(row.subjectId)},
    phase: ${escapeTsString(row.phase)},
    level1Theme: ${escapeTsString(row.level1Theme)},
    level2Theme: ${escapeTsString(row.level2Theme)},
    requirements: ${escapeTsString(row.requirements)},
    basicExperiments: ${JSON.stringify(row.basicExperiments)},
    activityType: ${escapeTsString(row.activityType)},
    suggestedGradeRange: ${escapeTsString(row.suggestedGradeRange)},
    applicableGrades: ${JSON.stringify(row.applicableGrades)},
  },
`;
  }
  body += `] as const;
`;
  const fileName = `segment-${String(si).padStart(3, "0")}.ts`;
  fs.writeFileSync(path.join(segmentsDir, fileName), body, "utf8");
}

let meta = `/* eslint-disable max-len */
/**
 * 自动生成（来源：scripts/generate-experiment-catalog-seed.mjs + experiment-teaching-catalog.csv）
 */
import type { CurriculumSubject } from "@/types/curriculum-standard";

export const EXPERIMENT_CATALOG_SUBJECTS: readonly CurriculumSubject[] = [
`;

for (const name of subjectNames) {
  const phases = [...subjectMap.get(name).phases].filter(Boolean).sort();
  const desc =
    phases.length > 0
      ? `课标实验教学基本目录（${phases.join("、")}），来源：宝山区教育学院提供的实验资料。`
      : "课标实验教学基本目录，来源：宝山区教育学院提供的实验资料。";
  const id = nameToId.get(name);
  meta += `  { id: ${escapeTsString(id)}, name: ${escapeTsString(name)}, description: ${escapeTsString(desc)} },\n`;
}

meta += `] as const;

export const CATALOG_SUGGESTED_GRADE_OPTIONS = ${JSON.stringify(sortedGrades)} as const;

export const CATALOG_ACTIVITY_TYPE_OPTIONS = ${JSON.stringify(sortedTypes)} as const;
`;

fs.writeFileSync(path.join(seedDir, "catalog-metadata.part-a.ts"), meta, "utf8");

const sortedKeys = [...keyToSegmentIds.keys()].sort((a, b) => {
  const [pa, ga] = a.split("-");
  const [pb, gb] = b.split("-");
  const order = { primary: 0, junior: 1, senior: 2 };
  const oa = order[pa] ?? 9;
  const ob = order[pb] ?? 9;
  if (oa !== ob) return oa - ob;
  return Number(ga) - Number(gb);
});

const keyToSegObj = {};
for (const [k, set] of keyToSegmentIds) {
  keyToSegObj[k] = [...set].sort((a, b) => a - b);
}

const catalogRowKeyTs = `/**
 * 课标种子行 → 「学段-年级」索引键（与生成脚本语义一致）。
 * 册次等二级维度请在业务 Hook 内基于行字段再过滤。
 */
import type { CurriculumStandardRow } from "@/types/curriculum-standard";

export type CatalogPhaseGradeKey =
  | \`primary-\${number}\`
  | \`junior-\${number}\`
  | \`senior-\${number}\`;

function phaseSlug(phase: string | undefined): "primary" | "junior" | "senior" {
  const p = (phase ?? "").trim();
  if (p === "小学") return "primary";
  if (p === "初中") return "junior";
  if (p === "高中") return "senior";
  return "primary";
}

function parseMinGrade(gradeStr: string | undefined): number {
  const s = (gradeStr ?? "").trim();
  if (!s) return 1;
  const range = s.match(/(\\d+)\\s*[~～]\\s*(\\d+)/);
  if (range) return Math.min(Number(range[1]), Number(range[2]));
  const arabic = s.match(/(\\d+)\\s*年级/);
  if (arabic) return Number(arabic[1]);
  const cn = s.match(/([一二三四五六七八九])\\s*年级/);
  if (cn) {
    const map: Record<string, number> = {
      一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9,
    };
    const n = map[cn[1] ?? ""];
    if (typeof n === "number") return n;
  }
  if (/高\\s*一|高一/.test(s)) return 10;
  if (/高\\s*二|高二/.test(s)) return 11;
  if (/高\\s*三|高三/.test(s)) return 12;
  return 1;
}

export function rowCatalogKey(
  row: Pick<CurriculumStandardRow, "phase" | "suggestedGradeRange" | "activityType">,
): CatalogPhaseGradeKey {
  const g = (row.suggestedGradeRange ?? "").trim();
  const t = (row.activityType ?? "").trim();
  const src = g || (/年级/.test(t) ? t : "");
  return \`\${phaseSlug(row.phase)}-\${parseMinGrade(src)}\` as CatalogPhaseGradeKey;
}
`;

fs.writeFileSync(path.join(seedDir, "catalog-row-key.ts"), catalogRowKeyTs, "utf8");

const catalogIndexTs = `/* eslint-disable @typescript-eslint/consistent-type-imports */
/**
 * 课标种子分段加载入口（由 generate-experiment-catalog-seed.mjs 生成）。
 */
import type { CurriculumStandardRow } from "@/types/curriculum-standard";

import { rowCatalogKey, type CatalogPhaseGradeKey } from "./catalog-row-key";

export type CatalogSeedRow = Omit<CurriculumStandardRow, "id" | "updatedAt">;

export const CATALOG_SEGMENT_COUNT = ${segmentCount} as const;

/** 全库出现的 phase-grade 键（有序，便于调试） */
export const CATALOG_PHASE_GRADE_KEYS_ORDERED = ${JSON.stringify(sortedKeys)} as readonly CatalogPhaseGradeKey[];

/**
 * 各「学段-年级」键 → 含该键条目的分片下标（升序）。
 * 懒加载时只拉这些分片，再在内存中按 rowCatalogKey 过滤。
 */
export const CATALOG_KEY_TO_SEGMENT_IDS: Readonly<
  Record<CatalogPhaseGradeKey, readonly number[]>
> = ${JSON.stringify(keyToSegObj)} as Readonly<Record<CatalogPhaseGradeKey, readonly number[]>>;

export async function loadCatalogSegmentByIndex(
  segmentIndex: number,
): Promise<readonly CatalogSeedRow[]> {
  if (segmentIndex < 0 || segmentIndex >= CATALOG_SEGMENT_COUNT) {
    throw new Error(\`catalog segment out of range: \${segmentIndex}\`);
  }
  const id = String(segmentIndex).padStart(3, "0");
  const m = await import(\`./segments/segment-\${id}.ts\`);
  return m.CATALOG_SEGMENT_ROWS;
}

/** 按 CSV 全序拼接（用于本地种子仓 std_seed_i 稳定编号） */
export async function loadAllExperimentCatalogSeedRows(): Promise<readonly CatalogSeedRow[]> {
  const out: CatalogSeedRow[] = [];
  for (let i = 0; i < CATALOG_SEGMENT_COUNT; i++) {
    out.push(...(await loadCatalogSegmentByIndex(i)));
  }
  return out;
}

/** 某学段-年级键：按需拉取相关分片并过滤（不保证与全库顺序一致） */
export function createCatalogRowsLoaderForPhaseGradeKey(
  key: CatalogPhaseGradeKey,
): () => Promise<readonly CatalogSeedRow[]> {
  const ids = CATALOG_KEY_TO_SEGMENT_IDS[key];
  if (!ids?.length) {
    return async () => [];
  }
  return async () => {
    const acc: CatalogSeedRow[] = [];
    for (const seg of ids) {
      const rows = await loadCatalogSegmentByIndex(seg);
      for (const r of rows) {
        if (rowCatalogKey(r) === key) acc.push(r);
      }
    }
    return acc;
  };
}

export const CATALOG_LAZY_LOADERS: Readonly<
  Record<CatalogPhaseGradeKey, () => Promise<readonly CatalogSeedRow[]>>
> = Object.fromEntries(
  CATALOG_PHASE_GRADE_KEYS_ORDERED.map((k) => [k, createCatalogRowsLoaderForPhaseGradeKey(k)]),
) as Readonly<Record<CatalogPhaseGradeKey, () => Promise<readonly CatalogSeedRow[]>>>;
`;

fs.writeFileSync(path.join(seedDir, "catalog-index.ts"), catalogIndexTs, "utf8");

const indexTs = `export {
  EXPERIMENT_CATALOG_SUBJECTS,
  CATALOG_SUGGESTED_GRADE_OPTIONS,
  CATALOG_ACTIVITY_TYPE_OPTIONS,
} from "./catalog-metadata.part-a";

export {
  rowCatalogKey,
  type CatalogPhaseGradeKey,
} from "./catalog-row-key";

export {
  CATALOG_SEGMENT_COUNT,
  CATALOG_PHASE_GRADE_KEYS_ORDERED,
  CATALOG_KEY_TO_SEGMENT_IDS,
  loadCatalogSegmentByIndex,
  loadAllExperimentCatalogSeedRows,
  createCatalogRowsLoaderForPhaseGradeKey,
  CATALOG_LAZY_LOADERS,
  type CatalogSeedRow,
} from "./catalog-index";

export { PRIMARY_SCIENCE_SEED_ROW_COUNT } from "./catalog-stats.generated";
`;

fs.writeFileSync(path.join(seedDir, "index.ts"), indexTs, "utf8");

const primaryScienceSeedRowCount = rowObjects.filter(
  (r) => r.subjectId === "catalog-subj-0" && (r.phase || "").trim() === "小学",
).length;
const statsTs = `/**
 * 由 scripts/generate-experiment-catalog-seed.mjs 自动生成（请勿手改）
 */
export const PRIMARY_SCIENCE_SEED_ROW_COUNT = ${primaryScienceSeedRowCount} as const;
`;
fs.writeFileSync(path.join(seedDir, "catalog-stats.generated.ts"), statsTs, "utf8");

/** 清理旧版单体分片文件（若存在） */
for (const legacy of [
  "catalog-rows-primary.part-b.ts",
  "catalog-rows-junior.part-c.ts",
  "catalog-rows-senior.part-d.ts",
]) {
  const p = path.join(seedDir, legacy);
  if (fs.existsSync(p)) fs.unlinkSync(p);
}

console.log(
  "Wrote catalog seed:",
  "rows",
  rowObjects.length,
  "segments",
  segmentCount,
  "keys",
  sortedKeys.length,
);
