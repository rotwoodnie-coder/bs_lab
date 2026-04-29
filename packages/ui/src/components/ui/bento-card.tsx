"use client";

import * as React from "react";
import { motion, type HTMLMotionProps, type Variants } from "framer-motion";
import { Bookmark, Eye, Heart, MessageCircle } from "lucide-react";

import { cn } from "../../lib/utils";

export type BentoCardProps = HTMLMotionProps<"div"> & {
  className?: string;
  children: React.ReactNode;
  /** 与首页 stagger 容器配合，控制入场次序（越大越晚出现） */
  staggerIndex?: number;
  /** 底部区域（如社交互动条），与 `children` 之间自动加分隔线 */
  footer?: React.ReactNode;
};

export function BentoCard({
  className,
  children,
  staggerIndex = 0,
  variants,
  footer,
  ...rest
}: BentoCardProps) {
  const mergedVariants = React.useMemo<Variants>(() => {
    if (variants) return variants;
    const delay = staggerIndex * 0.05;
    return {
      hidden: { opacity: 0, y: 14 },
      show: {
        opacity: 1,
        y: 0,
        transition: {
          duration: 0.36,
          delay,
          ease: [0.22, 1, 0.36, 1] as const,
        },
      },
    };
  }, [staggerIndex, variants]);

  return (
    <motion.div
      variants={mergedVariants}
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 420, damping: 28 }}
      className={cn(
        "rounded-bento border border-border/50 bg-card/80 p-6 shadow-sm backdrop-blur-md",
        footer && "flex h-auto min-h-0 flex-col",
        className,
      )}
      {...rest}
    >
      <div className={cn(footer && "flex min-h-0 flex-1 flex-col")}>{children}</div>
      {footer ? (
        <div className="mt-5 border-t border-border/40 pt-3 text-muted-foreground">{footer}</div>
      ) : null}
    </motion.div>
  );
}

export type BentoCardSocialActionsProps = {
  className?: string;
  viewsCount?: number;
  likesCount?: number;
  commentsCount?: number;
  /** 供业务层挂接；未传则渲染为展示用按钮 */
  onLikeClick?: () => void;
  onCommentClick?: () => void;
  onBookmarkClick?: () => void;
};

/**
 * 实验卡片等场景的底部互动行：点赞、评论数、收藏。无内置状态，仅展示与可点击回调。
 */
export function BentoCardSocialActions({
  className,
  viewsCount,
  likesCount = 0,
  commentsCount = 0,
  onLikeClick,
  onCommentClick,
  onBookmarkClick,
}: BentoCardSocialActionsProps) {
  return (
    <div className={cn("flex items-center justify-between gap-2", className)}>
      <div className="flex items-center gap-1">
        {viewsCount != null ? (
          <span
            className="inline-flex h-9 items-center gap-1 rounded-md px-2 text-xs font-medium text-muted-foreground"
            aria-label="阅读量"
          >
            <Eye className="size-4 shrink-0" aria-hidden />
            <span className="tabular-nums">{viewsCount}</span>
          </span>
        ) : null}
        <button
          type="button"
          className="inline-flex h-9 items-center gap-1 rounded-md px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
          aria-label="点赞"
          onClick={onLikeClick}
        >
          <Heart className="size-4 shrink-0" aria-hidden />
          <span className="tabular-nums">{likesCount}</span>
        </button>
        <button
          type="button"
          className="inline-flex h-9 items-center gap-1 rounded-md px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
          aria-label="评论"
          onClick={onCommentClick}
        >
          <MessageCircle className="size-4 shrink-0" aria-hidden />
          <span className="tabular-nums">{commentsCount}</span>
        </button>
      </div>
      <button
        type="button"
        className="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
        aria-label="收藏"
        onClick={onBookmarkClick}
      >
        <Bookmark className="size-4" aria-hidden />
      </button>
    </div>
  );
}
