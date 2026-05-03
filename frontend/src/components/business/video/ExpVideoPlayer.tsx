"use client";

import * as React from "react";
import { Play } from "@bs-lab/ui/icons";
import { resolveMediaDisplaySrc } from "@bs-lab/ui";

import { StorageImg } from "@/components/media/StorageImg";
import { cn } from "@/lib/utils";

import { useStandardVideoExpPlayer } from "./ExpVideoPlayer.hooks";
import type { StandardVideoExpPlayerProps } from "./exp-video-player.types";

export type { PosterPersistConfig, RasterPosterCaptureMode, StandardVideoExpPlayerProps } from "./exp-video-player.types";

/**
 * 点击播放的视频卡片：用户点击后加载 <video> 并开始播放。
 * - 播放时封面保持可见作为背景，<video> 以半透明叠层方式覆盖
 * - 同一页面只有一个视频可处于 active 状态（全局互斥）
 * - 有播放指示器（右上角脉冲红点）
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
    >
      {/* 封面层：始终渲染，active 时半透明 */}
      {vm.imgSrc && !vm.posterFailed && vm.posterInView ? (
        <div
          className={cn(
            "pointer-events-none absolute inset-0 z-0 transition-opacity duration-300",
            vm.isActive ? "opacity-40" : "opacity-100",
          )}
        >
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
        <div className="absolute inset-0 z-0 animate-skeleton-shimmer" aria-hidden>
          {vm.capturePhase === "pending" ? (
            <div className="absolute inset-0 flex items-center justify-center text-[10px] text-muted-foreground">
              封面生成中…
            </div>
          ) : null}
        </div>
      ) : null}

      {/* 播放指示器：active 时在右上角显示脉冲红点 */}
      {vm.isActive ? (
        <div className="pointer-events-none absolute right-2 top-2 z-10 flex items-center gap-1.5 rounded-full bg-black/50 px-2 py-0.5">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-500 opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-red-500" />
          </span>
          <span className="text-[10px] font-medium text-white/90">播放中</span>
        </div>
      ) : null}

      {/* poster 态的播放按钮 */}
      {vm.status === "poster" ? (
        <>
          {!vm.isActive ? (
            <div className="pointer-events-none absolute inset-0 z-[1] flex items-center justify-center">
              <div className="grid size-14 place-items-center rounded-full bg-black/45 text-white shadow-lg ring-1 ring-white/20 backdrop-blur-[2px]">
                <Play className="size-7 fill-current opacity-95" aria-hidden />
              </div>
            </div>
          ) : null}
          <button
            type="button"
            className="absolute inset-0 z-[2] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={`播放：${vm.title}`}
            onClick={(e) => {
              e.stopPropagation();
              vm.goActive();
            }}
          />
        </>
      ) : null}

      {/* 视频层：active 时才挂载，半透明叠加在封面上 */}
      {vm.mountVideo ? (
        // eslint-disable-next-line jsx-a11y/media-has-caption -- 列表预览；由 aria-label 描述
        <video
          key={vm.videoKey}
          ref={vm.videoRef}
          className="absolute inset-0 z-[5] h-full w-full object-cover opacity-70 transition-opacity duration-300"
          src={vm.trimmedSrc}
          poster={displayPosterSrc}
          playsInline
          preload="metadata"
          muted={false}
          autoPlay
          controls
          aria-label={vm.title}
        />
      ) : null}
    </div>
  );
}

export { StandardVideoExpPlayer as ExpVideoPlayer };
