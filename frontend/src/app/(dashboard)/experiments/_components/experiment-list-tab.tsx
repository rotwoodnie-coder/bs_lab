"use client";

import * as React from "react";
import Link from "next/link";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@bs-lab/ui";
import { FlaskConical } from "@bs-lab/ui/icons";

import { DASHBOARD_MAIN_CONTAINER_CLASS } from "@/lib/layout-container-classes";
import { formatZhDateTime } from "@/lib/datetime/format-zh";
import { useAuth } from "@/hooks/use-auth";
import type { CoreApiActor } from "@/lib/core-api-shared";
import { useExperimentList, type FilterStatus } from "../page.hooks";

const FILTER_OPTIONS: { value: FilterStatus; label: string }[] = [
  { value: "all", label: "全部" },
  { value: "pending", label: "待完成" },
  { value: "submitted", label: "已提交" },
  { value: "marked", label: "已批改" },
];

const STATUS_BADGE: Record<string, { label: string; variant: "outline" | "secondary" | "default" }> = {
  pending: { label: "待完成", variant: "outline" },
  submitted: { label: "已提交", variant: "secondary" },
  marked: { label: "已批改", variant: "default" },
};

function actorFromUser(user: ReturnType<typeof useAuth>["user"]): CoreApiActor {
  return {
    role: user.role,
    userId: user.userId,
    userName: user.userName,
    orgId: user.orgId,
    tenantId: user.tenantId,
    appId: user.appId,
  };
}

export function ExperimentListTab() {
  const { user } = useAuth();
  const actor = React.useMemo(() => actorFromUser(user), [user]);
  const { items, loading, error, filter, setFilter } = useExperimentList(actor);

  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">共 {items.length} 个实验任务</p>
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
        <div className="flex min-h-[200px] items-center justify-center text-sm text-muted-foreground">
          加载中…
        </div>
      ) : error ? (
        <div className="flex min-h-[200px] items-center justify-center text-sm text-destructive">
          加载失败：{error}
        </div>
      ) : items.length === 0 ? (
        <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
          <FlaskConical className="size-10 opacity-40" />
          <p>暂无实验任务</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const badge = STATUS_BADGE[item.status] ?? { label: item.status, variant: "outline" as const };
            return (
              <Link key={item.seqId} href={`/experiments/${item.expId}`} className="block">
                <Card className="h-full cursor-pointer border-border/80 shadow-sm transition-colors hover:border-primary/40">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="line-clamp-2 text-sm font-medium leading-snug">
                        {item.expName || "未命名实验"}
                      </CardTitle>
                      <Badge variant={badge.variant} className="shrink-0 whitespace-nowrap text-xs">
                        {badge.label}
                      </Badge>
                    </div>
                    {item.teacherName && (
                      <CardDescription className="text-xs">{item.teacherName}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-1 text-xs text-muted-foreground">
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
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
