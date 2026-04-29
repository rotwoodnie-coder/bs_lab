"use client";

import * as React from "react";
import Image from "next/image";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  MediaPreview,
} from "@bs-lab/ui";
import { Bookmark, Eye, Heart, Share2 } from "@bs-lab/ui/icons";
import { cn } from "@/lib/utils";
import { experimentCoverPlaceholderClass } from "@/lib/experiment-cover-styles";
import type { Experiment, ExperimentScienceDiscipline } from "@/types/experiment";

import type { ExperimentCardVisualVariant } from "@/lib/experiment-card-variant";
import { ExperimentCardPulseGraph } from "./experiment-card-pulse-graph";

export type ExperimentCardAction =
  | { type: "view"; experimentId: string }
  | { type: "favorite"; experimentId: string }
  | { type: "share"; experimentId: string };

export type { ExperimentCardVisualVariant } from "@/lib/experiment-card-variant";

const DIFFICULTY_LABEL: Record<NonNullable<Experiment["difficulty"]>, string> = {
  easy: "入门",
  medium: "中等",
  hard: "拓展",
};

const TITLE_CLASS = "text-[15px] font-semibold leading-snug";
const DESC_CLASS = "line-clamp-1 text-xs leading-snug text-muted-foreground";
const META_TEXT = "text-xs text-muted-foreground";

const ACTION_ICON_BTN =
  "size-8 min-h-8 min-w-8 shrink-0 text-muted-foreground [&_svg]:size-3.5";

function authorInitials(name: string): string {
  const t = name.trim();
  if (!t) return "?";
  return t.length <= 2 ? t : t.slice(0, 2);
}

function disciplineBadgeClass(d?: ExperimentScienceDiscipline): string | undefined {
  switch (d) {
    case "physics":
      return "border-brand-science/35 bg-brand-science/10 text-brand-science";
    case "chemistry":
      return "border-status-error/35 bg-status-error/10 text-status-error";
    case "biology":
      return "border-status-success/35 bg-status-success/10 text-status-success";
    default:
      return undefined;
  }
}

