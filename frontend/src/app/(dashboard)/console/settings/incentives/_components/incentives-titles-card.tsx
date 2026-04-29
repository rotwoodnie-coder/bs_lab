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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@bs-lab/ui";
import { Plus } from "@bs-lab/ui/icons";
import { type ColumnDef, type SortingState, getCoreRowModel, getSortedRowModel, useReactTable } from "@bs-lab/ui/react-table";

import { createSerialNumberColumn } from "@/lib/data-table/serial-column";
import type { V2DictItem } from "@/lib/v2/v2-exp-api";
import type { V2ScaleTitleItem } from "@/lib/v2/v2-scale-api";

type Props = {
  roleOptions: V2DictItem[];
  roleNameById: (roleId: string) => string;
  titleRoleFilter: string;
  setTitleRoleFilter: (v: string) => void;
  titles: V2ScaleTitleItem[];
  titlesLoading: boolean;
  onRequestCreate: () => void;
  onRequestEdit: (row: V2ScaleTitleItem) => void;
  onRequestDelete: (row: V2ScaleTitleItem) => void;
};

export function IncentivesTitlesCard(props: Props) {
  const [titleSort, setTitleSort] = React.useState<SortingState>([]);

  const titleColumns = React.useMemo<ColumnDef<V2ScaleTitleItem>[]>(
    () => [
      createSerialNumberColumn<V2ScaleTitleItem>(),
      {
        id: "role",
        meta: { label: "角色" },
        header: ({ column }) => <DataTableColumnHeader column={column} title="角色" />,
        cell: ({ row }) => <span className="text-sm">{props.roleNameById(row.original.roleId)}</span>,
      },
      {
        accessorKey: "titleName",
        meta: { label: "称号名称" },
        header: ({ column }) => <DataTableColumnHeader column={column} title="称号名称" />,
        cell: ({ row }) => <span className="font-medium">{row.original.titleName}</span>,
      },
      {
        accessorKey: "scoreNum",
        meta: { label: "达标积分" },
        header: ({ column }) => <DataTableColumnHeader column={column} title="达标积分下限" />,
        cell: ({ row }) => <span className="tabular-nums">{row.original.scoreNum}</span>,
      },
      {
        id: "icon",
        meta: { label: "图标" },
        header: ({ column }) => <DataTableColumnHeader column={column} title="图标" />,
        cell: ({ row }) =>
          row.original.icon ? (
            <span className="max-w-[200px] truncate font-mono text-xs text-muted-foreground">{row.original.icon}</span>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        id: "actions",
        meta: { label: "操作" },
        header: () => <span className="text-sm font-medium">操作</span>,
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => props.onRequestEdit(row.original)}>
              编辑
            </Button>
            <Button type="button" size="sm" variant="destructive" onClick={() => props.onRequestDelete(row.original)}>
              删除
            </Button>
          </div>
        ),
      },
    ],
    [props.roleNameById, props.onRequestCreate, props.onRequestEdit, props.onRequestDelete],
  );

  const titleTable = useReactTable({
    data: props.titles,
    columns: titleColumns,
    state: { sorting: titleSort },
    onSortingChange: setTitleSort,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (r) => r.seqId,
  });

  return (
    <Card className="border-border shadow-xs">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">积分规则</CardTitle>
        <CardDescription>按角色配置积分档位与称号名称；数据来自库表 scale_title。</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex min-w-0 flex-1 flex-wrap items-end gap-3">
          <div className="min-w-[12rem] flex-1 space-y-1">
            <span className="text-xs text-muted-foreground">按角色筛选</span>
            <Select
              value={props.titleRoleFilter || "__all__"}
              onValueChange={(v) => props.setTitleRoleFilter(v === "__all__" ? "" : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="全部角色" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">全部角色</SelectItem>
                {props.roleOptions.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="button" size="sm" className="gap-1.5 rounded-lg bg-foreground text-background hover:bg-foreground/90 shrink-0" onClick={props.onRequestCreate}>
            <Plus className="size-3.5" />
            新增规则
          </Button>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">{props.titlesLoading ? "加载中…" : `共 ${props.titles.length} 条`}</p>
          {/* v0 对齐：不暴露列显示开关 */}
        </div>
        {props.titlesLoading ? (
          <p className="text-sm text-muted-foreground">加载中…</p>
        ) : (
          <DataTable table={titleTable} emptyText="暂无称号规则，请点击「新增规则」。" />
        )}
      </CardContent>
    </Card>
  );
}
