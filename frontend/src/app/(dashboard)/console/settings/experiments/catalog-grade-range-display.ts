import type { CatalogCore } from "@/lib/experiment-catalog-api";

import type { SchoolDimensionSnapshot } from "../education/subject-grades/page.types";

function nameByGradeId(snapshot: SchoolDimensionSnapshot | null | undefined, gradeId: string): string | undefined {
  if (!snapshot) return undefined;
  const g = snapshot.grades.find((x) => String(x.gradeId) === String(gradeId));
  const n = g?.gradeName?.trim();
  return n || undefined;
}

function gradeSort(snapshot: SchoolDimensionSnapshot | null | undefined, gradeId: string): number {
  if (!snapshot) return 0;
  return snapshot.grades.find((g) => g.gradeId === gradeId)?.sortOrder ?? 0;
}

/**
 * 与详情弹层一致：优先接口首末年级名 → 教学维度快照补名 → 年级 id 列表。
 */
export function formatCatalogGradeRange(row: CatalogCore, snapshot: SchoolDimensionSnapshot | null | undefined): string {
  const ids = row.gradeIds ?? [];
  if (ids.length === 0) return "—";

  const sorted = [...ids].sort((a, b) => gradeSort(snapshot, a) - gradeSort(snapshot, b));
  const names = sorted.map((id) => {
    const n = nameByGradeId(snapshot, id)?.trim();
    return n || id;
  });

  const apiMin = row.minGradeName?.trim();
  const apiMax = row.maxGradeName?.trim();
  if (apiMin && apiMax) {
    return apiMin === apiMax ? apiMin : `${apiMin}～${apiMax}`;
  }

  if (names.length <= 3) return names.join("、");
  return `${names[0]}～${names[names.length - 1]}`;
}

/** 按教学序排列后的年级名称全量拼接（不压缩为区间），不展示内部 id。 */
export function formatCatalogGradeFull(row: CatalogCore, snapshot: SchoolDimensionSnapshot | null | undefined): string {
  const ids = row.gradeIds ?? [];
  if (ids.length === 0) return "—";
  const sorted = [...ids].sort((a, b) => gradeSort(snapshot, a) - gradeSort(snapshot, b));
  const parts = sorted.map((id) => {
    const n = nameByGradeId(snapshot, id)?.trim();
    return n || "未解析";
  });
  return parts.join("、");
}

function sortedGradeSortOrders(row: CatalogCore, snapshot: SchoolDimensionSnapshot | null | undefined): number[] {
  const ids = [...(row.gradeIds ?? [])].sort((a, b) => gradeSort(snapshot, a) - gradeSort(snapshot, b));
  return ids.map((id) => gradeSort(snapshot, id));
}

/** 表头排序：按年级在教学维度中的 sortOrder 做字典序比较；无年级排在有年级之后。 */
export function compareCatalogRowsByGradeOrder(
  a: CatalogCore,
  b: CatalogCore,
  snapshot: SchoolDimensionSnapshot | null | undefined,
): number {
  const oa = sortedGradeSortOrders(a, snapshot);
  const ob = sortedGradeSortOrders(b, snapshot);
  if (oa.length === 0 && ob.length === 0) return 0;
  if (oa.length === 0) return 1;
  if (ob.length === 0) return -1;
  const n = Math.min(oa.length, ob.length);
  for (let i = 0; i < n; i++) {
    const d = oa[i]! - ob[i]!;
    if (d !== 0) return d;
  }
  return oa.length - ob.length;
}
