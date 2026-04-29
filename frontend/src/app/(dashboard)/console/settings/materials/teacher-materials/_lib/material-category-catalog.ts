import type { V2DictItem } from "@/lib/v2/v2-exp-api";

/**
 * data_material_type 表的真实字段映射。
 * 真源：database/migrations/bs_exp_data.sql → type_id, type_name, comments, status, sort_order。
 * 禁止编造 materialName / specModel / unit / stockWarning 等 DB 不存在的字段。
 */
export type MaterialCategoryRow = {
  id: string;
  materialCategoryName: string;
  comments: string | null;
  status: string | null;
  sortOrder: number | null;
};

export function statusLabel(status: string | null | undefined): string {
  const v = (status ?? "").trim().toLowerCase();
  if (v === "y" || v === "") return "启用";
  if (v === "n") return "停用";
  return status?.trim() ?? "—";
}

export function normalizeMaterialCategoryRows(items: V2DictItem[]): MaterialCategoryRow[] {
  return items.map((item) => ({
    id: item.id,
    materialCategoryName: item.name,
    comments: item.comments ?? null,
    status: item.status ?? null,
    sortOrder: item.sortOrder ?? null,
  }));
}
