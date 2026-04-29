"use client";

import * as React from "react";

import { cn } from "../../lib/utils";
import { resolveMediaDisplaySrc } from "../../lib/media-display-src";
import { MediaPreviewDeferredVideo } from "./media-preview-deferred-video";
import { MediaPreviewHoverPlay } from "./media-preview-hover";

export type MediaPreviewProps = {
  kind: "image" | "video";
  src: string;
  className?: string;
  alt?: string;
  /** 图片解码或网络失败时回调（用于业务侧回退占位，避免裂图长期停留） */
  onImageError?: () => void;
  videoRef?: React.Ref<HTMLVideoElement>;
  videoProps?: React.VideoHTMLAttributes<HTMLVideoElement>;
  /**
   * 视频：`default` = 立即挂载带控件 `<video>`（表单内预览、弹层完整播放等）。
   * 未传或 `hover-play` = 懒加载悬停预览（列表/网格默认，减轻多路解码与带宽）。
   */
  variant?: "default" | "hover-play";
  /** variant=hover-play：静态封面 URL */
  posterSrc?: string;
  /** variant=hover-play：自定义静态层（优先于 posterSrc 展示） */
  posterNode?: React.ReactNode;
  /** variant=hover-play：移动端点击静态封面 */
  onPosterClick?: () => void;
  /** variant=hover-play：悬停预览时长上限（秒），默认 5 */
  previewMaxSeconds?: number;
  /** 图片 `<img loading>`，列表默认 lazy */
  imageLoading?: "lazy" | "eager";
  /** IntersectionObserver：rootMargin（列表视频延后挂载 / 悬停预览共用） */
  inViewRootMargin?: string;
  /** IntersectionObserver：threshold，列表建议 0.1 */
  inViewThreshold?: number;
  /**
   * variant=default 且 kind=video：仅在进入视口后挂载 `<video>`，用于长列表降低内存。
   */
  deferVideoMount?: boolean;
  /** 单实例覆盖全局 `setDefaultMediaDisplaySrcResolver`（如私有桶直链→同源代理） */
  resolveDisplaySrc?: (url: string) => string;
};

export function MediaPreview({
  kind,
  src,
  className,
  alt,
  onImageError,
  videoRef,
  videoProps,
  variant,
  posterSrc,
  posterNode,
  onPosterClick,
  previewMaxSeconds,
  imageLoading = "lazy",
  inViewRootMargin,
  inViewThreshold,
  deferVideoMount,
  resolveDisplaySrc: resolveDisplaySrcProp,
}: MediaPreviewProps) {
  if (!src) return null;

  const resolve = resolveDisplaySrcProp ?? resolveMediaDisplaySrc;
  const displaySrc = resolve(src);
  const displayPosterSrc = posterSrc?.trim() ? resolve(posterSrc.trim()) : undefined;

  const useHoverPlayVideo = kind === "video" && variant !== "default";

  if (useHoverPlayVideo) {
    return (
      <MediaPreviewHoverPlay
        videoSrc={displaySrc}
        posterSrc={displayPosterSrc}
        posterNode={posterNode}
        className={className}
        alt={alt}
        onPosterClick={onPosterClick}
        videoRef={videoRef}
        previewMaxSeconds={previewMaxSeconds}
        inViewRootMargin={inViewRootMargin}
        inViewThreshold={inViewThreshold}
      />
    );
  }

  if (kind === "video" && variant === "default" && deferVideoMount) {
    return (
      <MediaPreviewDeferredVideo
        videoSrc={displaySrc}
        className={className}
        alt={alt}
        videoRef={videoRef}
        videoProps={videoProps}
        inViewRootMargin={inViewRootMargin}
        inViewThreshold={inViewThreshold}
      />
    );
  }

  return kind === "image" ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={displaySrc}
      alt={alt ?? "preview"}
      className={cn(className, "size-full bg-background !object-contain")}
      loading={imageLoading}
      decoding="async"
      onError={() => onImageError?.()}
    />
  ) : (
    <video
      ref={videoRef}
      src={displaySrc}
      {...videoProps}
      controls={videoProps?.controls !== false}
      className={cn("size-full bg-background object-contain", className)}
    />
  );
}
