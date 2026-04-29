import type { CoreApiActor } from "@/lib/core-api-shared";
import type { CatalogCore } from "@/lib/experiment-catalog-api";
import { fetchV2ExpLibraryById, fetchV2ExpLibraryList, type V2ExpLibraryItem } from "@/lib/v2/v2-exp-api";
import { UserRole } from "@/types/auth";

import type { SchoolDimensionSnapshot } from "../education/subject-grades/page.types";
import { buildExpCatalogListActor, v2ExpLibraryItemToCatalogCore } from "./v2-exp-library-catalog-adapter";

/** 与后端 `/v2/exp-library` 校验一致的单页上限。 */
const LIST_CHUNK_PAGE_SIZE = 100;

const MAX_PAGES = 2000;

const ENRICH_CHUNK = 12;

async function enrichWithGrades(actor: CoreApiActor, items: V2ExpLibraryItem[]): Promise<V2ExpLibraryItem[]> {
  const out: V2ExpLibraryItem[] = [];
  for (let i = 0; i < items.length; i += ENRICH_CHUNK) {
    const slice = items.slice(i, i + ENRICH_CHUNK);
    const rows = await Promise.all(slice.map((it) => fetchV2ExpLibraryById(actor, it.libExpId)));
    for (const r of rows) {
      if (r) out.push(r);
    }
  }
  return out;
}

/**
 * 从主后端 `/v2/exp-library` 拉取全量标准试验（多页 + 逐条补全年级），映射为控制台表格使用的 `CatalogCore`。
 */
export async function fetchAllCatalogExperiments(
  role: UserRole,
  orgId: string,
  keyword: string | undefined,
  getSnapshot: () => SchoolDimensionSnapshot | null,
): Promise<{ items: CatalogCore[]; total: number }> {
  const actor = buildExpCatalogListActor(role, orgId);
  const raw: V2ExpLibraryItem[] = [];
  let page = 1;
  let total = 0;

  for (;;) {
    const data = await fetchV2ExpLibraryList(actor, {
      page,
      pageSize: LIST_CHUNK_PAGE_SIZE,
      keyword: keyword?.trim() || undefined,
    });
    total = data.total;
    raw.push(...data.items);

    if (data.items.length === 0) break;
    if (raw.length >= total) break;
    page += 1;
    if (page > MAX_PAGES) {
      console.warn("[fetchAllCatalogExperiments] 达到最大分页次数，已停止继续请求");
      break;
    }
  }

  const enriched = await enrichWithGrades(actor, raw);
  const snap = getSnapshot();
  return {
    items: enriched.map((row) => v2ExpLibraryItemToCatalogCore(row, snap)),
    total,
  };
}
