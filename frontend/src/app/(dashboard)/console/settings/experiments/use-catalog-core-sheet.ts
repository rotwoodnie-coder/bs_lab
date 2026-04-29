"use client";

import * as React from "react";

import { sonnerToast } from "@bs-lab/ui";

import type { CatalogCategory } from "@/lib/experiment-catalog-api";
import { createV2ExpLibrary } from "@/lib/v2/v2-exp-api";
import { UserRole } from "@/types/auth";

import type { SchoolDimensionSnapshot } from "../education/subject-grades/page.types";
import { eligibleGradeIdsForCatalog } from "./catalog-eligible-grades";
import { buildExpCatalogListActor, V2_EXP_LIBRARY_PLACEHOLDER_CATEGORY } from "./v2-exp-library-catalog-adapter";

export function useCatalogCoreSheet(opts: {
  role: UserRole;
  orgId: string;
  snapshot: SchoolDimensionSnapshot | null;
  categories: CatalogCategory[];
  refreshList: () => Promise<void>;
  refreshCategories: () => Promise<void>;
  loadEdges: () => Promise<void>;
}) {
  const { role, orgId, snapshot, categories, refreshList, refreshCategories, loadEdges } = opts;

  const [open, setOpen] = React.useState(false);

  const [coreCode, setCoreCode] = React.useState("");
  const [coreName, setCoreName] = React.useState("");
  const [coreStage, setCoreStage] = React.useState("");
  const [coreSubject, setCoreSubject] = React.useState("");
  const [coreGradeIds, setCoreGradeIds] = React.useState<string[]>([]);
  const [coreMandatory, setCoreMandatory] = React.useState("1");
  const [coreCat, setCoreCat] = React.useState("");
  const [coreVideo, setCoreVideo] = React.useState("");
  const [videoPickerOpen, setVideoPickerOpen] = React.useState(false);

  React.useEffect(() => {
    if (!snapshot || !coreStage || !coreSubject) return;
    const elig = new Set(eligibleGradeIdsForCatalog(snapshot, coreStage, coreSubject));
    setCoreGradeIds((prev) => prev.filter((id) => elig.has(id)));
  }, [snapshot, coreStage, coreSubject]);

  const resetFields = React.useCallback(() => {
    setCoreCode("");
    setCoreName("");
    setCoreGradeIds([]);
    setCoreMandatory("1");
    setCoreVideo("");
  }, []);

  const openNew = React.useCallback(() => {
    const firstStage =
      snapshot?.levels.find((s) => String(s.status ?? "y").trim().toLowerCase() !== "n")?.levelId ?? "";
    const firstSub =
      snapshot?.subjects.find((s) => String(s.status ?? "y").trim().toLowerCase() !== "n")?.subjectId ?? "";
    const elig = snapshot ? eligibleGradeIdsForCatalog(snapshot, firstStage, firstSub) : [];
    const firstGrades = elig.length > 0 ? [elig[0]!] : [];
    setCoreStage(firstStage);
    setCoreSubject(firstSub);
    setCoreGradeIds(firstGrades);
    setCoreCat(categories[0]?.id ?? V2_EXP_LIBRARY_PLACEHOLDER_CATEGORY.id);
    setCoreCode("");
    setCoreName("");
    setCoreMandatory("1");
    setCoreVideo("");
    setOpen(true);
  }, [snapshot, categories]);

  const onSheetOpenChange = React.useCallback(
    (v: boolean) => {
      setOpen(v);
      if (!v) resetFields();
    },
    [resetFields],
  );

  const submit = React.useCallback(async () => {
    try {
      if (coreGradeIds.length === 0) {
        sonnerToast.error("请至少选择一个适用年级");
        return;
      }
      const actor = buildExpCatalogListActor(role, orgId);
      await createV2ExpLibrary(actor, {
        libExpName: coreName.trim(),
        subjectId: coreSubject,
        schoolLevelId: coreStage,
        gradeIds: coreGradeIds,
        chooseType: Number(coreMandatory) === 1 ? "y" : "n",
        comments: coreCode.trim() ? `standard_code:${coreCode.trim()}` : undefined,
        status: "y",
      });
      sonnerToast.success("已创建标准试验");
      setOpen(false);
      resetFields();
      await refreshList();
      await refreshCategories();
      await loadEdges();
    } catch (e) {
      sonnerToast.error(e instanceof Error ? e.message : "操作失败");
    }
  }, [
    coreGradeIds,
    coreName,
    coreStage,
    coreSubject,
    coreMandatory,
    coreCode,
    role,
    orgId,
    refreshList,
    refreshCategories,
    loadEdges,
    resetFields,
  ]);

  return {
    open,
    openNew,
    onSheetOpenChange,
    coreCode,
    setCoreCode,
    coreName,
    setCoreName,
    coreStage,
    setCoreStage,
    coreSubject,
    setCoreSubject,
    coreGradeIds,
    setCoreGradeIds,
    coreMandatory,
    setCoreMandatory,
    coreCat,
    setCoreCat,
    coreVideo,
    setCoreVideo,
    videoPickerOpen,
    setVideoPickerOpen,
    submit,
  };
}
