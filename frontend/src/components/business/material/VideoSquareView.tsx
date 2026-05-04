"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Input, Spinner } from "@bs-lab/ui";
import {
  Search,
  LayoutGrid,
  Table2,
  Rows3,
  RotateCcw,
} from "@bs-lab/ui/icons";

import { useSessionActor } from "@/hooks/use-session-actor";
import {
  VideoSquareWaterfall,
} from "@/components/business/material";
import type { TeacherMaterialItem } from "@/lib/teacher-materials-api";
import { useVideoSquarePage } from "@/app/(dashboard)/video-square/page.hooks";

export function VideoSquareView() {
  const router = useRouter();
  const st = useVideoSquarePage();
  const { hydrated } = useSessionActor();

  // 必须放在所有 early return 之前：hooks 调用次序需恒定
  const handleClickItem = React.useCallback(
    (item: TeacherMaterialItem) => {
      router.push(`/resource/${item.materialId}`);
    },
    [router],
  );

  if (!hydrated) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-4">
      {/* 页头 */}
      <header className="space-y-1 shrink-0">
        <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">视频广场</h1>
        <p className="text-sm text-muted-foreground">
          浏览全平台素材，单击卡片查看详情
        </p>
      </header>

      {/* 工具栏 */}
      <div className="flex flex-col gap-3">
        {/* 搜索栏 */}
        <div className="relative min-w-0">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={st.keyword}
            onChange={(e) => st.setKeyword(e.target.value)}
            placeholder="搜索标题、文件名或关联实验"
            className="pl-9"
            aria-label="搜索素材"
          />
        </div>

        {/* 视图切换（已移除类型筛选） */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex-1" />
          <div className="flex items-center gap-1">
            <Button
              type="button"
              size="sm"
              variant={st.mode === "waterfall" ? "default" : "outline"}
              onClick={() => st.setMode("waterfall")}
              aria-label="瀑布流"
            >
              <Rows3 className="size-4" />
              <span className="ml-1 hidden sm:inline">瀑布流</span>
            </Button>
            <Button
              type="button"
              size="sm"
              variant={st.mode === "grid" ? "default" : "outline"}
              onClick={() => st.setMode("grid")}
              aria-label="网格"
            >
              <LayoutGrid className="size-4" />
              <span className="ml-1 hidden sm:inline">网格</span>
            </Button>
            <Button
              type="button"
              size="sm"
              variant={st.mode === "list" ? "default" : "outline"}
              onClick={() => st.setMode("list")}
              aria-label="列表"
            >
              <Table2 className="size-4" />
              <span className="ml-1 hidden sm:inline">列表</span>
            </Button>
          </div>
        </div>
      </div>

      {/* 加载态 */}
      {st.loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Spinner className="size-8" />
        </div>
      ) : st.error ? (
        /* 错误态 */
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
          <p className="text-sm text-muted-foreground">加载失败：{st.error}</p>
          <Button type="button" variant="outline" size="sm" onClick={st.retry}>
            <RotateCcw className="mr-1 size-3.5" />
            重试
          </Button>
        </div>
      ) : st.items.length === 0 ? (
        /* 空态 */
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
          <p className="text-sm text-muted-foreground">暂无素材数据</p>
        </div>
      ) : (
        /* 内容区 */
        <VideoSquareWaterfall
          actor={st.actor}
          items={st.items}
          mode={st.mode}
          onClickItem={handleClickItem}
        />
      )}
    </div>
  );
}
