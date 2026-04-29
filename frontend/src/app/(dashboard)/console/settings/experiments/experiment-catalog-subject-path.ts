import type { CatalogCore } from "@/lib/experiment-catalog-api";

import type { SchoolDimensionSnapshot } from "../education/subject-grades/page.types";

export function catalogPhaseStats(
  items: CatalogCore[],
  snapshot: SchoolDimensionSnapshot | null,
): { primary: number; junior: number; senior: number; other: number } {
  const out = { primary: 0, junior: 0, senior: 0, other: 0 };
  if (!snapshot) return out;
  const idToLevelKey = new Map(snapshot.levels.map((lv) => [lv.levelId, lv.levelId]));
  for (const row of items) {
    const code = idToLevelKey.get(row.stageId) ?? "";
    if (code === "STAGE_PRIMARY") out.primary += 1;
    else if (code === "STAGE_JUNIOR") out.junior += 1;
    else if (code === "STAGE_SENIOR") out.senior += 1;
    else out.other += 1;
  }
  return out;
}

export function catalogMandatoryCount(items: CatalogCore[]): number {
  return items.filter((r) => r.isMandatory === 1).length;
}
