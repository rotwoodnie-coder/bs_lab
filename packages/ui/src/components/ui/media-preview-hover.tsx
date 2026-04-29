"use client";

import * as React from "react";
import { Video } from "lucide-react";

import { cn } from "../../lib/utils";
import {
  releaseHoverVideoPlayLock,
  takeHoverVideoPlayLock,
  useInViewElement,
  useMobileStaticPoster,
  usePrefersReducedMotion,
} from "./media-preview-hover.hooks";

const DEFAULT_PREVIEW_SECONDS = 5;

export type MediaPreviewHoverPlayProps = {
  videoSrc: string;
  /** 静态封面图 URL；与 posterNode 二选一或同时存在时 posterNode 优先作为外层容器内容 */
  posterSrc?: string;
  /** 自定义静态层（如第三方平台占位模板） */
  posterNode?: React.ReactNode;
  className?: string;
  alt?: string;
  /** 移动端点击静态封面（进入详情等） */
  onPosterClick?: () => void;
  videoRef?: React.Ref<HTMLVideoElement>;
  /** 悬停预览最大时长（秒） */
  previewMaxSeconds?: number;
  /** IntersectionObserver rootMargin，默认 120px */
  inViewRootMargin?: string;
  /** 进入视口判定比例，列表建议 0.1 减少边缘抖动 */
  inViewThreshold?: number;
};

function mergeRefs<T>(...refs: Array<React.Ref<T> | undefined>): React.RefCallback<T> {
  return (node) => {
    for (const r of refs) {
      if (typeof r === "function") r(node);
      else if (r && typeof r === "object" && "current" in r) {
        (r as React.MutableRefObject<T | null>).current = node;
      }
    }
  };
}

function FallbackPoster({ alt }: { alt?: string }) {
  return (
    <div
      className="flex size-full flex-col items-center justify-center gap-2 bg-muted/40 text-muted-foreground"
      aria-label={alt ?? "视频封面"}
    >
      <div className="flex size-12 items-center justify-center rounded-full border border-border bg-background/80">
        <Video className="size-6" aria-hidden />
      </div>
    </div>
  );
}

export function MediaPreviewHoverPlay(props: MediaPreviewHoverPlayProps) {
  const {
    videoSrc,
    posterSrc,
    posterNode,
    className,
    alt,
    onPosterClick,
    videoRef: videoRefProp,
    previewMaxSeconds = DEFAULT_PREVIEW_SECONDS,
    inViewRootMargin = "120px",
    inViewThreshold = 0.1,
  } = props;

  const [obsEl, setObsEl] = React.useState<HTMLDivElement | null>(null);
  const setContainerRef = React.useCallback((node: HTMLDivElement | null) => {
    setObsEl(node);
  }, []);
  const inView = useInViewElement(obsEl, inViewRootMargin, inViewThreshold);
  const mobileStatic = useMobileStaticPoster();
  const reducedMotion = usePrefersReducedMotion();

  const [showVideo, setShowVideo] = React.useState(false);
  const [loadError, setLoadError] = React.useState(false);

  const cleanupRef = React.useRef<() => void>(() => {});
  cleanupRef.current = () => {
    setShowVideo(false);
  };

  const boundCleanup = React.useCallback(() => cleanupRef.current(), []);

  React.useEffect(() => {
    if (!inView) boundCleanup();
  }, [inView, boundCleanup]);

  React.useEffect(
    () => () => {
      boundCleanup();
      releaseHoverVideoPlayLock(boundCleanup);
    },
    [boundCleanup],
  );

  const maxSec = Number.isFinite(previewMaxSeconds) && previewMaxSeconds > 0 ? previewMaxSeconds : DEFAULT_PREVIEW_SECONDS;

  const onPointerEnter = React.useCallback(() => {
    if (mobileStatic || reducedMotion || !inView || !videoSrc.trim()) return;
    setLoadError(false);
    takeHoverVideoPlayLock(boundCleanup);
    setShowVideo(true);
  }, [mobileStatic, reducedMotion, inView, videoSrc, boundCleanup]);

  const onPointerLeave = React.useCallback(() => {
    releaseHoverVideoPlayLock(boundCleanup);
    boundCleanup();
  }, [boundCleanup]);

  const onTimeUpdate = React.useCallback(
    (e: React.SyntheticEvent<HTMLVideoElement>) => {
      const v = e.currentTarget;
      if (v.currentTime >= maxSec) {
        v.pause();
        try {
          v.currentTime = 0;
        } catch {
          /* ignore */
        }
      }
    },
    [maxSec],
  );

  const onVideoError = React.useCallback(() => {
    setLoadError(true);
    boundCleanup();
    releaseHoverVideoPlayLock(boundCleanup);
  }, [boundCleanup]);

  const innerVideoRef = React.useRef<HTMLVideoElement | null>(null);
  const setVideoRefs = React.useMemo(
    () => mergeRefs(innerVideoRef, videoRefProp),
    [videoRefProp],
  );

  React.useEffect(() => {
    const node = innerVideoRef.current;
    if (!showVideo || !node) return;
    void node.play().catch(() => {
      setLoadError(true);
      boundCleanup();
    });
  }, [showVideo, videoSrc, boundCleanup]);

  const staticLayer = posterNode ?? (
    <>
      {posterSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={posterSrc} alt={alt ?? ""} className="size-full object-cover" loading="lazy" decoding="async" />
      ) : (
        <FallbackPoster alt={alt} />
      )}
    </>
  );

  const shellClass = cn("relative size-full overflow-hidden bg-muted/30", className);

  const videoLayer =
    showVideo && !loadError && !mobileStatic && !reducedMotion ? (
      <video
        ref={setVideoRefs}
        src={videoSrc}
        className="absolute inset-0 z-[1] size-full bg-background object-cover"
        muted
        playsInline
        preload="metadata"
        controls={false}
        autoPlay
        aria-label={alt ?? "视频预览"}
        onTimeUpdate={onTimeUpdate}
        onError={onVideoError}
      />
    ) : null;

  if (mobileStatic) {
    return (
      <div ref={setContainerRef} className={shellClass}>
        {onPosterClick ? (
          <button
            type="button"
            className="flex size-full cursor-pointer flex-col border-0 bg-transparent p-0 text-left"
            onClick={onPosterClick}
            aria-label={alt ? `${alt}，进入详情` : "进入详情"}
          >
            {staticLayer}
          </button>
        ) : (
          staticLayer
        )}
      </div>
    );
  }

  return (
    <div
      ref={setContainerRef}
      className={shellClass}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
    >
      <div className="relative size-full">{staticLayer}</div>
      {videoLayer}
    </div>
  );
}
