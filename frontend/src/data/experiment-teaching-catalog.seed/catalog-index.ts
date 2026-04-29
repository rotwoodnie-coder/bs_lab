import type { CurriculumStandardRow } from "@/types/curriculum-standard";
import { rowCatalogKey, type CatalogPhaseGradeKey } from "./catalog-row-key";
export type CatalogSeedRow = Omit<CurriculumStandardRow, "id" | "updatedAt">;
export const CATALOG_SEGMENT_COUNT = 5 as const;
export const CATALOG_PHASE_GRADE_KEYS_ORDERED = ["grade-1","grade-3","grade-5","grade-7"] as readonly CatalogPhaseGradeKey[];
export const CATALOG_KEY_TO_SEGMENT_IDS: Readonly<Record<CatalogPhaseGradeKey, readonly number[]>> = {"grade-1":[0],"grade-3":[0,1],"grade-5":[1,2],"grade-7":[2,3,4]} as Readonly<Record<CatalogPhaseGradeKey, readonly number[]>>;
export async function loadCatalogSegmentByIndex(segmentIndex: number): Promise<readonly CatalogSeedRow[]> {
  if (segmentIndex < 0 || segmentIndex >= CATALOG_SEGMENT_COUNT) throw new Error(`catalog segment out of range: ${segmentIndex}`);
  const id = String(segmentIndex).padStart(3, "0");
  const m = await import(`./segments/segment-${id}.ts`);
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
