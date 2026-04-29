"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { sonnerToast } from "@bs-lab/ui";
import {
  Avatar,
  AvatarFallback,
  BentoCard,
  Button,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@bs-lab/ui";
import { ArrowRight, Hash, Sparkles, Trophy } from "@bs-lab/ui/icons";

import { ExperimentCard } from "@/components/business/experiment-card";
import type { ExperimentCardAction } from "@/components/business/experiment-card";
import { ManagementAnimatedNumber } from "@/components/business/management-animated-number";
import { useDemoRole } from "@/components/layout/demo-role-context";
import { useAppMode } from "@/context/app-mode-context";
import {
  getUserAchievementSummary,
  listAchievementMedals,
  listCommunityActivities,
  listHomeHotTags,
  listHotExperimentsForCarousel,
  listPublishedExperiments,
} from "@/data/home-social-provider";
import {
  experimentCardVariantForDiscoveryFeed,
  experimentCardVariantForOfficialHot,
} from "@/lib/experiment-card-variant";
import { isSuperUserRole } from "@/lib/rbac/management-access";
import { UserRole } from "@/types/auth";

import { homeStaggerContainer, homeStaggerItem } from "./home-motion";
import { TeacherSimulationDemandWidget } from "./teacher-simulation-demand-widget";

export function SocialHomeView() {
  const router = useRouter();
  const { role } = useDemoRole();
  const { viewMode } = useAppMode();
  const hot = React.useMemo(() => listHotExperimentsForCarousel(), []);
  const feed = React.useMemo(() => listPublishedExperiments(), []);
  const hotTags = React.useMemo(() => listHomeHotTags(), []);
  const activities = React.useMemo(() => listCommunityActivities(), []);
  const medals = React.useMemo(() => listAchievementMedals(), []);
  const achievement = React.useMemo(() => getUserAchievementSummary(), []);

  const handleCardAction = React.useCallback(
    (action: ExperimentCardAction) => {
      switch (action.type) {
        case "view":
          router.push(`/experiments/${action.experimentId}`);
          break;
        case "favorite":
          sonnerToast.success("已加入收藏", { description: action.experimentId });
          break;
        case "share":
          sonnerToast.message("分享", { description: `生成分享链接：${action.experimentId}` });
          break;
        default:
          break;
      }
    },
    [router],
  );

  return (
    <TooltipProvider delayDuration={200}>
      <motion.div
        className="space-y-5"
        variants={homeStaggerContainer}
        initial="hidden"
        animate="show"
      >
        <motion.section
          variants={homeStaggerItem}
          className="overflow-hidden rounded-bento border border-border/50 bg-card/70 p-6 shadow-sm backdrop-blur-md"
        >
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2 text-primary">
              <Sparkles className="size-4 shrink-0" aria-hidden />
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                实验社交
              </span>
            </div>
            <h1 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">发现实验，与同好同行</h1>
            <p className="text-sm text-muted-foreground">
              浏览热门实验与社区动态；使用顶栏全局搜索（⌘K / Ctrl+K）查找实验、作者与话题。
            </p>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">热门话题</span>
            {hotTags.map((t) => (
              <Button key={t.id} type="button" variant="secondary" size="sm" className="h-8 gap-1" asChild>
                <Link href={t.href}>
                  <Hash className="size-3.5 opacity-70" aria-hidden />
                  {t.label}
                </Link>
              </Button>
            ))}
          </div>
        </motion.section>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <motion.div
            variants={homeStaggerItem}
            className="min-w-0 space-y-5 lg:col-span-8 2xl:col-span-9"
          >
            <BentoCard staggerIndex={0} className="overflow-hidden">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-foreground">热门实验推荐</h2>
                <Button type="button" variant="ghost" size="sm" className="h-8 text-muted-foreground" asChild>
                  <Link href="/experiments">
                    实验库
                    <ArrowRight className="size-3.5 opacity-70" />
                  </Link>
                </Button>
              </div>
              <div className="relative mt-5 px-2">
                <Carousel opts={{ align: "start", loop: true }} className="w-full">
                  <CarouselContent className="-ml-4">
                    {hot.map((ex, idx) => (
                      <CarouselItem key={ex.id} className="pl-4 md:basis-4/5 lg:basis-3/4">
                        <ExperimentCard
                          data={ex}
                          onAction={handleCardAction}
                          variant={experimentCardVariantForOfficialHot(ex, idx)}
                          coverImagePriority={idx === 0}
                          className="h-full"
                        />
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious
                    type="button"
                    variant="outline"
                    className="left-0 top-1/2 z-10 size-9 -translate-y-1/2 border-border/60 bg-background/80 shadow-sm backdrop-blur-sm"
                  />
                  <CarouselNext
                    type="button"
                    variant="outline"
                    className="right-0 top-1/2 z-10 size-9 -translate-y-1/2 border-border/60 bg-background/80 shadow-sm backdrop-blur-sm"
                  />
                </Carousel>
              </div>
            </BentoCard>

            <div>
              <div className="mb-3 flex items-center justify-between gap-2 px-0.5">
                <h2 className="text-sm font-semibold text-foreground">探索实验</h2>
                <Button type="button" variant="ghost" size="sm" className="h-8 text-muted-foreground" asChild>
                  <Link href="/experiments">
                    更多
                    <ArrowRight className="size-3.5 opacity-70" />
                  </Link>
                </Button>
              </div>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 min-[1920px]:grid-cols-5">
                {feed.map((ex) => (
                  <div key={ex.id} className="min-h-0">
                    <ExperimentCard
                      data={ex}
                      onAction={handleCardAction}
                      variant={experimentCardVariantForDiscoveryFeed(ex)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.aside
            variants={homeStaggerItem}
            className="min-w-0 space-y-5 lg:col-span-4 lg:min-w-[300px] lg:overflow-x-auto 2xl:sticky 2xl:top-24 2xl:col-span-3 2xl:self-start 2xl:max-h-[calc(100dvh-6rem)] 2xl:overflow-y-auto"
          >
            <BentoCard staggerIndex={0}>
              <div className="flex items-center gap-2">
                <Trophy className="size-4 text-chart-4" aria-hidden />
                <p className="text-sm font-semibold text-foreground">个人成就</p>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{achievement.scienceLevelLabel}</p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-md bg-muted/50 px-3 py-3">
                  <p className="text-xs text-muted-foreground">已获勋章</p>
                  <p className="mt-1 text-2xl tabular-nums text-foreground">
                    <ManagementAnimatedNumber value={achievement.medalCount} viewMode={viewMode} />
                    <span className="text-sm font-normal text-muted-foreground"> 枚</span>
                  </p>
                </div>
                <div className="rounded-md bg-muted/50 px-3 py-3">
                  <p className="text-xs text-muted-foreground">科学学分</p>
                  <p className="mt-1 text-2xl tabular-nums text-foreground">
                    <ManagementAnimatedNumber value={achievement.scienceCredits} viewMode={viewMode} />
                  </p>
                </div>
              </div>
              <p className="mt-4 text-xs font-medium text-muted-foreground">勋章墙</p>
              <div className="mt-2 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]">
                {medals.map((m) => (
                  <Tooltip key={m.id}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="shrink-0 rounded-full border border-border/70 bg-muted/40 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-muted/70"
                      >
                        {m.label}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs text-xs leading-snug">
                      {m.hint}
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
              <Button type="button" variant="outline" size="sm" className="mt-4 w-full" asChild>
                <Link href="/student/footprints">
                  成长足迹
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </BentoCard>

            <BentoCard staggerIndex={1}>
              <p className="text-sm font-semibold text-foreground">全区动态</p>
              <p className="mt-1 text-xs text-muted-foreground">实验与笔记相关的社区动作</p>
              <ul className="mt-4 space-y-3">
                {activities.map((row) => (
                  <li key={row.id} className="flex gap-3 rounded-md border border-border/70 bg-muted/20 p-3">
                    <Avatar className="size-9 shrink-0 border border-border/60">
                      <AvatarFallback className="bg-muted text-xs text-muted-foreground">{row.fallback}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground">{row.name}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{row.action}</p>
                      <p className="mt-1 text-[10px] text-muted-foreground">{row.ago}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </BentoCard>
          </motion.aside>
        </div>

        {role === UserRole.TEACHER || isSuperUserRole(role) ? (
          <motion.div variants={homeStaggerItem}>
            <BentoCard staggerIndex={3} className="overflow-hidden">
              <TeacherSimulationDemandWidget
                variant="compact"
                className="rounded-none border-0 bg-transparent p-0 shadow-none"
              />
            </BentoCard>
          </motion.div>
        ) : null}
      </motion.div>
    </TooltipProvider>
  );
}
