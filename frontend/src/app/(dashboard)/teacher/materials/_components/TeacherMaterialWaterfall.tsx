"use client";

import * as React from "react";
import { Badge, Button, sonnerToast, Avatar, AvatarImage, AvatarFallback } from "@bs-lab/ui";
import { Download, Eye, ImagePlus, Pencil, RefreshCw, RotateCcw, Share2, Trash2 } from "@bs-lab/ui/icons";
import type { ApiActor } from "@/lib/new-core-api";
import { resolveTeacherMaterialDownload, teacherMaterialDownloadHref, type TeacherMaterialItem } from "@/lib/teacher-materials-api";
import { MaterialPreviewCard } from "./MaterialPreviewCard";
import { materialStorageBrowserHref } from "@/lib/material-asset-url";
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
  /** 触发服务端从对象存储补跑封面 */
  onRepairThumbnail?: (item: TeacherMaterialItem) => void;
  /** 打开手动上传封面弹窗 */
  onRequestPosterUpload?: (item: TeacherMaterialItem) => void;
  /** 为 true 时隐藏编辑/删除/分享/下载等操作按钮 */
  readOnly?: boolean;
};

export function TeacherMaterialWaterfall(props: Props) {
  const [documentPreview, setDocumentPreview] = React.useState<TeacherMaterialItem | null>(null);

  const gridClass =
    props.mode === "waterfall"
      ? "columns-1 gap-3 md:columns-2 2xl:columns-3"
      : "grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4";

  if (props.items.length === 0) {
    return (
      <div
        className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground bg-muted/10"
        style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center", minHeight: 400, width: "100%" }}
      >
        <div className="text-center">
          <p>当前筛选无素材条目。</p>
          <p className="text-xs opacity-50 mt-1">尝试调整筛选条件或上传新素材</p>
        </div>
      </div>
    );
  }

  return (
    <div className={gridClass}>
      {props.items.map((item) => {
        const preview = getMaterialPreviewPayload(item);
        const isWaterfall = props.mode === "waterfall";
        return (
          <article
            key={item.materialId}
            className="group mb-0.5 flex break-inside-avoid flex-col rounded-xl border border-border bg-card shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
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
                {/* 封面待生成标记：图片/视频类型且无封面时显示 */}
                {!item.materialMainPicUrl && (item.kind === "image" || item.kind === "video") ? (
                  <Badge variant="outline" className="font-normal text-[9px] text-amber-600 border-amber-300 bg-amber-50/50">
                    封面待生成
                  </Badge>
                ) : null}
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
                  {/* 封面修复操作 */}
                  {props.onRepairThumbnail && item.materialStatus === "n" ? (
                    <button
                      type="button"
                      className="inline-flex size-7 items-center justify-center rounded-full border border-border/70 bg-background/80 text-foreground backdrop-blur-sm hover:bg-background"
                      aria-label="重新处理"
                      onClick={() => props.onRepairThumbnail!(item)}
                    >
                      <RotateCcw className="size-3.5" />
                    </button>
                  ) : null}
                  {props.onRepairThumbnail && (item.kind === "image" || item.kind === "video") && !item.materialMainPicUrl ? (
                    <button
                      type="button"
                      className="inline-flex size-7 items-center justify-center rounded-full border border-border/70 bg-background/80 text-foreground backdrop-blur-sm hover:bg-background"
                      aria-label="生成封面"
                      onClick={() => props.onRepairThumbnail!(item)}
                    >
                      <ImagePlus className="size-3.5" />
                    </button>
                  ) : null}
                  {props.onRequestPosterUpload && (item.kind === "image" || item.kind === "video") ? (
                    <button
                      type="button"
                      className="inline-flex size-7 items-center justify-center rounded-full border border-border/70 bg-background/80 text-foreground backdrop-blur-sm hover:bg-background"
                      aria-label="上传封面"
                      onClick={() => props.onRequestPosterUpload!(item)}
                    >
                      <RefreshCw className="size-3.5" />
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="p-2">
              {/* 上传人头像（左）+ 标题（右），合并一行 */}
              <div className="flex gap-2">
                {item.ownerUserName ? (
                  <Avatar className="size-9 shrink-0 border border-border">
                    {item.ownerAvatarUrl ? (
                      <AvatarImage
                        src={materialStorageBrowserHref(item.ownerAvatarUrl)}
                        alt=""
                      />
                    ) : null}
                    <AvatarFallback className="bg-primary/10 text-lg font-extrabold text-primary">
                      {item.ownerUserName.trim().slice(0, 1).toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                ) : null}
                <div className="min-w-0 flex-1">
                  <div className="line-clamp-2 text-sm font-medium leading-snug text-foreground">{item.title}</div>
                  <div className="truncate text-[11px] text-muted-foreground">
                    {item.ownerUserName ? (
                      <span>
                        {item.ownerUserName}
                        {item.ownerTitleName ? <span className="opacity-60"> {item.ownerTitleName}</span> : null}
                        <span className="mx-1.5 opacity-30">·</span>
                      </span>
                    ) : null}
                    {item.ownerOrgName ? (
                      <span className="opacity-60">{item.ownerOrgName} </span>
                    ) : null}
                    <span>更新 {item.updatedAt}</span>
                  </div>
                </div>
              </div>

              {/* 预览按钮，仅可预览时显示 */}
              {canPreviewTeacherMaterialDocument(item) ? (
                <div className="pt-1.5">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="h-8 w-full text-xs"
                    onClick={() => setDocumentPreview(item)}
                  >
                    <Eye className="me-1 size-3" />
                    预览
                  </Button>
                </div>
              ) : null}
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

