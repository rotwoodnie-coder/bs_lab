"use client";

import * as React from "react";

import { RichMediaEditor, sonnerToast, type RichMediaEmbed, type RichMediaUploadContext } from "@bs-lab/ui";

import { MediaAssetPickerDialog } from "@/components/business/media/MediaAssetPickerDialog";
import type { ApiActor } from "@/lib/new-core-api";
import { mediaRegistryStreamUrl } from "@/lib/media-platform/registry-ref";
import { uploadMediaFileToPlatform } from "@/lib/media-platform/upload-client";

import type { V2DictGradeItem } from "@/lib/v2/v2-exp-api";

type Props = {
  mediaActor: ApiActor;
  fieldDisabled: boolean;
  mainVideoEmbeds: Array<{ id: string; kind: "video"; src: string; caption?: string }>;
  mainVideoUrl: string;
  onMainVideoChange: (embeds: Array<{ id: string; kind: "video"; src: string; caption?: string }>, url: string) => void;
  onMainVideoIdChange?: (registryId: string | null) => void;
  gradeDictOptions?: V2DictGradeItem[];
};

export function EditorMainVideoSection(props: Props) {
  const { mediaActor, fieldDisabled, mainVideoEmbeds, onMainVideoChange, onMainVideoIdChange } = props;

  const [mainVideoLibraryOpen, setMainVideoLibraryOpen] = React.useState(false);


  const mainVideoValue = React.useMemo(
    () => ({ text: "", embeds: mainVideoEmbeds }),
    [mainVideoEmbeds],
  );

  const syncMainVideoValue = React.useCallback(
    (next: { text: string; embeds: Array<{ id: string; kind: "image" | "video"; src: string; caption?: string }> }) => {
      const onlyVideo = next.embeds.filter((item): item is { id: string; kind: "video"; src: string; caption?: string } => item.kind === "video");
      if (onlyVideo.length === 0) {
        onMainVideoIdChange?.(null);
      }
      onMainVideoChange(onlyVideo, onlyVideo[0]?.src ?? "");
    },
    [onMainVideoChange, onMainVideoIdChange],
  );

  const uploadMainVideo = React.useCallback(
    async (_kind: "image" | "video", file: File, ctx?: RichMediaUploadContext) => {
      const result = await uploadMediaFileToPlatform(mediaActor, file, { kind: "video", title: file.name }, {
        ui: "silent",
        onProgress: (e) => ctx?.onProgress?.(e),
      });

      // 后端已完成内容去重（SHA-256），提示用户复用情况
      if (result.reused) {
        sonnerToast.info("视频已存在", {
          description: "该视频已在媒体库中，已复用已有文件。",
        });
      }

      onMainVideoIdChange?.(result.registryId);

      return { src: result.viewUrl };
    },
    [mediaActor, onMainVideoIdChange],
  );

  const pickMainVideoFromLibrary = React.useCallback(
    async (registryId: string) => {
      const src = mediaRegistryStreamUrl(registryId, "view", mediaActor);
      const caption = `登记 ${registryId.slice(0, 8)}`;
      const next = [
        ...mainVideoEmbeds,
        {
          id: `video-lib-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          kind: "video" as const,
          src,
          caption,
        },
      ];
      // 先同步完成所有状态更新，确保视频立即出现在编辑器中
      onMainVideoChange(next, next[0]?.src ?? "");
      onMainVideoIdChange?.(registryId);
      setMainVideoLibraryOpen(false);

    },
    [mediaActor, mainVideoEmbeds, onMainVideoChange, onMainVideoIdChange],
  );

  return (
    <div className="rounded-2xl border border-border bg-muted/20 p-3 lg:col-span-12">
      <div className="grid gap-2">
        <RichMediaEditor
          value={mainVideoValue}
          onChange={syncMainVideoValue}
          disabled={fieldDisabled}
          title="实验视频"
          toolbarVariant="icon"
          enabledKinds={["video"]}
          showTextEditor={false}
          onUploadMedia={uploadMainVideo}
          onOpenLibrary={() => setMainVideoLibraryOpen(true)}
        />
             </div>
      <MediaAssetPickerDialog
        open={mainVideoLibraryOpen}
        onOpenChange={setMainVideoLibraryOpen}
        kind="video"
        actor={mediaActor}
        onPick={pickMainVideoFromLibrary}
      />
    </div>
  );
}
