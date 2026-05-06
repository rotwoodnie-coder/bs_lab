import type { CatalogCore } from "@/lib/experiment-catalog-api";
import { fetchV2ExpLibraryList, type V2ExpLibraryItem } from "@/lib/v2/v2-exp-api";
import { UserRole } from "@/types/auth";

import type { SchoolDimensionSnapshot } from "../education/subject-grades/page.types";
import { buildExpCatalogListActor, v2ExpLibraryItemToCatalogCore } from "./v2-exp-library-catalog-adapter";

/** 与后端 `/v2/exp-library` 校验一致的单页上限。 */
const LIST_CHUNK_PAGE_SIZE = 100;

const MAX_PAGES = 2000;

/**
 * 从主后端 `/v2/exp-library` 拉取全量标准试验（多页），映射为控制台表格使用的 `CatalogCore`。
 * 注：列表接口已在后端返回 grades 字段，无需逐条补全。
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

  const snap = getSnapshot();
  return {
    items: raw.map((row) => v2ExpLibraryItemToCatalogCore(row, snap)),
    total,
  };
}
