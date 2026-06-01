"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  type ColumnDef,
  type PaginationState,
} from "@bs-lab/ui/react-table";
import {
  Button,
  DataTable,
  DataTablePagination,
  DataTableColumnHeader,
} from "@bs-lab/ui";
import {
  Check,
  Eye,
  PenSquare,
  Trash2,
  SendHorizontal,
  ImageUp,
  Monitor,
  X,
} from "@bs-lab/ui/icons";
import { createSerialNumberColumn } from "@/lib/data-table/serial-column";
import { formatZhDateTime } from "@/lib/datetime/format-zh";
import type { VirtualExperimentRecord } from "@/lib/v2/v2-virtual-experiment-api";

// ─── 状态颜色映射 ──────────────────────────────────────

const STATUS_STYLE: Record<
  string,
  { label: string; dot: string; text: string; bg: string }
> = {
  draft: {
    label: "草稿",
    dot: "bg-gray-400",
    text: "text-gray-600",
    bg: "bg-gray-100",
  },
  pending: {
    label: "审核中",
    dot: "bg-orange-400",
    text: "text-orange-600",
    bg: "bg-orange-50",
  },
  published: {
    label: "已发布",
    dot: "bg-green-400",
    text: "text-green-600",
    bg: "bg-green-50",
  },
  rejected: {
    label: "已拒绝",
    dot: "bg-red-400",
    text: "text-red-600",
    bg: "bg-red-50",
  },
  archived: {
    label: "已归档",
    dot: "bg-gray-400",
    text: "text-gray-600",
    bg: "bg-gray-100",
  },
};

// ─── 状态徽章组件 ──────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_STYLE[status] ?? {
    label: status,
    dot: "bg-gray-400",
    text: "text-gray-600",
    bg: "bg-gray-100",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${cfg.bg} ${cfg.text}`}
    >
      <span className={`size-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// ─── 封面缩略图 ────────────────────────────────────────

function CoverThumb({ coverUrl }: { coverUrl: string | null }) {
  if (coverUrl) {
    return (
      <div className="h-10 w-14 flex-shrink-0 overflow-hidden rounded border bg-muted">
        <img
          src={coverUrl}
          alt=""
          className="h-full w-full object-cover"
        />
      </div>
    );
  }
  return (
    <div className="flex h-10 w-14 flex-shrink-0 items-center justify-center rounded border bg-muted">
      <Monitor className="h-4 w-4 text-muted-foreground" />
    </div>
  );
}

// ─── Props ─────────────────────────────────────────────

export interface ExperimentTableProps {
  items: VirtualExperimentRecord[];
  loading: boolean;
  onEdit: (item: VirtualExperimentRecord) => void;
  onDelete: (id: string) => void;
  onSubmitReview: (id: string) => void;
  onUploadCover?: (item: VirtualExperimentRecord) => void;
  /** 审核通过回调（review 模式） */
  onApprove?: (id: string) => void;
  /** 审核拒绝回调（review 模式） */
  onReject?: (id: string) => void;
}

// ─── 列定义工厂 ────────────────────────────────────────

function useExperimentColumns(props: {
  onEdit: (item: VirtualExperimentRecord) => void;
  onDelete: (id: string) => void;
  onSubmitReview: (id: string) => void;
  onUploadCover?: (item: VirtualExperimentRecord) => void;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
}): ColumnDef<VirtualExperimentRecord>[] {
  const router = useRouter();
  const { onEdit, onDelete, onSubmitReview, onUploadCover, onApprove, onReject } = props;

  return React.useMemo<ColumnDef<VirtualExperimentRecord>[]>(
    () => [
      createSerialNumberColumn<VirtualExperimentRecord>(),

      {
        accessorKey: "coverUrl",
        meta: { label: "封面" },
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="封面" />
        ),
        cell: ({ row }) => <CoverThumb coverUrl={row.original.coverUrl} />,
        enableSorting: false,
      },

      {
        accessorKey: "title",
        meta: { label: "实验名称" },
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="实验名称" />
        ),
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div>
              <button
                className="font-medium text-primary hover:underline"
                onClick={() =>
                  router.push(`/virtual-experiment/play/${item.id}`)
                }
              >
                {item.title}
              </button>
              {item.description && (
                <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                  {item.description}
                </p>
              )}
            </div>
          );
        },
      },

      {
        accessorKey: "sourceType",
        meta: { label: "来源" },
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="来源" />
        ),
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.sourceType === "html_file"
              ? "HTML 文件"
              : "URL 内嵌"}
          </span>
        ),
        enableSorting: false,
      },

      {
        accessorKey: "status",
        meta: { label: "状态" },
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="状态" />
        ),
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
        enableSorting: false,
      },

      {
        accessorKey: "callCount",
        meta: { label: "调用数" },
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="调用数" />
        ),
        cell: ({ row }) => (
          <span className="tabular-nums text-muted-foreground">
            {row.original.callCount ?? 0}
          </span>
        ),
      },

      {
        accessorKey: "createTime",
        meta: { label: "创建时间" },
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="创建时间" />
        ),
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {formatZhDateTime(row.original.createTime)}
          </span>
        ),
        enableSorting: false,
      },

      {
        id: "actions",
        meta: { label: "操作" },
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="操作" />
        ),
        cell: ({ row }) => {
          const item = row.original;
          const canSubmit =
            item.status === "draft" || item.status === "rejected";
          const isPending = item.status === "pending";

          return (
            <div className="flex items-center justify-end gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                title="预览"
                onClick={() =>
                  router.push(`/virtual-experiment/play/${item.id}`)
                }
              >
                <Eye className="h-3.5 w-3.5" />
              </Button>

              {/* 审核操作（pending 状态且在 review 模式） */}
              {isPending && onApprove && onReject ? (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-green-600"
                    title="通过"
                    onClick={() => onApprove(item.id)}
                  >
                    <Check className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-red-600"
                    title="拒绝"
                    onClick={() => onReject(item.id)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    title="编辑"
                    onClick={() => onEdit(item)}
                  >
                    <PenSquare className="h-3.5 w-3.5" />
                  </Button>
                  {canSubmit && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      title="提交审核"
                      onClick={() => onSubmitReview(item.id)}
                    >
                      <SendHorizontal className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </>
              )}

              {onUploadCover && !isPending && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  title="上传封面"
                  onClick={() => onUploadCover(item)}
                >
                  <ImageUp className="h-3.5 w-3.5" />
                </Button>
              )}

              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive"
                title="删除"
                onClick={() => onDelete(item.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          );
        },
        enableSorting: false,
      },
    ],
    [router, onEdit, onDelete, onSubmitReview, onUploadCover, onApprove, onReject],
  );
}

// ─── 主组件 ────────────────────────────────────────────

export function ExperimentTable({
  items,
  loading,
  onEdit,
  onDelete,
  onSubmitReview,
  onUploadCover,
  onApprove,
  onReject,
}: ExperimentTableProps) {
  const columns = useExperimentColumns({
    onEdit,
    onDelete,
    onSubmitReview,
    onUploadCover,
    onApprove,
    onReject,
  });

  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });

  const table = useReactTable({
    data: items,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: { pagination },
    onPaginationChange: setPagination,
  });

  return (
    <div className="space-y-4">
      <DataTable
        table={table}
        className={loading ? "opacity-60 pointer-events-none transition-opacity" : ""}
      />
      <DataTablePagination table={table} />
    </div>
  );
}
