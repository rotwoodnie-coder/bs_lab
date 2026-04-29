"use client";

import * as React from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  DataTable,
  DataTablePagination,
  DataTableViewOptions,
  ToggleGroup,
  ToggleGroupItem,
  TooltipProvider,
} from "@bs-lab/ui";
import { LayoutGrid, Table2 } from "@bs-lab/ui/icons";
import {
  type SortingState,
  type VisibilityState,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@bs-lab/ui/react-table";

import { useDevInspector } from "@/contexts/dev-inspector-context";
import type { CatalogCore } from "@/lib/experiment-catalog-api";

import type { UserRole } from "@/types/auth";

import type { SchoolDimensionSnapshot } from "../../education/subject-grades/page.types";
import { CatalogOfficialVideoPreviewDialog } from "./catalog-experiment-table-cells";
import { CatalogExperimentsCardGrid } from "./catalog-experiments-card-grid";
import { buildCatalogExperimentColumns } from "./catalog-experiments-table-columns";

type StatusConfirm = { row: CatalogCore; next: number };

export function CatalogExperimentsTablePanel(props: {
  items: CatalogCore[];
  loading: boolean;
  canManage: boolean;
  role: UserRole;
  orgId: string;
  eduSnapshot: SchoolDimensionSnapshot | null;
  onRowOpen: (row: CatalogCore) => void;
  onDelete: (row: CatalogCore) => void;
  onOpenEditFocusVideo: (row: CatalogCore) => void;
  onPatchCoreStatus: (id: string, status: number) => Promise<void>;
}) {
  const { enabled: devIds } = useDevInspector();
  const [listLayout, setListLayout] = React.useState<"table" | "cards">("table");
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [visibility, setVisibility] = React.useState<VisibilityState>({
    closure: false,
    updatedAt: false,
  });
  const [statusConfirm, setStatusConfirm] = React.useState<StatusConfirm | null>(null);
  const [statusBusy, setStatusBusy] = React.useState(false);
  const [previewRow, setPreviewRow] = React.useState<CatalogCore | null>(null);

  const snap = props.eduSnapshot;

  const runStatusPatch = React.useCallback(
    async (row: CatalogCore, next: number) => {
      setStatusBusy(true);
      try {
        await props.onPatchCoreStatus(row.id, next);
        setStatusConfirm(null);
      } catch {
        setStatusConfirm(null);
      } finally {
        setStatusBusy(false);
      }
    },
    [props],
  );

  const columns = React.useMemo(
    () =>
      buildCatalogExperimentColumns({
        devIds,
        snap,
        canManage: props.canManage,
        onOpenDetail: props.onRowOpen,
        onDelete: props.onDelete,
        onOpenEditFocusVideo: props.onOpenEditFocusVideo,
        setStatusConfirm,
        setPreviewRow,
      }),
    [devIds, snap, props.canManage, props.onRowOpen, props.onDelete, props.onOpenEditFocusVideo],
  );

  const table = useReactTable({
    data: props.items,
    columns,
    state: { sorting, columnVisibility: visibility },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setVisibility,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => row.id,
    initialState: { pagination: { pageSize: 10 } },
  });

  const sc = statusConfirm;

  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-0 space-y-2 overflow-hidden border-t border-border p-2 sm:p-2 lg:border-t-0 lg:pl-2 lg:pr-1 lg:pt-0">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <ToggleGroup
            type="single"
            value={listLayout}
            onValueChange={(v) => {
              if (v === "table" || v === "cards") setListLayout(v);
            }}
            variant="outline"
            size="sm"
            aria-label="列表展示方式"
          >
            <ToggleGroupItem value="table" aria-label="表格列表">
              <Table2 className="size-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="cards" aria-label="卡片列表">
              <LayoutGrid className="size-4" />
            </ToggleGroupItem>
          </ToggleGroup>
          {listLayout === "table" ? <DataTableViewOptions table={table} /> : null}
        </div>
        {listLayout === "table" ? (
          <>
            <DataTable
              table={table}
              className="max-h-[min(70vh,calc(100dvh-16rem))] w-full min-w-0 overflow-auto rounded-md border border-border"
              emptyText={props.loading ? "加载中…" : "当前筛选无数据，请调整左侧学科树或关键词"}
              stickyHeader
              onRowClick={props.onRowOpen}
            />
            <DataTablePagination table={table} pageSizeOptions={[10, 20, 50]} />
          </>
        ) : (
          <CatalogExperimentsCardGrid
            items={props.items}
            loading={props.loading}
            eduSnapshot={props.eduSnapshot}
            role={props.role}
            orgId={props.orgId}
            onCardOpen={props.onRowOpen}
          />
        )}
        <p className="text-xs text-muted-foreground">当前列表 {props.items.length} 条</p>
      </div>

      <AlertDialog
        open={!!sc}
        onOpenChange={(o) => {
          if (!o && !statusBusy) setStatusConfirm(null);
        }}
      >
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>{sc?.next === 1 ? "确认启用该实验？" : "确认停用该实验？"}</AlertDialogTitle>
            <AlertDialogDescription>
              {sc?.next === 1
                ? "启用后，该标准实验将在前台检索与编排中可见（仍受其他业务规则约束）。"
                : "停用后，该标准实验在学生与教师前台检索中默认不展示；已有关联映射不会被自动删除。"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={statusBusy}>取消</AlertDialogCancel>
            <Button
              type="button"
              disabled={statusBusy || !sc}
              onClick={() => {
                if (!sc) return;
                void runStatusPatch(sc.row, sc.next);
              }}
            >
              确认
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CatalogOfficialVideoPreviewDialog open={!!previewRow} onOpenChange={(o) => !o && setPreviewRow(null)} row={previewRow} />
    </TooltipProvider>
  );
}
