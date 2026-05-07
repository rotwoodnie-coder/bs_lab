"use client";

import * as React from "react";
import { Badge, Button, DataTable, DataTableColumnHeader, DataTablePagination, DataTableViewOptions, MediaPreview } from "@bs-lab/ui";
import {
  type ColumnDef,
  type PaginationState,
  type SortingState,
  type Updater,
  type VisibilityState,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@bs-lab/ui/react-table";
import { Star, StarOff } from "lucide-react";

import type { ExperimentalMaterialsViewMode } from "../page.types";
import { ExperimentalMaterialsViewToggle } from "./ExperimentalMaterialsViewToggle";
import {
  getExperimentalMaterialCategoryDisplayLabels,
  getExperimentalMaterialRiskLabel,
  getExperimentalMaterialRiskLevel,
  getExperimentalMaterialSafetyLabels,
  getExperimentalMaterialTypeLabel,
  type ExperimentalMaterialRecord,
} from "@/data/experimental-materials";
import { createSerialNumberColumn } from "@/lib/data-table/serial-column";

function formatZhDateTime(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export type ExperimentalMaterialsServerPagination = {
  total: number;
  pageIndex: number;
  pageSize: number;
  onPageIndexChange: (pageIndex: number) => void;
  onPageSizeChange: (pageSize: number) => void;
};

export function ExperimentalMaterialsTableView(props: {
  rows: ExperimentalMaterialRecord[];
  canMaintain: boolean;
  onToggleFavorite: (id: string) => void | Promise<void>;
  onCopy: (record: ExperimentalMaterialRecord) => void;
  onView: (record: ExperimentalMaterialRecord) => void;
  onEdit: (record: ExperimentalMaterialRecord) => void;
  onDelete: (record: ExperimentalMaterialRecord) => void;
  mode?: "default" | "picker";
  view: ExperimentalMaterialsViewMode;
  onViewChange: (view: ExperimentalMaterialsViewMode) => void;
  materialTypeItems?: readonly { id: string; label: string }[] | null;
  materialCategoryItems?: readonly { id: string; label: string }[] | null;
  materialUnitItems?: readonly { id: string; label: string }[] | null;
  materialSafetyTagItems?: readonly { id: string; label: string }[] | null;
  /** 传入时由服务端分页；选择器等场景不传则使用客户端分页 */
  serverPagination?: ExperimentalMaterialsServerPagination | null;
}) {
  const [sorting, setSorting] = React.useState<SortingState>([{ id: "updatedAt", desc: true }]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});

  const server = props.serverPagination;
  const paginationState: PaginationState = React.useMemo(
    () => ({
      pageIndex: server?.pageIndex ?? 0,
      pageSize: server?.pageSize ?? 10,
    }),
    [server?.pageIndex, server?.pageSize],
  );

  const onPaginationChange = React.useCallback(
    (updater: Updater<PaginationState>) => {
      if (!server) return;
      const next = typeof updater === "function" ? updater(paginationState) : updater;
      if (next.pageSize !== server.pageSize) {
        server.onPageSizeChange(next.pageSize);
        if (next.pageIndex !== 0) server.onPageIndexChange(0);
        return;
      }
      if (next.pageIndex !== server.pageIndex) server.onPageIndexChange(next.pageIndex);
    },
    [paginationState, server],
  );

  const columns = React.useMemo<ColumnDef<ExperimentalMaterialRecord>[]>(
    () => [
      createSerialNumberColumn<ExperimentalMaterialRecord>(),
      {
        accessorKey: "photoUrl",
        meta: { label: "缩略图" },
        header: ({ column }) => <DataTableColumnHeader column={column} title="缩略图" />,
        enableSorting: false,
        cell: ({ row }) =>
          row.original.photoUrl ? (
            <div className="h-10 w-10 overflow-hidden rounded-md border border-border">
              <MediaPreview kind="image" src={row.original.photoUrl} alt={row.original.name} className="h-full w-full" />
            </div>
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted text-[10px] text-muted-foreground">无图</div>
          ),
      },
      {
        accessorKey: "name",
        meta: { label: "材料名称" },
        header: ({ column }) => <DataTableColumnHeader column={column} title="材料名称" />,
        cell: ({ row }) => <span className="font-medium text-foreground">{row.original.name}</span>,
      },
      {
        id: "materialPropLabel",
        accessorFn: (row) => getExperimentalMaterialCategoryDisplayLabels(row).join("、"),
        meta: { label: "材料属性" },
        header: ({ column }) => <DataTableColumnHeader column={column} title="材料属性" />,
        cell: ({ row }) => {
          const labels = getExperimentalMaterialCategoryDisplayLabels(
            row.original,
            props.materialCategoryItems ? props.materialCategoryItems.map((item) => ({ code: item.id, displayName: item.label })) : undefined,
          );
          return <span className="text-sm text-foreground">{labels.join("、") || row.original.categoryNameProxy || "—"}</span>;
        },
      },
      {
        id: "materialTypeLabel",
        accessorFn: (row) => getExperimentalMaterialTypeLabel(row.materialType),
        meta: { label: "材料分类" },
        header: ({ column }) => <DataTableColumnHeader column={column} title="材料分类" />,
        cell: ({ row }) => (
          <Badge variant="secondary" className="h-5 rounded-md px-2 text-[10px] font-medium text-slate-600">
            {getExperimentalMaterialTypeLabel(
              row.original.materialType,
              props.materialTypeItems ? props.materialTypeItems.map((item) => ({ code: item.id, displayName: item.label })) : undefined,
            ) || row.original.materialType || "—"}
          </Badge>
        ),
      },
      {
        id: "materialNum",
        accessorFn: (row) => `${row.numValue || row.suggestedAmount || ""} ${row.unitId || ""}`.trim(),
        meta: { label: "建议用量" },
        header: ({ column }) => <DataTableColumnHeader column={column} title="建议用量" />,
        cell: ({ row }) => {
          const unitLabel = props.materialUnitItems?.find((u) => u.id === row.original.unitId)?.label;
          const value = `${row.original.numValue || row.original.suggestedAmount || ""} ${unitLabel || row.original.unitId || ""}`.trim();
          return <span className="text-sm text-muted-foreground">{value || "—"}</span>;
        },
      },
      {
        id: "safety",
        accessorFn: (row) => getExperimentalMaterialSafetyLabels(row.safetyTags).join("、"),
        meta: { label: "安全性" },
        header: ({ column }) => <DataTableColumnHeader column={column} title="安全性" />,
        cell: ({ row }) => {
          const dimSafetyTags = props.materialSafetyTagItems
            ? props.materialSafetyTagItems.map((item) => ({ code: item.id, name: item.label }))
            : undefined;
          const riskLevel = getExperimentalMaterialRiskLevel(row.original);
          const riskLabel = getExperimentalMaterialRiskLabel(riskLevel);
          const riskClassName =
            riskLevel === "high"
              ? "bg-red-50 text-red-600"
              : riskLevel === "medium"
                ? "bg-amber-50 text-amber-700"
                : "bg-emerald-50 text-emerald-700";
          return (
            <div className="flex max-w-[240px] flex-wrap gap-1">
              <Badge variant="secondary" className={`h-5 rounded-md px-2 text-[10px] font-medium ${riskClassName}`}>
                {riskLabel}
              </Badge>
              {row.original.safetyTags.length === 0 ? (
                <span className="text-sm text-muted-foreground">—</span>
              ) : (
                getExperimentalMaterialSafetyLabels(row.original.safetyTags, dimSafetyTags).map((label) => (
                  <Badge key={label} variant="secondary" className="h-5 rounded-md px-2 text-[10px] font-medium text-slate-600">
                    {label}
                  </Badge>
                ))
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "updatedAt",
        meta: { label: "更新时间" },
        header: ({ column }) => <DataTableColumnHeader column={column} title="更新时间" />,
        cell: ({ row }) => <span className="text-xs text-muted-foreground">{formatZhDateTime(row.original.updatedAt)}</span>,
      },
      {
        id: "actions",
        meta: { label: "操作" },
        header: "操作",
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            {props.mode === "picker" ? (
              <Button type="button" size="sm" variant="secondary" className="rounded-md" onClick={() => props.onView(row.original)}>
                添加到本实验
              </Button>
            ) : (
              <>
                <Button type="button" size="sm" variant="secondary" className="rounded-md" disabled={!props.canMaintain} onClick={() => props.onEdit(row.original)}>
                  编辑
                </Button>
                <Button type="button" size="sm" variant="outline" className="rounded-md" onClick={() => props.onView(row.original)}>
                  查看
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="rounded-md text-destructive hover:text-destructive"
                  disabled={!props.canMaintain}
                  onClick={() => void props.onToggleFavorite(row.original.id)}
                  aria-label={row.original.favorited ? "取消收藏" : "加入收藏"}
                >
                  {row.original.favorited ? (
                    <Star className="size-4 fill-current text-primary" />
                  ) : (
                    <StarOff className="size-4 text-muted-foreground" />
                  )}
                </Button>
              </>
            )}
          </div>
        ),
      },
    ],
    [props],
  );

  const table = useReactTable({
    data: props.rows,
    columns,
    state: server ? { sorting, columnVisibility, pagination: paginationState } : { sorting, columnVisibility },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: server ? onPaginationChange : undefined,
    manualPagination: Boolean(server),
    pageCount: server ? Math.max(1, Math.ceil(server.total / server.pageSize)) : undefined,
    rowCount: server?.total,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: server ? undefined : getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => row.id,
    initialState: server ? undefined : { pagination: { pageSize: 10 } },
  });

  return (
    <>
      <div className="flex flex-wrap items-center justify-end gap-2">
        <ExperimentalMaterialsViewToggle view={props.view} onViewChange={props.onViewChange} className="shrink-0" />
        <DataTableViewOptions table={table} className="ml-0 shrink-0" />
      </div>
      <div className="relative w-full overflow-x-auto rounded-md border border-border">
        <DataTable
          table={table}
          stickyHeader
          className="max-h-[68vh] overflow-auto border-0"
          emptyText="暂无材料数据，可点击右下角按钮新增材料。"
        />
      </div>
      <DataTablePagination table={table} pageSizeOptions={[10, 20, 50]} />
    </>
  );
}
