"use client";

import * as React from "react";
import { Button, MediaPreview } from "@bs-lab/ui";
import { Pause, Play } from "@bs-lab/ui/icons";
import type { ApiActor } from "@/lib/new-core-api";
import { useMediaPreview } from "@/lib/media/gms/use-media-preview";

export type MediaPreviewCardProps = {
  actor: ApiActor;
  fileId?: string | null;
  src: string;
  title?: string;
  className?: string;
  showManageButton?: boolean;
  onManage?: () => void;
};

export function MediaPreviewCard({ actor, fileId, src, title, className, showManageButton, onManage }: MediaPreviewCardProps) {
  const { thumbnailUrl, state } = useMediaPreview(actor, fileId, true);
  const [inlinePlaying, setInlinePlaying] = React.useState(false);
  const [hovering, setHovering] = React.useState(false);
  const [paused, setPaused] = React.useState(false);
  const inlineVideoRef = React.useRef<HTMLVideoElement | null>(null);

  React.useEffect(() => {
    setInlinePlaying(false);
    setHovering(false);
    setPaused(false);
  }, [src]);

  const previewUrl = thumbnailUrl || src;

  return (
    <div
      className={`group relative aspect-video w-full overflow-hidden rounded-md border border-border bg-muted/10 ${className ?? ""}`}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      {inlinePlaying ? (
        <div className="absolute inset-0">
          <MediaPreview
            kind="video"
            variant="default"
            src={src}
            className="size-full object-contain"
            videoRef={(node) => {
              inlineVideoRef.current = node;
            }}
            videoProps={{
              autoPlay: true,
              muted: true,
              playsInline: true,
              onPlay: () => setPaused(false),
              onPause: () => setPaused(true),
            }}
          />
          {hovering ? (
            <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center">
              <button
                type="button"
                aria-label={paused ? "继续播放" : "暂停播放"}
                className="pointer-events-auto grid size-14 place-items-center rounded-full bg-black/55 text-white/90 shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-sm ring-1 ring-white/15"
                onClick={(event) => {
                  event.stopPropagation();
                  const node = inlineVideoRef.current;
                  if (!node) return;
                  if (node.paused) {
                    void node.play();
                  } else {
                    node.pause();
                  }
                }}
              >
                {paused ? <Play className="size-7 fill-current opacity-95" /> : <Pause className="size-7 opacity-95" />}
              </button>
            </div>
          ) : null}
        </div>
      ) : (
        <MediaPreview
          kind="video"
          src={previewUrl}
          onPosterClick={() => setInlinePlaying(true)}
          className="absolute inset-0 h-full w-full rounded-none border-0"
          alt={title || "视频封面"}
          previewMaxSeconds={5}
        />
      )}

      {state === "checking" ? (
        <div className="pointer-events-none absolute left-2 top-2 rounded-full bg-black/50 px-2 py-1 text-[10px] text-white backdrop-blur-sm">
          正在检查封面
        </div>
      ) : state === "scheduled" ? (
        <div className="pointer-events-none absolute left-2 top-2 rounded-full bg-black/50 px-2 py-1 text-[10px] text-white backdrop-blur-sm">
          封面生成中
        </div>
      ) : state === "failed" ? (
        <div className="pointer-events-none absolute left-2 top-2 rounded-full bg-black/50 px-2 py-1 text-[10px] text-white backdrop-blur-sm">
          封面生成失败
        </div>
      ) : null}

      {showManageButton && onManage ? (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="absolute left-2 top-2 z-10 h-6 px-2 text-[10px]"
          onClick={onManage}
        >
          管理
        </Button>
      ) : null}
    </div>
  );
}
