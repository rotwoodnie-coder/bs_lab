"use client";

import * as React from "react";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DataTable,
  DataTableColumnHeader,
  DataTablePagination,
  DataTableViewOptions,
  Input,
} from "@bs-lab/ui";
import { Search } from "@bs-lab/ui/icons";
import {
  type ColumnDef,
  type PaginationState,
  type SortingState,
  type Updater,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@bs-lab/ui/react-table";

import { createSerialNumberColumn } from "@/lib/data-table/serial-column";
import type { V2ScaleLogItem } from "@/lib/v2/v2-scale-api";

type Props = {
  logItems: V2ScaleLogItem[];
  logTotal: number;
  logLoading: boolean;
  logPageIndex: number;
  setLogPageIndex: (n: number) => void;
  logPageSize: number;
  setLogPageSize: (n: number) => void;
  logDraftUserId: string;
  setLogDraftUserId: (v: string) => void;
  logDraftSource: string;
  setLogDraftSource: (v: string) => void;
  applyLogFilters: () => void;
};

export function IncentivesLogsCard(props: Props) {
  const [logSort, setLogSort] = React.useState<SortingState>([]);

  const logColumns = React.useMemo<ColumnDef<V2ScaleLogItem>[]>(
    () => [
      createSerialNumberColumn<V2ScaleLogItem>(),
      {
        accessorKey: "userId",
        meta: { label: "用户" },
        header: ({ column }) => <DataTableColumnHeader column={column} title="用户标识" />,
        cell: ({ row }) => <span className="font-mono text-xs">{row.original.userId}</span>,
      },
      {
        accessorKey: "scaleSource",
        meta: { label: "来源" },
        header: ({ column }) => <DataTableColumnHeader column={column} title="积分来源" />,
        cell: ({ row }) => <span className="text-sm">{row.original.scaleSource ?? "—"}</span>,
      },
      {
        accessorKey: "scaleNum",
        meta: { label: "变动" },
        header: ({ column }) => <DataTableColumnHeader column={column} title="积分变动" />,
        cell: ({ row }) => (
          <span
            className={
              row.original.scaleNum >= 0 ? "tabular-nums text-status-success" : "tabular-nums text-destructive"
            }
          >
            {row.original.scaleNum > 0 ? `+${row.original.scaleNum}` : row.original.scaleNum}
          </span>
        ),
      },
      {
        accessorKey: "createTime",
        meta: { label: "时间" },
        header: ({ column }) => <DataTableColumnHeader column={column} title="记录时间" />,
        cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.createTime ?? "—"}</span>,
      },
    ],
    [],
  );

  const logPaginationState: PaginationState = React.useMemo(
    () => ({ pageIndex: props.logPageIndex, pageSize: props.logPageSize }),
    [props.logPageIndex, props.logPageSize],
  );

  const { logPageIndex, logPageSize, setLogPageIndex, setLogPageSize } = props;

  const onLogPaginationChange = React.useCallback(
    (updater: Updater<PaginationState>) => {
      const next = typeof updater === "function" ? updater(logPaginationState) : updater;
      if (next.pageSize !== logPageSize) {
        setLogPageSize(next.pageSize);
        if (next.pageIndex !== 0) setLogPageIndex(0);
        return;
      }
      if (next.pageIndex !== logPageIndex) setLogPageIndex(next.pageIndex);
    },
    [logPaginationState, logPageIndex, logPageSize, setLogPageIndex, setLogPageSize],
  );

  const logTable = useReactTable({
    data: props.logItems,
    columns: logColumns,
    state: { sorting: logSort, pagination: logPaginationState },
    onSortingChange: setLogSort,
    onPaginationChange: onLogPaginationChange,
    manualPagination: true,
    pageCount: Math.max(1, Math.ceil(props.logTotal / props.logPageSize) || 1),
    rowCount: props.logTotal,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (r) => r.seqId,
  });

  return (
    <Card className="border-border shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">积分流水</CardTitle>
        <CardDescription>只读展示 scale_log；支持分页与简单筛选。</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex min-w-0 flex-wrap items-end gap-3">
          <div className="min-w-0 flex-1 space-y-1">
            <span className="text-xs text-muted-foreground">用户标识</span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                value={props.logDraftUserId}
                onChange={(e) => props.setLogDraftUserId(e.target.value)}
                placeholder="精确匹配 user_id"
              />
            </div>
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <span className="text-xs text-muted-foreground">来源关键词</span>
            <Input
              value={props.logDraftSource}
              onChange={(e) => props.setLogDraftSource(e.target.value)}
              placeholder="模糊匹配 scale_source"
            />
          </div>
          <Button type="button" variant="secondary" className="shrink-0" onClick={() => void props.applyLogFilters()}>
            查询
          </Button>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">{props.logLoading ? "加载中…" : `共 ${props.logTotal} 条`}</p>
          {!props.logLoading ? <DataTableViewOptions table={logTable} /> : null}
        </div>
        {props.logLoading ? (
          <p className="text-sm text-muted-foreground">加载中…</p>
        ) : (
          <>
            <DataTable table={logTable} emptyText="暂无流水记录。" />
            <DataTablePagination table={logTable} pageSizeOptions={[10, 20, 50]} />
          </>
        )}
      </CardContent>
    </Card>
  );
}
