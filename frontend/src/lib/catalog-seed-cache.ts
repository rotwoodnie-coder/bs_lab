import type { CatalogSeedRow } from "@/data/experiment-teaching-catalog.seed";

let cachedRows: readonly CatalogSeedRow[] | null = null;

export function setExperimentCatalogSeedRowsCache(rows: readonly CatalogSeedRow[]): void {
  cachedRows = rows;
}

export function getExperimentCatalogSeedRowsCache(): readonly CatalogSeedRow[] | null {
  return cachedRows;
}
