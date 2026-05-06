"use client";

import * as React from "react";

import { RichMediaEditor, sonnerToast, type RichMediaEmbed, type RichMediaUploadContext } from "@bs-lab/ui";

import { MediaAssetPickerDialog } from "@/components/business/media/MediaAssetPickerDialog";
import type { ApiActor } from "@/lib/new-core-api";
import { buildApiUrl, buildCoreApiJsonHeaders } from "@/lib/core-api-shared";
import { mediaRegistryStreamUrl } from "@/lib/media-platform/registry-ref";
import { uploadMediaFileToPlatform } from "@/lib/media-platform/upload-client";

import { EditorOcrSection, type EditorOcrSectionHandle } from "./EditorOcrSection";
import type { V2DictGradeItem } from "@/lib/v2/v2-exp-api";

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * 调用 /v2/file/:fileId/thumbnail/ensure 确保视频封面已生成。
 * 最多重试 maxAttempts 次，每次间隔 intervalMs。
 * 最终失败不抛异常（让上层 OCR 重试兜底）。
 */
async function ensureThumbnailReady(
  fileId: string,
  actor: ApiActor,
  maxAttempts = 3,
  intervalMs = 1500,
): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const url = buildApiUrl(`/v2/file/${encodeURIComponent(fileId)}/thumbnail/ensure`);
      const res = await fetch(url, {
        method: "POST",
        headers: buildCoreApiJsonHeaders(actor),
        body: JSON.stringify({ force: false }),
      });
      if (res.ok) return;
    } catch {
      // 忽略错误，继续重试
    }
    if (i < maxAttempts - 1) {
      await delay(intervalMs);
    }
  }
}

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

  const triggerOcrAfterCoverReady = React.useCallback(
    (registryId: string) => {
      // 不阻塞状态更新：异步确保封面就绪后，从后端拉取真实 logoUrl 再触发 OCR
      void ensureThumbnailReady(registryId, mediaActor).then(async () => {
        await delay(500);
        // 从后端获取文件记录中的 logoUrl（后端已更新，是真实封面图地址）
        try {
          const detailUrl = buildApiUrl(`/v2/file/${encodeURIComponent(registryId)}`);
          const res = await fetch(detailUrl, { headers: buildCoreApiJsonHeaders(mediaActor) });
          if (res.ok) {
            const body = await res.json() as { data?: { logoUrl?: string | null } };
            const logoUrl = body.data?.logoUrl?.trim();
            if (logoUrl) {
              ocrSectionRef.current?.triggerOcr(logoUrl);
              return;
            }
          }
        } catch {
          // 拉取失败时，退回到 OCR 自身的封面就绪轮询，由它等待
        }
        // 兜底：仍尝试 registry-stream thumb_sm
        const fallbackUrl = mediaRegistryStreamUrl(registryId, "view", mediaActor, { variant: "thumb_sm" });
        ocrSectionRef.current?.triggerOcr(fallbackUrl);
      });
    },
    [mediaActor],
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

      // 不阻塞状态更新，异步确保封面并触发 OCR
      triggerOcrAfterCoverReady(result.registryId);

      return { src: result.viewUrl };
    },
    [mediaActor, onMainVideoIdChange, triggerOcrAfterCoverReady],
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

      // 不阻塞状态更新，异步确保封面并触发 OCR
      triggerOcrAfterCoverReady(registryId);
    },
    [mediaActor, mainVideoEmbeds, onMainVideoChange, onMainVideoIdChange, triggerOcrAfterCoverReady],
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
