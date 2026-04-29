"use client";

import * as React from "react";
import { Button, DataTableColumnHeader } from "@bs-lab/ui";
import type { ColumnDef } from "@bs-lab/ui/react-table";
import { createSerialNumberColumn } from "@/lib/data-table/serial-column";

export type RiskLevel = "none" | "low" | "medium" | "high";

export type TypeRow = {
  id: string;
  code: string;
  name: string;
  displayName: string;
  sortOrder: number;
};
export type CategoryRow = {
  id: string;
  code: string;
  name: string;
  parentCode: string | null;
  sortOrder: number;
};
export type TagRow = {
  id: string;
  code: string;
  name: string;
  riskLevel: RiskLevel;
  sortOrder: number;
};

export function riskLabel(level: RiskLevel) {
  return level === "high" ? "高风险" : level === "medium" ? "中风险" : level === "low" ? "低风险" : "无风险";
}

export function useTypeColumns(params: {
  canMaintain: boolean;
  busy: boolean;
  onEdit: (row: TypeRow) => void;
  onDelete: (code: string) => void;
}) {
  return React.useMemo<ColumnDef<TypeRow>[]>(
    () => [
      createSerialNumberColumn<TypeRow>(),
      {
        accessorKey: "name",
        meta: { label: "属性名称" },
        header: ({ column }) => <DataTableColumnHeader column={column} title="属性名称" />,
        cell: ({ row }) => <span className="text-sm">{row.original.name}</span>,
      },
      {
        accessorKey: "displayName",
        meta: { label: "展示文案" },
        header: ({ column }) => <DataTableColumnHeader column={column} title="展示文案" />,
        cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.displayName}</span>,
      },
      {
        accessorKey: "sortOrder",
        meta: { label: "排序" },
        header: ({ column }) => <DataTableColumnHeader column={column} title="排序" />,
        cell: ({ row }) => <span className="tabular-nums text-sm">{row.original.sortOrder}</span>,
      },
      {
        id: "actions",
        meta: { label: "操作" },
        header: () => <span className="text-muted-foreground">操作</span>,
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <Button type="button" size="sm" variant="ghost" disabled={!params.canMaintain || params.busy} onClick={() => params.onEdit(row.original)}>
              编辑
            </Button>
            <Button type="button" size="sm" variant="ghost" disabled={!params.canMaintain || params.busy} onClick={() => params.onDelete(row.original.code)}>
              删除
            </Button>
          </div>
        ),
      },
    ],
    [params],
  );
}

export function useCategoryColumns(params: {
  canMaintain: boolean;
  busy: boolean;
  onEdit: (row: CategoryRow) => void;
  onDelete: (code: string) => void;
}) {
  return React.useMemo<ColumnDef<CategoryRow>[]>(
    () => [
      createSerialNumberColumn<CategoryRow>(),
      {
        accessorKey: "name",
        meta: { label: "分类名称" },
        header: ({ column }) => <DataTableColumnHeader column={column} title="分类名称" />,
        cell: ({ row }) => <span className="text-sm">{row.original.parentCode ? `└ ${row.original.name}` : row.original.name}</span>,
      },
      {
        id: "parent",
        accessorFn: (row) => row.parentCode ?? "",
        meta: { label: "父级分类" },
        header: ({ column }) => <DataTableColumnHeader column={column} title="父级分类" />,
        cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.parentCode ?? "无"}</span>,
      },
      {
        accessorKey: "sortOrder",
        meta: { label: "排序" },
        header: ({ column }) => <DataTableColumnHeader column={column} title="排序" />,
        cell: ({ row }) => <span className="tabular-nums text-sm">{row.original.sortOrder}</span>,
      },
      {
        id: "actions",
        meta: { label: "操作" },
        header: () => <span className="text-muted-foreground">操作</span>,
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <Button type="button" size="sm" variant="ghost" disabled={!params.canMaintain || params.busy} onClick={() => params.onEdit(row.original)}>
              编辑
            </Button>
            <Button type="button" size="sm" variant="ghost" disabled={!params.canMaintain || params.busy} onClick={() => params.onDelete(row.original.code)}>
              删除
            </Button>
          </div>
        ),
      },
    ],
    [params],
  );
}

export function useTagColumns(params: {
  canMaintain: boolean;
  busy: boolean;
  onEdit: (row: TagRow) => void;
  onDelete: (code: string) => void;
}) {
  return React.useMemo<ColumnDef<TagRow>[]>(
    () => [
      createSerialNumberColumn<TagRow>(),
      {
        accessorKey: "name",
        meta: { label: "风险提示" },
        header: ({ column }) => <DataTableColumnHeader column={column} title="风险提示" />,
        cell: ({ row }) => <span className="text-sm">{row.original.name}</span>,
      },
      {
        accessorKey: "riskLevel",
        meta: { label: "风险等级" },
        header: ({ column }) => <DataTableColumnHeader column={column} title="风险等级" />,
        cell: ({ row }) => <span className="text-sm text-muted-foreground">{riskLabel(row.original.riskLevel)}</span>,
      },
      {
        accessorKey: "sortOrder",
        meta: { label: "排序" },
        header: ({ column }) => <DataTableColumnHeader column={column} title="排序" />,
        cell: ({ row }) => <span className="tabular-nums text-sm">{row.original.sortOrder}</span>,
      },
      {
        id: "actions",
        meta: { label: "操作" },
        header: () => <span className="text-muted-foreground">操作</span>,
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <Button type="button" size="sm" variant="ghost" disabled={!params.canMaintain || params.busy} onClick={() => params.onEdit(row.original)}>
              编辑
            </Button>
            <Button type="button" size="sm" variant="ghost" disabled={!params.canMaintain || params.busy} onClick={() => params.onDelete(row.original.code)}>
              删除
            </Button>
          </div>
        ),
      },
    ],
    [params],
  );
}

