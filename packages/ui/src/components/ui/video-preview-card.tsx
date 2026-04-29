"use client";

import { cn } from "../../lib/utils";

import { MediaEmptyFrame } from "./media-empty-frame";
import { MediaPreview } from "./media-preview";

export type VideoPreviewCardProps = {
  /** 主标题（如媒体登记标题） */
  title?: string | null;
  /** 副文案（如说明当前为官方视频） */
  caption?: string | null;
  /** 同源代理等可播放地址；为空则不渲染播放器 */
  streamSrc?: string | null;
  /** 登记 id 存在但媒体库无法解析 */
  unreachable?: boolean;
  className?: string;
};

/**
 * 只读视频预览：有流则 `MediaPreview` 带控件；无流则与 `VideoManagerField` 空态同源的 `MediaEmptyFrame`。
 */
export function VideoPreviewCard(props: VideoPreviewCardProps) {
  const { title, caption, streamSrc, unreachable, className } = props;
  const src = streamSrc?.trim() ?? "";
  const hasSrc = Boolean(src);

  if (unreachable) {
    return (
      <div
        className={cn(
          "rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-foreground",
          className,
        )}
      >
        <p className="font-medium text-destructive">已绑定登记，但媒体库暂无法解析对应素材。</p>
        {title?.trim() ? <p className="mt-1 text-xs text-muted-foreground">{title.trim()}</p> : null}
      </div>
    );
  }

  if (!hasSrc) {
    return (
      <div className={cn("space-y-2", className)}>
        {title?.trim() || caption?.trim() ? (
          <div className="text-sm">
            {title?.trim() ? <p className="font-medium text-foreground">{title.trim()}</p> : null}
            {caption?.trim() ? <p className="text-xs text-muted-foreground">{caption.trim()}</p> : null}
          </div>
        ) : null}
        <MediaEmptyFrame kind="video" hint="未绑定官方视频" />
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {title?.trim() || caption?.trim() ? (
        <div className="text-sm">
          {title?.trim() ? <p className="font-medium text-foreground">{title.trim()}</p> : null}
          {caption?.trim() ? <p className="text-xs text-muted-foreground">{caption.trim()}</p> : null}
        </div>
      ) : null}
      <div className="aspect-video w-full max-w-xl overflow-hidden rounded-md border border-border bg-muted/40">
        <MediaPreview
          kind="video"
          variant="default"
          src={src}
          className="object-contain"
          videoProps={{ controls: true, preload: "metadata" }}
        />
      </div>
    </div>
  );
}
