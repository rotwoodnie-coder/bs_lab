"use client";

import * as React from "react";
import Link from "next/link";
import { Button, sonnerToast } from "@bs-lab/ui";
import { MonitorPlay } from "@bs-lab/ui/icons";

import {
  hasTeacherSubmittedSimulationDemand,
  submitTeacherSimulationDemand,
} from "@/lib/simulation-demand-store";
import { listExperimentsMissingOnlineSimulation } from "@/lib/experiments-without-simulation";
import { cn } from "@/lib/utils";

type TeacherSimulationDemandWidgetProps = {
  variant?: "compact" | "panel";
  className?: string;
};

/**
 * 首页「需求即任务」入口：无模拟器实验一键申请，写入 localStorage 并与管理端看板联动。
 */
export function TeacherSimulationDemandWidget({
  variant = "panel",
  className,
}: TeacherSimulationDemandWidgetProps) {
  const missing = React.useMemo(() => listExperimentsMissingOnlineSimulation().slice(0, 4), []);
  const [, tick] = React.useReducer((n) => n + 1, 0);

  const apply = React.useCallback((experimentId: string) => {
    const { totalTeachers, newlyCounted } = submitTeacherSimulationDemand(experimentId);
    tick();
    if (newlyCounted) {
      sonnerToast.success("建议已直达教育局", {
        description: `当前共 ${totalTeachers} 位教师共同申请。`,
      });
    } else {
      sonnerToast.message("您已提交过该需求", {
        description: `当前共 ${totalTeachers} 位教师共同申请。`,
      });
    }
  }, []);

  if (missing.length === 0) return null;

  return (
    <div
      className={cn(
        variant === "panel" && "rounded-xl border border-dashed border-primary/35 bg-primary/5 p-4",
        variant === "compact" && "rounded-md border border-border/60 bg-card/80 p-3 shadow-xs backdrop-blur-sm",
        className,
      )}
    >
      <div className="flex items-start gap-2">
        <MonitorPlay className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-sm font-semibold text-foreground">申请开发在线模拟</p>
          <p className="text-xs text-muted-foreground">
            下列实验尚无交互模拟，提交后需求将汇总至区级「模拟开发任务」队列。
          </p>
        </div>
      </div>
      <ul className="mt-3 space-y-2">
        {missing.map((ex) => {
          const done = hasTeacherSubmittedSimulationDemand(ex.id);
          return (
            <li
              key={ex.id}
              className="flex flex-col gap-2 rounded-lg border border-border/80 bg-card/60 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{ex.title}</p>
                <p className="text-xs text-muted-foreground">
                  {ex.gradeLabel} · {ex.categoryLabel}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <Button type="button" variant="secondary" size="sm" asChild>
                  <Link href={`/experiments/${ex.id}`}>查看详情</Link>
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={done ? "outline" : "default"}
                  disabled={done}
                  onClick={() => apply(ex.id)}
                >
                  {done ? "已申请" : "申请开发"}
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
