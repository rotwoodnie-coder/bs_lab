"use client";

/**
 * DataTable — 基于 TanStack Table 的表体渲染容器（泛型 `<TData, TValue>` 由列定义 `ColumnDef<TData, TValue>` 推导）。
 *
 * ## 标准范式：columns 与 data
 *
 * 1. 定义行类型 `TData`（与业务实体一致）。
 * 2. 使用 `ColumnDef<TData, TValue>[]` 声明列：`accessorKey` / `accessorFn`、`header`、`cell`。
 * 3. 在组件内调用 `useReactTable({ data, columns, getCoreRowModel: getCoreRowModel(), ... })` 得到 `table`。
 * 4. 将 `table` 传入 `<DataTable table={table} />`；分页/列显隐等状态通过 `useReactTable` 的 `state` / `on*` 与对应 row model（如 `getPaginationRowModel`）组合启用。`useReactTable` 等 API 请从 **`@bs-lab/ui/react-table`** 导入（与主包中的 `Table` 组件区分命名）。
 *
 * 列展示名（可选）：在列定义中设置 `meta: { label: "显示名" }`，供 `DataTableViewOptions` 使用。
 *
 * @see https://tanstack.com/table/latest
 */
import * as React from "react";
import { flexRender, type Table as TanstackTable } from "@tanstack/react-table";

import { cn } from "../../../lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../table";

export interface DataTableProps<TData> extends React.HTMLAttributes<HTMLDivElement> {
  /** 由 `useReactTable` 返回的表格实例 */
  table: TanstackTable<TData>;
  /** 无数据时的占位文案 */
  emptyText?: string;
  /** 是否显示序号列（默认 false） */
  showRowNumber?: boolean;
  /** 序号列标题（默认 "序号"） */
  rowNumberHeader?: React.ReactNode;
  /** 序号模式：global=跨页连续，page=每页从 1 开始 */
  rowNumberMode?: "global" | "page";
  /** 当表格放在可滚动容器内时，表头吸顶（默认 false） */
  stickyHeader?: boolean;
  /** 行点击回调（用于详情侧栏等） */
  onRowClick?: (row: TData) => void;
  /** 行双击回调（用于打开详情页等） */
  onRowDoubleClick?: (row: TData) => void;
}

function DataTable<TData>({
  table,
  className,
  emptyText = "暂无数据",
  showRowNumber = false,
  rowNumberHeader = "序号",
  rowNumberMode = "global",
  stickyHeader = false,
  onRowClick,
  onRowDoubleClick,
  ...props
}: DataTableProps<TData>) {
  const pagination = table.getState().pagination;
  const pageIndex = pagination?.pageIndex ?? 0;
  const pageSize = pagination?.pageSize ?? table.getRowModel().rows.length;
  const rowNumberOffset = rowNumberMode === "global" ? pageIndex * pageSize : 0;

  return (
    <div className={cn("w-full space-y-4", className)} {...props}>
      <div className="relative overflow-visible rounded-md border border-border bg-card">
        <Table>
          <TableHeader className={stickyHeader ? "sticky top-0 z-10 bg-card" : undefined}>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-border hover:bg-transparent">
                {showRowNumber ? (
                  <TableHead
                    className={cn(
                      "w-16 text-center tabular-nums",
                      stickyHeader ? "bg-card" : undefined,
                    )}
                  >
                    {rowNumberHeader}
                  </TableHead>
                ) : null}
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    colSpan={header.colSpan}
                    className={stickyHeader ? "bg-card" : undefined}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row, displayIndex) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() ? "selected" : undefined}
                  className={cn(
                    "border-border",
                    onRowClick || onRowDoubleClick ? "cursor-pointer hover:bg-muted/50" : undefined,
                  )}
                  onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                  onDoubleClick={onRowDoubleClick ? () => onRowDoubleClick(row.original) : undefined}
                >
                  {showRowNumber ? (
                    <TableCell className="w-16 text-center text-xs tabular-nums text-muted-foreground">
                      {rowNumberOffset + displayIndex + 1}
                    </TableCell>
                  ) : null}
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="border-border">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={table.getVisibleLeafColumns().length + (showRowNumber ? 1 : 0)}
                  className="h-24 text-center text-muted-foreground"
                >
                  {emptyText}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export { DataTable };

