"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  ExternalLink,
  Grid3X3,
  Play,
  User,
} from "@bs-lab/ui/icons";
import { Avatar, AvatarFallback, AvatarImage, Badge, Button, Card, CardContent, CardHeader, CardTitle, Spinner } from "@bs-lab/ui";

import { useResourceDetailPage } from "./page.hooks";
import { kindLabel } from "@/app/(dashboard)/teacher/materials/_lib/material-preview.utils";
import { MaterialPreviewCard } from "@/app/(dashboard)/teacher/materials/_components/MaterialPreviewCard";
import { getMaterialPreviewPayload } from "@/app/(dashboard)/teacher/materials/_lib/material-preview.utils";
import { materialStorageBrowserHref } from "@/lib/material-asset-url";
import { formatZhDateTime } from "@/lib/datetime/format-zh";

function ResourceDetailPage() {
  const params = useParams<{ id: string }>();
  const resourceId = params?.id ?? "";
  const vm = useResourceDetailPage(resourceId);

  if (!resourceId) {
    return <MissingId />;
  }

  if (vm.loading) {
    return (
      <div className="mx-auto max-w-screen-lg px-4 py-12">
        <div className="flex min-h-[50vh] items-center justify-center">
          <Spinner className="size-8" />
        </div>
      </div>
    );
  }

  if (vm.error || !vm.item) {
    return (
      <div className="mx-auto max-w-screen-lg px-4 py-12">
        <div className="space-y-4 rounded-xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">{vm.error ?? "素材不存在。"}</p>
          <Button type="button" variant="outline" size="sm" asChild>
            <Link href="/video-square">返回视频广场</Link>
          </Button>
        </div>
      </div>
    );
  }

  const preview = getMaterialPreviewPayload(vm.item);
  const hasExp = vm.expDetail != null;

  return (
    <div className="mx-auto max-w-screen-lg space-y-6 px-4 py-4 sm:px-6 sm:py-6">
      {/* 顶部导航 */}
      <div className="flex items-center justify-between">
        <Button type="button" variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" asChild>
          <Link href="/video-square">
            <ArrowLeft className="size-4" />
            返回视频广场
          </Link>
        </Button>
      </div>

      {/* 主视频/预览区 */}
      <Card className="overflow-hidden border-border shadow-sm">
        <div className="aspect-video w-full bg-muted/30">
          <MaterialPreviewCard
            preview={preview}
            title={vm.item.title}
            className="h-full w-full"
            actor={vm.actor}
            repairSourceItem={vm.item}
          />
        </div>
        <CardContent className="space-y-3 p-4 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0 space-y-1">
              <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                {vm.item.title}
              </h1>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="secondary" className="font-normal">
                  {kindLabel(vm.item.kind)}
                </Badge>
                {vm.item.updatedAt !== "—" ? (
                  <span>更新于 {vm.item.updatedAt}</span>
                ) : null}
              </div>
            </div>
          </div>

          {/* 上传者信息 */}
          {vm.item.ownerUserName ? (
            <div className="flex items-center gap-2 rounded-lg bg-muted/20 px-3 py-2">
              <Avatar className="size-8 border border-border">
                {vm.item.ownerAvatarUrl ? (
                  <AvatarImage src={materialStorageBrowserHref(vm.item.ownerAvatarUrl)} alt="" />
                ) : null}
                <AvatarFallback className="bg-primary/10 text-sm text-primary">
                  {vm.item.ownerUserName.trim().slice(0, 1).toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 text-sm">
                <p className="truncate font-medium text-foreground">{vm.item.ownerUserName}</p>
                {vm.item.ownerTitleName ? (
                  <p className="truncate text-xs text-muted-foreground">{vm.item.ownerTitleName}</p>
                ) : null}
              </div>
            </div>
          ) : null}

          {/* 素材描述 */}
          {vm.item.additionalComments ? (
            <p className="text-sm text-muted-foreground">{vm.item.additionalComments}</p>
          ) : null}
        </CardContent>
      </Card>

      {/* 关联实验课程 */}
      {hasExp ? (
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BookOpen className="size-4 text-muted-foreground" />
              关联实验课程
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Link
                href={`/teacher/experiment-preview?id=${vm.expDetail!.expId}`}
                className="group inline-flex items-center gap-1.5 text-base font-semibold text-primary hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                {vm.expDetail!.expName || "未命名实验"}
                <ExternalLink className="size-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
              </Link>
              <div className="flex flex-wrap gap-1 text-xs text-muted-foreground">
                {vm.expDetail!.createTime ? (
                  <span>{formatZhDateTime(vm.expDetail!.createTime)}</span>
                ) : null}
                {vm.expDetail!.displayOwnerName ? (
                  <span> · {vm.expDetail!.displayOwnerName}</span>
                ) : null}
                {vm.expDetail!.likeNum > 0 ? (
                  <span> · {vm.expDetail!.likeNum} 人收藏</span>
                ) : null}
              </div>
            </div>

            {/* 实验视频缩略播放 */}
            {vm.expDetail!.videos && vm.expDetail!.videos.length > 0 ? (
              <div className="aspect-video overflow-hidden rounded-lg bg-muted">
                <video
                  src={vm.expDetail!.videos[0].videoUrl ?? undefined}
                  controls
                  className="h-full w-full"
                  poster={vm.expDetail!.coverVideoUrl ?? undefined}
                >
                  您的浏览器不支持视频播放。
                </video>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {/* 同课程素材推荐 */}
      {vm.relatedItems.length > 0 ? (
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Grid3X3 className="size-4 text-muted-foreground" />
              同课程素材（{vm.relatedItems.length}）
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {vm.relatedItems.map((ri) => {
                const rp = getMaterialPreviewPayload(ri);
                return (
                  <Link
                    key={ri.materialId}
                    href={`/resource/${ri.materialId}`}
                    className="group block overflow-hidden rounded-lg border border-border bg-card transition hover:border-primary/40 hover:shadow-sm"
                  >
                    <div className="aspect-video w-full bg-muted/30">
                      <MaterialPreviewCard
                        preview={rp}
                        title={ri.title}
                        className="h-full w-full rounded-none"
                        actor={vm.actor}
                        repairSourceItem={ri}
                      />
                    </div>
                    <div className="space-y-0.5 p-2">
                      <p className="line-clamp-1 text-sm font-medium text-foreground group-hover:text-primary">
                        {ri.title}
                      </p>
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <Badge variant="outline" className="px-1 py-0 text-[10px] font-normal">
                          {kindLabel(ri.kind)}
                        </Badge>
                        {ri.ownerUserName ? (
                          <span className="truncate">{ri.ownerUserName}</span>
                        ) : null}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function MissingId() {
  return (
    <div className="mx-auto max-w-screen-lg px-4 py-12">
      <div className="space-y-4 rounded-xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center">
        <p className="text-sm text-muted-foreground">缺少资源 ID。</p>
        <Button type="button" variant="outline" size="sm" asChild>
          <Link href="/video-square">返回视频广场</Link>
        </Button>
      </div>
    </div>
  );
}

export default ResourceDetailPage;
