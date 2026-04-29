"use client";

import * as React from "react";

import { RichMediaEditor, type RichMediaEmbed, type RichMediaUploadContext } from "@bs-lab/ui";

import { MediaAssetPickerDialog } from "@/components/business/media/MediaAssetPickerDialog";
import type { ApiActor } from "@/lib/new-core-api";
import { mediaRegistryStreamUrl } from "@/lib/media-platform/registry-ref";
import { uploadMediaFileToPlatform } from "@/lib/media-platform/upload-client";

import { EditorOcrSection, type EditorOcrSectionHandle } from "./EditorOcrSection";
import type { V2DictGradeItem } from "@/lib/v2/v2-exp-api";

type Props = {
  mediaActor: ApiActor;
  fieldDisabled: boolean;
  mainVideoEmbeds: Array<{ id: string; kind: "video"; src: string; caption?: string }>;
  mainVideoUrl: string;
  onMainVideoChange: (embeds: Array<{ id: string; kind: "video"; src: string; caption?: string }>, url: string) => void;
  onMainVideoIdChange?: (registryId: string | null) => void;
  gradeDictOptions?: V2DictGradeItem[];
  expId: string | null;
  userId: string;
  onExpNameOcr: (title: string) => void;
  onGradeOcr: (gradeId: string, schoolLevelId: string) => void;
};

export function EditorMainVideoSection(props: Props) {
  const { mediaActor, fieldDisabled, mainVideoEmbeds, onMainVideoChange, onMainVideoIdChange, gradeDictOptions, expId, userId, onExpNameOcr, onGradeOcr } = props;

  const ocrSectionRef = React.useRef<EditorOcrSectionHandle>(null);
  const [mainVideoLibraryOpen, setMainVideoLibraryOpen] = React.useState(false);

  const ocrPreviewUrl = React.useMemo(() => {
    const base = mainVideoEmbeds[0]?.src ?? props.mainVideoUrl;
    if (!base) return "";
    // 若已有 thumbnail variant 参数，直接返回；否则构造 thumbnail 专用 URL
    if (base.includes("variant=")) return base;
    // 从相对路径提取 registryId 构造缩略图 URL
    const m = base.match(/registryId=([^&]+)/);
    if (m) return mediaRegistryStreamUrl(decodeURIComponent(m[1]!), "view", mediaActor, { variant: "thumb_sm" });
    return base;
  }, [mainVideoEmbeds, props.mainVideoUrl, mediaActor]);

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
      const thumbUrl = mediaRegistryStreamUrl(result.registryId, "view", mediaActor, { variant: "thumb_sm" });
      ocrSectionRef.current?.triggerOcr(thumbUrl);
      onMainVideoIdChange?.(result.registryId);
      return { src: result.viewUrl };
    },
    [mediaActor, onMainVideoIdChange],
  );

  const pickMainVideoFromLibrary = React.useCallback(
    async (registryId: string) => {
      const src = mediaRegistryStreamUrl(registryId, "view", mediaActor);
      const thumbUrl = mediaRegistryStreamUrl(registryId, "view", mediaActor, { variant: "thumb_sm" });
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
      onMainVideoChange(next, next[0]?.src ?? "");
      onMainVideoIdChange?.(registryId);
      setMainVideoLibraryOpen(false);
      ocrSectionRef.current?.triggerOcr(thumbUrl);
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
        <EditorOcrSection
          ref={ocrSectionRef}
          previewVideoSrc={ocrPreviewUrl}
          fieldDisabled={fieldDisabled}
          gradeDictOptions={gradeDictOptions}
          expId={expId}
          userId={userId}
          onExpNameOcr={onExpNameOcr}
          onGradeOcr={onGradeOcr}
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
