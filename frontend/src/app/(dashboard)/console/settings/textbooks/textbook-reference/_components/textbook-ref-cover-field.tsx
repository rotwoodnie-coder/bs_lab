"use client";

import * as React from "react";
import { Input, Label, MediaPreview } from "@bs-lab/ui";

import { viewUrlForRegistryId } from "@/lib/media-platform/upload-client";
import type { ApiActor } from "@/lib/new-core-api";

export function TextbookRefCoverField(props: {
  inputId: string;
  value: string;
  onChange: (next: string) => void;
  actor: ApiActor;
  inputPlaceholder: string;
}) {
  const rid = props.value.trim();
  const previewSrc = rid ? viewUrlForRegistryId(rid, props.actor) : "";
  const [previewBroken, setPreviewBroken] = React.useState(false);

  React.useEffect(() => {
    setPreviewBroken(false);
  }, [rid]);

  const emptyHint = rid && previewBroken ? "封面加载失败，请核对媒体登记 ID" : "暂无封面，可在下方填写媒体登记 ID";

  return (
    <div className="space-y-2">
      <Label htmlFor={props.inputId}>封面</Label>
      <div className="relative aspect-[3/4] max-h-48 w-full overflow-hidden rounded-md border border-border bg-muted">
        {previewSrc && !previewBroken ? (
          <MediaPreview
            kind="image"
            src={previewSrc}
            alt="教材封面"
            className="size-full object-contain"
            onImageError={() => setPreviewBroken(true)}
          />
        ) : (
          <div className="flex size-full items-center justify-center px-2 text-center text-xs text-muted-foreground">
            {emptyHint}
          </div>
        )}
      </div>
      <Input
        id={props.inputId}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        placeholder={props.inputPlaceholder}
        className="font-mono text-xs"
        aria-describedby={`${props.inputId}-hint`}
      />
      <p id={`${props.inputId}-hint`} className="text-xs text-muted-foreground">
        填写已在媒体库登记的封面图片登记 ID；留空表示不使用封面。
      </p>
    </div>
  );
}
