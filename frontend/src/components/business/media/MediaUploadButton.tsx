"use client";

import * as React from "react";
import { Button, sonnerToast } from "@bs-lab/ui";
import { Upload } from "@bs-lab/ui/icons";

import type { ApiActor } from "@/lib/new-core-api";
import type { MediaKind } from "@/lib/media-platform/types";
import { uploadMediaFileToPlatform } from "@/lib/media-platform/upload-client";

export type MediaUploadButtonProps = {
  kind: MediaKind;
  actor: ApiActor;
  onUploaded: (registryId: string) => void | Promise<void>;
  disabled?: boolean;
  variant?: "default" | "secondary" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  label?: string;
};

export function MediaUploadButton({
  kind,
  actor,
  onUploaded,
  disabled = false,
  variant = "outline",
  size = "sm",
  className,
  label,
}: MediaUploadButtonProps) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const accept = kind === "video" ? "video/*" : "image/*";

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.currentTarget.files?.[0];
          e.currentTarget.value = "";
          if (!f) return;
          void (async () => {
            let result;
            try {
              result = await uploadMediaFileToPlatform(actor, f, { kind, title: f.name });
            } catch {
              return;
            }
            try {
              await onUploaded(result.registryId);
            } catch (err) {
              sonnerToast.error("上传已成功但后续处理失败", {
                description: err instanceof Error ? err.message : "未知错误",
              });
            }
          })();
        }}
      />
      <Button
        type="button"
        disabled={disabled}
        variant={variant}
        size={size}
        className={className}
        onClick={() => inputRef.current?.click()}
      >
        <Upload className={size === "icon" ? "size-4" : "mr-2 size-4"} />
        {size === "icon" ? null : (label ?? `上传${kind === "video" ? "视频" : "图片"}`)}
      </Button>
    </>
  );
}
