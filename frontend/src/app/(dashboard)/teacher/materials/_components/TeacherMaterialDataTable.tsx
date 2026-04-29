"use client";

import * as React from "react";
import {
  Badge,
  Button,
  DataTable,
  DataTableColumnHeader,
  DataTablePagination,
  DataTableViewOptions,
  sonnerToast,
} from "@bs-lab/ui";
import { Download, Eye, Pencil, Share2, Trash2 } from "@bs-lab/ui/icons";
import {
  type ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@bs-lab/ui/react-table";
import { createSerialNumberColumn } from "@/lib/data-table/serial-column";
import type { ApiActor } from "@/lib/new-core-api";
import { resolveTeacherMaterialDownload, teacherMaterialDownloadHref, type TeacherMaterialItem } from "@/lib/teacher-materials-api";
import { MaterialPreviewCard } from "./MaterialPreviewCard";
import { TeacherMaterialDocumentPreviewDialog } from "./TeacherMaterialDocumentPreviewDialog";
import { buildTeacherMaterialShareText } from "../_lib/teacher-material-share-text";
import { canPreviewTeacherMaterialDocument, getMaterialPreviewPayload, kindLabel } from "../_lib/material-preview.utils";
import { materialMsgStatusLabel } from "../_lib/teacher-materials-ui.config";

type Props = {
  actor: ApiActor;
  items: TeacherMaterialItem[];
  onRequestEdit: (item: TeacherMaterialItem) => void;
  onRequestDelete: (item: TeacherMaterialItem) => void;
  onVideoPosterPersisted?: (fileId: string, displayHref: string) => void;
};

export function TeacherMaterialDataTable(props: Props) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [documentPreview, setDocumentPreview] = React.useState<TeacherMaterialItem | null>(null);

  const columns = React.useMemo<ColumnDef<TeacherMaterialItem>[]>(
    () => [
      createSerialNumberColumn<TeacherMaterialItem>(),
      {
        id: "title",
        accessorKey: "title",
        meta: { label: "素材" },
        header: ({ column }) => <DataTableColumnHeader column={column} title="素材" />,
        cell: ({ row }) => {
          const preview = getMaterialPreviewPayload(row.original);
          return (
            <div className="flex min-w-0 items-center gap-3">
              <div className="h-12 w-[84px] overflow-hidden rounded border border-border/60 bg-muted/30">
                <MaterialPreviewCard
                  preview={preview}
                  title={row.original.title}
                  compact
                  className="h-full w-full"
                  actor={props.actor}
                  repairSourceItem={row.original}
                  onVideoPosterPersisted={props.onVideoPosterPersisted}
                />
              </div>
              <div className="min-w-0 space-y-0.5">
                <div className="line-clamp-1 text-sm font-medium text-foreground">{row.original.title}</div>
                <div className="text-xs text-muted-foreground">{row.original.updatedAt}</div>
              </div>
            </div>
          );
        },
      },
      {
        id: "kind",
        accessorKey: "kind",
        meta: { label: "类型" },
        header: ({ column }) => <DataTableColumnHeader column={column} title="类型" />,
        cell: ({ row }) => (
          <Badge variant="secondary" className="font-normal">
            {kindLabel(row.original.kind)}
          </Badge>
        ),
      },
      {
        id: "materialStatus",
        accessorFn: (row) => row.materialStatus ?? "",
        meta: { label: "状态" },
        header: ({ column }) => <DataTableColumnHeader column={column} title="状态" />,
        cell: ({ row }) => (
          <Badge variant="outline" className="text-[11px] font-normal">
            {materialMsgStatusLabel(row.original.materialStatus)}
          </Badge>
        ),
      },
      {
        id: "linkedExperimentTitle",
        accessorKey: "linkedExperimentTitle",
        meta: { label: "关联实验" },
        header: ({ column }) => <DataTableColumnHeader column={column} title="关联实验" />,
        cell: ({ row }) => {
          const experimentId = row.original.experimentId?.trim();
          const title = row.original.linkedExperimentTitle?.trim();
          if (!experimentId && !title) {
            return <span className="line-clamp-1 text-sm text-muted-foreground">未关联实验</span>;
          }
          return (
            <div className="min-w-0">
              {title ? <div className="line-clamp-1 text-sm text-foreground">{title}</div> : null}
              {experimentId ? <div className="line-clamp-1 text-xs text-muted-foreground">ID: {experimentId}</div> : null}
            </div>
          );
        },
      },
      {
        id: "actions",
        meta: { label: "操作" },
        header: "操作",
        enableSorting: false,
        cell: ({ row }) => {
          const preview = getMaterialPreviewPayload(row.original);
          return (
            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                size="icon-sm"
                variant="outline"
                aria-label="分享"
                onClick={() => {
                  void navigator.clipboard
                    .writeText(buildTeacherMaterialShareText(row.original))
                    .then(() => sonnerToast.success("已复制分享内容"))
                    .catch(() => sonnerToast.error("复制失败"));
                }}
              >
                <Share2 className="size-3.5" />
              </Button>
              {canPreviewTeacherMaterialDocument(row.original) ? (
                <Button
                  type="button"
                  size="icon-sm"
                  variant="outline"
                  aria-label="预览文档"
                  onClick={() => setDocumentPreview(row.original)}
                >
                  <Eye className="size-3.5" />
                </Button>
              ) : null}
              <Button
                type="button"
                size="icon-sm"
                variant="outline"
                aria-label="下载"
                onClick={() => {
                  void (async () => {
                    let downloadHref = teacherMaterialDownloadHref(row.original, props.actor);
                    if (!downloadHref) {
                      downloadHref = await resolveTeacherMaterialDownload(props.actor, row.original);
                    }
                    if (!downloadHref && preview.sourceUrl) {
                      downloadHref = preview.sourceUrl;
                    }
                    if (downloadHref) {
                      window.open(downloadHref, "_blank", "noopener,noreferrer");
                      sonnerToast.success("已开始下载");
                      return;
                    }
                    sonnerToast.error("未找到可下载的文件", {
                      description: "未找到可打开的文件（缺少主图、附件或文件未正确绑定）。请在编辑中重新上传或补充附件后重试。",
                    });
                  })();
                }}
              >
                <Download className="size-3.5" />
              </Button>
              <Button
                type="button"
                size="icon-sm"
                variant="outline"
                aria-label="编辑素材"
                onClick={() => props.onRequestEdit(row.original)}
              >
                <Pencil className="size-3.5" />
              </Button>
              <Button
                type="button"
                size="icon-sm"
                variant="outline"
                className="text-destructive hover:text-destructive"
                aria-label="删除素材"
                onClick={() => props.onRequestDelete(row.original)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          );
        },
      },
    ],
    [props.actor, props.onRequestDelete, props.onRequestEdit],
  );

  const table = useReactTable({
    data: props.items,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => row.materialId,
    initialState: { pagination: { pageSize: 10 } },
  });

  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <DataTableViewOptions table={table} />
      </div>
      <DataTable table={table} stickyHeader className="max-h-[68vh] overflow-auto rounded-md border border-border" emptyText="当前筛选无素材条目。" />
      <DataTablePagination table={table} pageSizeOptions={[10, 20, 50]} />
      <TeacherMaterialDocumentPreviewDialog
        open={documentPreview !== null}
        onOpenChange={(open) => {
          if (!open) setDocumentPreview(null);
        }}
        material={documentPreview}
        actor={props.actor}
      />
    </div>
  );
}
