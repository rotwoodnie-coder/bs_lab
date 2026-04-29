"use client";

import * as React from "react";
import type { Table } from "@tanstack/react-table";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

import { cn } from "../../../lib/utils";
import { Button } from "../button";
import { Input } from "../input";
import { Label } from "../label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../select";

export interface DataTablePaginationProps<TData> {
  table: Table<TData>;
  /** 每页条数可选项 */
  pageSizeOptions?: number[];
  className?: string;
}

function DataTablePagination<TData>({
  table,
  pageSizeOptions = [5, 10, 20, 30, 50],
  className,
}: DataTablePaginationProps<TData>) {
  const pageIndex = table.getState().pagination.pageIndex;
  const pageSize = table.getState().pagination.pageSize;
  const pageCount = table.getPageCount();
  const currentPage = pageIndex + 1;
  const safePageCount = Math.max(1, pageCount);

  const [jump, setJump] = React.useState(String(currentPage));

  React.useEffect(() => {
    setJump(String(currentPage));
  }, [currentPage]);

  const applyJump = React.useCallback(() => {
    const n = Number.parseInt(jump, 10);
    if (Number.isNaN(n)) return;
    const clamped = Math.min(Math.max(1, n), safePageCount);
    table.setPageIndex(clamped - 1);
    setJump(String(clamped));
  }, [jump, safePageCount, table]);

  return (
    <div
      className={cn(
        "flex flex-col gap-4 px-1 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between",
        className,
      )}
    >
      <p className="text-sm text-muted-foreground">
        已选 {table.getFilteredSelectedRowModel().rows.length} /{" "}
        {table.getFilteredRowModel().rows.length} 行
      </p>

      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:gap-6">
        <div className="flex items-center gap-2">
          <Label htmlFor="rows-per-page" className="whitespace-nowrap text-sm font-medium">
            每页行数
          </Label>
          <Select
            value={`${pageSize}`}
            onValueChange={(v) => {
              table.setPageSize(Number(v));
            }}
          >
            <SelectTrigger size="sm" className="h-8 w-[4.5rem]" id="rows-per-page">
              <SelectValue />
            </SelectTrigger>
            <SelectContent side="top">
              {pageSizeOptions.map((s) => (
                <SelectItem key={s} value={`${s}`}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex w-full items-center justify-center gap-1 sm:w-auto">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            aria-label="第一页"
          >
            <ChevronsLeft className="size-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            aria-label="上一页"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="flex items-center gap-1 px-2 text-sm text-muted-foreground">
            第 {currentPage} / {safePageCount} 页
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            aria-label="下一页"
          >
            <ChevronRight className="size-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => table.setPageIndex(safePageCount - 1)}
            disabled={!table.getCanNextPage()}
            aria-label="最后一页"
          >
            <ChevronsRight className="size-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Label htmlFor="page-jump" className="whitespace-nowrap text-sm font-medium">
            跳转
          </Label>
          <Input
            id="page-jump"
            className="h-8 w-14 text-center"
            type="number"
            min={1}
            max={safePageCount}
            value={jump}
            onChange={(e) => setJump(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") applyJump();
            }}
            onBlur={applyJump}
          />
        </div>
      </div>
    </div>
  );
}

export { DataTablePagination };

