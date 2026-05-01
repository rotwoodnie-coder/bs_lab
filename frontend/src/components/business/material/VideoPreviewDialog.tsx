"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogTitle, Avatar, AvatarImage, AvatarFallback } from "@bs-lab/ui";
import { ExpVideoPlayer } from "@/components/business/video";
import type { ApiActor } from "@/lib/new-core-api";
import type { TeacherMaterialItem } from "@/lib/teacher-materials-api";
import { getMaterialPreviewPayload } from "@/app/(dashboard)/teacher/materials/_lib/material-preview.utils";
import { materialStorageBrowserHref } from "@/lib/material-asset-url";

type Props = {
  item: TeacherMaterialItem | null;
  actor: ApiActor;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** 视频播放弹窗，仅播放/暂停/音量控制，无管理按钮。 */
export function VideoPreviewDialog({ item, actor, open, onOpenChange }: Props) {
  if (!item) return null;

  const preview = getMaterialPreviewPayload(item);
  const videoSrc = preview.sourceUrl?.trim() || "";
  const poster = preview.previewUrl?.trim() || undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[90dvh] max-w-[90vw] overflow-hidden p-0 sm:max-w-[80vw]"
        showCloseButton
      >
        <DialogTitle className="sr-only">{item.title}</DialogTitle>
        <div className="flex flex-col">
          {/* 视频播放区 */}
          <div className="aspect-video w-full bg-black">
            {videoSrc ? (
              <ExpVideoPlayer
                src={videoSrc}
                poster={poster ?? null}
                ratio={16 / 9}
                title={item.title}
                className="size-full"
                rasterPosterCapture="visible"
              />
            ) : (
              <div className="flex size-full items-center justify-center text-muted-foreground">
                视频暂不可用
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
              <div className="truncate text-sm font-medium text-foreground">{item.title}</div>
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
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