function shortSummary(text: string | undefined, max = 42): string | undefined {
  if (!text?.trim()) return undefined;
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

export type ExperimentCardProps = {
  data: Experiment;
  onAction: (action: ExperimentCardAction) => void;
  className?: string;
  /** 视觉档位：A 赛博 / B 磨砂 / C 数据脉冲 / D 全息；默认 A */
  variant?: ExperimentCardVisualVariant;
  /** 封面图优先加载（首页轮播首屏等） */
  coverImagePriority?: boolean;
};

function TagRow({
  gradeLabel,
  categoryLabel,
  difficulty,
  subjectBadgeExtra,
  variant,
}: {
  gradeLabel: string;
  categoryLabel?: string;
  difficulty?: Experiment["difficulty"];
  subjectBadgeExtra?: string;
  variant: ExperimentCardVisualVariant;
}) {
  const breathe = variant === "C" ? "animate-experiment-tag-breathe" : "";
  return (
    <div className="-mx-0.5 flex flex-nowrap items-center gap-1 overflow-x-auto px-0.5 [scrollbar-width:thin]">
      <Badge variant="outline" className={cn("shrink-0 text-xs font-normal", breathe)}>
        {gradeLabel}
      </Badge>
      {categoryLabel ? (
        <Badge
          variant="outline"
          className={cn(
            "shrink-0 text-xs font-normal",
            subjectBadgeExtra ?? "text-foreground",
            breathe,
          )}
        >
          {categoryLabel}
        </Badge>
      ) : null}
      {difficulty ? (
        <Badge variant="outline" className={cn("shrink-0 border-primary/30 text-xs font-normal text-primary", breathe)}>
          {DIFFICULTY_LABEL[difficulty]}
        </Badge>
      ) : null}
    </div>
  );
}

function StatsRow({
  viewsCount,
  likesCount,
  durationMin,
  className,
}: {
  viewsCount?: number;
  likesCount?: number;
  durationMin?: number;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-x-3 gap-y-1", META_TEXT, className)}>
      <div className="flex flex-wrap items-center gap-3">
        {typeof viewsCount === "number" ? (
          <span className="inline-flex items-center gap-1">
            <Eye className="size-3.5 shrink-0" aria-hidden />
            <span>{viewsCount.toLocaleString("zh-CN")}</span>
          </span>
        ) : null}
        {typeof likesCount === "number" ? (
          <span className="inline-flex items-center gap-1">
            <Heart className="size-3.5 shrink-0" aria-hidden />
            <span>{likesCount.toLocaleString("zh-CN")}</span>
          </span>
        ) : null}
      </div>
      {typeof durationMin === "number" ? (
        <span className="shrink-0 tabular-nums">~{durationMin}′</span>
      ) : (
        <span className="shrink-0">课时可调</span>
      )}
    </div>
  );
}

function FooterActions({
  experimentId,
  onAction,
}: {
  experimentId: string;
  onAction: (action: ExperimentCardAction) => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Button
        type="button"
        size="sm"
        className="h-8 min-h-8 flex-1 gap-1.5 px-3 text-xs"
        onClick={() => onAction({ type: "view", experimentId })}
      >
        查看
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={ACTION_ICON_BTN}
        aria-label="收藏"
        onClick={() => onAction({ type: "favorite", experimentId })}
      >
        <Bookmark />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={ACTION_ICON_BTN}
        aria-label="分享"
        onClick={() => onAction({ type: "share", experimentId })}
      >
        <Share2 />
      </Button>
    </div>
  );
}

type CoverBlockProps = {
  data: Experiment;
  variant: ExperimentCardVisualVariant;
  authorDisplayName?: string;
  authorAvatarUrl?: string;
  categoryLabel?: string;
  subjectBadgeExtra?: string;
  className?: string;
  coverImagePriority?: boolean;
};

function CoverBlock({
  data,
  variant,
  authorDisplayName,
  authorAvatarUrl,
  categoryLabel,
  subjectBadgeExtra,
  className,
  coverImagePriority,
}: CoverBlockProps) {
  const { coverImageUrl, coverVideoUrl, status } = data;
  const hasCover = Boolean(coverImageUrl?.trim());
  const hasVideo = Boolean(coverVideoUrl?.trim());

  const glassFloat = variant === "B";
  const neon = variant === "A";

  return (
    <div
      className={cn(
        "relative aspect-video w-full overflow-hidden bg-muted",
        neon && "ring-1 ring-primary/45 experiment-neon-scanlines",
        neon && "drop-shadow-neon",
        className,
      )}
    >
      {hasVideo ? (
        <div className="absolute inset-0" aria-hidden>
          <MediaPreview
            kind="video"
            variant="default"
            src={coverVideoUrl!}
            className="size-full object-cover"
            alt=""
            videoProps={{ muted: true, playsInline: true, loop: true, autoPlay: true, controls: false }}
          />
        </div>
      ) : hasCover ? (
        <Image
          src={coverImageUrl!}
          alt=""
          fill
          priority={coverImagePriority}
          className={cn("object-cover", neon && "opacity-95 contrast-110 saturate-125")}
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, (max-width: 1536px) 33vw, (max-width: 2560px) 25vw, 20vw"
        />
      ) : (
        <div
          className={cn("flex size-full items-center justify-center text-xs text-muted-foreground", experimentCoverPlaceholderClass(data))}
        >
          无封面
        </div>
      )}

      {glassFloat && (authorDisplayName || authorAvatarUrl) ? (
        <div className="absolute bottom-2 left-2 z-10 flex items-center gap-1.5 rounded-full border border-border/60 bg-background/55 py-0.5 ps-0.5 pe-2 backdrop-blur-xl">
          <Avatar className="size-7 border border-border/50">
            {authorAvatarUrl ? <AvatarImage src={authorAvatarUrl} alt="" /> : null}
            <AvatarFallback className="text-[10px] font-medium">
              {authorDisplayName ? authorInitials(authorDisplayName) : "?"}
            </AvatarFallback>
          </Avatar>
          {authorDisplayName ? (
            <span className="max-w-[7rem] truncate text-xs text-foreground">{authorDisplayName}</span>
          ) : null}
        </div>
      ) : null}

      {glassFloat && categoryLabel ? (
        <Badge
          variant="secondary"
          className={cn(
            "absolute right-2 z-10 border border-border/50 bg-background/50 text-xs font-normal backdrop-blur-xl",
            status === "draft" ? "top-9" : "top-2",
            subjectBadgeExtra,
          )}
        >
          {categoryLabel}
        </Badge>
      ) : null}

      {status === "draft" ? (
        <Badge variant="secondary" className="absolute right-2 top-2 z-20 text-xs">
          草稿
        </Badge>
      ) : null}
    </div>
  );
}

export function ExperimentCard({
  data,
  onAction,
  className,
  variant: variantProp = "A",
  coverImagePriority,
}: ExperimentCardProps) {
  const {
    id,
    title,
    summary,
    gradeLabel,
    categoryLabel,
    difficulty,
    durationMin,
    likesCount,
    viewsCount,
    scienceDiscipline,
    authorDisplayName,
    authorAvatarUrl,
    publishedAgoLabel,
  } = data;

  const variant = variantProp;
  const subjectBadgeExtra = disciplineBadgeClass(scienceDiscipline);
  const summaryShort = shortSummary(summary);
  const showAuthorInBody = variant !== "A" && variant !== "B";

  const cardShell = (inner: React.ReactNode) => {
    if (variant === "A") {
      return (
        <div className="dark">
          <Card
            className={cn(
              "overflow-hidden gap-0 border-primary/35 bg-background py-0 text-foreground shadow-md",
              className,
            )}
          >
            {inner}
          </Card>
        </div>
      );
    }
    if (variant === "B") {
      return (
        <Card
          className={cn(
            "overflow-hidden gap-0 border-border/55 bg-card/50 py-0 shadow-sm backdrop-blur-xl",
            className,
          )}
        >
          {inner}
        </Card>
      );
    }
    return (
      <Card className={cn("overflow-hidden gap-0 py-0 shadow-xs", className)}>
        {inner}
      </Card>
    );
  };

  if (variant === "D") {
    return cardShell(
      <>
        <div className="flex flex-col sm:flex-row">
          <div className="relative w-full shrink-0 sm:w-[44%]">
            <CoverBlock
              data={data}
              variant={variant}
              className="aspect-video sm:min-h-[200px] sm:aspect-auto sm:h-full"
              coverImagePriority={coverImagePriority}
            />
          </div>
          <div className="flex min-w-0 flex-1 flex-col border-border/60 sm:border-s">
            <CardHeader className="gap-2 border-b border-border/60 p-3 pb-2 pt-3 font-mono">
              <TagRow
                gradeLabel={gradeLabel}
                categoryLabel={categoryLabel}
                difficulty={difficulty}
                subjectBadgeExtra={subjectBadgeExtra}
                variant={variant}
              />
              <CardTitle className={cn(TITLE_CLASS, "font-mono tracking-tight")}>{title}</CardTitle>
              {summaryShort ? <CardDescription className={cn(DESC_CLASS, "font-mono")}>{summaryShort}</CardDescription> : null}
              {(authorDisplayName || authorAvatarUrl) ? (
                <div className="flex items-center gap-2 pt-0.5">
                  <div
                    className="flex size-9 shrink-0 items-center justify-center rounded-md border border-dashed border-primary/45 bg-muted/40 font-mono text-[10px] font-semibold text-primary"
                    aria-hidden
                  >
                    {authorDisplayName ? authorInitials(authorDisplayName) : "ID"}
                  </div>
                  <div className="min-w-0 leading-tight">
                    {authorDisplayName ? (
                      <p className={cn("truncate font-mono text-xs text-foreground")}>{authorDisplayName}</p>
                    ) : null}
                    {publishedAgoLabel ? (
                      <p className={cn("truncate font-mono text-[11px] text-muted-foreground")}>{publishedAgoLabel}</p>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </CardHeader>
            <CardFooter className="mt-auto flex flex-col gap-2 border-t border-border/60 p-3 pt-2">
              <StatsRow viewsCount={viewsCount} likesCount={likesCount} durationMin={durationMin} className="font-mono text-[11px]" />
              <FooterActions experimentId={id} onAction={onAction} />
            </CardFooter>
          </div>
        </div>
      </>,
    );
  }

  const headerAuthor =
    showAuthorInBody && (authorDisplayName || publishedAgoLabel) ? (
      <div className="flex min-w-0 items-center gap-2">
        <Avatar className="size-7 shrink-0 border border-border/60">
          {authorAvatarUrl ? <AvatarImage src={authorAvatarUrl} alt="" /> : null}
          <AvatarFallback className="text-[10px] font-medium">{authorDisplayName ? authorInitials(authorDisplayName) : "?"}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1 leading-tight">
          {authorDisplayName ? <p className={cn("truncate", META_TEXT)}>{authorDisplayName}</p> : null}
          {publishedAgoLabel ? <p className={cn("truncate", META_TEXT)}>{publishedAgoLabel}</p> : null}
        </div>
      </div>
    ) : null;

  const mainHeader = (
    <CardHeader
      className={cn(
        "gap-2 border-b border-border/60 p-3 pb-2 pt-3",
        variant === "A" && "border-primary/25",
      )}
    >
      {variant !== "B" ? headerAuthor : null}
      {variant === "B" ? (
        <TagRow
          gradeLabel={gradeLabel}
          categoryLabel={undefined}
          difficulty={difficulty}
          subjectBadgeExtra={subjectBadgeExtra}
          variant={variant}
        />
      ) : (
        <TagRow
          gradeLabel={gradeLabel}
          categoryLabel={categoryLabel}
          difficulty={difficulty}
          subjectBadgeExtra={subjectBadgeExtra}
          variant={variant}
        />
      )}
      <CardTitle className={cn(TITLE_CLASS, variant === "A" && "drop-shadow-neon")}>{title}</CardTitle>
      {summaryShort ? (
        <CardDescription className={cn(DESC_CLASS, variant === "A" && "text-muted-foreground")}>{summaryShort}</CardDescription>
      ) : null}
      {variant === "A" ? (
        <div className="font-mono text-[10px] leading-relaxed text-primary/75">
          <p className="truncate">{`// module: lab/${id}`}</p>
          <p className="truncate text-primary/55">{`status.sync("${gradeLabel}");`}</p>
        </div>
      ) : null}
    </CardHeader>
  );

  const footerBlock = (
    <CardFooter
      className={cn(
        "flex flex-col gap-2 border-t border-border/60 p-3 pt-2",
        variant === "A" && "border-primary/20",
      )}
    >
      <StatsRow viewsCount={viewsCount} likesCount={likesCount} durationMin={durationMin} />
      <FooterActions experimentId={id} onAction={onAction} />
    </CardFooter>
  );

  return cardShell(
    <>
      <CoverBlock
        data={data}
        variant={variant}
        authorDisplayName={authorDisplayName}
        authorAvatarUrl={authorAvatarUrl}
        categoryLabel={categoryLabel}
        subjectBadgeExtra={subjectBadgeExtra}
        coverImagePriority={coverImagePriority}
      />
      {mainHeader}
      {variant === "C" ? (
        <div className="border-b border-border/60 px-3 py-2">
          <ExperimentCardPulseGraph />
        </div>
      ) : null}
      {footerBlock}
    </>,
  );
}
