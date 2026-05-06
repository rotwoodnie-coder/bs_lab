"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  BookOpen,
  ChevronRight,
  Download,
  ExternalLink,
  Grid3X3,
  ClipboardList,
  Beaker,
} from "@bs-lab/ui/icons";
import { Avatar, AvatarFallback, AvatarImage, Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@bs-lab/ui";

import { useResourceDetailPage } from "./page.hooks";
import { kindLabel } from "@/app/(dashboard)/teacher/materials/_lib/material-preview.utils";
import { MaterialPreviewCard } from "@/app/(dashboard)/teacher/materials/_components/MaterialPreviewCard";
import { getMaterialPreviewPayload } from "@/app/(dashboard)/teacher/materials/_lib/material-preview.utils";
import { materialStorageBrowserHref } from "@/lib/material-asset-url";
import { teacherMaterialDownloadHref } from "@/lib/teacher-materials-api";
import { formatZhDateTime } from "@/lib/datetime/format-zh";

/* ── 骨架屏 ── */
function DetailSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-4 md:px-6 lg:px-8">
      <div className="mb-4 h-5 w-40 animate-pulse rounded bg-muted" />
      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="flex-1 min-w-0">
          <div className="aspect-video w-full animate-pulse rounded-xl bg-muted" />
        </div>
        <div className="w-full shrink-0 lg:w-80 xl:w-96">
          <div className="space-y-4">
            <div className="h-6 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
            <div className="h-16 w-full animate-pulse rounded-lg bg-muted" />
            <div className="h-24 w-full animate-pulse rounded-lg bg-muted" />
            <div className="h-20 w-full animate-pulse rounded-lg bg-muted" />
          </div>
        </div>
      </div>
    </div>
  );
}

/** 原生 <video> 组件，进入视口后自动播放 */
function AutoPlayVideo({ src, title, className }: { src: string; title: string; className?: string }) {
  const videoRef = React.useRef<HTMLVideoElement>(null);

  React.useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    // 组件挂载后立即尝试播放
    const tryPlay = () => {
      el.muted = true;
      el.playsInline = true;
      el.play().catch(() => {
        /* Safari/Firefox 自动播放策略限制时忽略 */
      });
    };
    tryPlay();
  }, [src]);

  return (
    <video
      ref={videoRef}
      src={src}
      controls
      muted
      playsInline
      autoPlay
      title={title}
      className={className ?? "h-full w-full"}
      preload="metadata"
    >
      您的浏览器不支持视频播放。
    </video>
  );
}

