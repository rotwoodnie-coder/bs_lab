"use client";

import * as React from "react";
import { Badge } from "@bs-lab/ui";
import { cn } from "@/lib/utils";

import type { ApiActor } from "@/lib/new-core-api";
import type { MaterialCoverThumbInfo } from "@/lib/experimental-materials-api";
import { normalizeMediaStreamPathToRegistryProxy } from "@/lib/media-platform/registry-ref";

export function ExperimentalMaterialCoverThumbStatus(props: {
  coverThumb: MaterialCoverThumbInfo | null;
  actor: Pick<ApiActor, "orgId" | "userId" | "userName" | "tenantId" | "appId">;
}) {
  const { coverThumb, actor } = props;
  if (!coverThumb || coverThumb.processingStatus === "NONE") return null;

  const proxy = normalizeMediaStreamPathToRegistryProxy(coverThumb.posterUrl, actor);
  const showPoster = Boolean(proxy) && (coverThumb.processingStatus === "READY" || coverThumb.processingStatus === "STALE");

  return (
    <div className="space-y-2" data-thumb-status={coverThumb.processingStatus} aria-live="polite">
      {showPoster ? (
        <div
          className={cn(
            "relative overflow-hidden rounded-md border border-border bg-muted/30",
            coverThumb.processingStatus === "STALE" && "opacity-[0.88] contrast-[0.97]",
          )}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- 同源代理地址，懒加载 */}
          <img src={proxy!} alt="自动生成的封面预览" className="mx-auto max-h-40 w-full object-contain" loading="lazy" />
          {coverThumb.processingStatus === "STALE" ? (
            <Badge variant="secondary" className="absolute right-1 top-1 text-[10px] font-normal">
              更新中
            </Badge>
          ) : null}
        </div>
      ) : null}
      {coverThumb.processingStatus === "PROCESSING" ? (
        <p className="text-xs text-muted-foreground">封面缩略图生成中，请稍候刷新。</p>
      ) : null}
      {coverThumb.processingStatus === "FAILED" ? (
        <p className="text-xs text-destructive">
          封面生成失败
          {coverThumb.errorCode ? `（${coverThumb.errorCode}）` : ""}
        </p>
      ) : null}
    </div>
  );
}
