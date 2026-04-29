"use client";

import * as React from "react";
import { Badge, Button, MediaPreview, Progress } from "@bs-lab/ui";
import type { CurriculumRowVideo } from "@/lib/curriculum-row-videos-api";
import type { VideoMeta } from "./video-meta-store";

type Props = {
  videos: CurriculumRowVideo[];
  saving: boolean;
  busyIds: Record<string, boolean>;
  objectUrls: Record<string, string>;
  defaultVideoId?: string;
  metaByVideoId: Record<string, VideoMeta | null | undefined>;
  onDefaultVideoChange?: (videoId: string | null) => void;
  onRemoveVideo: (videoId: string) => Promise<void>;
  onPatchVideoKeywords: (videoId: string, keywords: string[]) => void;
};

function toDisplayName(title: string): string {
  const raw = title.trim();
  if (!raw) return "未命名视频";
  const normalized = raw.split(/[\\/]/g).at(-1)?.trim();
  return normalized || raw;
}

function resolvePreviewUrl(video: CurriculumRowVideo, objectUrls: Record<string, string>): string {
  return objectUrls[video.id] ?? "";
}

function inferTitleTag(title: string): string | null {
  const t = title.trim();
  if (!t) return null;
  if (t.includes("纠错") || t.includes("错误")) return "错误纠正";
  if (t.includes("安全")) return "安全规范";
  if (t.includes("特写") || t.includes("细节")) return "特写";
  if (t.includes("讲解") || t.includes("解说")) return "讲解";
  return "";
}

function buildTagCloud(meta: VideoMeta | null | undefined, title: string): string[] {
  const tags = new Set<string>();
  const titleTag = inferTitleTag(title);
  if (titleTag) tags.add(titleTag);
  if (meta?.hard?.subjectLabel) tags.add(meta.hard.subjectLabel);
  for (const grade of meta?.hard?.gradeLabels ?? []) tags.add(grade);
  if (meta?.content?.action) tags.add(meta.content.action);
  for (const keyword of meta?.content?.keywords ?? []) tags.add(keyword);
  return Array.from(tags).slice(0, 14);
}

function rowProgress(saving: boolean, isBusy: boolean): number {
  if (isBusy) return 72;
  if (saving) return 46;
  return 100;
}

export function VideoManagerBoundWorkbench(props: Props) {
  const [selectedVideoId, setSelectedVideoId] = React.useState<string | null>(props.videos[0]?.id ?? null);

  React.useEffect(() => {
    if (props.videos.length === 0) {
      setSelectedVideoId(null);
      return;
    }
    if (!selectedVideoId || !props.videos.some((v) => v.id === selectedVideoId)) {
      setSelectedVideoId(props.videos[0]!.id);
    }
  }, [props.videos, selectedVideoId]);

  const selectedVideo = React.useMemo(
    () => props.videos.find((video) => video.id === selectedVideoId) ?? null,
    [props.videos, selectedVideoId],
  );
  const selectedMeta = selectedVideo ? props.metaByVideoId[selectedVideo.id] ?? null : null;
  const tagCloud = buildTagCloud(selectedMeta, selectedVideo?.title ?? "");
  const selectedPreviewUrl = selectedVideo ? resolvePreviewUrl(selectedVideo, props.objectUrls) : "";
  const selectedKeywords = selectedMeta?.content?.keywords ?? [];

  const toggleTag = React.useCallback(
    (tag: string) => {
      if (!selectedVideo) return;
      const exists = selectedKeywords.includes(tag);
      const next = exists ? selectedKeywords.filter((item) => item !== tag) : [...selectedKeywords, tag].slice(0, 8);
      props.onPatchVideoKeywords(selectedVideo.id, next);
    },
    [props, selectedKeywords, selectedVideo],
  );

  return (
    <div className="grid max-h-[76vh] gap-3 overflow-hidden">
      <div className="sticky top-0 z-10 space-y-2 rounded-xl border border-border bg-background/95 p-3 backdrop-blur">
        <div className="overflow-hidden rounded-lg border border-border bg-muted/20">
          <div className="aspect-video">
            {!selectedVideo ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">请选择视频进行预览</div>
            ) : selectedPreviewUrl ? (
              <div key={selectedVideo.id} className="size-full">
                <MediaPreview
                  kind="video"
                  variant="default"
                  src={selectedPreviewUrl}
                  className="size-full object-cover"
                  alt={selectedVideo.title || "视频预览"}
                  videoProps={{ controls: true, playsInline: true, preload: "metadata" }}
                />
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">视频加载中...</div>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {tagCloud.length === 0 ? (
            <span className="text-xs text-muted-foreground">AI 正在处理标签，稍后自动展示</span>
          ) : (
            tagCloud.map((tag) => {
              const active = selectedKeywords.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  className={`rounded-full border px-2.5 py-1 text-xs transition ${
                    active ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className="grid gap-2 overflow-y-auto pr-1">
        {props.videos.length === 0 ? (
          <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">暂无已绑定视频</div>
        ) : (
          props.videos.map((video) => {
            const isDefault = props.defaultVideoId === video.id;
            const isBusy = !!props.busyIds[video.id];
            const active = selectedVideoId === video.id;
            const progress = rowProgress(props.saving, isBusy);
            return (
              <div
                key={video.id}
                className={`rounded-lg border p-3 transition ${active ? "border-primary bg-primary/5" : "border-border"}`}
              >
                <button type="button" className="grid w-full gap-2 text-left" onClick={() => setSelectedVideoId(video.id)}>
                  <div className="truncate text-sm font-medium">{toDisplayName(video.title)}</div>
                  <div className="text-xs text-muted-foreground">上传者：{video.createdByName || "未知用户"}</div>
                  <Progress value={progress} className="h-1.5" />
                </button>
                <div className="mt-2 flex flex-wrap justify-end gap-2">
                  <Button
                    type="button"
                    variant={isDefault ? "default" : "outline"}
                    size="sm"
                    onClick={() => props.onDefaultVideoChange?.(isDefault ? null : video.id)}
                  >
                    {isDefault ? "默认中" : "设为默认"}
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    disabled={isBusy}
                    onClick={() => void props.onRemoveVideo(video.id)}
                  >
                    删除
                  </Button>
                </div>
                {active && tagCloud.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {tagCloud.slice(0, 4).map((tag) => (
                      <Badge key={tag} variant={selectedKeywords.includes(tag) ? "secondary" : "outline"} className="font-normal">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

