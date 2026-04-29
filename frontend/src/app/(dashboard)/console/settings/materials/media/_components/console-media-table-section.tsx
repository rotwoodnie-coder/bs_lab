"use client";

import * as React from "react";
import { DataTable, DataTablePagination, DataTableViewOptions } from "@bs-lab/ui";
import {
  type PaginationState,
  type SortingState,
  type Updater,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@bs-lab/ui/react-table";

import type { ApiActor } from "@/lib/new-core-api";
import type { V2DataFileRecord } from "@/lib/v2/v2-file-api";

import { buildConsoleMediaColumns } from "./console-media-columns";
import type { ConsoleMediaServerPagination } from "../page.hooks";

type Props = {
  rows: V2DataFileRecord[];
  actor: ApiActor;
  refresh: () => Promise<void>;
  serverPagination: ConsoleMediaServerPagination;
};

export function ConsoleMediaTableSection({ rows, actor, refresh, serverPagination }: Props) {
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const columns = React.useMemo(
    () => buildConsoleMediaColumns({ actor, refresh }),
    [actor, refresh],
  );

  const server = serverPagination;
  const paginationState: PaginationState = React.useMemo(
    () => ({
      pageIndex: server.pageIndex,
      pageSize: server.pageSize,
    }),
    [server.pageIndex, server.pageSize],
  );

  const onPaginationChange = React.useCallback(
    (updater: Updater<PaginationState>) => {
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

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting, pagination: paginationState },
    onSortingChange: setSorting,
    onPaginationChange,
    manualPagination: true,
    pageCount: Math.max(1, Math.ceil(server.total / server.pageSize)),
    rowCount: server.total,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => row.fileId,
  });

  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <DataTableViewOptions table={table} />
      </div>
      <DataTable
        table={table}
        stickyHeader
        className="max-h-[68vh] overflow-auto rounded-md border border-border"
        emptyText="暂无文件记录。可通过上方上传写入 data_file。"
      />
      <DataTablePagination table={table} pageSizeOptions={[10, 20, 50]} />
    </div>
  );
}
