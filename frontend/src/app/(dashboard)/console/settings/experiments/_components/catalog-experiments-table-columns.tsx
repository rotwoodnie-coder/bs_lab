"use client";

import {
  Badge,
  Button,
  DataTableColumnHeader,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@bs-lab/ui";
import type { ColumnDef } from "@bs-lab/ui/react-table";

import type { CatalogCore } from "@/lib/experiment-catalog-api";
import { createSerialNumberColumn } from "@/lib/data-table/serial-column";
import { formatRelativeTimeZh } from "@/lib/format-relative-zh";

import type { SchoolDimensionSnapshot } from "../../education/subject-grades/page.types";
import {
  compareCatalogRowsByGradeOrder,
  formatCatalogGradeFull,
} from "../catalog-grade-range-display";
import { CatalogOfficialVideoLamp, MandatoryBadge } from "./catalog-experiment-table-cells";

export function catalogClosureBadge(row: CatalogCore) {
  const pending = row.pendingEdgeCount ?? 0;
  const ok = row.closureComplete === true;
  if (ok) {
    return (
      <Badge variant="secondary" className="font-normal">
        已闭环
      </Badge>
    );
  }
  return (
    <div className="flex flex-col items-start gap-0.5">
      <Badge variant="outline" className="font-normal text-muted-foreground">
        待完善
      </Badge>
      {pending > 0 ? (
        <span className="text-xs text-muted-foreground">待审 {pending} 条</span>
      ) : null}
    </div>
  );
}

export type CatalogExperimentColumnsCtx = {
  devIds: boolean;
  snap: SchoolDimensionSnapshot | null;
  canManage: boolean;
  onOpenDetail: (row: CatalogCore) => void;
  onDelete: (row: CatalogCore) => void;
  onOpenEditFocusVideo: (row: CatalogCore) => void;
  setStatusConfirm: (v: { row: CatalogCore; next: number } | null) => void;
  setPreviewRow: (row: CatalogCore) => void;
};

export function buildCatalogExperimentColumns(ctx: CatalogExperimentColumnsCtx): ColumnDef<CatalogCore>[] {
  const { devIds, snap, canManage } = ctx;
  return [
    createSerialNumberColumn<CatalogCore>(),
    {
      accessorKey: "displayName",
      meta: { label: "实验名称" },
      header: ({ column }) => <DataTableColumnHeader column={column} title="实验名称" />,
      cell: ({ row }) => {
        const r = row.original;
        return (
          <div className="flex min-w-0 items-center gap-2">
            <span className="min-w-0 flex-1 truncate font-medium text-foreground">
              {r.displayName}
              {devIds ? (
                <span className="ml-1 font-mono text-xs font-normal text-muted-foreground">(ID: {r.id})</span>
              ) : null}
            </span>
            <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
              <CatalogOfficialVideoLamp
                row={r}
                canManage={ctx.canManage}
                onUnboundClick={ctx.onOpenEditFocusVideo}
                onBoundClick={(row) => ctx.setPreviewRow(row)}
              />
            </div>
          </div>
        );
      },
    },
    {
      id: "stageName",
      accessorFn: (r) => r.stageName?.trim() ?? "",
      meta: { label: "学段" },
      header: ({ column }) => <DataTableColumnHeader column={column} title="学段" />,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.stageName?.trim() || "—"}</span>
      ),
    },
    {
      id: "subjectName",
      accessorFn: (r) => r.subjectName?.trim() ?? "",
      meta: { label: "学科" },
      header: ({ column }) => <DataTableColumnHeader column={column} title="学科" />,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.subjectName?.trim() || "—"}</span>
      ),
    },
    {
      id: "gradeNames",
      accessorFn: (r) => formatCatalogGradeFull(r, snap),
      meta: { label: "年级" },
      header: ({ column }) => <DataTableColumnHeader column={column} title="年级" />,
      sortingFn: (rowA, rowB) => compareCatalogRowsByGradeOrder(rowA.original, rowB.original, snap),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{formatCatalogGradeFull(row.original, snap)}</span>
      ),
    },
    {
      accessorKey: "isMandatory",
      meta: { label: "必做" },
      header: ({ column }) => <DataTableColumnHeader column={column} title="必做" />,
      cell: ({ row }) => <MandatoryBadge value={row.original.isMandatory} />,
    },
    {
      id: "status",
      accessorFn: (r) => r.status,
      meta: { label: "状态" },
      header: ({ column }) => <DataTableColumnHeader column={column} title="状态" />,
      cell: ({ row }) => {
        const r = row.original;
        const on = r.status === 1;
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                disabled={!canManage}
                className="inline-flex items-center gap-1 rounded-md p-1 text-left hover:bg-muted/60 disabled:opacity-50"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!canManage) return;
                  ctx.setStatusConfirm({ row: r, next: on ? 0 : 1 });
                }}
              >
                <span
                  className={`size-2.5 shrink-0 rounded-full ${on ? "bg-primary" : "bg-muted-foreground/40"}`}
                  aria-hidden
                />
                <span className="text-xs text-muted-foreground">{on ? "启用" : "停用"}</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              {canManage ? "点击切换启用状态（需确认）" : "仅管理员可切换状态"}
            </TooltipContent>
          </Tooltip>
        );
      },
    },
    {
      id: "updatedAt",
      accessorFn: (r) => r.updatedAt ?? "",
      meta: { label: "最近更新" },
      enableHiding: true,
      header: ({ column }) => <DataTableColumnHeader column={column} title="最近更新" />,
      cell: ({ row }) => (
        <span className="tabular-nums text-sm text-muted-foreground">
          {formatRelativeTimeZh(row.original.updatedAt)}
        </span>
      ),
    },
    {
      id: "closure",
      meta: { label: "检查闭环" },
      enableHiding: true,
      header: () => (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="cursor-help border-b border-dotted border-muted-foreground">检查闭环</span>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs text-xs" side="top">
            已登记官方视频，且章节、材料、媒体映射各至少一条已通过，且无待审核边时记为已闭环。
          </TooltipContent>
        </Tooltip>
      ),
      cell: ({ row }) => catalogClosureBadge(row.original),
    },
    ...(canManage
      ? ([
          {
            id: "actions",
            meta: { label: "操作" },
            header: () => <span className="text-muted-foreground">操作</span>,
            cell: ({ row }) => {
              const r = row.original;
              return (
                <div className="flex flex-nowrap items-center gap-1 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                  <Button type="button" variant="ghost" size="sm" className="h-8 shrink-0 px-2" onClick={() => ctx.onOpenDetail(r)}>
                    编辑
                  </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 shrink-0 px-2 text-destructive hover:text-destructive"
                      onClick={() => ctx.onDelete(r)}
                    >
                      停用
                    </Button>
                </div>
              );
            },
          },
        ] as ColumnDef<CatalogCore>[])
      : []),
  ];
}
