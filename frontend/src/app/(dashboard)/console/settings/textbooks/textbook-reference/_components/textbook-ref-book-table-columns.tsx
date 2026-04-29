"use client";

import {
  Badge,
  Button,
  DataTableColumnHeader,
} from "@bs-lab/ui";
import type { ColumnDef } from "@bs-lab/ui/react-table";

import { createSerialNumberColumn } from "@/lib/data-table/serial-column";
import { cn } from "@/lib/utils";

import type { TextbookRefBook } from "../page.types";

export type BookColumnCtx = {
  selectedBookId: string;
  gradeNameById: Record<string, string>;
  onSelectBook: (id: string) => void;
  onEdit: (row: TextbookRefBook) => void;
  onToggleStatus: (row: TextbookRefBook) => void;
};

export function buildTextbookRefBookColumns(ctx: BookColumnCtx): ColumnDef<TextbookRefBook>[] {
  return [
    createSerialNumberColumn<TextbookRefBook>(),
    {
      accessorKey: "title",
      meta: { label: "教材名称" },
      header: ({ column }) => <DataTableColumnHeader column={column} title="教材名称" />,
      cell: ({ row }) => (
        <span className={cn("text-sm", row.original.id === ctx.selectedBookId && "font-medium text-foreground")}>
          {row.original.title}
        </span>
      ),
    },
    {
      id: "coursebookVersion",
      accessorFn: (r) => r.coursebookVersion ?? "",
      meta: { label: "教材版本" },
      header: ({ column }) => <DataTableColumnHeader column={column} title="教材版本" />,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.coursebookVersion?.trim() || "—"}</span>
      ),
    },
    {
      id: "grade",
      accessorFn: (r) => r.gradeId ?? "",
      meta: { label: "年级" },
      header: ({ column }) => <DataTableColumnHeader column={column} title="年级" />,
      cell: ({ row }) => {
        const gid = row.original.gradeId;
        const label = gid ? ctx.gradeNameById[gid] ?? "—" : "不限";
        return <span className="text-sm text-muted-foreground">{label}</span>;
      },
    },
    {
      id: "cover",
      accessorFn: (r) => (r.coverRegistryId ? "y" : "n"),
      meta: { label: "封面" },
      header: ({ column }) => <DataTableColumnHeader column={column} title="封面" />,
      cell: ({ row }) =>
        row.original.coverRegistryId ? (
          <Badge variant="secondary" className="font-normal">
            已配置
          </Badge>
        ) : (
          <span className="text-sm text-muted-foreground">未配置</span>
        ),
    },
    {
      accessorKey: "sortOrder",
      meta: { label: "排序" },
      header: ({ column }) => <DataTableColumnHeader column={column} title="排序" />,
      cell: ({ row }) => <span className="tabular-nums text-sm">{row.original.sortOrder}</span>,
    },
    {
      id: "status",
      accessorFn: (r) => r.status,
      meta: { label: "状态" },
      header: ({ column }) => <DataTableColumnHeader column={column} title="状态" />,
      cell: ({ row }) =>
        row.original.status === 1 ? (
          <Badge variant="secondary" className="font-normal">
            启用
          </Badge>
        ) : (
          <Badge variant="outline" className="font-normal text-muted-foreground">
            停用
          </Badge>
        ),
    },
    {
      id: "actions",
      meta: { label: "操作" },
      header: () => <span className="text-muted-foreground">操作</span>,
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          <Button
            type="button"
            variant={row.original.id === ctx.selectedBookId ? "secondary" : "ghost"}
            size="sm"
            className="h-8 px-2"
            onClick={() => ctx.onSelectBook(row.original.id)}
          >
            章节目录
          </Button>
          <Button type="button" variant="ghost" size="sm" className="h-8 px-2" onClick={() => ctx.onEdit(row.original)}>
            编辑
          </Button>
          <Button type="button" variant="ghost" size="sm" className="h-8 px-2" onClick={() => ctx.onToggleStatus(row.original)}>
            {row.original.status === 1 ? "停用" : "启用"}
          </Button>
        </div>
      ),
    },
  ];
}
