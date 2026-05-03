"use client";

import * as React from "react";
import { Play, Loader2 } from "@bs-lab/ui/icons";

import { cn } from "@/lib/utils";

import { useStandardVideoExpPlayer } from "./ExpVideoPlayer.hooks";
import type { StandardVideoExpPlayerProps } from "./exp-video-player.types";

export type { StandardVideoExpPlayerProps } from "./exp-video-player.types";

/**
 * 点击播放的视频卡片：
 * - poster 态：封面 + 播放按钮 + 悬浮"点击播放"提示
 * - active 加载态：封面保持 + spinner，等待 video canplay
 * - active 播放态：封面淡出（200ms），video 全屏清晰播放
 * - 停止播放后：封面 fadeIn 恢复（200ms）
 * - 全局互斥：同一页面只有一个视频可 active
 */
export function StandardVideoExpPlayer(props: StandardVideoExpPlayerProps) {
  const vm = useStandardVideoExpPlayer(props);
  if (!vm.trimmedSrc) return null;

  const showPosterCover = (!vm.isActive || !vm.videoReady);

  return (
    <div
      ref={vm.rootRef}
      className={cn("relative isolate w-full overflow-hidden bg-black", vm.className)}
      style={{ aspectRatio: vm.ratio }}
    >
      {/* ── 封面层 ── */}
      {vm.displayPoster ? (
        <div
          className={cn(
            "pointer-events-none absolute inset-0 z-0 transition-opacity duration-200",
            vm.isActive && vm.videoReady ? "opacity-0" : "opacity-100",
          )}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={vm.displayPoster}
            alt=""
            className="h-full w-full object-cover"
            loading="eager"
            decoding="async"
            draggable={false}
            onError={() => vm.setPosterFailed(true)}
          />
        </div>
      ) : null}

      {/* ── poster 态：播放按钮 ── */}
      {vm.status === "poster" ? (
        <>
          <div className="pointer-events-none absolute inset-0 z-[1] flex items-center justify-center">
            <div className="grid size-14 place-items-center rounded-full bg-black/45 text-white shadow-lg ring-1 ring-white/20 backdrop-blur-[2px] transition-transform duration-150 hover:scale-105">
              <Play className="size-7 fill-current opacity-95" aria-hidden />
            </div>
          </div>
          <button
            type="button"
            className="absolute inset-0 z-[2] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={`播放：${vm.title}`}
            onClick={(e) => { e.stopPropagation(); vm.goActive(); }}
          />
        </>
      ) : null}

      {/* ── active 加载中：spinner ── */}
      {vm.isActive && !vm.videoReady ? (
        <div className="pointer-events-none absolute inset-0 z-[3] flex items-center justify-center">
          <div className="flex items-center gap-2 rounded-full bg-black/50 px-3 py-1.5">
            <Loader2 className="size-4 animate-spin text-white/80" />
            <span className="text-xs font-medium text-white/80">加载中</span>
          </div>
        </div>
      ) : null}

      {/* ── 播放指示器 ── */}
      {vm.isActive && vm.videoReady ? (
        <div className="pointer-events-none absolute right-2 top-2 z-10 flex items-center gap-1.5 rounded-full bg-black/50 px-2 py-0.5">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-500 opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-red-500" />
          </span>
          <span className="text-[10px] font-medium text-white/90">播放中</span>
        </div>
      ) : null}

      {/* ── 视频层：active 时挂载，就绪前 hidden，就绪后 fadeIn 清晰播放 ── */}
      {vm.mountVideo ? (
        // eslint-disable-next-line jsx-a11y/media-has-caption -- 列表预览；由 aria-label 描述
        <video
          key={vm.videoKey}
          ref={vm.videoRef}
          className={cn(
            "absolute inset-0 z-[5] h-full w-full object-cover bg-black transition-opacity duration-200",
            vm.videoReady ? "opacity-100" : "opacity-0 pointer-events-none",
          )}
          src={vm.trimmedSrc}
          playsInline
          preload="auto"
          muted={false}
          autoPlay
          controls
          aria-label={vm.title}
          onCanPlay={vm.handleVideoReady}
          onLoadedMetadata={vm.handleVideoMeta}
        />
      ) : null}
    </div>
  );
}

export { StandardVideoExpPlayer as ExpVideoPlayer };
