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
const listOutputPath = path.join(root, "src/data/primary-science-experiment-list.generated.ts");
const SUBJECT_ID = "catalog-subj-science-list";

const GRADE_MAP = new Map([
  [1, "一年级"], [2, "二年级"], [3, "三年级"], [4, "四年级"], [5, "五年级"],
  [6, "六年级"], [7, "七年级"], [8, "八年级"], [9, "九年级"],
]);

const parseRange = (raw) => {
  const s = String(raw ?? "").trim();
  const m = s.match(/(\d+)\s*[-~～]\s*(\d+)/);
  if (m) return { from: Math.min(Number(m[1]), Number(m[2])), to: Math.max(Number(m[1]), Number(m[2])) };
  const one = s.match(/(\d+)/);
  if (one) return { from: Number(one[1]), to: Number(one[1]) };
  return { from: 1, to: 1 };
};

const toGrades = (raw) => {
  const { from, to } = parseRange(raw);
  const out = [];
  for (let i = from; i <= to; i++) out.push(GRADE_MAP.get(i) ?? `${i}年级`);
  return out;
};

const toPhase = (raw) => (parseRange(raw).to <= 6 ? "小学" : "初中");
const toMandatory = (v) => (String(v ?? "").trim() === "选做" ? "optional" : "mandatory");
const toMandatoryZh = (v) => (toMandatory(v) === "mandatory" ? "必做" : "选做");
const toKey = (suggestedGradeRange) => `grade-${parseRange(suggestedGradeRange).from}`;

const csvBuffer = fs.readFileSync(csvPath);
const utfRaw = csvBuffer.toString("utf8").replace(/^\uFEFF/, "");
const header = (utfRaw.split(/\r?\n/)[0] ?? "").trim();
const csvRaw = header.includes("年级") ? utfRaw : iconv.decode(csvBuffer, "gbk");
const records = parse(csvRaw, {
  columns: true, skip_empty_lines: true, trim: true, bom: true, relax_column_count: true,
});

const rows = records
  .map((r) => {
    const gradeRangeRaw = String(r["年级"] ?? "").trim();
    const experimentName = String(r["实验名称"] ?? "").trim();
    if (!gradeRangeRaw || !experimentName) return null;
    const requiredFlag = toMandatoryZh(r["必做/选做"]);
    return {
      subjectId: SUBJECT_ID,
      phase: toPhase(gradeRangeRaw),
      level1Theme: gradeRangeRaw,
      level2Theme: requiredFlag,
      applicableGrades: toGrades(gradeRangeRaw),
      requirements: "",
      basicExperiments: [experimentName],
      activityType: requiredFlag,
      requiredFlag,
      suggestedGradeRange: gradeRangeRaw,
      experimentName,
      mandatory: toMandatory(r["必做/选做"]),
    };
  })
  .filter(Boolean);

const ROWS_PER_SEGMENT = 24;
const segmentCount = Math.max(1, Math.ceil(rows.length / ROWS_PER_SEGMENT));
fs.mkdirSync(segmentsDir, { recursive: true });

const keyToSegmentIds = new Map();
for (let i = 0; i < segmentCount; i++) {
  const segRows = rows.slice(i * ROWS_PER_SEGMENT, (i + 1) * ROWS_PER_SEGMENT);
  for (const row of segRows) {
    const key = toKey(row.suggestedGradeRange);
    if (!keyToSegmentIds.has(key)) keyToSegmentIds.set(key, new Set());
    keyToSegmentIds.get(key).add(i);
  }
}

for (let i = 0; i < segmentCount; i++) {
  const segRows = rows.slice(i * ROWS_PER_SEGMENT, (i + 1) * ROWS_PER_SEGMENT).map((row) => ({
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
  }));
  fs.writeFileSync(
    path.join(segmentsDir, `segment-${String(i).padStart(3, "0")}.ts`),
    `import type { CurriculumStandardRow } from "@/types/curriculum-standard";
export const CATALOG_SEGMENT_INDEX = ${i} as const;
export const CATALOG_SEGMENT_ROWS: readonly Omit<CurriculumStandardRow, "id" | "updatedAt">[] = ${JSON.stringify(segRows, null, 2)} as const;
`,
    "utf8",
  );
}

const orderedKeys = [...keyToSegmentIds.keys()].sort((a, b) => Number(a.split("-")[1]) - Number(b.split("-")[1]));
const keyToSegObj = Object.fromEntries([...keyToSegmentIds.entries()].map(([k, ids]) => [k, [...ids].sort((a, b) => a - b)]));
const gradeOptions = [...new Set(rows.flatMap((row) => row.applicableGrades))];
const activityTypeOptions = [...new Set(rows.map((row) => row.activityType))];

