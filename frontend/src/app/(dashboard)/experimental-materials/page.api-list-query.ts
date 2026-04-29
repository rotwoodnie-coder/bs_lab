import type { ExperimentalMaterialsPageQuery } from "@/lib/experimental-materials-api";

import type { ExperimentalMaterialsFilters } from "./page.types";

export function experimentalMaterialsFiltersToListQuery(
  filters: ExperimentalMaterialsFilters,
  pageIndex0: number,
  pageSize: number,
): ExperimentalMaterialsPageQuery {
  const page = pageIndex0 + 1;
  return {
    page,
    pageSize,
    keyword: filters.query.trim() || undefined,
    materialTypeCode: filters.materialType === "all" ? undefined : filters.materialType,
    categoryCodes: filters.category.length ? [...filters.category] : undefined,
    riskLevel: filters.riskLevel,
    favoritesOnly: filters.onlyFavorites || undefined,
  };
}
