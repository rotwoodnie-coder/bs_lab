"use client";

import { Play } from "@bs-lab/ui/icons";
import { resolveMediaDisplaySrc } from "@bs-lab/ui";

import { StorageImg } from "@/components/media/StorageImg";
import { cn } from "@/lib/utils";

import { useStandardVideoExpPlayer } from "./ExpVideoPlayer.hooks";
import type { StandardVideoExpPlayerProps } from "./exp-video-player.types";

export type { PosterPersistConfig, RasterPosterCaptureMode, StandardVideoExpPlayerProps } from "./exp-video-player.types";

/**
 * 省流列表视频：有封面时 `<img>` 常驻底层，preview/active 上叠 `<video>`；无封面时仍仅在 poster 态占位。
 * 避免移出 hover 后卸载再挂载封面 + lazy 解码前透黑底。
 */
export function StandardVideoExpPlayer(props: StandardVideoExpPlayerProps) {
  const vm = useStandardVideoExpPlayer(props);
  if (!vm.trimmedSrc) return null;

  const displayPosterSrc =
    vm.imgSrc && !vm.posterFailed ? resolveMediaDisplaySrc(vm.imgSrc).trim() || undefined : undefined;

  return (
    <div
      ref={vm.rootRef}
      className={cn("relative isolate w-full overflow-hidden bg-black", vm.className)}
      style={{ aspectRatio: vm.ratio }}
      onMouseEnter={vm.onMouseEnter}
      onMouseLeave={vm.onMouseLeave}
    >
      {vm.imgSrc && !vm.posterFailed ? (
        <div className="pointer-events-none absolute inset-0 z-0">
          <StorageImg
            src={vm.imgSrc}
            alt=""
            className="h-full w-full object-cover"
            loading="eager"
            decoding="async"
            draggable={false}
            onError={() => vm.setPosterFailed(true)}
          />
        </div>
      ) : vm.status === "poster" ? (
        <div className="absolute inset-0 z-0 bg-muted" aria-hidden>
          {vm.capturePhase === "pending" ? (
            <div className="absolute inset-0 flex items-center justify-center text-[10px] text-muted-foreground">
              封面生成中…
            </div>
          ) : null}
        </div>
      ) : null}

      {vm.status === "poster" ? (
        <>
          <div className="pointer-events-none absolute inset-0 z-[1] flex items-center justify-center">
            <div className="grid size-14 place-items-center rounded-full bg-black/45 text-white shadow-lg ring-1 ring-white/20 backdrop-blur-[2px]">
              <Play className="size-7 fill-current opacity-95" aria-hidden />
            </div>
          </div>
          <button
            type="button"
            className="absolute inset-0 z-[2] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={`播放：${vm.title}`}
            onClick={vm.goActive}
          />
        </>
      ) : null}

      {vm.mountVideo ? (
        // eslint-disable-next-line jsx-a11y/media-has-caption -- 列表预览；由 aria-label 描述
        <video
          key={vm.videoKey}
          ref={vm.videoRef}
          className="absolute inset-0 z-[5] h-full w-full object-cover"
          src={vm.trimmedSrc}
          poster={displayPosterSrc}
          playsInline
          preload="metadata"
          muted={vm.isPreview}
          autoPlay={vm.isPreview || vm.isActive}
          loop={vm.isPreview}
          controls={vm.isActive}
          aria-label={vm.title}
          onClick={vm.isPreview ? () => vm.goActive() : undefined}
        />
      ) : null}
    </div>
  );
}

export { StandardVideoExpPlayer as ExpVideoPlayer };
