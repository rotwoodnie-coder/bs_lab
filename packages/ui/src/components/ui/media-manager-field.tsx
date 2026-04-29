"use client";

import * as React from "react";

import { cn } from "../../lib/utils";
import { Button } from "./button";
import { MediaEmptyFrame } from "./media-empty-frame";
import { MediaPreview } from "./media-preview";

type MediaManagerFieldProps = {
  kind: "image" | "video";
  value: string;
  onChange: (nextUrl: string) => void;
  onUploadFile?: (file: File) => void | Promise<void>;
  onOpenLibrary?: () => void;
  libraryPicker?: React.ReactNode;
  disabled?: boolean;
  className?: string;
  emptyText?: string;
  uploadLabel?: string;
  pickLabel?: string;
  clearLabel?: string;
  /** 空态次要说明（统一占位组件内展示） */
  emptyDescription?: string;
};

function previewShellClass(kind: "image" | "video") {
  return cn(
    "relative w-full overflow-hidden rounded-md border border-border bg-muted/30",
    kind === "video" ? "aspect-video" : "aspect-[4/3]",
  );
}

/**
 * 统一媒体管理字段：空态占位 + 预览 + 单行操作（上传 / 媒体库 / 清除）。
 * 业务页通过 `ImageManagerField` / `VideoManagerField` 引用，避免各页自绘空块与散落 file input。
 */
export function MediaManagerField({
  kind,
  value,
  onChange,
  onUploadFile,
  onOpenLibrary,
  libraryPicker,
  disabled = false,
  className,
  emptyText,
  uploadLabel,
  pickLabel = "从媒体库选择",
  clearLabel = "清除",
  emptyDescription,
}: MediaManagerFieldProps) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const accept = kind === "video" ? "video/*" : "image/*";
  const fallbackText = emptyText ?? (kind === "video" ? "暂无视频" : "暂无图片");

  const triggerUpload = React.useCallback(() => {
    inputRef.current?.click();
  }, []);

  const uploadBtnLabel = uploadLabel ?? `上传${kind === "video" ? "视频" : "图片"}`;

  return (
    <div className={cn("flex flex-col gap-1 rounded-md border border-border p-2", className)}>
      {value ? (
        <div className={previewShellClass(kind)}>
          <MediaPreview
            kind={kind}
            variant={kind === "video" ? "default" : undefined}
            src={value}
            className="size-full object-contain"
            videoProps={{ controls: true, preload: "metadata" }}
          />
        </div>
      ) : (
        <MediaEmptyFrame kind={kind} hint={fallbackText} description={emptyDescription} />
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          event.currentTarget.value = "";
          if (!file || !onUploadFile) return;
          void onUploadFile(file);
        }}
      />

      <div className="flex flex-wrap items-center gap-1.5">
        <Button type="button" size="sm" variant="outline" disabled={disabled || !onUploadFile} onClick={triggerUpload}>
          {uploadBtnLabel}
        </Button>
        <Button type="button" size="sm" variant="outline" disabled={disabled || !onOpenLibrary} onClick={() => onOpenLibrary?.()}>
          {pickLabel}
        </Button>
        <Button type="button" size="sm" variant="ghost" className="h-8 px-2" disabled={disabled || !value} onClick={() => onChange("")}>
          {clearLabel}
        </Button>
      </div>

      {libraryPicker}
    </div>
  );
}

export type VideoManagerFieldProps = Omit<MediaManagerFieldProps, "kind">;
export function VideoManagerField(props: VideoManagerFieldProps) {
  return <MediaManagerField {...props} kind="video" />;
}

export type ImageManagerFieldProps = Omit<MediaManagerFieldProps, "kind">;
export function ImageManagerField(props: ImageManagerFieldProps) {
  return <MediaManagerField {...props} kind="image" />;
}
