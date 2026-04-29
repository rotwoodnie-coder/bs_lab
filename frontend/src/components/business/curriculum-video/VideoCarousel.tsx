"use client";

import * as React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  MediaPreview,
} from "@bs-lab/ui";
import { ChevronLeft, ChevronRight, X } from "@bs-lab/ui/icons";
import { useVideoPagination } from "@/hooks/useCurriculumVideo";
import type { CurriculumRowVideo as Video } from "@/lib/curriculum-row-videos-api";
import { mediaRegistryStreamUrl, parseMediaPlatformRegistryRef } from "@/lib/media-platform/registry-ref";

type VideoCarouselProps = {
  videos: Video[];
  className?: string;
  onRequestDelete?: (video: Video) => void;
};

function renderVideo(video: Video) {
  if (video.sourceUrl.startsWith("local-media://") || parseMediaPlatformRegistryRef(video.sourceUrl)) {
    const registryId = parseMediaPlatformRegistryRef(video.sourceUrl);
    const previewUrl = registryId ? mediaRegistryStreamUrl(registryId, "view") : null;
    return previewUrl ? (
      <MediaPreview
        kind="video"
        variant="default"
        src={previewUrl}
        className="size-full object-contain"
        alt={video.title || "视频"}
        videoProps={{ controls: true, preload: "metadata" }}
      />
    ) : (
      <div className="flex size-full items-center justify-center text-sm text-muted-foreground">视频地址解析中</div>
    );
  }

  return (
    <MediaPreview
      kind="video"
      variant="default"
      src={video.sourceUrl}
      className="size-full object-contain"
      alt={video.title || "视频"}
      videoProps={{ controls: true, preload: "metadata" }}
    />
  );
}

export function VideoCarousel({ videos, className, onRequestDelete }: VideoCarouselProps) {
  const total = videos.length;
  const { currentIndex, next, prev, goTo } = useVideoPagination(total);
  const canSwitch = total > 1;
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const activeVideo = videos[currentIndex] ?? null;

  if (total === 0) {
    return (
      <div className={`relative aspect-video w-full overflow-hidden rounded-md border border-border bg-muted/10 ${className ?? ""}`}>
        <div className="flex size-full items-center justify-center text-sm text-muted-foreground">暂无视频</div>
      </div>
    );
  }

  return (
    <div className={`group relative aspect-video w-full overflow-hidden rounded-md border border-border bg-muted/10 ${className ?? ""}`}>
      <span className="sr-only" aria-live="polite">
        当前视频：{activeVideo?.title || "未命名视频"}
      </span>
      <div className="h-full w-full transition-transform duration-500 ease-out" style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
        <div className="flex h-full w-full">
          {videos.map((video) => (
            <div key={video.id} className="h-full w-full shrink-0">
              {renderVideo(video)}
            </div>
          ))}
        </div>
      </div>

      <div className="absolute right-2 top-2">
        <div className="flex items-center gap-2">
          {onRequestDelete && activeVideo ? (
            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
              <button
                type="button"
                onClick={() => setDeleteOpen(true)}
                aria-label="删除当前视频"
                className="pointer-events-auto inline-flex size-7 items-center justify-center rounded-md bg-black/20 text-white opacity-0 transition hover:bg-black/50 group-hover:opacity-100"
              >
                <X className="size-4" />
              </button>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>确认删除视频？</AlertDialogTitle>
                  <AlertDialogDescription>删除后将从当前条目中移除该视频。</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>取消</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      setDeleteOpen(false);
                      onRequestDelete(activeVideo);
                    }}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    删除
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : null}
        </div>
      </div>

      {canSwitch ? (
        <>
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="absolute left-2 top-1/2 size-8 -translate-y-1/2 rounded-full shadow-sm"
            onClick={prev}
            aria-label="上一个视频"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="absolute right-2 top-1/2 size-8 -translate-y-1/2 rounded-full shadow-sm"
            onClick={next}
            aria-label="下一个视频"
          >
            <ChevronRight className="size-4" />
          </Button>
          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-background/75 px-2 py-1 backdrop-blur-sm">
            {videos.map((video, index) => (
              <button
                key={video.id}
                type="button"
                onClick={() => goTo(index)}
                aria-label={`切换到第 ${index + 1} 个视频`}
                aria-current={index === currentIndex}
                className={`h-1.5 w-1.5 rounded-full transition-all ${index === currentIndex ? "bg-foreground" : "bg-muted-foreground/40 hover:bg-muted-foreground/70"}`}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

export type { Video };
