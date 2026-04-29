"use client";

import * as React from "react";
import {
  Badge,
  DataTable,
  DataTableColumnHeader,
  DataTablePagination,
  Input,
} from "@bs-lab/ui";
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
  dataFileTypeStatusLabel,
  type DataFileTypeCatalogRow,
} from "../_lib/data-file-type-catalog";

function buildCols(): ColumnDef<DataFileTypeCatalogRow>[] {
  return [
    createSerialNumberColumn<DataFileTypeCatalogRow>(),
    {
      accessorKey: "typeName",
      meta: { label: "类型名称" },
      header: ({ column }) => <DataTableColumnHeader column={column} title="类型名称" />,
      cell: ({ row }) => <span className="text-sm font-medium">{row.original.typeName}</span>,
    },
    {
      accessorKey: "typeId",
      meta: { label: "类型主键" },
      header: ({ column }) => <DataTableColumnHeader column={column} title="类型主键（type_id）" />,
      cell: ({ row }) => <span className="font-mono text-xs break-all">{row.original.typeId}</span>,
    },
    {
      accessorKey: "comments",
      meta: { label: "说明" },
      header: ({ column }) => <DataTableColumnHeader column={column} title="说明" />,
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">{row.original.comments?.trim() || "—"}</span>
      ),
    },
    {
      accessorKey: "status",
      id: "statusCol",
      accessorFn: (r) => dataFileTypeStatusLabel(r.status),
      meta: { label: "状态" },
      header: ({ column }) => <DataTableColumnHeader column={column} title="状态" />,
      cell: ({ row }) => {
        const active = (row.original.status ?? "y").trim().toLowerCase() !== "n";
        return (
          <Badge variant={active ? "secondary" : "outline"} className="font-normal">
            {dataFileTypeStatusLabel(row.original.status)}
          </Badge>
        );
      },
    },
    {
      accessorKey: "sortOrder",
      meta: { label: "排序" },
      header: ({ column }) => <DataTableColumnHeader column={column} title="排序" />,
      cell: ({ row }) => (
        <span className="tabular-nums text-sm">
          {row.original.sortOrder != null ? row.original.sortOrder : "—"}
        </span>
      ),
    },
    {
      accessorKey: "logoClass",
      meta: { label: "图标样式" },
      header: ({ column }) => <DataTableColumnHeader column={column} title="图标样式（logo_class）" />,
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">{row.original.logoClass?.trim() || "—"}</span>
      ),
    },
  ];
}

export function DataFileTypeCatalogPanel(props: { rows: DataFileTypeCatalogRow[]; ready: boolean }) {
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
      return [r.typeName, r.typeId, r.comments ?? ""].some((s) => s.toLowerCase().includes(q));
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getRowId: (r) => r.typeId,
    initialState: { pagination: { pageSize: 15 } },
  });

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          与表 <span className="font-mono text-xs">data_file_type</span> 一致，供{" "}
          <span className="font-mono text-xs">data_file.file_type_id</span> 引用；由迁移初始化，本页不提供增删改。
        </p>
        <Input
          className="h-9 max-w-sm"
          placeholder="按名称、主键或说明筛选…"
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
