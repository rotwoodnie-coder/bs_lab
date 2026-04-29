"use client";

import * as React from "react";

import {
  DataTable,
  DataTablePagination,
  DataTableViewOptions,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
  Skeleton,
} from "@bs-lab/ui";
import {
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  type VisibilityState,
  useReactTable,
} from "@bs-lab/ui/react-table";

import type { UserRecord } from "@/lib/console/users/types";

import { useUserDataTableColumns, type UserDataTableColumnsProps } from "./user-data-table-columns";

export function UserDataTable(props: UserDataTableColumnsProps & { users: UserRecord[] }) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({
    orgPath: false,
    roleName: false,
    comments: false,
  });

  const columns = useUserDataTableColumns(props);

  const table = useReactTable({
    data: props.users,
    columns,
    state: { sorting, columnVisibility },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => row.id,
    initialState: { pagination: { pageSize: 20 } },
  });

  if (props.tableBusy) {
    return (
      <div className="space-y-2 p-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full min-w-[720px]" />
        ))}
      </div>
    );
  }

  if (props.users.length === 0) {
    return (
      <Empty className="rounded-md border border-border py-12">
        <EmptyHeader>
          <EmptyTitle>没有符合条件的用户</EmptyTitle>
          <EmptyDescription>调整左侧组织、搜索词或类别筛选，或新建用户。</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="relative min-w-0 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 p-2">
        <DataTableViewOptions table={table} />
      </div>
      <DataTable
        table={table}
        stickyHeader
        className="max-h-[min(72vh,680px)] overflow-auto rounded-md border border-border"
        emptyText="暂无数据"
      />
      <DataTablePagination table={table} pageSizeOptions={[10, 20, 50]} />
    </div>
  );
}
