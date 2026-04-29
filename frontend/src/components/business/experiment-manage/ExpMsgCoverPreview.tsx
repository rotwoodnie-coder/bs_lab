"use client";

import { cn } from "@/lib/utils";
import { ExpVideoPlayer } from "@/components/business/video";

/**
 * 使用 `exp_video` 聚合得到的首条 URL 作为封面（与本地 `curriculum-row-videos` 库互斥展示）。
 */
export function ExpMsgCoverPreview({
  coverUrl,
  title,
  className,
}: {
  coverUrl: string;
  title: string;
  className?: string;
}) {
  const url = coverUrl.trim();
  if (!url) return null;

  const isImage =
    /\.(png|jpe?g|gif|webp)(\?|$)/i.test(url) || url.startsWith("data:image");

  if (isImage) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={url}
        alt={title}
        className={cn("aspect-video w-full object-cover", className)}
      />
    );
  }

  return (
    <ExpVideoPlayer
      src={url}
      poster={null}
      ratio={16 / 9}
      title={`${title} 封面视频`}
      className={cn("w-full rounded-none", className)}
    />
  );
}
