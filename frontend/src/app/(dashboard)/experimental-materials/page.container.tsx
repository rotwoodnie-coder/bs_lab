"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Badge,
  Button,
} from "@bs-lab/ui";
import { Plus } from "@bs-lab/ui/icons";

import { experimentalMaterialSummary } from "@/data/experimental-materials";
import { buildMaterialsApiActor } from "@/lib/materials-api-actor";
import { userRoleLabelZh } from "@/types/auth";
import { useSessionActor } from "@/hooks/use-session-actor";

import { ExperimentalMaterialFormDialog } from "./_components/ExperimentalMaterialFormDialog";
import { ExperimentalMaterialsCardsView } from "./_components/ExperimentalMaterialsCardsView";
import { ExperimentalMaterialsRulesSheet } from "./_components/experimental-materials-rules-sheet";
import { ExperimentalMaterialsTableView } from "./_components/ExperimentalMaterialsTableView";
import { ExperimentalMaterialsToolbar } from "./_components/ExperimentalMaterialsToolbar";
import { useExperimentalMaterialsApiPage } from "./page.api-hooks";
import { PageHeader } from "@/components/layout/page-header";

export default function ExperimentalMaterialsPageContainer() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { role, orgId, hydrated } = useSessionActor();
  const page = useExperimentalMaterialsApiPage(role, orgId, hydrated);
  const mediaActor = React.useMemo(() => buildMaterialsApiActor(role, orgId, "materials-page"), [orgId, role]);

  const settingsOpen = searchParams.get("settings") === "true";
  const setSettingsOpen = React.useCallback(
    (open: boolean) => {
      const qs = new URLSearchParams(searchParams.toString());
      if (open) qs.set("settings", "true");
      else qs.delete("settings");
      const next = qs.toString();
      router.replace(next ? `${pathname}?${next}` : pathname);
    },
    [pathname, router, searchParams],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          <div className="flex flex-wrap items-center gap-2">
            <span>实验材料</span>
            <Badge variant="secondary" className="font-normal">
              单材料主档
            </Badge>
          </div>
        }
        description={
          <>以单个材料主档为中心维护实验材料信息，支持列表视图与卡片视图。当前身份为「{userRoleLabelZh(role)}」{page.canMaintain ? "。" : "，当前身份仅可浏览，保存操作已禁用。"}</>
        }
      />

      <ExperimentalMaterialsToolbar
        filters={page.filters}
        onFiltersChange={(updater) => page.setFilters((prev) => updater(prev))}
        canMaintain={page.canMaintain}
        onCreate={page.openCreateDialog}
        onOpenRulesManagement={page.canMaintain ? () => setSettingsOpen(true) : undefined}
        dimensionTypeItems={page.toolbarTypeOptions}
        dimensionCategoryItems={page.toolbarCategoryOptions}
      />

      {page.view === "list" ? (
        <ExperimentalMaterialsTableView
          rows={page.rows}
          canMaintain={page.canMaintain}
          onToggleFavorite={page.toggleFavorite}
          onCopy={page.openCopyDialog}
          onView={page.openViewDialog}
          onEdit={page.openEditDialog}
          onDelete={page.setDeleteTarget}
          view={page.view}
          onViewChange={page.setView}
          materialTypeItems={page.toolbarTypeOptions}
          materialCategoryItems={page.toolbarCategoryOptions}
          materialUnitItems={page.formDimensionLists?.unitOptions ?? null}
          serverPagination={{
            total: page.total,
            pageIndex: page.pageIndex,
            pageSize: page.pageSize,
            onPageIndexChange: page.setPageIndex,
            onPageSizeChange: page.setPageSize,
          }}
        />
      ) : (
        <ExperimentalMaterialsCardsView
          rows={page.rows}
          canMaintain={page.canMaintain}
          onToggleFavorite={page.toggleFavorite}
          onCopy={page.openCopyDialog}
          onView={page.openViewDialog}
          onEdit={page.openEditDialog}
          onDelete={page.setDeleteTarget}
          view={page.view}
          onViewChange={page.setView}
        />
      )}

      <ExperimentalMaterialsRulesSheet open={settingsOpen} onOpenChange={setSettingsOpen} />

      <ExperimentalMaterialFormDialog
        open={page.dialogOpen}
        mode={page.formDialogMode}
        canMaintain={page.canMaintain}
        mediaActor={mediaActor}
        form={page.form}
        dialogRecord={page.dialogRecord}
        detailStats={page.detailStats}
        materialFormDimensions={page.formDimensionLists}
        relatedExperiments={page.relatedExperiments}
        coverThumb={page.detailCoverThumb}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) page.closeDialog();
        }}
        onFormChange={page.setForm}
        onSubmit={page.saveForm}
        onRequestEditFromView={page.requestEditFromView}
        onRequestCloneFromTemplate={() => {
          if (page.dialogRecord) page.openCopyDialog(page.dialogRecord);
        }}
      />

      <AlertDialog
        open={Boolean(page.deleteTarget)}
        onOpenChange={(open) => {
          if (!open) page.setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>删除该材料？</AlertDialogTitle>
            <AlertDialogDescription>
              删除后将无法在实验材料库中继续查看或关联该条材料。若实验步骤仍引用该材料，可能影响实验说明的完整性，请确认后再操作。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-foreground">
            {page.deleteTarget ? experimentalMaterialSummary(page.deleteTarget) : ""}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={page.confirmDelete}>确认删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {page.canMaintain ? (
        <Button
          type="button"
          size="icon"
          variant="default"
          className="fixed bottom-6 right-6 z-40 size-12 rounded-full shadow-lg"
          onClick={page.openCreateDialog}
          aria-label="新增材料"
        >
          <Plus className="size-5" />
        </Button>
      ) : null}
    </div>
  );
}
