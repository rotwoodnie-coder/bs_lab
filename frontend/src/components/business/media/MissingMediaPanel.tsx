"use client";

import * as React from "react";
import Image from "next/image";
import { sonnerToast } from "@bs-lab/ui";
import { Upload } from "@bs-lab/ui/icons";

export type MissingMediaKind = "video" | "image";

export type MissingMediaPanelProps = {
  kind: MissingMediaKind;
  title?: string;
  description?: string;
  illustrationSrc?: string;
  className?: string;
  disabled?: boolean;
  showIllustration?: boolean;
  onOpenManager: () => void;
};

function acceptLabel(kind: MissingMediaKind) {
  return kind === "video" ? "视频" : "图片";
}

function isAcceptedFile(kind: MissingMediaKind, file: File) {
  if (kind === "video") return file.type.startsWith("video/");
  return file.type.startsWith("image/");
}

export function MissingMediaPanel({
  kind,
  title,
  description,
  illustrationSrc = "/illustrations/media-missing.svg",
  className,
  disabled = false,
  showIllustration = false,
  onOpenManager,
}: MissingMediaPanelProps) {
  const [isDragging, setIsDragging] = React.useState(false);

  const hintTitle = title ?? `暂无${acceptLabel(kind)}`;
  const hintDesc = description ?? `点击或拖拽${acceptLabel(kind)}到此处`;

  const openManager = React.useCallback(() => {
    if (disabled) return;
    onOpenManager();
  }, [disabled, onOpenManager]);

  const onDragOver = React.useCallback(
    (e: React.DragEvent) => {
      if (disabled) return;
      e.preventDefault();
      setIsDragging(true);
    },
    [disabled],
  );

  const onDragLeave = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = React.useCallback(
    (e: React.DragEvent) => {
      if (disabled) return;
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (!file) return;
      if (!isAcceptedFile(kind, file)) {
        sonnerToast.error("文件类型不匹配", { description: `请拖拽${acceptLabel(kind)}文件` });
        return;
      }
      sonnerToast.message("已打开管理面板", { description: "请在管理面板中完成上传/绑定。" });
      onOpenManager();
    },
    [disabled, kind, onOpenManager],
  );

  return (
    <div className={`grid gap-3 ${className ?? ""}`}>
      <div
        role={disabled ? undefined : "button"}
        tabIndex={disabled ? -1 : 0}
        onClick={openManager}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === "Enter" || e.key === " ") openManager();
        }}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        aria-disabled={disabled}
        className={[
          "group relative flex aspect-video w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed p-6 text-center transition",
          "border-border bg-muted/10 text-muted-foreground hover:bg-muted/20",
          isDragging ? "border-primary bg-primary/5 text-foreground" : "",
          disabled ? "cursor-not-allowed opacity-60 hover:bg-muted/10" : "",
        ].join(" ")}
      >
        <div
          className={[
            "grid size-12 place-items-center rounded-full transition",
            isDragging ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
          ].join(" ")}
        >
          <Upload className="size-5" />
        </div>
        <div className="space-y-1">
          <div className="text-sm font-medium text-foreground">{hintTitle}</div>
          <div className="text-xs">{isDragging ? "释放文件以继续" : hintDesc}</div>
        </div>
        <div className="text-[11px] text-muted-foreground/80">支持拖拽；或点击打开管理面板</div>
      </div>

      {showIllustration ? (
        <div className="hidden overflow-hidden rounded-md border border-border bg-muted/10 lg:block">
          <div className="relative aspect-video w-full">
            <Image src={illustrationSrc} alt="媒体缺失示意图" fill className="object-cover" sizes="360px" priority={false} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

