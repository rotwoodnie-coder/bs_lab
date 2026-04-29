"use client";

import type {
  ExperimentalMaterialCategory,
  ExperimentalMaterialRecord,
  ExperimentalMaterialRiskLevel,
  ExperimentalMaterialSafetyTag,
  ExperimentalMaterialType,
} from "@/data/experimental-materials";

export type ExperimentalMaterialsViewMode = "list" | "cards";

/** 材料表单弹层模式：与列表/详情复用同一套表单 UI */
export type ExperimentalMaterialFormDialogMode = "create" | "edit" | "view" | "copy";

/** 材料表单：来自 `GET /v1/experimental-materials/dimensions` 的选项与风险聚合用维表行 */
export type ExperimentalMaterialFormDimensionsLists = {
  typeSelect: { id: string; label: string }[];
  categoryChecks: { id: string; label: string }[];
  unitOptions: { id: string; label: string }[];
  safetyChecks: { id: string; label: string }[];
  safetyRiskLookup: { code: string; name: string; riskLevel: ExperimentalMaterialRiskLevel }[];
};

/** GET /v1/experimental-materials/:id 返回的关联计数（仅展示） */
export type ExperimentalMaterialDetailStats = {
  scopesCount: number;
  resourcesCount: number;
};

/** 材料被标准实验目录或工作流实验引用 */
export type ExperimentalMaterialRelatedExperiment = {
  refSource: "standard_edge" | "workflow_link";
  experimentId: string;
  displayName: string;
  standardCode: string;
};

export type ExperimentalMaterialsFilters = {
  query: string;
  materialType: ExperimentalMaterialType | "all";
  category: ExperimentalMaterialCategory[];
  riskLevel: "all" | "none" | "low" | "medium" | "high";
  onlyFavorites: boolean;
};

export type ExperimentalMaterialFormState = {
  name: string;
  photoUrl: string;
  materialType: ExperimentalMaterialType;
  materialPropId: string;
  usage: string;
  numValue: string;
  suggestedAmount: string;
  unitId: string;
  homeAlternative: string;
  safetyTags: ExperimentalMaterialSafetyTag[];
  comments: string;
  status: "ACTIVE" | "ARCHIVED";
};

export type ExperimentalMaterialDialogState = {
  open: boolean;
  editingId: string | null;
};

export type ExperimentalMaterialPageState = {
  rows: ExperimentalMaterialRecord[];
  hydrated: boolean;
  view: ExperimentalMaterialsViewMode;
  filters: ExperimentalMaterialsFilters;
  dialog: ExperimentalMaterialDialogState;
  detailTarget: ExperimentalMaterialRecord | null;
  deleteTarget: ExperimentalMaterialRecord | null;
};
