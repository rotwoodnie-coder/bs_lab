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
  className?: string;
};

/**
 * 媒体库统一预览：同源 `registry-stream` 换预签名；视频用 `hover-play` 避免 `<img>` 拉 MP4 裂图；可选 `logo_url` 作封面。
 */
export function MediaRegistryStreamPreview({
  fileId,
  actor,
  title,
  fileExt,
  assetMediaType,
  logoUrl,
  className,
}: MediaRegistryStreamPreviewProps) {
  const streamUrl = React.useMemo(() => mediaRegistryStreamUrl(fileId, "view", actor), [fileId, actor]);
  const previewKind = resolveRegistryStreamPreviewKind({ assetMediaType, fileExt, title });

  const rawLogo = logoUrl?.trim();
  const poster = rawLogo ? materialStorageBrowserHref(rawLogo) : mediaRegistryStreamUrl(fileId, "view", actor, { variant: "thumb_sm" });
  const posterIsLikelyRaster =
    poster.length > 0 &&
    !/\.(mp4|webm|mov|m4v|avi)(\?|#|$)/i.test(poster) &&
    (/\.(png|jpe?g|gif|webp|bmp)(\?|#|$)/i.test(poster) || poster.startsWith("data:image") || poster.includes("variant=thumb_sm"));

  if (previewKind === "video") {
    return (
      <MediaPreview
        kind="video"
        src={streamUrl}
        variant="hover-play"
        posterSrc={posterIsLikelyRaster ? poster : undefined}
        alt={title}
        className={cn("size-full min-h-0", className)}
        previewMaxSeconds={5}
        inViewRootMargin="100px"
        inViewThreshold={0.08}
      />
    );
  }

  if (previewKind === "image") {
    // 有 logoUrl 时用 materialStorageBrowserHref 转为 Nginx 直连路径（绕过 /api/media/registry-stream）
    const imageSrc = rawLogo ? materialStorageBrowserHref(rawLogo) : streamUrl;
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
