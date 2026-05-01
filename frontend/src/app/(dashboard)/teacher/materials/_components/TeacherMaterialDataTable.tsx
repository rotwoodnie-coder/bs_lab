"use client";

import * as React from "react";
import {
  Badge,
  Button,
  Checkbox,
  DataTable,
  DataTableColumnHeader,
  DataTablePagination,
  DataTableViewOptions,
  Separator,
  sonnerToast,
} from "@bs-lab/ui";
import { Download, Eye, ImagePlus, Pencil, RefreshCw, RotateCcw, Share2, Tags, Trash2 } from "@bs-lab/ui/icons";
import {
  type ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type RowSelectionState,
  type SortingState,
  type Updater,
  useReactTable,
} from "@bs-lab/ui/react-table";
import { createSerialNumberColumn } from "@/lib/data-table/serial-column";
import type { ApiActor } from "@/lib/new-core-api";
import { resolveTeacherMaterialDownload, teacherMaterialDownloadHref, type TeacherMaterialItem } from "@/lib/teacher-materials-api";
import { MaterialPreviewCard } from "./MaterialPreviewCard";
import { TeacherMaterialDocumentPreviewDialog } from "./TeacherMaterialDocumentPreviewDialog";
import { buildTeacherMaterialShareText } from "../_lib/teacher-material-share-text";
import { canPreviewTeacherMaterialDocument, getMaterialPreviewPayload, kindLabel } from "../_lib/material-preview.utils";
import { materialMsgStatusLabel, materialMsgStatusVariant } from "../_lib/teacher-materials-ui.config";

type Props = {
  actor: ApiActor;
  items: TeacherMaterialItem[];
  onRequestEdit: (item: TeacherMaterialItem) => void;
  onRequestDelete: (item: TeacherMaterialItem) => void;
  onVideoPosterPersisted?: (fileId: string, displayHref: string) => void;
  /** 触发服务端从对象存储补跑封面 */
  onRepairThumbnail?: (item: TeacherMaterialItem) => void;
  /** 打开手动上传封面弹窗 */
  onRequestPosterUpload?: (item: TeacherMaterialItem) => void;
  /** 批量删除 */
  onBatchDelete?: (ids: string[]) => void;
  /** 打开批量修改分类弹窗，传入当前选中的 ID 列表 */
  onBatchCategory?: (selectedIds: string[]) => void;
};

export function TeacherMaterialDataTable(props: Props) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [documentPreview, setDocumentPreview] = React.useState<TeacherMaterialItem | null>(null);

  const selectedIds = React.useMemo(
    () => props.items.filter((_, i) => rowSelection[i]).map((item) => item.materialId),
    [props.items, rowSelection],
  );

  const columns = React.useMemo<ColumnDef<TeacherMaterialItem>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(Boolean(value as boolean))}
            aria-label="全选"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(Boolean(value as boolean))}
            aria-label="选择"
          />
        ),
        enableSorting: false,
        enableHiding: false,
        size: 40,
      },
      createSerialNumberColumn<TeacherMaterialItem>(),
      {
        id: "title",
        accessorKey: "title",
        meta: { label: "素材" },
        header: ({ column }) => <DataTableColumnHeader column={column} title="素材" />,
        cell: ({ row }) => {
          const preview = getMaterialPreviewPayload(row.original);
          return (
            <div className="flex min-w-0 items-center gap-2">
              <div className="h-10 w-[72px] shrink-0 overflow-hidden rounded border border-border/60 bg-muted/30">
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
              <div className="min-w-0">
                <div className="line-clamp-1 text-sm font-medium text-foreground">{row.original.title}</div>
                <div className="text-[11px] text-muted-foreground">{row.original.updatedAt}</div>
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
          <div className="flex items-center gap-1">
            <Badge variant={materialMsgStatusVariant(row.original.materialStatus)} className="text-[11px] font-normal">
              {materialMsgStatusLabel(row.original.materialStatus)}
            </Badge>
            {/* 封面待生成标记：图片/视频类型且无封面时显示 */}
            {!row.original.materialMainPicUrl && (row.original.kind === "image" || row.original.kind === "video") ? (
              <Badge variant="outline" className="text-[10px] font-normal text-amber-600 border-amber-300 bg-amber-50/50">
                封面待生成
              </Badge>
            ) : null}
          </div>
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
              {/* 常态操作与修复操作之间的分隔线 */}
              <Separator orientation="vertical" className="h-4 mx-0.5" />
              {/* 封面待生成或失败时：重新处理按钮 */}
              {props.onRepairThumbnail && row.original.materialStatus === "n" ? (
                <Button
                  type="button"
                  size="icon-sm"
                  variant="outline"
                  aria-label="重新处理"
                  title="重新处理"
                  onClick={() => props.onRepairThumbnail!(row.original)}
                >
                  <RotateCcw className="size-3.5" />
                </Button>
              ) : null}
              {props.onRepairThumbnail && (row.original.kind === "image" || row.original.kind === "video") && !row.original.materialMainPicUrl ? (
                <Button
                  type="button"
                  size="icon-sm"
                  variant="outline"
                  aria-label="生成封面"
                  title="生成封面"
                  onClick={() => props.onRepairThumbnail!(row.original)}
                >
                  <ImagePlus className="size-3.5" />
                </Button>
              ) : null}
              {props.onRequestPosterUpload && (row.original.kind === "image" || row.original.kind === "video") ? (
                <Button
                  type="button"
                  size="icon-sm"
                  variant="outline"
                  aria-label="上传封面"
                  title="上传封面"
                  onClick={() => props.onRequestPosterUpload!(row.original)}
                >
                  <RefreshCw className="size-3.5" />
                </Button>
              ) : null}
            </div>
          );
        },
      },
    ],
    [props.actor, props.onRequestDelete, props.onRequestEdit, props.onRepairThumbnail, props.onRequestPosterUpload],
  );

  const table = useReactTable({
    data: props.items,
    columns,
    state: { sorting, rowSelection },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => row.materialId,
    enableRowSelection: true,
    initialState: { pagination: { pageSize: 10 } },
  });

  return (
    <div className="space-y-2">
      {/* 批量操作栏 */}
      {selectedIds.length > 0 && (
        <div className="flex items-center gap-2 rounded-md border border-border bg-muted/20 px-3 py-2">
          <span className="text-xs text-muted-foreground">已选 {selectedIds.length} 项</span>
          {props.onBatchCategory ? (
            <Button variant="outline" size="sm" onClick={() => props.onBatchCategory!(selectedIds)}>
              <Tags className="mr-1 h-3.5 w-3.5" />
              批量修改分类
            </Button>
          ) : null}
          {props.onBatchDelete ? (
            <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => props.onBatchDelete!(selectedIds)}>
              <Trash2 className="mr-1 h-3.5 w-3.5" />
              批量删除
            </Button>
          ) : null}
        </div>
      )}
      <div className="flex justify-end">
        <DataTableViewOptions table={table} />
      </div>
      <DataTable table={table} stickyHeader className="max-h-[68vh] overflow-auto rounded-md border border-border [&_td]:py-1.5 [&_th]:py-1.5" emptyText="当前筛选无素材条目。" />
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