function ResourceDetailPage() {
  const params = useParams<{ id: string }>();
  const resourceId = params?.id ?? "";
  const vm = useResourceDetailPage(resourceId);

  /* ── Early returns ── */
  if (!resourceId) {
    return <MissingId />;
  }

  if (vm.loading) {
    return <DetailSkeleton />;
  }

  if (vm.error || !vm.item) {
    return (
      <div className="mx-auto w-full max-w-[1600px] px-4 py-12">
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
  const videoSrc = preview.sourceUrl?.trim() ?? "";
  const hasExp = vm.expDetail != null;
  const sortedSteps = vm.expDetail?.steps
    ? [...vm.expDetail.steps].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    : [];
  const sortedMaterials = vm.expDetail?.materials
    ? [...vm.expDetail.materials].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    : [];
  const downloadHref = teacherMaterialDownloadHref(vm.item, {
    orgId: vm.actor.orgId,
    userId: vm.actor.userId,
    userName: vm.actor.userName,
  });

  return (
    <>
      {/* 移动端全宽视频区（< lg） */}
      <div className="-mx-4 sm:-mx-6 md:-mx-8 lg:hidden">
        <div className="aspect-video w-full bg-black">
          {videoSrc ? (
            <AutoPlayVideo src={videoSrc} title={vm.item.title} className="h-full w-full" />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              视频不可用
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1600px] px-4 py-4 md:px-6 lg:px-8">
        {/* ── 面包屑导航 ── */}
        <nav className="mb-3 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link href="/video-square" className="hover:text-foreground transition-colors">
            视频广场
          </Link>
          <ChevronRight className="size-3.5" />
          <span className="truncate text-foreground">{vm.item.title}</span>
        </nav>

        {/* ── 双栏主体 ── */}
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* ========== 左栏：主视频区 ========== */}
          <div className="flex-1 min-w-0">
            {/* 桌面端视频（移动端已在上面单独渲染） */}
            <div className="hidden lg:block">
              <div className="aspect-video w-full overflow-hidden rounded-xl bg-black shadow-sm">
                {videoSrc ? (
                  <AutoPlayVideo src={videoSrc} title={vm.item.title} className="h-full w-full" />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    视频不可用
                  </div>
                )}
              </div>
            </div>

            {/* 视频下方操作栏 */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {downloadHref ? (
                <Button type="button" variant="outline" size="sm" className="gap-1.5" asChild>
                  <a href={downloadHref} target="_blank" rel="noopener noreferrer">
                    <Download className="size-3.5" />
                    下载
                  </a>
                </Button>
              ) : null}
              {hasExp ? (
                <Button type="button" variant="outline" size="sm" className="gap-1.5" asChild>
                  <Link
                    href={`/teacher/experiment-preview?id=${vm.expDetail!.expId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="size-3.5" />
                    查看实验课程
                  </Link>
                </Button>
              ) : null}
            </div>
          </div>

          {/* ========== 右栏：信息边栏 ========== */}
          <aside className="w-full shrink-0 lg:w-80 xl:w-96">
            <div className="space-y-4">
              {/* 标题与元数据 */}
              <div className="space-y-2">
                <h1 className="text-xl font-bold leading-tight text-foreground sm:text-2xl">
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

              {/* 上传者信息 */}
              {vm.item.ownerUserName ? (
                <div className="flex items-center gap-2.5 rounded-lg bg-muted/20 px-3 py-2.5">
                  <Avatar className="size-9 shrink-0 border border-border">
                    {vm.item.ownerAvatarUrl ? (
                      <AvatarImage src={materialStorageBrowserHref(vm.item.ownerAvatarUrl)} alt="" />
                    ) : null}
                    <AvatarFallback className="bg-primary/10 text-base text-primary">
                      {vm.item.ownerUserName.trim().slice(0, 1).toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 text-sm">
                    <p className="truncate font-medium text-foreground">{vm.item.ownerUserName}</p>
                    {vm.item.ownerTitleName || vm.item.ownerOrgName ? (
                      <p className="truncate text-xs text-muted-foreground">
                        {[vm.item.ownerTitleName, vm.item.ownerOrgName].filter(Boolean).join(" · ")}
                      </p>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {/* 素材描述 */}
              {vm.item.additionalComments ? (
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {vm.item.additionalComments}
                </p>
              ) : null}

              {/* 关联实验课程 */}
              {hasExp ? (
                <Card className="border-border shadow-none">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                      <BookOpen className="size-4 text-muted-foreground" />
                      关联实验课程
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Link
                        href={`/teacher/experiment-preview?id=${vm.expDetail!.expId}`}
                        className="group inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {vm.expDetail!.expName || "未命名实验"}
                        <ExternalLink className="size-3 opacity-0 transition-opacity group-hover:opacity-100" />
                      </Link>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {vm.expDetail!.createTime ? (
                          <span>{formatZhDateTime(vm.expDetail!.createTime)}</span>
                        ) : null}
                        {vm.expDetail!.displayOwnerName ? (
                          <span> · {vm.expDetail!.displayOwnerName}</span>
                        ) : null}
                        {vm.expDetail!.likeNum > 0 ? (
                          <span> · 收藏 {vm.expDetail!.likeNum}</span>
                        ) : null}
                      </div>
                    </div>

                    {/* 步骤概览 */}
                    {sortedSteps.length > 0 ? (
                      <div>
                        <h4 className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                          <ClipboardList className="size-3" />
                          实验步骤（{sortedSteps.length}）
                        </h4>
                        <ol className="space-y-1 text-xs text-muted-foreground">
                          {sortedSteps.slice(0, 5).map((s, i) => (
                            <li key={s.stepId} className="flex gap-1.5">
                              <span className="shrink-0 font-medium text-muted-foreground/60">{i + 1}.</span>
                              <span className="line-clamp-1">{s.stepName || `步骤 ${i + 1}`}</span>
                            </li>
                          ))}
                          {sortedSteps.length > 5 ? (
                            <li className="text-muted-foreground/50">还有 {sortedSteps.length - 5} 步…</li>
                          ) : null}
                        </ol>
                      </div>
                    ) : null}

                    {/* 实验材料 */}
                    {sortedMaterials.length > 0 ? (
                      <div>
                        <h4 className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                          <Beaker className="size-3" />
                          实验材料（{sortedMaterials.length}）
                        </h4>
                        <ul className="space-y-1 text-xs text-muted-foreground">
                          {sortedMaterials.slice(0, 6).map((m) => (
                            <li key={m.expMaterialId} className="line-clamp-1">
                              {m.materialName || "材料"}
                            </li>
                          ))}
                          {sortedMaterials.length > 6 ? (
                            <li className="text-muted-foreground/50">还有 {sortedMaterials.length - 6} 项…</li>
                          ) : null}
                        </ul>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              ) : null}
            </div>
          </aside>
        </div>

        {/* ── 同课程素材推荐（横向滚动） ── */}
        {vm.relatedItems.length > 0 ? (
          <section className="mt-8">
            <h2 className="mb-3 flex items-center gap-2 text-base font-semibold">
              <Grid3X3 className="size-4 text-muted-foreground" />
              本课程其他素材（{vm.relatedItems.length}）
            </h2>
            <div className="flex gap-3 overflow-x-auto pb-2 snap-x">
              {vm.relatedItems.map((ri) => {
                const rp = getMaterialPreviewPayload(ri);
                return (
                  <Link
                    key={ri.materialId}
                    href={`/resource/${ri.materialId}`}
                    className="group w-52 shrink-0 snap-start overflow-hidden rounded-lg border border-border bg-card transition hover:border-primary/40 hover:shadow-sm sm:w-56"
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
          </section>
        ) : null}
      </div>
    </>
  );
}

function MissingId() {
  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-12">
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
