"use client";

import * as React from "react";
import { sonnerToast } from "@bs-lab/ui";
import { experimentalMaterialSummary, getExperimentalMaterialRiskLabel, type ExperimentalMaterialRecord } from "@/data/experimental-materials";
import { buildMaterialsApiActor } from "@/lib/materials-api-actor";
import { parseCoverRegistryIdFromPhotoUrl } from "@/lib/material-cover-registry-id";
import { V2ApiServiceError } from "@/lib/v2/apiService";
import {
  createExperimentalMaterialApi,
  deleteExperimentalMaterialApi,
  fetchExperimentalMaterialDetail,
  fetchExperimentalMaterialDimensions,
  fetchExperimentalMaterialsPage,
  setExperimentalMaterialFavoriteApi,
  updateExperimentalMaterialApi,
  type ExperimentalMaterialDimensionsApiResponse,
  type MaterialCoverThumbInfo,
} from "@/lib/experimental-materials-api";
import { canMaintainExperimentalMaterialsLibrary } from "@/lib/rbac/management-access";
import { UserRole } from "@/types/auth";
import { experimentalMaterialsFiltersToListQuery } from "./page.api-list-query";
import { createEmptyMaterialForm, DEFAULT_FILTERS } from "./page.constants";
import type {
  ExperimentalMaterialDetailStats,
  ExperimentalMaterialFormDialogMode,
  ExperimentalMaterialFormState,
  ExperimentalMaterialRelatedExperiment,
  ExperimentalMaterialsFilters,
  ExperimentalMaterialsViewMode,
} from "./page.types";

const MATERIAL_TEXT_LIMIT = 2000;

function normalizeRecord(record: ExperimentalMaterialRecord): ExperimentalMaterialRecord {
  return {
    ...record,
    name: record.name.trim(),
    photoUrl: record.photoUrl.trim(),
    usage: record.usage.trim(),
    numValue: record.numValue?.trim?.() || record.suggestedAmount.trim(),
    unitId: record.unitId?.trim?.() || "",
    safetyTags: [...record.safetyTags],
    suggestedAmount: record.suggestedAmount.trim(),
    homeAlternative: record.homeAlternative.trim(),
  };
}

function formFromRecord(record: ExperimentalMaterialRecord): ExperimentalMaterialFormState {
  const r = normalizeRecord(record);
  return {
    name: r.name,
    photoUrl: r.photoUrl,
    materialType: r.materialType,
    materialPropId: r.categories?.[0] ?? "",
    usage: r.usage,
    numValue: String(r.numValue ?? ""),
    unitId: String(r.unitId ?? ""),
    safetyTags: [...r.safetyTags],
    comments: r.safetyNote || r.remark ? [r.safetyNote, r.remark].filter(Boolean).join("\n") : "",
    suggestedAmount: String(r.suggestedAmount ?? ""),
    homeAlternative: String(r.homeAlternative ?? ""),
    status: r.status === "ARCHIVED" ? "ARCHIVED" : "ACTIVE",
  };
}

