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
  Separator,
} from "@bs-lab/ui";
import { FlaskConical, Users } from "@bs-lab/ui/icons";

import { ManagementAnimatedNumber } from "@/components/business/management-animated-number";
import { PageHeader } from "@/components/layout/page-header";
import { useAppMode } from "@/context/app-mode-context";
import {
  SIMULATION_DEMAND_CHANGED_EVENT,
  listSimulationDevTasks,
  simulationDemandHeatTotal,
  simulationTaskStatusLabel,
  updateSimulationDevTask,
  type SimulationDevTask,
  type SimulationDevTaskStatus,
} from "@/lib/simulation-demand-store";
import { cn } from "@/lib/utils";

/** 按申请人数自动着色：红 / 黄 / 绿（语义色） */
function demandPriorityFromCount(count: number): { label: string; className: string } {
  if (count > 20) {
    return {
      label: "紧急",
      className: "border-destructive/50 bg-destructive/10 font-medium text-destructive",
    };
  }
  if (count > 10) {
    return {
      label: "关注",
      className: "border-chart-4/45 bg-chart-4/10 font-medium text-chart-4",
    };
  }
  return {
    label: "一般",
    className: "border-primary/25 bg-primary/8 font-medium text-foreground",
  };
}

function statusBadgeClass(status: SimulationDevTaskStatus): string {
  switch (status) {
    case "pending_review":
      return "border-border bg-secondary/80 text-secondary-foreground";
    case "in_development":
      return "border-primary/30 bg-primary/10 text-foreground";
    case "live":
      return "border-border bg-muted text-foreground";
    default:
      return "";
  }
}

export default function AdminSimulationDevPage() {
  const { viewMode, setViewMode } = useAppMode();
  const [tasks, setTasks] = React.useState<SimulationDevTask[]>([]);

  const refresh = React.useCallback(() => {
    setTasks(listSimulationDevTasks());
  }, []);

  React.useEffect(() => {
    if (viewMode !== "management") {
      setViewMode("management", { suppressToast: true });
    }
  }, [viewMode, setViewMode]);

  React.useEffect(() => {
    refresh();
    if (typeof window === "undefined") return;
    const onChange = () => refresh();
    window.addEventListener(SIMULATION_DEMAND_CHANGED_EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(SIMULATION_DEMAND_CHANGED_EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, [refresh]);

  const heatTotal = simulationDemandHeatTotal(tasks);

  return (
    <div className="mx-auto flex min-h-0 max-w-6xl flex-col gap-6">
      <PageHeader
        title="模拟开发管理"
        description="自动聚合全区教师的模拟需求勾选数据；优先级按申请人数标识，状态一键流转（本地存储）。"
      />

      <Card className="border-border shadow-xs">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">需求热力</CardTitle>
          <CardDescription>全区累计申请人次（含种子，教师端提交会实时累加）</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-3xl font-semibold tabular-nums text-foreground sm:text-4xl">
              <ManagementAnimatedNumber value={heatTotal} durationMs={1100} />
            </span>
            <span className="text-sm text-muted-foreground">人次</span>
          </div>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 className="text-sm font-semibold text-foreground">待办看板</h2>
          <p className="text-xs text-muted-foreground">排序：申请人数 ↓ · 紧迫程度 ↓</p>
        </div>

        {tasks.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
            暂无需求条目。请教师在实验详情「在线模拟」页提交申请，或清除本地存储后刷新以查看种子。
          </p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
            {tasks.map((t) => {
              const priority = demandPriorityFromCount(t.requestCount);
              return (
              <li key={t.experimentId}>
                <Card className="h-full rounded-xl border border-border shadow-sm transition-shadow hover:shadow-md">
                  <CardHeader className="space-y-2 p-5 pb-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <CardTitle className="text-base leading-snug">{t.title}</CardTitle>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary" className={cn("h-5 rounded-md px-1.5 text-[10px] font-medium", priority.className)}>
                          优先级 · {priority.label}
                        </Badge>
                        <Badge
                          variant="secondary"
                          className={cn("h-5 rounded-md px-1.5 text-[10px] font-medium", statusBadgeClass(t.status))}
                        >
                          {simulationTaskStatusLabel(t.status)}
                        </Badge>
                      </div>
                    </div>
                    <CardDescription className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="inline-flex items-center gap-1">
                        <FlaskConical className="size-3 text-slate-400" />
                        {t.subjectLabel}
                      </span>
                      <span className="inline-flex items-center gap-1.5 tabular-nums text-foreground">
                        <Users className="size-3 text-slate-400" />
                        <ManagementAnimatedNumber value={t.requestCount} durationMs={900} />
                        <span className="text-muted-foreground">位老师申请</span>
                      </span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 p-5 pt-0">
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">任务状态（一键标记）</p>
                      <div className="inline-flex w-full rounded-lg bg-muted/50 p-1">
                        {(
                          [
                            ["pending_review", simulationTaskStatusLabel("pending_review")],
                            ["in_development", simulationTaskStatusLabel("in_development")],
                            ["live", simulationTaskStatusLabel("live")],
                          ] as const
                        ).map(([value, label]) => (
                          <Button
                            key={value}
                            type="button"
                            size="sm"
                            variant="ghost"
                            className={cn(
                              "flex-1 rounded-md",
                              t.status === value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground",
                            )}
                            onClick={() => {
                              updateSimulationDevTask(t.experimentId, { status: value });
                              refresh();
                            }}
                          >
                            {label}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <Separator />
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                      <span className="tabular-nums">
                        最近申请：{t.lastRequestedAt ? new Date(t.lastRequestedAt).toLocaleString("zh-CN") : "—"}
                      </span>
                      <Link
                        href={`/experiments/${t.experimentId}`}
                        className="inline-flex items-center gap-1 font-medium text-primary underline-offset-4 hover:underline"
                      >
                        <span>打开实验详情</span>
                        <span aria-hidden>→</span>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </li>
            );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
