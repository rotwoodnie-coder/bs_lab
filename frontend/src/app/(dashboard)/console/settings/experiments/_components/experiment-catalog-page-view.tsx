"use client";

import * as React from "react";

import { BookOpen } from "@bs-lab/ui/icons";
import { EmptyPlaceholder } from "@/components/business/common/EmptyPlaceholder";
import { ManagementKpiCards } from "@/components/business/common/ManagementKpiCards";
import { ManagementPageFrame } from "@/components/business/common/ManagementPageFrame";

import type { CatalogCore } from "@/lib/experiment-catalog-api";

import type { ExperimentCatalogPageModel } from "../page.hooks";
import { EXPERIMENT_CATALOG_PAGE_LABELS } from "../page.labels";
import { CatalogDimensionGapPanel } from "./catalog-dimension-gap-panel";
import { CatalogExperimentsTablePanel } from "./catalog-experiments-table-panel";
import { ExperimentCatalogArchitectureTree } from "./experiment-catalog-architecture-tree";
import { ExperimentCatalogToolbar } from "./experiment-catalog-toolbar";

export function ExperimentCatalogPageView(props: {
  model: ExperimentCatalogPageModel;
  onOpenNewCore: () => void;
  onRowOpen: (row: CatalogCore) => void;
  onDeleteRow: (row: CatalogCore) => void;
  onOpenEditFocusVideo: (row: CatalogCore) => void;
  onPatchCoreStatus: (id: string, status: number) => Promise<void>;
}) {
  const { model } = props;

  const kpis = React.useMemo(() => {
    const m = model;
    return [
      { key: "filtered", label: "当前筛选条目", value: m.filteredItems.length },
      { key: "mandatory", label: "必做（当前筛选）", value: m.mandatoryFiltered },
      {
        key: "phase",
        label: "按学段（已加载）",
        value: `小 ${m.phaseStats.primary} · 初 ${m.phaseStats.junior} · 高 ${m.phaseStats.senior}${m.phaseStats.other > 0 ? ` · 其他 ${m.phaseStats.other}` : ""}`,
      },
      { key: "total", label: "关键词范围内（共）", value: `${m.total} 条`, tooltip: "包含所有匹配的实验" },
    ];
  }, [model]);

  if (!model.hydrated) {
    return (
      <EmptyPlaceholder
        icon={<BookOpen className="size-6" />}
        title="加载实验目录…"
        className="min-h-[40vh]"
      />
    );
  }

  return (
    <ManagementPageFrame
      title={
        <>
          <BookOpen className="size-6 shrink-0 text-muted-foreground" />
          <h1 className="text-2xl font-bold text-foreground">{EXPERIMENT_CATALOG_PAGE_LABELS.pageTitle}</h1>
        </>
      }
      description="数据来源于标准实验目录库；左侧树与「教学架构管理」维度一致，按节点筛选列表。"
      kpis={<ManagementKpiCards items={kpis} />}
      cardTitle={EXPERIMENT_CATALOG_PAGE_LABELS.queryTitle}
      cardToolbar={
        <ExperimentCatalogToolbar
          keyword={model.keyword}
          setKeyword={model.setKeyword}
          saving={model.loading}
          canManage={model.canManage}
          onRefresh={model.refreshList}
          onSearchSubmit={model.submitSearchFromInput}
          onOpenNewCore={props.onOpenNewCore}
        />
      }
    >
      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(200px,260px)_minmax(0,1fr)]">
        <aside className="min-w-0 border-border lg:border-r">
          <div className="space-y-2 p-2 sm:p-3">
            {model.items.length === 0 && !model.loading ? (
              <EmptyPlaceholder
                title="暂无数据"
                description="请确认关键词或后端租户配置。"
              />
            ) : (
              <ExperimentCatalogArchitectureTree
                snapshot={model.snapshot}
                items={model.items}
                treeByGrade={model.treeByGrade}
                treeBySubject={model.treeBySubject}
                viewMode={model.architectureTreeViewMode}
                onViewModeChange={model.onArchitectureTreeViewModeChange}
                selectedNodeId={model.architectureFilterNodeId}
                onSelectNodeId={model.setArchitectureFilterNodeId}
              />
            )}
            <div className="rounded-md border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">关键词范围内：</span>
              {model.items.length} 条
              <span className="mx-2 text-border">|</span>
              <span className="font-medium text-foreground">左侧树筛选后：</span>
              {model.filteredItems.length} 条
            </div>
          </div>
        </aside>
        <div className="flex min-h-0 min-w-0 flex-col">
          <CatalogExperimentsTablePanel
            items={model.filteredItems}
            loading={model.loading}
            canManage={model.canManage}
            role={model.role}
            orgId={model.orgId}
            eduSnapshot={model.snapshot}
            onRowOpen={props.onRowOpen}
            onDelete={props.onDeleteRow}
            onOpenEditFocusVideo={props.onOpenEditFocusVideo}
            onPatchCoreStatus={props.onPatchCoreStatus}
          />
          <CatalogDimensionGapPanel
            dimensionGaps={model.dimensionGaps}
            gapLoading={model.gapLoading}
            canManage={model.canManage}
            onOpenRow={props.onRowOpen}
            onDeleteRow={props.onDeleteRow}
          />
        </div>
      </div>
    </ManagementPageFrame>
  );
}
