"use client";

import * as React from "react";
import { Badge, DataTable, DataTableColumnHeader, DataTablePagination, Input } from "@bs-lab/ui";
import type { ColumnDef } from "@bs-lab/ui/react-table";
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from "@bs-lab/ui/react-table";

import { createSerialNumberColumn } from "@/lib/data-table/serial-column";

import {
  statusLabel,
  type MaterialCategoryRow,
} from "../_lib/material-category-catalog";

function buildCols(): ColumnDef<MaterialCategoryRow>[] {
  return [
    createSerialNumberColumn<MaterialCategoryRow>(),
    {
      accessorKey: "materialCategoryName",
      meta: { label: "材料分类" },
      header: ({ column }) => <DataTableColumnHeader column={column} title="材料分类" />,
      cell: ({ row }) => <span className="min-w-[12rem] text-sm font-medium">{row.original.materialCategoryName}</span>,
    },
    {
      accessorKey: "sortOrder",
      meta: { label: "排序" },
      header: ({ column }) => <DataTableColumnHeader column={column} title="排序" />,
      cell: ({ row }) => (
        <span className="tabular-nums text-sm">{row.original.sortOrder != null ? row.original.sortOrder : "—"}</span>
      ),
    },
    {
      accessorKey: "status",
      id: "statusCol",
      accessorFn: (r) => statusLabel(r.status),
      meta: { label: "状态" },
      header: ({ column }) => <DataTableColumnHeader column={column} title="状态" />,
      cell: ({ row }) => {
        const active = (row.original.status ?? "y").trim().toLowerCase() !== "n";
        return (
          <Badge variant={active ? "secondary" : "outline"} className="font-normal">
            {statusLabel(row.original.status)}
          </Badge>
        );
      },
    },
    {
      accessorKey: "comments",
      meta: { label: "说明" },
      header: ({ column }) => <DataTableColumnHeader column={column} title="说明" />,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.comments?.trim() || "—"}</span>
      ),
    },
  ];
}

export function MaterialCategoryCatalogPanel(props: { rows: MaterialCategoryRow[]; ready: boolean }) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = React.useState("");
  const columns = React.useMemo(() => buildCols(), []);

  const table = useReactTable({
    data: props.rows,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, _columnId, filterValue) => {
      const q = String(filterValue ?? "").trim().toLowerCase();
      if (!q) return true;
      const r = row.original;
      return [r.materialCategoryName, r.comments ?? ""].some((s) =>
        s.toLowerCase().includes(q),
      );
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getRowId: (r) => r.id,
    initialState: { pagination: { pageSize: 15 } },
  });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          与表 <span className="font-mono text-xs">data_material_type</span> 一致，供
          <span className="font-mono text-xs"> material_msg.material_type_id</span> 引用。
        </p>
        <Input
          className="h-9 w-full sm:max-w-sm"
          placeholder="按分类或说明筛选…"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
        />
      </div>
      <DataTable
        table={table}
        className="max-h-[min(60vh,520px)] w-full overflow-auto rounded-md border border-border"
        emptyText={props.ready ? "暂无数据" : "加载中…"}
        stickyHeader
      />
      <DataTablePagination table={table} pageSizeOptions={[10, 15, 20, 50]} />
    </div>
  );
}
