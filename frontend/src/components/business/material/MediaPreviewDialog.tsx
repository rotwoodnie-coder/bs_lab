"use client";

import * as React from "react";
import {
  Badge,
  Dialog,
  DialogContent,
  DialogTitle,
  Avatar,
  AvatarImage,
  AvatarFallback,
  MediaPreview,
} from "@bs-lab/ui";
import type { ApiActor } from "@/lib/new-core-api";
import type { TeacherMaterialItem } from "@/lib/teacher-materials-api";
import { getMaterialPreviewPayload, kindLabel } from "@/app/(dashboard)/teacher/materials/_lib/material-preview.utils";
import { materialStorageBrowserHref } from "@/lib/material-asset-url";

type Props = {
  item: TeacherMaterialItem | null;
  actor: ApiActor;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const OFFICE_DOC_KINDS = new Set<string>(["word", "ppt", "spreadsheet"]);

/** 非视频素材只读预览弹窗。图片原尺寸展示，PDF/Office 展示缩略图+提示。 */
export function MediaPreviewDialog({ item, actor, open, onOpenChange }: Props) {
  if (!item) return null;

  const preview = getMaterialPreviewPayload(item);
  const isImage = item.kind === "image" || (preview.kind === "image" && preview.status === "ready");
  const isPdf = item.kind === "pdf";
  const isOffice = OFFICE_DOC_KINDS.has(item.kind);
  const previewSrc = preview.previewUrl?.trim() || "";
  const sourceSrc = preview.sourceUrl?.trim() || "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[90dvh] max-w-[90vw] overflow-hidden p-0 sm:max-w-[70vw]"
        showCloseButton
      >
        <DialogTitle className="sr-only">{item.title}</DialogTitle>
        <div className="flex flex-col">
          {/* 预览区 */}
          <div className="flex max-h-[60vh] w-full items-center justify-center overflow-hidden bg-muted/20">
            {isImage && previewSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={materialStorageBrowserHref(sourceSrc || previewSrc)}
                alt={item.title}
                className="max-h-[60vh] max-w-full object-contain"
              />
            ) : previewSrc && (isPdf || isOffice) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={materialStorageBrowserHref(previewSrc)}
                alt={item.title}
                className="max-h-[60vh] max-w-full object-contain opacity-60"
              />
            ) : previewSrc ? (
              <MediaPreview
                kind="image"
                src={materialStorageBrowserHref(previewSrc)}
                alt={item.title}
                className="max-h-[60vh] max-w-full"
              />
            ) : (
              <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
                暂无预览
              </div>
            )}
          </div>
          {/* 元信息栏 */}
          <div className="flex items-center gap-3 border-t border-border px-4 py-3">
            {item.ownerUserName ? (
              <Avatar className="size-8 shrink-0 border border-border">
                {item.ownerAvatarUrl ? (
                  <AvatarImage src={materialStorageBrowserHref(item.ownerAvatarUrl)} alt="" />
                ) : null}
                <AvatarFallback className="bg-primary/10 text-base font-bold text-primary">
                  {item.ownerUserName.trim().slice(0, 1).toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
            ) : null}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-medium text-foreground">{item.title}</span>
                <Badge variant="secondary" className="shrink-0 font-normal">
                  {kindLabel(item.kind)}
                </Badge>
              </div>
              <div className="truncate text-[11px] text-muted-foreground">
                {item.ownerUserName ? (
                  <span>
                    {item.ownerUserName}
                    {item.ownerTitleName ? <span className="opacity-60"> {item.ownerTitleName}</span> : null}
                    <span className="mx-1.5 opacity-30">·</span>
                  </span>
                ) : null}
                {item.ownerOrgName ? <span className="opacity-60">{item.ownerOrgName}</span> : null}
                <span className="ml-1.5">更新 {item.updatedAt}</span>
              </div>
              {(isPdf || isOffice) ? (
                <p className="mt-1 text-[11px] text-muted-foreground/70">
                  此文档可在「实验素材库」中预览完整内容
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
