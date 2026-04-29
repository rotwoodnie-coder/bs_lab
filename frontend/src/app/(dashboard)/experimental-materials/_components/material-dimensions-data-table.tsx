"use client";

import * as React from "react";
import { DataTable, DataTablePagination } from "@bs-lab/ui";
import {
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@bs-lab/ui/react-table";

export function MaterialDimensionsDataTable<T extends { id: string }>(props: {
  rows: T[];
  columns: ColumnDef<T>[];
  emptyText: string;
}) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const table = useReactTable({
    data: props.rows,
    columns: props.columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => row.id,
    initialState: { pagination: { pageSize: 10 } },
  });

  return (
    <div className="space-y-3">
      <DataTable
        table={table}
        className="max-h-[min(56vh,520px)] w-full overflow-auto rounded-md border border-border"
        emptyText={props.emptyText}
        stickyHeader
      />
      <DataTablePagination table={table} pageSizeOptions={[10, 20, 30]} />
    </div>
  );
}