export function useExperimentalMaterialsApiPage(role: UserRole, orgId: string, hydrated: boolean) {
  const [rows, setRows] = React.useState<ExperimentalMaterialRecord[]>([]);
  const [total, setTotal] = React.useState(0);
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(10);
  const [loading, setLoading] = React.useState(false);
  const [view, setView] = React.useState<ExperimentalMaterialsViewMode>("list");
  const [filters, setFiltersState] = React.useState<ExperimentalMaterialsFilters>(DEFAULT_FILTERS);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [formDialogMode, setFormDialogMode] = React.useState<ExperimentalMaterialFormDialogMode>("create");
  const [formTargetId, setFormTargetId] = React.useState<string | null>(null);
  const [dialogRecord, setDialogRecord] = React.useState<ExperimentalMaterialRecord | null>(null);
  const [detailStats, setDetailStats] = React.useState<ExperimentalMaterialDetailStats | null>(null);
  const [relatedExperiments, setRelatedExperiments] = React.useState<ExperimentalMaterialRelatedExperiment[]>([]);
  const [detailCoverThumb, setDetailCoverThumb] = React.useState<MaterialCoverThumbInfo | null>(null);
  const [form, setForm] = React.useState<ExperimentalMaterialFormState>(createEmptyMaterialForm);
  const [deleteTarget, setDeleteTarget] = React.useState<ExperimentalMaterialRecord | null>(null);
  const [dimensions, setDimensions] = React.useState<ExperimentalMaterialDimensionsApiResponse | null>(null);

  const canMaintain = canMaintainExperimentalMaterialsLibrary({
    role,
    roleId: role,
    userId: "demo",
    userName: "demo",
    loginName: "demo",
    orgId,
    orgName: "demo",
    tenantId: "district-001",
    appId: "materials",
  } as any);
  const actor = React.useMemo(() => buildMaterialsApiActor(role, orgId, "materials-page"), [role, orgId]);

  const setFilters = React.useCallback((updater: React.SetStateAction<ExperimentalMaterialsFilters>) => {
    setFiltersState(updater);
    setPageIndex(0);
  }, []);

  const loadRows = React.useCallback(async () => {
    setLoading(true);
    try {
      const q = experimentalMaterialsFiltersToListQuery(filters, pageIndex, pageSize);
      const res = await fetchExperimentalMaterialsPage(actor, q);
      setRows(res.items.map(normalizeRecord));
      setTotal(res.total);
    } catch (error) {
      sonnerToast.error(error instanceof Error ? error.message : "\u52a0\u8f7d\u6750\u6599\u5931\u8d25");
    } finally {
      setLoading(false);
    }
  }, [actor, filters, pageIndex, pageSize]);

  React.useEffect(() => {
    if (!hydrated) return;
    void loadRows();
  }, [hydrated, loadRows]);

  React.useEffect(() => {
    if (!hydrated) return;
    void fetchExperimentalMaterialDimensions(actor)
      .then(setDimensions)
      .catch(() => setDimensions(null));
  }, [actor, hydrated]);

  const toolbarTypeOptions = React.useMemo(() => {
    if (!dimensions?.types?.length) return null;
    return dimensions.types.map((t) => ({
      id: t.code,
      label: (t.displayName?.trim() || t.name || t.code).trim(),
    }));
  }, [dimensions]);

  const toolbarCategoryOptions = React.useMemo(() => {
    if (!dimensions?.categories?.length) return null;
    return dimensions.categories.map((c) => ({
      id: c.code,
      label: `${c.parentCode ? "　└ " : ""}${(c.displayName?.trim() || c.name || c.code).trim()}`,
    }));
  }, [dimensions]);

  const formDimensionLists = React.useMemo(() => {
    if (!dimensions) return null;
    return {
      typeSelect: dimensions.types.map((t) => ({
        id: t.code,
        label: (t.displayName?.trim() || t.name || t.code).trim(),
      })),
      categoryChecks: dimensions.categories.map((c) => ({
        id: c.code,
        label: `${c.parentCode ? "　└ " : ""}${(c.displayName?.trim() || c.name || c.code).trim()}`,
      })),
      unitOptions: dimensions.units.map((u) => ({
        id: u.code,
        label: (u.displayName?.trim() || u.name || u.code).trim(),
      })),
      safetyChecks: dimensions.safetyTags.map((s) => ({
        id: s.code,
        label: `${s.name}（${getExperimentalMaterialRiskLabel(s.riskLevel)}）`,
      })),
      safetyRiskLookup: dimensions.safetyTags.map((s) => ({
        code: s.code,
        name: s.name,
        riskLevel: s.riskLevel,
      })),
    };
  }, [dimensions]);

  const resetDialogState = React.useCallback(() => {
    setFormDialogMode("create");
    setFormTargetId(null);
    setDialogRecord(null);
    setDetailStats(null);
    setRelatedExperiments([]);
    setDetailCoverThumb(null);
    setForm(createEmptyMaterialForm());
  }, []);

  const scheduleDialogOpen = React.useCallback(() => {
    window.setTimeout(() => setDialogOpen(true), 0);
  }, []);

  const openCreateDialog = React.useCallback(() => {
    resetDialogState();
    setFormDialogMode("create");
    scheduleDialogOpen();
  }, [resetDialogState, scheduleDialogOpen]);

  const openEditDialog = React.useCallback(
    (record: ExperimentalMaterialRecord) => {
      setFormDialogMode("edit");
      setFormTargetId(record.id);
      setForm(formFromRecord(normalizeRecord(record)));
      setDialogRecord(record);
      setDetailStats(null);
      setRelatedExperiments([]);
      setDetailCoverThumb(null);
      scheduleDialogOpen();
      void (async () => {
        try {
          const detail = await fetchExperimentalMaterialDetail(actor, record.id);
          setForm(formFromRecord(normalizeRecord(detail.record)));
          setDialogRecord(detail.record);
          setDetailStats({ scopesCount: detail.scopesCount, resourcesCount: detail.resourcesCount });
          setRelatedExperiments(detail.relatedExperiments);
          setDetailCoverThumb(detail.coverThumb);
        } catch {
          setForm(formFromRecord(normalizeRecord(record)));
          setDialogRecord(record);
          setDetailStats(null);
          setRelatedExperiments([]);
          setDetailCoverThumb(null);
          sonnerToast.message("\u672a\u80fd\u62c9\u53d6\u4e3b\u6863\u8be6\u60c5\uff0c\u5df2\u4f7f\u7528\u5217\u8868\u6570\u636e\u7f16\u8f91", {
            description: "\u4fdd\u5b58\u4ecd\u4f1a\u5199\u5165\u670d\u52a1\u5668\u3002",
          });
        }
      })();
    },
    [actor, scheduleDialogOpen],
  );

  const openViewDialog = React.useCallback(
    (record: ExperimentalMaterialRecord) => {
      setFormDialogMode("view");
      setFormTargetId(record.id);
      setForm(formFromRecord(record));
      setDialogRecord(record);
      setDetailStats(null);
      setRelatedExperiments([]);
      setDetailCoverThumb(null);
      scheduleDialogOpen();
      void (async () => {
        try {
          const detail = await fetchExperimentalMaterialDetail(actor, record.id);
          setForm(formFromRecord(detail.record));
          setDialogRecord(detail.record);
          setDetailStats({ scopesCount: detail.scopesCount, resourcesCount: detail.resourcesCount });
          setRelatedExperiments(detail.relatedExperiments);
          setDetailCoverThumb(detail.coverThumb);
        } catch {
          setForm(formFromRecord(record));
          setDialogRecord(record);
          setDetailStats(null);
          setRelatedExperiments([]);
          setDetailCoverThumb(null);
          sonnerToast.message("\u672a\u80fd\u62c9\u53d6\u4e3b\u6863\u8be6\u60c5\uff0c\u5df2\u4f7f\u7528\u5217\u8868\u6570\u636e\u5c55\u793a", {
            description: "\u5b57\u6bb5\u53ef\u80fd\u7565\u65e7\u3002",
          });
        }
      })();
    },
    [actor, scheduleDialogOpen],
  );

  const requestEditFromView = React.useCallback(() => {
    setFormDialogMode("edit");
  }, []);

  const openCopyDialog = React.useCallback((record: ExperimentalMaterialRecord) => {
    setFormDialogMode("copy");
    setFormTargetId(null);
    setDialogRecord(null);
    setDetailStats(null);
    setRelatedExperiments([]);
    setDetailCoverThumb(null);
    const baseName = record.name.trim();
    const copyName = baseName ? `${baseName}\uFF08\u526F\u672C\uFF09` : "\u672A\u547D\u540D\u6750\u6599\uFF08\u526F\u672C\uFF09";
    setForm({
      ...formFromRecord(record),
      name: copyName,
    });
    scheduleDialogOpen();
  }, [scheduleDialogOpen]);

  const closeDialog = React.useCallback(() => {
    setDialogOpen(false);
    resetDialogState();
  }, [resetDialogState]);

  const saveForm = React.useCallback(async () => {
    if (formDialogMode === "view") return;
    const name = form.name.trim();
    if (!name || !form.usage.trim()) {
      sonnerToast.error("\u8bf7\u5148\u5b8c\u5584\u5fc5\u586b\u5b57\u6bb5", {
        description: "\u6750\u6599\u540d\u79f0\u548c\u5b9e\u9a8c\u7528\u9014\u4e3a\u5fc5\u586b\u9879\u3002",
      });
      return;
    }
    if (form.comments.trim().length > MATERIAL_TEXT_LIMIT) {
      sonnerToast.error("\u5185\u5bb9\u8fc7\u957f\uff0c\u8bf7\u7cbe\u7b80\uff08\u96502000\u5b57\uff09", { description: "\u5907\u6ce8/\u5b89\u5168\u8bf4\u660e\u5b57\u6570\u8d85\u8fc7\u4e0a\u9650\u3002" });
      return;
    }
    const coverRegistryId = parseCoverRegistryIdFromPhotoUrl(form.photoUrl);
    const numValue = form.numValue.trim();
    const unitId = form.unitId.trim();
    // unitId 提交时拼入 materialNum（建议用量），存储为 "500 毫升" 格式
    const suggestedAmount = unitId && numValue ? `${numValue} ${unitId}` : (numValue || form.suggestedAmount.trim());
    const payloadBase = {
      name,
      materialType: form.materialType,
      usage: form.usage.trim(),
      numValue,
      unitId,
      suggestedAmount,
      homeAlternative: form.homeAlternative.trim(),
      categories: form.materialPropId ? [form.materialPropId] : [],
      safetyTags: form.safetyTags,
      comments: form.comments.trim() || undefined,
      coverRegistryId: coverRegistryId ?? undefined,
      status: form.status,
    };
    try {
      if (formDialogMode === "edit" && formTargetId) {
        await updateExperimentalMaterialApi(actor, formTargetId, payloadBase);
        sonnerToast.success("\u5df2\u66f4\u65b0\u6750\u6599\u4fe1\u606f");
      } else {
        await createExperimentalMaterialApi(actor, payloadBase);
        setPageIndex(0);
        sonnerToast.success("\u5df2\u65b0\u589e\u6750\u6599");
      }
      closeDialog();
      await loadRows();
    } catch (error) {
      const code = V2ApiServiceError.getBusinessCode(error);
      if (code === 4001) {
        sonnerToast.error("\u5185\u5bb9\u8d85\u8fc7\u5b57\u7b26\u4e0a\u9650\uff08\u8bf7\u68c0\u67e5\u6750\u6599\u63cf\u8ff0\uff09");
        return;
      }
      if (code === 4002) {
        sonnerToast.error("\u540d\u79f0\u4e0d\u80fd\u4e3a\u7a7a");
        return;
      }
      sonnerToast.error(error instanceof Error ? error.message : "\u4fdd\u5b58\u5931\u8d25");
    }
  }, [actor, closeDialog, form, formDialogMode, formTargetId, loadRows]);

  const confirmDelete = React.useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await deleteExperimentalMaterialApi(actor, deleteTarget.id);
      setDeleteTarget(null);
      sonnerToast.message("\u5df2\u5220\u9664\u6750\u6599", { description: experimentalMaterialSummary(deleteTarget) });
      await loadRows();
    } catch (error) {
      sonnerToast.error(error instanceof Error ? error.message : "\u5220\u9664\u5931\u8d25");
    }
  }, [actor, deleteTarget, loadRows]);

  const toggleFavorite = React.useCallback(
    async (id: string) => {
      const row = rows.find((r) => r.id === id);
      const next = !(row?.favorited ?? false);
      try {
        await setExperimentalMaterialFavoriteApi(actor, id, next);
        await loadRows();
      } catch (error) {
        sonnerToast.error(error instanceof Error ? error.message : "\u6536\u85cf\u64cd\u4f5c\u5931\u8d25");
      }
    },
    [actor, loadRows, rows],
  );

  return {
    rows,
    total,
    pageIndex,
    pageSize,
    setPageIndex,
    setPageSize,
    loading,
    view,
    setView,
    filters,
    setFilters,
    canMaintain,
    dialogOpen,
    formDialogMode,
    form,
    setForm,
    formTargetId,
    dialogRecord,
    detailStats,
    relatedExperiments,
    detailCoverThumb,
    deleteTarget,
    setDeleteTarget,
    openCreateDialog,
    openEditDialog,
    openViewDialog,
    openCopyDialog,
    requestEditFromView,
    closeDialog,
    saveForm,
    confirmDelete,
    reload: loadRows,
    toggleFavorite,
    dimensions,
    toolbarTypeOptions,
    toolbarCategoryOptions,
    formDimensionLists,
  };
}
