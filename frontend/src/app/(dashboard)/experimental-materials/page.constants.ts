"use client";

import {
  EXPERIMENTAL_MATERIAL_CATEGORY_OPTIONS,
  EXPERIMENTAL_MATERIAL_SAFETY_TAG_OPTIONS,
  EXPERIMENTAL_MATERIAL_TYPE_OPTIONS,
  type ExperimentalMaterialCategory,
  type ExperimentalMaterialRiskLevel,
  type ExperimentalMaterialSafetyTag,
} from "@/data/experimental-materials";

import type { ExperimentalMaterialFormState, ExperimentalMaterialsFilters } from "./page.types";

export const MATERIAL_TYPE_OPTIONS = EXPERIMENTAL_MATERIAL_TYPE_OPTIONS;
export const MATERIAL_CATEGORY_OPTIONS = EXPERIMENTAL_MATERIAL_CATEGORY_OPTIONS;
export const MATERIAL_SAFETY_TAG_OPTIONS = EXPERIMENTAL_MATERIAL_SAFETY_TAG_OPTIONS;

export const ALL_FILTER_VALUE = "all";

export const DEFAULT_FILTERS: ExperimentalMaterialsFilters = {
  query: "",
  materialType: ALL_FILTER_VALUE,
  category: [],
  riskLevel: ALL_FILTER_VALUE,
  onlyFavorites: false,
};

export const DEFAULT_FORM_STATE: ExperimentalMaterialFormState = {
  name: "",
  photoUrl: "",
  /** 与 `data_material_type.type_id` 对齐；空表示未选，避免与维表 id 冲突 */
  materialType: "",
  materialPropId: "",
  usage: "",
  numValue: "",
  suggestedAmount: "",
  unitId: "",
  homeAlternative: "",
  safetyTags: [],
  comments: "",
  status: "ACTIVE",
};

export function createEmptyMaterialForm(): ExperimentalMaterialFormState {
  return {
    ...DEFAULT_FORM_STATE,
    safetyTags: [...DEFAULT_FORM_STATE.safetyTags],
  };
}

export function toggleStringSelection<
  T extends ExperimentalMaterialCategory | ExperimentalMaterialSafetyTag,
>(current: readonly T[], nextValue: T, checked: boolean): T[] {
  return checked ? [...new Set([...current, nextValue])] : current.filter((item) => item !== nextValue);
}

export function materialTypeFilterItems(): { id: string; label: string }[] {
  return [{ id: "all", label: "全部分类" }, ...MATERIAL_TYPE_OPTIONS];
}

export function materialCategoryFilterItems(): { id: string; label: string }[] {
  return [{ id: "all", label: "全部分类" }, ...MATERIAL_CATEGORY_OPTIONS];
}

export function materialRiskLevelFilterItems(): { id: ExperimentalMaterialsFilters["riskLevel"]; label: string }[] {
  return [
    { id: "all", label: "全部" },
    { id: "none", label: "无风险" },
    { id: "low", label: "低风险" },
    { id: "medium", label: "中风险" },
    { id: "high", label: "高风险" },
  ];
}
