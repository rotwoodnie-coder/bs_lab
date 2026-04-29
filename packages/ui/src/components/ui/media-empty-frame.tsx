"use client";

import * as React from "react";
import { Image as ImageIcon, Video } from "lucide-react";

import { cn } from "../../lib/utils";

export type MediaEmptyFrameProps = {
  kind: "image" | "video";
  /** 主提示，如「暂无视频」 */
  hint: string;
  /** 次要说明 */
  description?: string;
  className?: string;
  /** 悬停强调：置于可点击按钮内时与 `group` 容器配合 */
  emphasize?: boolean;
  children?: React.ReactNode;
};

/**
 * 系统统一媒体空态：底纹占位 + 图标区（占位图语义）。
 * 可点击语义由外层 `<button>` / `PopoverTrigger>` 提供，避免嵌套交互角色冲突。
 */
export function MediaEmptyFrame(props: MediaEmptyFrameProps) {
  const { kind, hint, description, emphasize, className, children } = props;
  const Icon = kind === "video" ? Video : ImageIcon;

  const shellClass = cn(
    "relative w-full overflow-hidden rounded-md border border-border bg-muted/40",
    kind === "video" ? "aspect-video" : "aspect-[4/3]",
    emphasize && "transition group-hover:bg-muted/55 group-focus-visible:ring-2 group-focus-visible:ring-ring",
    className,
  );

  return (
    <div className={shellClass}>
      {/* 轻量占位图：中性纹理 + 图标，避免各页上传不同静态资源 */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        aria-hidden
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Cdefs%3E%3Cpattern id='g' width='12' height='12' patternUnits='userSpaceOnUse'%3E%3Cpath d='M0 12h12V0' fill='none' stroke='%23888' stroke-opacity='.12' stroke-width='1'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='120' height='120' fill='url(%23g)'/%3E%3C/svg%3E")`,
          backgroundSize: "120px 120px",
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center p-3">
        <div className="flex max-w-full flex-col items-center justify-center gap-2 text-center">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-full border border-border bg-background/80 shadow-xs">
            <Icon className="size-7 text-muted-foreground" aria-hidden />
          </div>
          <p className="text-sm font-medium text-foreground">{hint}</p>
          {description ? <p className="max-w-xs text-xs text-muted-foreground">{description}</p> : null}
          {children}
        </div>
      </div>
    </div>
  );
}
