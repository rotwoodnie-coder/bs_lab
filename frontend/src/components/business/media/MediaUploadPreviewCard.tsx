"use client";

import * as React from "react";
import { Button, MediaPreview } from "@bs-lab/ui";
import { Loader2, UploadCloud, X } from "@bs-lab/ui/icons";
import type { ApiActor } from "@/lib/new-core-api";
import { useMediaUpload } from "@/lib/media/gms/use-media-upload";
import { useMediaPreview } from "@/lib/media/gms/use-media-preview";

export type MediaUploadPreviewCardProps = {
  actor: ApiActor;
  fileId?: string | null;
  initialSrc?: string;
  title?: string;
  className?: string;
  accept?: string;
  kind?: "image" | "video";
  aspectClassName?: string;
  onUploaded?: (payload: {
    fileHash: string;
    uploadKey: string;
    remoteUrl?: string;
    fileId?: string;
    fileUrl?: string;
  }) => void;
};

export function MediaUploadPreviewCard({
  actor,
  fileId,
  initialSrc,
  title,
  className,
  accept,
  kind = "video",
  aspectClassName,
  onUploaded,
}: MediaUploadPreviewCardProps) {
  const { upload } = useMediaUpload(actor);
  const { thumbnailUrl, state, reload } = useMediaPreview(actor, fileId, true);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [localPreview, setLocalPreview] = React.useState<string | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    return () => {
      if (localPreview?.startsWith("blob:")) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  const previewUrl = thumbnailUrl || localPreview || initialSrc || "";

  const clearSelection = React.useCallback(() => {
    setSelectedFile(null);
    setUploadProgress(0);
    setErrorMessage(null);
    if (localPreview?.startsWith("blob:")) URL.revokeObjectURL(localPreview);
    setLocalPreview(null);
    if (inputRef.current) inputRef.current.value = "";
  }, [localPreview]);

  const onPick = React.useCallback((file: File) => {
    setSelectedFile(file);
    setUploadProgress(0);
    setErrorMessage(null);
    if (localPreview?.startsWith("blob:")) URL.revokeObjectURL(localPreview);
    const blobUrl = URL.createObjectURL(file);
    setLocalPreview(blobUrl);
  }, [localPreview]);

  const handleUpload = React.useCallback(async () => {
    if (!selectedFile) return;
    setUploading(true);
    setErrorMessage(null);
    try {
      const result = await upload(selectedFile, {
        mediaKind: kind,
        onProgress: (event) => setUploadProgress(event.percent),
      });
      onUploaded?.({
        fileHash: result.fileHash,
        uploadKey: result.uploadKey,
        remoteUrl: result.result.objectKey,
        fileId: (result.result as any)?.fileId,
        fileUrl: (result.result as any)?.fileUrl,
      });
      await reload().catch(() => void 0);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "上传失败");
    } finally {
      setUploading(false);
    }
  }, [kind, onUploaded, reload, selectedFile, upload]);

  return (
    <div className={`rounded-md border border-border bg-card ${className ?? ""}`}>
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <div className="text-sm font-medium text-foreground">{title || "媒体上传与预览"}</div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
            <UploadCloud className="mr-1 size-4" />
            选择文件
          </Button>
          <Button type="button" size="sm" disabled={!selectedFile || uploading} onClick={() => void handleUpload()}>
            {uploading ? (
              <>
                <Loader2 className="mr-1 size-4 animate-spin" />
                上传中 {Math.round(uploadProgress)}%
              </>
            ) : (
              "开始上传"
            )}
          </Button>
          <Button type="button" variant="ghost" size="sm" disabled={!selectedFile && !previewUrl} onClick={clearSelection}>
            <X className="mr-1 size-4" />
            清除
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onPick(file);
              e.currentTarget.value = "";
            }}
          />
        </div>
      </div>

      <div className="p-3">
        <div className={`relative overflow-hidden rounded-md border border-border bg-muted/10 ${aspectClassName ?? "aspect-video"}`}>
          {previewUrl ? (
            <MediaPreview
              kind={kind}
              src={previewUrl}
              alt={title || "媒体预览"}
              className="size-full object-contain"
              {...(kind === "video" ? { previewMaxSeconds: 5 } : {})}
            />
          ) : (
            <div className="flex size-full items-center justify-center text-sm text-muted-foreground">暂无预览</div>
          )}
          {uploading ? (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-black/20">
              <div className="h-full bg-primary transition-all" style={{ width: `${Math.max(4, uploadProgress)}%` }} />
            </div>
          ) : null}
          {state === "checking" ? (
            <div className="pointer-events-none absolute left-2 top-2 rounded-full bg-black/50 px-2 py-1 text-[10px] text-white backdrop-blur-sm">正在检查封面</div>
          ) : state === "scheduled" ? (
            <div className="pointer-events-none absolute left-2 top-2 rounded-full bg-black/50 px-2 py-1 text-[10px] text-white backdrop-blur-sm">封面生成中</div>
          ) : state === "failed" ? (
            <div className="pointer-events-none absolute left-2 top-2 rounded-full bg-black/50 px-2 py-1 text-[10px] text-white backdrop-blur-sm">封面生成失败</div>
          ) : null}
          {errorMessage ? (
            <div className="pointer-events-none absolute inset-x-2 bottom-2 rounded-md bg-destructive/90 px-2 py-1 text-xs text-destructive-foreground shadow-sm">
              {errorMessage}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
