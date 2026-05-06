"use client";

import * as React from "react";
import { MediaPreview } from "@bs-lab/ui";

import type { ApiActor } from "@/lib/new-core-api";
import { cn } from "@/lib/utils";
import { IMAGE_FILE_EXTENSIONS, VIDEO_FILE_EXTENSIONS } from "@/lib/media/extension-groups";
import { mediaRegistryStreamUrl } from "@/lib/media-platform/registry-ref";
import { materialStorageBrowserHref } from "@/lib/material-asset-url";

function extToken(fileExt: string | null | undefined, title: string): string {
  const fromCol = (fileExt ?? "").replace(/^\./, "").trim().toLowerCase();
  if (fromCol) return fromCol;
  const m = title.trim().toLowerCase().match(/\.([a-z0-9]+)(\?|#|$)/i);
  return (m?.[1] ?? "").toLowerCase();
}

export type RegistryStreamPreviewKind = "image" | "video" | "other";

export function resolveRegistryStreamPreviewKind(input: {
  assetMediaType?: string | null;
  fileExt?: string | null;
  title: string;
}): RegistryStreamPreviewKind {
  const t = (input.assetMediaType ?? "UNKNOWN").toUpperCase();
  if (t === "IMAGE") return "image";
  if (t === "VIDEO") return "video";
  const e = extToken(input.fileExt, input.title);
  if (VIDEO_FILE_EXTENSIONS.has(e)) return "video";
  if (IMAGE_FILE_EXTENSIONS.has(e)) return "image";
  return "other";
}

export type MediaRegistryStreamPreviewProps = {
  fileId: string;
  actor: ApiActor;
  title: string;
  fileExt?: string | null;
  assetMediaType?: string | null;
  logoUrl?: string | null;
  /** 封面图片流式加载：传入 coverFileId 时将图片走同源代理（/api/media/registry-stream），避免内网 MinIO URL 浏览器不可达 */
  coverFileId?: string | null;
  className?: string;
};

/**
 * 媒体库统一预览：同源 `registry-stream` 换预签名；视频用 `hover-play` 避免 `<img>` 拉 MP4 裂图。
 * 封面图片优先走同源代理（通过 `coverFileId` 指向封面子行），确保浏览器可加载。
 */
export function MediaRegistryStreamPreview({
  fileId,
  actor,
  title,
  fileExt,
  assetMediaType,
  logoUrl,
  coverFileId,
  className,
}: MediaRegistryStreamPreviewProps) {
  const streamUrl = React.useMemo(() => mediaRegistryStreamUrl(fileId, "view", actor), [fileId, actor]);
  const previewKind = resolveRegistryStreamPreviewKind({ assetMediaType, fileExt, title });

  // 封面图片地址：优先 coverFileId 走同源代理，兜底 logoUrl
  const posterUrl = React.useMemo(() => {
    if (coverFileId?.trim()) {
      return mediaRegistryStreamUrl(coverFileId.trim(), "view", actor);
    }
    const rawLogo = logoUrl?.trim();
    if (rawLogo) return materialStorageBrowserHref(rawLogo);
    return "";
  }, [coverFileId, actor, logoUrl]);

  if (previewKind === "video") {
    return (
      <MediaPreview
        kind="video"
        src={streamUrl}
        variant="hover-play"
        posterSrc={posterUrl || undefined}
        alt={title}
        className={cn("size-full min-h-0", className)}
        previewMaxSeconds={5}
        inViewRootMargin="100px"
        inViewThreshold={0.08}
      />
    );
  }

  if (previewKind === "image") {
    // 图片走同源代理流式直出；有 coverFileId 时也走代理
    const imageSrc = posterUrl || streamUrl;
    return (
      <MediaPreview
        kind="image"
        src={imageSrc}
        alt={title}
        className={cn("size-full object-cover", className)}
        imageLoading="lazy"
      />
    );
  }

  return (
    <div
      className={cn("flex size-full items-center justify-center bg-muted/40 px-2 text-center text-[11px] text-muted-foreground", className)}
      title={title}
    >
      不可预览
    </div>
  );
}
