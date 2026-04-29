"use client";

import {
  Badge,
  Button,
  DataTableColumnHeader,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@bs-lab/ui";
import { MoreHorizontal, Pencil } from "@bs-lab/ui/icons";
import type { ColumnDef } from "@bs-lab/ui/react-table";

import { createSerialNumberColumn } from "@/lib/data-table/serial-column";
import type { V2DictItem } from "@/lib/v2/v2-exp-api";
import type { V2QuestionItem } from "@/lib/v2/v2-question-api";

function stemPreview(text: string, max = 72) {
  const t = text.replace(/\s+/g, " ").trim();
  return t.length <= max ? t : `${t.slice(0, max)}…`;
}

function statusLabel(status: string | null): string {
  if (status === "y") return "已启用";
  if (status === "t") return "草稿";
  if (status === "n") return "已停用";
  return "—";
}

function statusVariant(status: string | null): "default" | "secondary" | "outline" | "destructive" {
  if (status === "y") return "default";
  if (status === "t") return "secondary";
  if (status === "n") return "destructive";
  return "outline";
}

export type QuestionsTableColumnsCtx = {
  typeName: (id: string | null) => string;
  difficultyName: (id: string | null) => string;
  capacityName: (id: string | null) => string;
  onEdit: (row: V2QuestionItem) => void;
  onDelete: (row: V2QuestionItem) => void;
  onStatus: (row: V2QuestionItem, status: "y" | "t") => void;
  onRequestDeactivate: (row: V2QuestionItem) => void;
};

export function buildQuestionsTableColumns(ctx: QuestionsTableColumnsCtx): ColumnDef<V2QuestionItem>[] {
  return [
    createSerialNumberColumn<V2QuestionItem>(),
    {
      id: "stem",
      accessorFn: (r) => r.questionContent,
      meta: { label: "题干摘要" },
      header: ({ column }) => <DataTableColumnHeader column={column} title="题干摘要" />,
      cell: ({ row }) => (
        <span className="line-clamp-2 min-w-0 text-sm text-foreground">{stemPreview(row.original.questionContent)}</span>
      ),
    },
    {
      id: "questionType",
      accessorFn: (r) => ctx.typeName(r.questionTypeId),
      meta: { label: "题型" },
      header: ({ column }) => <DataTableColumnHeader column={column} title="题型" />,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{ctx.typeName(row.original.questionTypeId)}</span>
      ),
    },
    {
      id: "difficulty",
      accessorFn: (r) => ctx.difficultyName(r.difficultyTypeId),
      meta: { label: "难度类型" },
      header: ({ column }) => <DataTableColumnHeader column={column} title="难度类型" />,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{ctx.difficultyName(row.original.difficultyTypeId)}</span>
      ),
    },
    {
      id: "capacity",
      accessorFn: (r) => ctx.capacityName(r.questionCapacityId),
      meta: { label: "能力侧重点" },
      header: ({ column }) => <DataTableColumnHeader column={column} title="能力侧重点" />,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{ctx.capacityName(row.original.questionCapacityId)}</span>
      ),
    },
    {
      id: "status",
      accessorFn: (r) => r.status ?? "",
      meta: { label: "状态" },
      header: ({ column }) => <DataTableColumnHeader column={column} title="状态" />,
      cell: ({ row }) => (
        <Badge variant={statusVariant(row.original.status)} className="font-normal">
          {statusLabel(row.original.status)}
        </Badge>
      ),
    },
    {
      id: "createTime",
      accessorFn: (r) => r.createTime ?? "",
      meta: { label: "创建时间" },
      header: ({ column }) => <DataTableColumnHeader column={column} title="创建时间" />,
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-xs text-muted-foreground">{row.original.createTime ?? "—"}</span>
      ),
    },
    {
      id: "owner",
      accessorFn: (r) => r.displayOwnerName ?? "",
      meta: { label: "录入人" },
      header: ({ column }) => <DataTableColumnHeader column={column} title="录入人" />,
      cell: ({ row }) => (
        <span className="max-w-[140px] truncate text-xs text-muted-foreground" title={row.original.displayOwnerName ?? ""}>
          {row.original.displayOwnerName ?? "—"}
        </span>
      ),
    },
    {
      id: "actions",
      meta: { label: "操作" },
      header: () => <span className="text-muted-foreground">操作</span>,
      cell: ({ row }) => {
        const r = row.original;
        return (
          <div className="flex items-center gap-1">
            <Button type="button" variant="ghost" size="sm" className="h-8 px-2" onClick={() => ctx.onEdit(r)}>
              <Pencil className="size-3.5" />
              编辑
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="outline" size="sm" className="h-8 px-2">
                  <MoreHorizontal className="size-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={() => ctx.onStatus(r, "y")}>设为已启用</DropdownMenuItem>
                <DropdownMenuItem onClick={() => ctx.onStatus(r, "t")}>设为草稿</DropdownMenuItem>
                <DropdownMenuItem onClick={() => ctx.onRequestDeactivate(r)}>设为已停用…</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => ctx.onDelete(r)}>
                  删除题目
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];
}

export function dictNameById(dict: V2DictItem[], id: string | null): string {
  if (!id) return "—";
  const hit = dict.find((d) => d.id === id);
  return hit?.name?.trim() || "—";
}
