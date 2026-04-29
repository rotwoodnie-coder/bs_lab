/**
 * 材料状态枚举映射（统一真源）
 *
 * DB 存储值：`"y"`（启用）、`"n"`（停用）
 * 前端展示值：`"ACTIVE"`、`"ARCHIVED"`
 *
 * 当需要新增状态或反向统一 DB 值时，修改此文件即可。
 */

export const MATERIAL_STATUS_DB_VALUES = ["y", "n"] as const;
export type MaterialStatusDb = (typeof MATERIAL_STATUS_DB_VALUES)[number];

export const MATERIAL_STATUS_UI_VALUES = ["ACTIVE", "ARCHIVED"] as const;
export type MaterialStatusUi = (typeof MATERIAL_STATUS_UI_VALUES)[number];

const STATUS_DB_TO_UI: Record<string, MaterialStatusUi> = {
  y: "ACTIVE",
  n: "ARCHIVED",
};

const STATUS_UI_TO_DB: Record<string, MaterialStatusDb> = {
  ACTIVE: "y",
  ARCHIVED: "n",
};

/** DB 值 → 前端展示值 */
export function materialStatusDbToUi(db: string | null | undefined): MaterialStatusUi {
  return STATUS_DB_TO_UI[db ?? ""] ?? "ACTIVE";
}

/** 前端展示值 → DB 存储值 */
export function materialStatusUiToDb(ui: string | null | undefined): MaterialStatusDb {
  return STATUS_UI_TO_DB[ui ?? ""] ?? "y";
}
