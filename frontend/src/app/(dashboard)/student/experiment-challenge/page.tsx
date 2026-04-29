"use client";

import * as React from "react";
import Link from "next/link";
import { Badge, Button, Card, CardContent } from "@bs-lab/ui";
import { FlaskConical, Loader2, Trophy } from "@bs-lab/ui/icons";

import { ErrorBoundary } from "@/components/business/error-boundary";
import { formatZhDateTime } from "@/lib/datetime/format-zh";
import { useChallengeList, type ChallengeFilter } from "./page.hooks";

const FILTER_OPTIONS: { value: ChallengeFilter; label: string }[] = [
  { value: "all", label: "全部" },
  { value: "pending", label: "待完成" },
  { value: "submitted", label: "已提交" },
  { value: "marked", label: "已批改" },
];

const STATUS_STYLE: Record<
  string,
  { label: string; variant: "outline" | "secondary" | "default" }
> = {
  pending: { label: "待完成", variant: "outline" },
  submitted: { label: "已提交", variant: "secondary" },
  marked: { label: "已批改", variant: "default" },
};

function ExperimentChallengePageInner() {
  const { items, stats, loading, error, filter, setFilter } = useChallengeList();

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight sm:text-2xl">
          <Trophy className="size-6 text-amber-500" />
          实验闯关
        </h1>
        <p className="text-sm text-muted-foreground">
          完成教师布置的实验任务，提交作业等待批改
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold tabular-nums">{stats.total}</p>
            <p className="text-xs text-muted-foreground">全部任务</p>
          </CardContent>
        </Card>
        <Card className="border-amber-200/60 dark:border-amber-800/40">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold tabular-nums text-amber-600 dark:text-amber-400">
              {stats.pending}
            </p>
            <p className="text-xs text-muted-foreground">待完成</p>
          </CardContent>
        </Card>
        <Card className="border-sky-200/60 dark:border-sky-800/40">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold tabular-nums text-sky-600 dark:text-sky-400">
              {stats.submitted}
            </p>
            <p className="text-xs text-muted-foreground">已提交</p>
          </CardContent>
        </Card>
        <Card className="border-emerald-200/60 dark:border-emerald-800/40">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
              {stats.marked}
            </p>
            <p className="text-xs text-muted-foreground">已批改</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTER_OPTIONS.map((opt) => (
          <Button
            key={opt.value}
            type="button"
            variant={filter === opt.value ? "default" : "outline"}
            size="sm"
            className="rounded-lg"
            onClick={() => setFilter(opt.value)}
          >
            {opt.label}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex min-h-[200px] items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          加载中…
        </div>
      ) : error ? (
        <div className="flex min-h-[200px] items-center justify-center text-sm text-destructive">
          加载失败：{error}
        </div>
      ) : items.length === 0 ? (
        <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
          <FlaskConical className="size-10 opacity-40" />
          <p>暂无实验闯关任务</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const badge = STATUS_STYLE[item.status] ?? {
              label: item.status,
              variant: "outline" as const,
            };
            return (
              <Link
                key={item.seqId}
                href={`/experiments/${item.expId}`}
                className="block"
              >
                <Card className="h-full cursor-pointer border-border/80 shadow-sm transition-colors hover:border-primary/40">
                  <CardContent className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <p className="line-clamp-2 text-sm font-medium leading-snug">
                        {item.expName || "未命名实验"}
                      </p>
                      <Badge
                        variant={badge.variant}
                        className="shrink-0 whitespace-nowrap text-xs"
                      >
                        {badge.label}
                      </Badge>
                    </div>
                    {item.teacherName && (
                      <p className="text-xs text-muted-foreground">
                        {item.teacherName}
                      </p>
                    )}
                    <div className="space-y-1 text-xs text-muted-foreground">
                      {item.requireDate && (
                        <div className="flex justify-between">
                          <span>要求完成</span>
                          <span>{formatZhDateTime(item.requireDate)}</span>
                        </div>
                      )}
                      {item.submitDate && (
                        <div className="flex justify-between">
                          <span>提交时间</span>
                          <span>{formatZhDateTime(item.submitDate)}</span>
                        </div>
                      )}
                      {item.markResult && (
                        <div className="flex justify-between">
                          <span>批改结果</span>
                          <span>{item.markResult}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function ExperimentChallengePage() {
  return (
    <ErrorBoundary>
      <ExperimentChallengePageInner />
    </ErrorBoundary>
  );
}
