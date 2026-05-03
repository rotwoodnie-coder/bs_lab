"use client";

import * as React from "react";
import { MediaPreview } from "@bs-lab/ui";

import { ExpVideoPlayer } from "@/components/business/video";
import type { ApiActor } from "@/lib/new-core-api";
import { resolvedTeacherMaterialDataFileId, type TeacherMaterialItem } from "@/lib/teacher-materials-api";

import type { MaterialPreviewPayload } from "../_lib/material-preview.types";
import { isEmbeddableWithoutCookie } from "../_lib/material-preview.utils";
import { useTeacherMaterialDataFileRepairOnVisible } from "../_lib/use-teacher-material-data-file-repair-on-visible";

type Props = {
  preview: MaterialPreviewPayload;
  title: string;
  className?: string;
  compact?: boolean;
  /** 传入时，卡片进入视口后静默尝试补齐关联 `data_file` 的 hash / file_type_id */
  actor?: ApiActor | null;
  repairSourceItem?: TeacherMaterialItem | null;
  /** 视频截帧上传写库成功后，更新列表行 `materialMainPicUrl` */
  onVideoPosterPersisted?: (fileId: string, displayHref: string) => void;
  /** 可选：点击播放替代 inline 播放，父级打开弹窗时暂停卡片视频 */
  onPlayRequest?: () => void;
};

function titleByStatus(preview: MaterialPreviewPayload): string {
  if (preview.status === "processing") return "预览生成中";
  if (preview.status === "failed") return "暂无素材预览";
  if (preview.kind === "office") return "Office 文件预览";
  if (preview.kind === "pdf") return "PDF 文件预览";
  return "素材预览";
}

function descByStatus(preview: MaterialPreviewPayload): string {
  if (preview.note) return preview.note;
  if (preview.status === "processing") return "请稍后刷新查看";
  if (preview.status === "failed") return "请上传或绑定素材后查看";
  return "可在详情页查看完整内容";
}

function mediaKind(preview: MaterialPreviewPayload): "image" | "video" {
  return preview.kind === "video" && preview.status === "ready" ? "video" : "image";
}

const FALLBACK_POSTER = "/illustrations/media-missing.svg";

/**
 * 列表视频片头极短黑场时，可从第 N 秒起播（hover 与点开后均走 `ExpVideoPlayer.contentStartSeconds`）。
 * 在 `.env.local` 设置，例如：`NEXT_PUBLIC_TEACHER_MATERIAL_VIDEO_LEADING_SKIP_SEC=0.85`
 * 未设置则不跳过（仍可用每条的元数据字段在将来接入后覆盖）。
 */
const TEACHER_MATERIAL_VIDEO_LEADING_SKIP_SEC: number | undefined = (() => {
  const raw = process.env.NEXT_PUBLIC_TEACHER_MATERIAL_VIDEO_LEADING_SKIP_SEC?.trim();
  if (!raw) return undefined;
  const n = Number.parseFloat(raw);
  if (!Number.isFinite(n) || n <= 0 || n > 30) return undefined;
  return n;
})();

export function MaterialPreviewCard(props: Props) {
  const repairRef = useTeacherMaterialDataFileRepairOnVisible(props.actor, props.repairSourceItem ?? null);
  const useOverlay = props.preview.status !== "ready" || props.preview.kind === "office" || props.preview.kind === "pdf";
  const videoReady = props.preview.kind === "video" && props.preview.status === "ready";
  const repairFileId =
    props.repairSourceItem != null
      ? (resolvedTeacherMaterialDataFileId(props.repairSourceItem) ??
          (props.repairSourceItem.rowSource === "data_file" ? props.repairSourceItem.materialId.trim() : "")) || ""
      : "";
  const previewSrc = props.preview.previewUrl || FALLBACK_POSTER;
  const videoPlaySrc = props.preview.sourceUrl?.trim() || previewSrc;
  const posterForVideo =
    props.preview.previewUrl?.trim() &&
    props.preview.previewUrl.trim() !== FALLBACK_POSTER &&
    props.preview.previewUrl.trim() !== videoPlaySrc.trim() &&
    isEmbeddableWithoutCookie(props.preview.previewUrl)
      ? props.preview.previewUrl.trim()
      : undefined;
  return (
    <div ref={repairRef} className={`relative overflow-hidden rounded-md bg-muted/30 ${props.className ?? ""}`}>
      {videoReady ? (
        <ExpVideoPlayer
          src={videoPlaySrc}
          poster={posterForVideo ?? null}
          contentStartSeconds={TEACHER_MATERIAL_VIDEO_LEADING_SKIP_SEC}
          ratio={16 / 9}
          title={props.title}
          className="size-full min-h-0"
          rasterPosterCapture="visible"
          onPlayRequest={props.onPlayRequest}
          posterPersist={
            props.actor && videoReady && !posterForVideo && repairFileId
              ? {
                  fileId: repairFileId,
                  actor: props.actor,
                  onPersisted: props.onVideoPosterPersisted,
                }
              : undefined
          }
        />
      ) : (
        <MediaPreview
          kind={mediaKind(props.preview)}
          src={previewSrc}
          alt={props.title}
          className="size-full object-cover"
          videoProps={{ playsInline: true, preload: "metadata" }}
        />
      )}
      {useOverlay ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-background/45 px-3 text-center">
          <div className={`${props.compact ? "text-[11px]" : "text-xs"} font-medium text-foreground`}>{titleByStatus(props.preview)}</div>
          <div className={`${props.compact ? "text-[10px]" : "text-[11px]"} text-muted-foreground`}>{descByStatus(props.preview)}</div>
        </div>
      ) : null}
    </div>
  );
}

