"use client";

import * as React from "react";
import { Bookmark, Camera, MessageCircle, ThumbsUp, Trash2 } from "@bs-lab/ui/icons";

import type { ExperimentManageCardMenuAction, ExperimentManageCardQuickState } from "./types";
import { RowActionsMenu } from "@/components/business/common/RowActionsMenu";

export type ExperimentCourseCardMenusProps = {
  size?: "sm" | "md";
  quick: ExperimentManageCardQuickState | undefined;
  fallbackLikeCount: number;
  onAction: (action: ExperimentManageCardMenuAction) => void;
};

export function ExperimentCourseCardMenus(props: ExperimentCourseCardMenusProps) {
  const liked = props.quick?.liked ?? false;
  const favorited = props.quick?.favorited ?? false;
  const likeCount = props.quick?.likeCount ?? props.fallbackLikeCount;
  const commentCount = props.quick?.commentCount ?? 0;

  return (
    <RowActionsMenu
      size={props.size}
      items={[
        { key: "edit", label: "编辑", onSelect: () => props.onAction("edit") },
        { key: "review_or_view", label: "评审/查看", onSelect: () => props.onAction("review_or_view") },
        { key: "video_manage", label: "视频管理", onSelect: () => props.onAction("video_manage") },
        { key: "sep-1", separator: true, label: "sep-1" },
        {
          key: "like",
          label: liked ? `取消点赞（${likeCount}）` : `点赞（${likeCount}）`,
          icon: <ThumbsUp className="size-4 text-muted-foreground" aria-hidden />,
          onSelect: () => props.onAction("like"),
        },
        {
          key: "favorite",
          label: favorited ? "取消收藏" : "收藏",
          icon: <Bookmark className="size-4 text-muted-foreground" aria-hidden />,
          onSelect: () => props.onAction("favorite"),
        },
        {
          key: "comment",
          label: `留言（${commentCount}）`,
          icon: <MessageCircle className="size-4 text-muted-foreground" aria-hidden />,
          onSelect: () => props.onAction("comment"),
        },
        { key: "sep-2", separator: true, label: "sep-2" },
        {
          key: "same_style",
          label: "拍同款",
          icon: <Camera className="size-4 text-muted-foreground" aria-hidden />,
          onSelect: () => props.onAction("same_style"),
        },
        { key: "sep-3", separator: true, label: "sep-3" },
        {
          key: "delete",
          label: "删除",
          destructive: true,
          icon: <Trash2 className="size-4 text-muted-foreground" aria-hidden />,
          confirm: { title: "确认删除", description: "此操作无法撤销。", confirmText: "确认删除" },
          onSelect: () => props.onAction("delete"),
        },
      ]}
    />
  );
}