fs.writeFileSync(path.join(seedDir, "catalog-metadata.part-a.ts"), `import type { CurriculumSubject } from "@/types/curriculum-standard";
export const EXPERIMENT_CATALOG_SUBJECTS: readonly CurriculumSubject[] = [{ id: "${SUBJECT_ID}", name: "科学试验列表", description: "按老师提供CSV重构" }] as const;
export const CATALOG_SUGGESTED_GRADE_OPTIONS = ${JSON.stringify(gradeOptions)} as const;
export const CATALOG_ACTIVITY_TYPE_OPTIONS = ${JSON.stringify(activityTypeOptions)} as const;
`, "utf8");

fs.writeFileSync(path.join(seedDir, "catalog-row-key.ts"), `import type { CurriculumStandardRow } from "@/types/curriculum-standard";
export type CatalogPhaseGradeKey = \`grade-\${number}\`;
export function rowCatalogKey(row: Pick<CurriculumStandardRow, "suggestedGradeRange">): CatalogPhaseGradeKey {
  const s = (row.suggestedGradeRange ?? "").trim();
  const m = s.match(/(\\d+)\\s*[-~～]\\s*(\\d+)/);
  if (m) return \`grade-\${Math.min(Number(m[1]), Number(m[2]))}\` as CatalogPhaseGradeKey;
  const n = s.match(/(\\d+)/);
  return \`grade-\${n ? Number(n[1]) : 1}\` as CatalogPhaseGradeKey;
}
`, "utf8");

fs.writeFileSync(path.join(seedDir, "catalog-index.ts"), `import type { CurriculumStandardRow } from "@/types/curriculum-standard";
import { rowCatalogKey, type CatalogPhaseGradeKey } from "./catalog-row-key";
export type CatalogSeedRow = Omit<CurriculumStandardRow, "id" | "updatedAt">;
export const CATALOG_SEGMENT_COUNT = ${segmentCount} as const;
export const CATALOG_PHASE_GRADE_KEYS_ORDERED = ${JSON.stringify(orderedKeys)} as readonly CatalogPhaseGradeKey[];
export const CATALOG_KEY_TO_SEGMENT_IDS: Readonly<Record<CatalogPhaseGradeKey, readonly number[]>> = ${JSON.stringify(keyToSegObj)} as Readonly<Record<CatalogPhaseGradeKey, readonly number[]>>;
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
  Object.fromEntries(CATALOG_PHASE_GRADE_KEYS_ORDERED.map((k) => [k, createCatalogRowsLoaderForPhaseGradeKey(k)])) as Readonly<Record<CatalogPhaseGradeKey, () => Promise<readonly CatalogSeedRow[]>>>;
`, "utf8");

fs.writeFileSync(path.join(seedDir, "index.ts"), `export { EXPERIMENT_CATALOG_SUBJECTS, CATALOG_SUGGESTED_GRADE_OPTIONS, CATALOG_ACTIVITY_TYPE_OPTIONS } from "./catalog-metadata.part-a";
export { rowCatalogKey, type CatalogPhaseGradeKey } from "./catalog-row-key";
export { CATALOG_SEGMENT_COUNT, CATALOG_PHASE_GRADE_KEYS_ORDERED, CATALOG_KEY_TO_SEGMENT_IDS, loadCatalogSegmentByIndex, loadAllExperimentCatalogSeedRows, createCatalogRowsLoaderForPhaseGradeKey, CATALOG_LAZY_LOADERS, type CatalogSeedRow } from "./catalog-index";
export { PRIMARY_SCIENCE_SEED_ROW_COUNT } from "./catalog-stats.generated";
`, "utf8");

fs.writeFileSync(path.join(seedDir, "catalog-stats.generated.ts"), `export const PRIMARY_SCIENCE_SEED_ROW_COUNT = ${rows.length} as const;\n`, "utf8");

fs.writeFileSync(listOutputPath, `export type PrimaryScienceExperimentListItem = {
  id: string;
  experimentName: string;
  gradeRangeRaw: string;
  gradeLabels: string[];
  mandatory: "mandatory" | "optional";
};
export const PRIMARY_SCIENCE_EXPERIMENT_LIST: readonly PrimaryScienceExperimentListItem[] = ${JSON.stringify(
  rows.map((row, i) => ({ id: `exp-${String(i + 1).padStart(3, "0")}`, experimentName: row.experimentName, gradeRangeRaw: row.suggestedGradeRange, gradeLabels: row.applicableGrades, mandatory: row.mandatory })),
  null,
  2,
)} as const;
`, "utf8");

console.log("Wrote experiment list seed:", rows.length);

