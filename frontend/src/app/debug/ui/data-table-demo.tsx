"use client";

import * as React from "react";
import {
  Badge,
  Checkbox,
  DataTable,
  DataTableColumnHeader,
  DataTablePagination,
  DataTableViewOptions,
  Input,
  Switch,
} from "@bs-lab/ui";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "@bs-lab/ui/icons";
import {
  ColumnDef,
  RowSelectionState,
  SortingState,
  VisibilityState,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@bs-lab/ui/react-table";

type Grade = "高一" | "高二" | "高三";

export type SyllabusRow = {
  id: string;
  name: string;
  grade: Grade;
  updatedAt: Date;
  published: boolean;
};

const INITIAL_ROWS: SyllabusRow[] = [
  {
    id: "s1",
    name: "力学基础与测量",
    grade: "高一",
    updatedAt: new Date("2026-04-02T14:30:00"),
    published: true,
  },
  {
    id: "s2",
    name: "电磁感应探究",
    grade: "高二",
    updatedAt: new Date("2026-04-08T09:15:00"),
    published: false,
  },
  {
    id: "s3",
    name: "光学与波动",
    grade: "高二",
    updatedAt: new Date("2026-03-28T16:45:00"),
    published: true,
  },
  {
    id: "s4",
    name: "近代物理导读",
    grade: "高三",
    updatedAt: new Date("2026-04-10T11:00:00"),
    published: false,
  },
  {
    id: "s5",
    name: "热学与分子动理论",
    grade: "高一",
    updatedAt: new Date("2026-04-01T08:20:00"),
    published: true,
  },
  {
    id: "s6",
    name: "实验设计与误差分析",
    grade: "高三",
    updatedAt: new Date("2026-04-09T13:40:00"),
    published: true,
  },
];

function formatDateTime(d: Date): string {
  return d.toLocaleString("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function DataTableDemo() {
  const [rows, setRows] = React.useState<SyllabusRow[]>(INITIAL_ROWS);
  const [query, setQuery] = React.useState("");
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [rowNumberMode, setRowNumberMode] = React.useState<"global" | "page">("global");

  const filtered = React.useMemo(
    () =>
      rows.filter((r) =>
        r.name.toLowerCase().includes(query.trim().toLowerCase()),
      ),
    [rows, query],
  );

  const setPublished = React.useCallback((id: string, value: boolean) => {
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, published: value } : row)),
    );
  }, []);

  const columns = React.useMemo<ColumnDef<SyllabusRow>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="全选本页"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label={`选择 ${row.original.name}`}
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "name",
        meta: { label: "实验名称" },
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="实验名称" />
        ),
      },
      {
        accessorKey: "grade",
        meta: { label: "所属年级" },
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="所属年级" />
        ),
        cell: ({ row }) => (
          <Badge variant="secondary">{row.original.grade}</Badge>
        ),
      },
      {
        accessorKey: "updatedAt",
        meta: { label: "更新时间" },
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="更新时间" />
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground tabular-nums">
            {formatDateTime(row.original.updatedAt)}
          </span>
        ),
        sortingFn: (rowA, rowB, columnId) => {
          const a = rowA.getValue(columnId) as Date;
          const b = rowB.getValue(columnId) as Date;
          return a.getTime() - b.getTime();
        },
      },
      {
        accessorKey: "published",
        meta: { label: "状态" },
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="状态" />
        ),
        cell: ({ row }) => (
          <Switch
            checked={row.original.published}
            onCheckedChange={(v) => setPublished(row.original.id, v)}
            aria-label={`${row.original.name} 发布状态`}
          />
        ),
      },
    ],
    [setPublished],
  );

  const table = useReactTable({
    data: filtered,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
    },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => row.id,
    enableRowSelection: true,
    initialState: {
      pagination: { pageSize: 5 },
    },
  });

  const sortingStateText =
    sorting.length === 0 ? "未排序" : JSON.stringify(sorting, null, 2);
  const paginationStateText = JSON.stringify(table.getState().pagination, null, 2);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            placeholder="按实验名称筛选…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="max-w-sm bg-background"
            aria-label="搜索实验名称"
          />
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>序号模式</span>
            <button
              type="button"
              className="inline-flex h-8 items-center rounded-md border border-input px-2 hover:bg-accent hover:text-accent-foreground"
              onClick={() => setRowNumberMode("global")}
            >
              全局连续
            </button>
            <button
              type="button"
              className="inline-flex h-8 items-center rounded-md border border-input px-2 hover:bg-accent hover:text-accent-foreground"
              onClick={() => setRowNumberMode("page")}
            >
              按页重置
            </button>
          </div>
        </div>
        <DataTableViewOptions table={table} />
      </div>
      <DataTable table={table} showRowNumber rowNumberMode={rowNumberMode} />
      <DataTablePagination table={table} pageSizeOptions={[5, 10, 20]} />

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3 rounded-lg border border-input bg-card p-4">
          <div className="space-y-1">
            <p className="text-sm font-medium">排序状态 Demo</p>
            <p className="text-xs text-muted-foreground">
               `SortingState`：点击按钮可直接切换列排序，也可点击表头联动。
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="inline-flex h-8 items-center rounded-md border border-input px-3 text-xs hover:bg-accent hover:text-accent-foreground"
              onClick={() => table.getColumn("name")?.toggleSorting(false)}
            >
              名称升序
            </button>
            <button
              type="button"
              className="inline-flex h-8 items-center rounded-md border border-input px-3 text-xs hover:bg-accent hover:text-accent-foreground"
              onClick={() => table.getColumn("name")?.toggleSorting(true)}
            >
              名称降序
            </button>
            <button
              type="button"
              className="inline-flex h-8 items-center rounded-md border border-input px-3 text-xs hover:bg-accent hover:text-accent-foreground"
              onClick={() => table.resetSorting()}
            >
              重置排序
            </button>
          </div>
          <pre className="overflow-x-auto rounded-md border border-input bg-background p-3 text-xs text-muted-foreground">
            {sortingStateText}
          </pre>
        </div>

        <div className="space-y-3 rounded-lg border border-input bg-card p-4">
          <div className="space-y-1">
            <p className="text-sm font-medium">分页状态 Demo</p>
            <p className="text-xs text-muted-foreground">
              分页跳转、页大小与当前 `PaginationState` 变化。
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="inline-flex h-8 items-center gap-1 rounded-md border border-input px-2 text-xs hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
              onClick={() => table.firstPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronsLeft className="h-3.5 w-3.5" />
              首页
            </button>
            <button
              type="button"
              className="inline-flex h-8 items-center gap-1 rounded-md border border-input px-2 text-xs hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              上一页
            </button>
            <button
              type="button"
              className="inline-flex h-8 items-center gap-1 rounded-md border border-input px-2 text-xs hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              下一页
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              className="inline-flex h-8 items-center gap-1 rounded-md border border-input px-2 text-xs hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
              onClick={() => table.lastPage()}
              disabled={!table.getCanNextPage()}
            >
              末页
              <ChevronsRight className="h-3.5 w-3.5" />
            </button>
          </div>
          <pre className="overflow-x-auto rounded-md border border-input bg-background p-3 text-xs text-muted-foreground">
            {paginationStateText}
          </pre>
        </div>
      </div>
    </div>
  );
}
