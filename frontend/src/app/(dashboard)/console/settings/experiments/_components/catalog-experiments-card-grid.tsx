"use client";

import * as React from "react";
import { Badge, Card, CardContent, MediaEmptyFrame, MediaPreview } from "@bs-lab/ui";
import { experimentCatalogDemoStreamActor, type CatalogCore } from "@/lib/experiment-catalog-api";
import { mediaRegistryStreamUrl } from "@/lib/media-platform/registry-ref";
import { UserRole } from "@/types/auth";

import type { SchoolDimensionSnapshot } from "../../education/subject-grades/page.types";
import { formatCatalogGradeRange } from "../catalog-grade-range-display";
import { CatalogExperimentsCardGridSkeleton } from "./catalog-experiments-card-grid-skeleton";

function mandatoryLabel(v: number): string {
  return v === 1 ? "必做" : "选做";
}

type PreviewState = "READY" | "STALE" | "LOADING" | "ERROR" | "EMPTY";

function resolvePreviewState(row: CatalogCore): {
  state: PreviewState;
  src: string;
  errorCode: string | null;
} {
  const vid = row.officialVideoRegistryId?.trim() ?? "";
  const status = row.officialVideoProcessingStatus ?? null;
  const posterUrl = row.officialVideoPosterUrl?.trim() ?? "";
  const errorCode = row.officialVideoErrorCode ?? null;
  if (!vid) return { state: "EMPTY", src: "", errorCode: null };

  if (status === "READY") return { state: "READY", src: posterUrl, errorCode: null };
  if (status === "STALE") return { state: "STALE", src: posterUrl, errorCode: null };
  if (status === "PROCESSING") return { state: "LOADING", src: "", errorCode: null };
  if (status === "FAILED") return { state: "ERROR", src: "", errorCode };
  if (status === "NONE") return { state: "EMPTY", src: "", errorCode: null };

  // 兼容后端 status 尚未接入时的历史口径。
  if (row.officialVideoReachable === false) return { state: "ERROR", src: "", errorCode: null };
  return { state: "READY", src: "", errorCode: null };
}

export function CatalogExperimentsCardGrid(props: {
  items: CatalogCore[];
  loading: boolean;
  eduSnapshot: SchoolDimensionSnapshot | null;
  role: UserRole;
  orgId: string;
  onCardOpen: (row: CatalogCore) => void;
}) {
  const actor = React.useMemo(() => experimentCatalogDemoStreamActor(props.role, props.orgId), [props.role, props.orgId]);

  if (props.loading && props.items.length === 0) {
    return <CatalogExperimentsCardGridSkeleton />;
  }

  if (!props.loading && props.items.length === 0) {
    return (
      <div className="flex min-h-[12rem] items-center justify-center text-sm text-muted-foreground">
        当前筛选无数据，请调整左侧学科树或关键词
      </div>
    );
  }

  return (
    <div className="grid max-h-[min(70vh,calc(100dvh-16rem))] min-h-0 gap-3 overflow-auto p-1 sm:grid-cols-2 xl:grid-cols-3">
      {props.items.map((row) => {
        const vid = row.officialVideoRegistryId?.trim() ?? "";
        const resolved = resolvePreviewState(row);
        const resolvedSrc =
          resolved.src || (resolved.state === "READY" || resolved.state === "STALE" ? mediaRegistryStreamUrl(vid, "view", actor) : "");

        return (
          <Card
            key={row.id}
            className="cursor-pointer overflow-hidden border-border shadow-xs transition-colors hover:bg-muted/30"
            onClick={() => props.onCardOpen(row)}
          >
            <CardContent className="space-y-2 p-3">
              <div className="relative w-full overflow-hidden rounded-md">
                {(resolved.state === "READY" || resolved.state === "STALE") && resolvedSrc ? (
                  <div className="relative aspect-video w-full overflow-hidden rounded-md border border-border bg-muted/40">
                    <MediaPreview
                      kind="video"
                      src={resolvedSrc}
                      className="size-full object-cover"
                      alt={row.officialVideoTitle?.trim() || row.displayName}
                      variant="hover-play"
                      inViewThreshold={0.1}
                    />
                    {resolved.state === "STALE" ? (
                      <Badge variant="secondary" className="absolute right-1 top-1 text-[10px] font-normal">
                        更新中
                      </Badge>
                    ) : null}
                  </div>
                ) : null}
                {resolved.state === "LOADING" ? (
                  <div className="relative aspect-video w-full overflow-hidden rounded-md border border-border bg-muted/20">
                    <div className="size-full animate-pulse bg-muted/40" />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/90 to-transparent px-2 py-1 text-[11px] text-muted-foreground">
                      预览生成中
                    </div>
                  </div>
                ) : null}
                {resolved.state === "ERROR" ? (
                  <MediaEmptyFrame
                    kind="video"
                    hint={`预览生成失败${resolved.errorCode ? `（${resolved.errorCode}）` : ""}`}
                    className="border-border"
                  />
                ) : null}
                {resolved.state === "EMPTY" ? <MediaEmptyFrame kind="video" hint="未绑定视频" className="border-border" /> : null}
              </div>
              <div>
                <p className="line-clamp-2 text-sm font-medium text-foreground">{row.displayName}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {[row.stageName, formatCatalogGradeRange(row, props.eduSnapshot), row.subjectName]
                    .map((x) => (x?.trim() ? x.trim() : null))
                    .filter(Boolean)
                    .join(" · ") || "—"}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground/80">
                  {(row.categoryName?.trim() || "—") + " · " + mandatoryLabel(row.isMandatory)}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
