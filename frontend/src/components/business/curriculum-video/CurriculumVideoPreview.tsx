"use client";

import * as React from "react";
import { Button } from "@bs-lab/ui";
import { Upload } from "@bs-lab/ui/icons";
import type { ApiActor } from "@/lib/new-core-api";
import { useCurriculumVideo } from "@/hooks/useCurriculumVideo";
import type { CurriculumRowVideo } from "@/lib/curriculum-row-videos-api";
import { MissingMediaPanel } from "@/components/business/media/MissingMediaPanel";
import { mediaRegistryStreamUrl, parseMediaPlatformRegistryRef } from "@/lib/media-platform/registry-ref";
import { MediaPreviewCard } from "@/components/business/media/MediaPreviewCard";
import { MediaUploadPreviewCard } from "@/components/business/media/MediaUploadPreviewCard";
import { VideoCarousel } from "./VideoCarousel";

type Props = {
  actor: ApiActor;
  rowId: string;
  defaultVideoId?: string;
  className?: string;
  onManage?: () => void;
  onRequestDelete?: (video: CurriculumRowVideo) => void;
  variant?: "default" | "waterfall";
};

function orderByDefault(videos: CurriculumRowVideo[], defaultVideoId?: string) {
  if (!defaultVideoId) return videos;
  const index = videos.findIndex((video) => video.id === defaultVideoId);
  if (index <= 0) return videos;
  const target = videos[index]!;
  return [target, ...videos.slice(0, index), ...videos.slice(index + 1)];
}

export function CurriculumVideoPreview({
  actor,
  rowId,
  defaultVideoId,
  className,
  onManage,
  onRequestDelete,
  variant = "default",
}: Props) {
  const { videos, loading, objectUrls } = useCurriculumVideo(actor, rowId);

  const playableVideos = React.useMemo(() => {
    const mapped = videos.map((video) => {
      const cached = objectUrls[video.id];
      if (cached) return { ...video, sourceUrl: cached };
      const regId = parseMediaPlatformRegistryRef(video.sourceUrl);
      if (regId) return { ...video, sourceUrl: mediaRegistryStreamUrl(regId, "view", actor) };
      return video;
    });
    return orderByDefault(mapped, defaultVideoId);
  }, [actor, defaultVideoId, objectUrls, videos]);
  const activeVideo = playableVideos[0] ?? null;
  const activeRegistryId = activeVideo ? parseMediaPlatformRegistryRef(activeVideo.sourceUrl) : null;

  if (loading) {
    return (
      <div className={`relative aspect-video w-full overflow-hidden rounded-md border border-border bg-muted/10 ${className ?? ""}`}>
        <div className="flex size-full items-center justify-center text-sm text-muted-foreground">加载视频...</div>
      </div>
    );
  }

  if (variant === "waterfall") {
    if (!activeVideo) {
      return (
        <div className={`relative aspect-video w-full overflow-hidden rounded-md border border-dashed border-border bg-muted/10 ${className ?? ""}`}>
          <button
            type="button"
            disabled={!onManage}
            className="flex size-full flex-col items-center justify-center gap-1 text-muted-foreground disabled:cursor-not-allowed"
            onClick={onManage}
          >
            <span className="grid size-10 place-items-center rounded-full bg-muted text-muted-foreground">
              <Upload className="size-4" />
            </span>
            <span className="text-sm font-medium text-foreground">暂无视频</span>
            <span className="text-xs">点击上传视频或从视频库选择</span>
          </button>
          {onManage ? (
            <div className="absolute inset-x-2 bottom-2 z-10 flex items-center justify-center gap-1.5">
              <Button type="button" size="sm" variant="outline" className="h-6 px-2 text-[11px]" onClick={onManage}>
                上传视频
              </Button>
              <Button type="button" size="sm" variant="secondary" className="h-6 px-2 text-[11px]" onClick={onManage}>
                选择库里视频
              </Button>
            </div>
          ) : null}
        </div>
      );
    }

    const previewUrl = activeVideo.sourceUrl;

    return (
      <MediaPreviewCard
        actor={actor}
        fileId={activeRegistryId}
        src={previewUrl}
        title={activeVideo.title}
        className={className}
        showManageButton={Boolean(onManage)}
        onManage={onManage}
      />
    );
  }

  if (videos.length === 0) {
    return (
      <MissingMediaPanel
        kind="video"
        disabled={!onManage}
        title="暂无视频"
        description={onManage ? "点击上传或绑定视频" : "暂无视频"}
        className={className}
        onOpenManager={() => onManage?.()}
      />
    );
  }

  return (
    <div className="relative">
      <VideoCarousel videos={playableVideos} className={className} onRequestDelete={onRequestDelete} />
      {onManage ? (
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
