"use client";

import * as React from "react";
import { Badge, Button, sonnerToast } from "@bs-lab/ui";
import { Download, Eye, Pencil, Share2, Trash2 } from "@bs-lab/ui/icons";
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
  mode: "waterfall" | "grid";
  onRequestEdit?: (item: TeacherMaterialItem) => void;
  onRequestDelete?: (item: TeacherMaterialItem) => void;
  onVideoPosterPersisted?: (fileId: string, displayHref: string) => void;
  /** 为 true 时隐藏编辑/删除/分享/下载等操作按钮 */
  readOnly?: boolean;
};

export function TeacherMaterialWaterfall(props: Props) {
  const [documentPreview, setDocumentPreview] = React.useState<TeacherMaterialItem | null>(null);

  const gridClass =
    props.mode === "waterfall"
      ? "columns-1 gap-4 md:columns-2 2xl:columns-3"
      : "grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4";

  if (props.items.length === 0) {
    return <div className="flex items-center justify-center min-h-[50vh] rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">当前筛选无素材条目。</div>;
  }

  return (
    <div className={gridClass}>
      {props.items.map((item) => {
        const preview = getMaterialPreviewPayload(item);
        const isWaterfall = props.mode === "waterfall";
        return (
          <article
            key={item.materialId}
            className="group mb-3 flex break-inside-avoid flex-col rounded-xl border border-border bg-card shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
          >
            <div
              className={`relative shrink-0 overflow-hidden rounded-t-xl bg-muted/30 ${isWaterfall ? "aspect-video w-full" : "h-40 w-full"}`}
            >
              <MaterialPreviewCard
                preview={preview}
                title={item.title}
                className="h-full w-full rounded-none transition duration-300 group-hover:scale-[1.02]"
                actor={props.actor}
                repairSourceItem={item}
                onVideoPosterPersisted={props.onVideoPosterPersisted}
              />
              <div className="absolute right-2 top-2 z-10 flex flex-wrap justify-end gap-1">
                <Badge variant="secondary" className="font-normal">
                  {kindLabel(item.kind)}
                </Badge>
                <Badge variant="outline" className="font-normal text-[10px]">
                  {materialMsgStatusLabel(item.materialStatus)}
                </Badge>
              </div>
              {!props.readOnly ? (
                <div className="absolute left-2 top-2 z-10 flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
                  <button
                    type="button"
                    className="inline-flex size-7 items-center justify-center rounded-full border border-border/70 bg-background/80 text-foreground backdrop-blur-sm hover:bg-background"
                    aria-label="分享"
                    onClick={() => {
                      void navigator.clipboard
                        .writeText(buildTeacherMaterialShareText(item))
                        .then(() => sonnerToast.success("已复制分享内容"))
                        .catch(() => sonnerToast.error("复制失败"));
                    }}
                  >
                    <Share2 className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    className="inline-flex size-7 items-center justify-center rounded-full border border-border/70 bg-background/80 text-foreground backdrop-blur-sm hover:bg-background"
                    aria-label="下载"
                    onClick={() => {
                      void (async () => {
                        let downloadHref = teacherMaterialDownloadHref(item, props.actor);
                        if (!downloadHref) {
                          downloadHref = await resolveTeacherMaterialDownload(props.actor, item);
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
                  </button>
                  <button
                    type="button"
                    className="inline-flex size-7 items-center justify-center rounded-full border border-border/70 bg-background/80 text-foreground backdrop-blur-sm hover:bg-background"
                    aria-label="编辑素材"
                    onClick={() => props.onRequestEdit?.(item)}
                  >
                    <Pencil className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    className="inline-flex size-7 items-center justify-center rounded-full border border-destructive/40 bg-background/80 text-destructive backdrop-blur-sm hover:bg-background"
                    aria-label="删除素材"
                    onClick={() => props.onRequestDelete?.(item)}
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              ) : null}
            </div>

            <div className="space-y-2 p-3">
              {/* 两行标题 + 日期行占位，减少单行标题时与双行卡片底边不齐 */}
              <div className="min-h-[3.5rem] space-y-1">
                <div className="line-clamp-2 text-sm font-medium leading-snug text-foreground">{item.title}</div>
                <div className="text-xs text-muted-foreground">更新 {item.updatedAt}</div>
              </div>
              {/* 与 size="sm" 按钮同高，避免仅有 Word 预览入口时卡片被拉高 */}
              <div className="h-9 w-full shrink-0">
                {canPreviewTeacherMaterialDocument(item) ? (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="h-9 w-full"
                    onClick={() => setDocumentPreview(item)}
                  >
                    <Eye className="me-1 size-3.5" />
                    预览
                  </Button>
                ) : null}
              </div>
            </div>
          </article>
        );
      })}
      {!props.readOnly ? (
        <TeacherMaterialDocumentPreviewDialog
          open={documentPreview !== null}
          onOpenChange={(open) => {
            if (!open) setDocumentPreview(null);
          }}
          material={documentPreview}
          actor={props.actor}
        />
      ) : null}
    </div>
  );
}

