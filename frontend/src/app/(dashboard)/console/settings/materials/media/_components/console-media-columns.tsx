"use client";

import { Badge } from "@bs-lab/ui";
import { type ColumnDef } from "@bs-lab/ui/react-table";
import { DataTableColumnHeader } from "@bs-lab/ui";

import { MediaRegistryStreamPreview, resolveRegistryStreamPreviewKind } from "@/components/business/media/MediaRegistryStreamPreview";
import { createSerialNumberColumn } from "@/lib/data-table/serial-column";
import type { V2DataFileRecord } from "@/lib/v2/v2-file-api";

import { dataFileStatusLabel, dataFileStatusVariant } from "./console-media-labels";
import { ConsoleMediaRowActions } from "./console-media-row-actions";
import type { ApiActor } from "@/lib/new-core-api";

function formatBytes(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n) || n < 0) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export type ConsoleMediaColumnsParams = {
  actor: ApiActor;
  refresh: () => Promise<void>;
};

export function buildConsoleMediaColumns(params: ConsoleMediaColumnsParams): ColumnDef<V2DataFileRecord>[] {
  return [
    createSerialNumberColumn<V2DataFileRecord>(),
    {
      id: "thumb",
      meta: { label: "封面" },
      header: ({ column }) => <DataTableColumnHeader column={column} title="封面" />,
      enableSorting: false,
      cell: ({ row }) => {
        const r = row.original;
        const fid = r.fileId?.trim();
        if (!fid) {
          return (
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted text-[10px] text-muted-foreground">
              —
            </div>
          );
        }
        const previewKind = resolveRegistryStreamPreviewKind({
          assetMediaType: null,
          fileExt: r.fileExt,
          title: r.fileName,
        });
        if (previewKind === "other") {
          return (
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted text-[10px] text-muted-foreground">
              {(r.fileExt ?? "文件").slice(0, 6)}
            </div>
          );
        }
        return (
          <div className="h-10 w-10 overflow-hidden rounded-md border border-border">
            <MediaRegistryStreamPreview
              fileId={fid}
              actor={params.actor}
              title={r.fileName}
              fileExt={r.fileExt}
              logoUrl={r.logoUrl}
              className="h-full w-full"
            />
          </div>
        );
      },
    },
    {
      accessorKey: "fileName",
      meta: { label: "文件名称" },
      header: ({ column }) => <DataTableColumnHeader column={column} title="文件名称" />,
      cell: ({ row }) => (
        <div className="min-w-0 max-w-[14rem] space-y-0.5">
          <div className="truncate text-sm font-medium text-foreground">{row.original.fileName}</div>
          <div className="truncate text-xs text-muted-foreground">
            {row.original.fileTypeName ?? "未分类类型"}
            {row.original.fileExt ? ` · .${String(row.original.fileExt).replace(/^\./, "")}` : ""}
          </div>
        </div>
      ),
    },
    {
      id: "size",
      meta: { label: "大小" },
      header: ({ column }) => <DataTableColumnHeader column={column} title="大小" />,
      enableSorting: false,
      cell: ({ row }) => <span className="tabular-nums text-sm text-muted-foreground">{formatBytes(row.original.fileSize)}</span>,
    },
    {
      id: "status",
      accessorKey: "status",
      meta: { label: "状态" },
      header: ({ column }) => <DataTableColumnHeader column={column} title="状态" />,
      cell: ({ row }) => (
        <Badge variant={dataFileStatusVariant(row.original.status)} className="font-normal">
          {dataFileStatusLabel(row.original.status)}
        </Badge>
      ),
    },
    {
      id: "owner",
      accessorKey: "ownerUserId",
      meta: { label: "归属用户" },
      header: ({ column }) => <DataTableColumnHeader column={column} title="归属用户" />,
      cell: ({ row }) => {
        const v = row.original.ownerUserId?.trim();
        return <span className="text-sm text-muted-foreground">{v ? v : "—"}</span>;
      },
    },
    {
      id: "actions",
      meta: { label: "操作" },
      header: "操作",
      enableSorting: false,
      cell: ({ row }) => <ConsoleMediaRowActions row={row.original} actor={params.actor} refresh={params.refresh} />,
    },
  ];
}
