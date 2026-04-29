"use client";

import * as React from "react";

import { sonnerToast } from "@bs-lab/ui";

import type { CatalogCategory, CatalogCore, CatalogDimensionGapsPayload, CatalogEdge } from "@/lib/experiment-catalog-api";
import { UserRole } from "@/types/auth";
import { useSessionActor } from "@/hooks/use-session-actor";

import { buildStageTreeByGrade, buildStageTreeBySubject } from "@/lib/edu-dimension-stage-tree";

import { eduDimensionsApi } from "../education/subject-grades/page.api";
import type { SchoolDimensionSnapshot } from "../education/subject-grades/page.types";

import { filterCatalogByArchitectureSelection } from "./experiment-catalog-architecture-filter";
import { fetchAllCatalogExperiments } from "./fetch-all-catalog-experiments";
import { catalogMandatoryCount, catalogPhaseStats } from "./experiment-catalog-subject-path";
import { V2_EXP_LIBRARY_PLACEHOLDER_CATEGORY } from "./v2-exp-library-catalog-adapter";

function canManageCatalog(role: UserRole): boolean {
  return role === UserRole.RESEARCHER || role === UserRole.DISTRICT_ADMIN || role === UserRole.SUPER_ADMIN;
}

function canContributeEdges(role: UserRole): boolean {
  return (
    role === UserRole.TEACHER ||
    role === UserRole.SCHOOL_ADMIN ||
    role === UserRole.RESEARCHER ||
    role === UserRole.DISTRICT_ADMIN ||
    role === UserRole.SUPER_ADMIN
  );
}

function canPurgeCatalogEdges(role: UserRole): boolean {
  return role === UserRole.DISTRICT_ADMIN || role === UserRole.SUPER_ADMIN;
}

export type ExperimentCatalogPageModel = ReturnType<typeof useExperimentCatalogPage>;

export function useExperimentCatalogPage() {
  const { role, orgId, hydrated } = useSessionActor();
  const canManage = canManageCatalog(role);
  const canReview = canManage;
  const canContribute = canContributeEdges(role);
  const canEdgePurge = canPurgeCatalogEdges(role);

  const [snapshot, setSnapshot] = React.useState<SchoolDimensionSnapshot | null>(null);
  const snapshotRef = React.useRef<SchoolDimensionSnapshot | null>(null);
  React.useEffect(() => {
    snapshotRef.current = snapshot;
  }, [snapshot]);

  const [categories, setCategories] = React.useState<CatalogCategory[]>([]);
  const [items, setItems] = React.useState<CatalogCore[]>([]);
  const [total, setTotal] = React.useState(0);
  const [dimensionGaps, setDimensionGaps] = React.useState<CatalogDimensionGapsPayload | null>(null);
  const [gapLoading, setGapLoading] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [keyword, setKeyword] = React.useState("");
  const [committedKeyword, setCommittedKeyword] = React.useState("");
  const [architectureTreeViewMode, setArchitectureTreeViewMode] = React.useState<"grade" | "subject">("grade");
  const [architectureFilterNodeId, setArchitectureFilterNodeId] = React.useState<string | null>(null);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [edges, setEdges] = React.useState<CatalogEdge[]>([]);
  const [edgeTab, setEdgeTab] = React.useState<"pending" | "all">("pending");

  const treeByGrade = React.useMemo(() => (snapshot ? buildStageTreeByGrade(snapshot) : []), [snapshot]);
  const treeBySubject = React.useMemo(() => (snapshot ? buildStageTreeBySubject(snapshot) : []), [snapshot]);

  const filteredItems = React.useMemo(() => {
    const roots = architectureTreeViewMode === "grade" ? treeByGrade : treeBySubject;
    return filterCatalogByArchitectureSelection(items, architectureFilterNodeId, roots, snapshot);
  }, [items, architectureFilterNodeId, snapshot, treeByGrade, treeBySubject, architectureTreeViewMode]);

  const onArchitectureTreeViewModeChange = React.useCallback((mode: "grade" | "subject") => {
    setArchitectureTreeViewMode(mode);
    setArchitectureFilterNodeId(null);
  }, []);

  const phaseStats = React.useMemo(() => catalogPhaseStats(items, snapshot), [items, snapshot]);
  const mandatoryFiltered = React.useMemo(() => catalogMandatoryCount(filteredItems), [filteredItems]);

  const refreshSnapshot = React.useCallback(async () => {
    const s = await eduDimensionsApi.fetchSnapshot();
    setSnapshot(s);
  }, []);

  const refreshCategories = React.useCallback(async () => {
    if (!hydrated) return;
    setCategories([V2_EXP_LIBRARY_PLACEHOLDER_CATEGORY]);
  }, [hydrated]);

  const refreshDimensionGaps = React.useCallback(async () => {
    setDimensionGaps(null);
    setGapLoading(false);
  }, []);

  const refreshList = React.useCallback(async () => {
    if (!hydrated) return;
    setLoading(true);
    try {
      const data = await fetchAllCatalogExperiments(role, orgId, committedKeyword || undefined, () => snapshotRef.current);
      setItems(data.items);
      setTotal(data.total);
    } catch (e) {
      sonnerToast.error(e instanceof Error ? e.message : "加载实验目录失败");
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
    void refreshDimensionGaps();
  }, [role, orgId, hydrated, committedKeyword, refreshDimensionGaps]);

  const submitSearchFromInput = React.useCallback(() => {
    const next = keyword.trim();
    if (next !== committedKeyword) {
      setCommittedKeyword(next);
      return;
    }
    void refreshList();
  }, [keyword, committedKeyword, refreshList]);

  React.useEffect(() => {
    void refreshSnapshot();
  }, [refreshSnapshot]);

  React.useEffect(() => {
    void refreshCategories();
  }, [refreshCategories]);

  React.useEffect(() => {
    void refreshList();
  }, [refreshList]);

  React.useEffect(() => {
    if (!snapshot) return;
    setItems((prev) =>
      prev.map((it) => ({
        ...it,
        stageName: snapshot.levels.find((s) => s.levelId === it.stageId)?.levelName ?? it.stageName,
        subjectName: snapshot.subjects.find((s) => s.subjectId === it.subjectId)?.subjectName ?? it.subjectName,
      })),
    );
  }, [snapshot]);

  const loadEdges = React.useCallback(async () => {
    setEdges([]);
  }, []);

  React.useEffect(() => {
    void loadEdges();
  }, [loadEdges]);

  const selectedCore = React.useMemo(() => {
    if (!selectedId) return null;
    const fromMain = items.find((i) => i.id === selectedId);
    if (fromMain) return fromMain;
    return dimensionGaps?.unlinked.find((i) => i.id === selectedId) ?? null;
  }, [items, selectedId, dimensionGaps]);

  return {
    hydrated,
    role,
    orgId,
    canManage,
    canReview,
    canContribute,
    canEdgePurge,
    snapshot,
    categories,
    items,
    filteredItems,
    total,
    dimensionGaps,
    gapLoading,
    refreshDimensionGaps,
    loading,
    keyword,
    setKeyword,
    architectureTreeViewMode,
    onArchitectureTreeViewModeChange,
    architectureFilterNodeId,
    setArchitectureFilterNodeId,
    treeByGrade,
    treeBySubject,
    phaseStats,
    mandatoryFiltered,
    selectedId,
    setSelectedId,
    selectedCore,
    edges,
    edgeTab,
    setEdgeTab,
    refreshList,
    submitSearchFromInput,
    refreshCategories,
    loadEdges,
  };
}
