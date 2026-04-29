"use client";

import * as React from "react";

import { Button, type RichMediaUploadContext } from "@bs-lab/ui";
import { RichHtmlEditor, type RichHtmlEditorHandle } from "@bs-lab/ui";
import { firstImageSrcFromHtml, plainTextFromHtml } from "@/components/business/rich-html-editor/word-html-sanitize";
import { MediaAssetPickerDialog } from "@/components/business/media/MediaAssetPickerDialog";
import type { ApiActor } from "@/lib/new-core-api";
import { mediaRegistryStreamUrl } from "@/lib/media-platform/registry-ref";
import { uploadMediaFileToPlatform } from "@/lib/media-platform/upload-client";

type Props = {
  mediaActor: ApiActor;
  fieldDisabled: boolean;
  principle: string;
  onPrincipleHtmlChange: (html: string) => void;
};

export function EditorPrincipleSection(props: Props) {
  const { mediaActor, fieldDisabled, principle, onPrincipleHtmlChange } = props;
  const principleEditorRef = React.useRef<RichHtmlEditorHandle>(null);
  const [principleLibraryKind, setPrincipleLibraryKind] = React.useState<"image" | "video" | null>(null);

  const uploadPrincipleMedia = React.useCallback(
    async (kind: "image" | "video", file: File, ctx?: RichMediaUploadContext) => {
      const result = await uploadMediaFileToPlatform(mediaActor, file, { kind, title: file.name }, {
        ui: "silent",
        onProgress: ctx?.onProgress,
      });
      return { src: result.viewUrl };
    },
    [mediaActor],
  );

  const pickPrincipleFromLibrary = React.useCallback(
    async (registryId: string) => {
      if (!principleLibraryKind) return;
      const src = mediaRegistryStreamUrl(registryId, "view", mediaActor);
      principleEditorRef.current?.insertImageFromUrl(src);
      setPrincipleLibraryKind(null);
    },
    [principleLibraryKind, mediaActor],
  );

  return (
    <div className="grid gap-2 lg:col-span-12">
      <RichHtmlEditor
        ref={principleEditorRef}
        value={principle}
        onChange={onPrincipleHtmlChange}
        disabled={fieldDisabled}
        placeholder="请输入实验原理"
        title="实验原理"
        onUploadImage={async (file, ctx) => {
          const result = await uploadPrincipleMedia("image", file, ctx);
          return result ? { src: result.src } : null;
        }}
      />
      <div className="flex justify-end">
        <Button type="button" size="sm" variant="outline" disabled={fieldDisabled} onClick={() => setPrincipleLibraryKind("image")}>
          选择图片
        </Button>
      </div>
      <MediaAssetPickerDialog
        open={Boolean(principleLibraryKind)}
        onOpenChange={(open) => {
          if (!open) setPrincipleLibraryKind(null);
        }}
        kind={principleLibraryKind ?? "image"}
        actor={mediaActor}
        onPick={pickPrincipleFromLibrary}
      />
    </div>
  );
}
