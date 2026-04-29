"use client";

import * as React from "react";

import {
  RichMediaEditor,
  type RichMediaEmbed,
  type RichMediaUploadContext,
  type RichMediaValue,
  sonnerToast,
} from "@bs-lab/ui";

import { MediaAssetPickerDialog } from "@/components/business/media/MediaAssetPickerDialog";
import type { ApiActor } from "@/lib/new-core-api";
import { mediaRegistryStreamUrl } from "@/lib/media-platform/registry-ref";
import { uploadMediaFileToPlatform } from "@/lib/media-platform/upload-client";

import { EXPERIMENT_EDITOR_MULTILINE_ROWS } from "../page.constants";

export function StepContentRichEditor(props: {
  mediaActor: ApiActor;
  disabled: boolean;
  content: string;
  contentEmbeds: RichMediaEmbed[];
  onChange: (next: RichMediaValue) => void;
  /** RichMediaEditor 区块标题 */
  editorTitle?: string;
  /** 正文占位说明 */
  contentPlaceholder?: string;
  /** 文本区默认行数，默认 5 */
  textRows?: number;
}) {
  const value = React.useMemo(() => {
    const embeds = Array.isArray(props.contentEmbeds) ? props.contentEmbeds : [];
    return { text: props.content ?? "", embeds };
  }, [props.content, props.contentEmbeds]);

  const syncValue = React.useCallback(
    (next: RichMediaValue) => {
      props.onChange(next);
    },
    [props],
  );

  const uploadStepMedia = React.useCallback(
    async (kind: "image" | "video", file: File, ctx?: RichMediaUploadContext) => {
      const result = await uploadMediaFileToPlatform(props.mediaActor, file, { kind, title: file.name }, {
        ui: "silent",
        onProgress: ctx?.onProgress,
      });
      return { src: result.viewUrl };
    },
    [props.mediaActor],
  );

  const [libraryKind, setLibraryKind] = React.useState<"image" | "video" | null>(null);

  const pickFromLibrary = React.useCallback(
    async (registryId: string) => {
      if (!libraryKind) return;
      const src = mediaRegistryStreamUrl(registryId, "view", props.mediaActor);
      if (!src) {
        sonnerToast.error("未找到媒体文件");
        return;
      }
      const caption = `登记 ${registryId.slice(0, 8)}`;
      const nextEmbeds: RichMediaEmbed[] = [
        ...(Array.isArray(props.contentEmbeds) ? props.contentEmbeds : []),
        {
          id: `${libraryKind}-lib-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          kind: libraryKind,
          src,
          caption,
        },
      ];
      syncValue({ text: props.content, embeds: nextEmbeds });
      setLibraryKind(null);
    },
    [libraryKind, props.content, props.contentEmbeds, props.mediaActor, syncValue],
  );

  return (
    <>
      <RichMediaEditor
        value={value}
        onChange={syncValue}
        disabled={props.disabled}
        placeholder={props.contentPlaceholder ?? "请输入本步操作说明，可插入图片与视频。"}
        textRows={props.textRows ?? EXPERIMENT_EDITOR_MULTILINE_ROWS}
        onUploadMedia={uploadStepMedia}
        title={props.editorTitle ?? "步骤内容"}
        toolbarVariant="icon"
        onOpenLibrary={(kind) => setLibraryKind(kind)}
      />
      <MediaAssetPickerDialog
        open={Boolean(libraryKind)}
        onOpenChange={(open) => {
          if (!open) setLibraryKind(null);
        }}
        kind={libraryKind ?? "image"}
        actor={props.mediaActor}
        onPick={pickFromLibrary}
      />
    </>
  );
}
