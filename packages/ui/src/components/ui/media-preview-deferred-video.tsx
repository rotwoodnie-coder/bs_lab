"use client";

import * as React from "react";

import { cn } from "../../lib/utils";
import { useInViewElement } from "./media-preview-hover.hooks";

export type MediaPreviewDeferredVideoProps = {
  videoSrc: string;
  className?: string;
  alt?: string;
  videoRef?: React.Ref<HTMLVideoElement>;
  videoProps?: React.VideoHTMLAttributes<HTMLVideoElement>;
  inViewRootMargin?: string;
  inViewThreshold?: number;
};

export function MediaPreviewDeferredVideo(props: MediaPreviewDeferredVideoProps) {
  const {
    videoSrc,
    className,
    alt,
    videoRef,
    videoProps,
    inViewRootMargin = "120px",
    inViewThreshold = 0.1,
  } = props;
  const [el, setEl] = React.useState<HTMLDivElement | null>(null);
  const inView = useInViewElement(el, inViewRootMargin, inViewThreshold);

  return (
    <div ref={setEl} className="size-full min-h-[1px]">
      {inView ? (
        <video
          ref={videoRef}
          src={videoSrc}
          {...videoProps}
          controls={videoProps?.controls !== false}
          className={cn("size-full bg-background object-contain", className)}
          aria-label={alt ?? "视频预览"}
        />
      ) : (
        <div className={cn("size-full bg-muted/30", className)} aria-hidden />
      )}
    </div>
  );
}
