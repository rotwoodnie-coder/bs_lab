"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@bs-lab/ui";
import { AlertCircle, BookOpen, School, Users } from "@bs-lab/ui/icons";

export interface TeacherStats {
  teacherCount: number;
  classCoverageCount: number;
  subjectCount: number;
  unconfiguredCount: number;
}

// V0 StatCard 原版模式：图标右对齐 text-muted-foreground，无彩色背景块
interface StatCardProps {
  title: string;
  value: React.ReactNode;
  description?: string;
  Icon: React.ElementType;
}

function StatCard({ title, value, description, Icon }: StatCardProps) {
  return (
    <Card className="border border-border/80 bg-card shadow-none">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold tracking-wide text-foreground">
          {title}
        </CardTitle>
        <Icon className="h-5 w-5 text-foreground/70" />
      </CardHeader>
      <CardContent className="pt-0">
        {/* V0 统计卡：数字显著大于标签 */}
        <div className="text-3xl font-bold tabular-nums tracking-tight text-foreground">{value}</div>
        {description ? <p className="mt-1.5 text-xs font-normal leading-snug text-muted-foreground">{description}</p> : null}
      </CardContent>
    </Card>
  );
}

export function StatsCards({ stats, loading }: { stats: TeacherStats; loading?: boolean }) {
  const displayValue = (v: number) =>
    loading ? <span className="inline-block h-7 w-8 animate-pulse rounded bg-muted" /> : v;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="教师总数"
        value={displayValue(stats.teacherCount)}
        Icon={Users}
      />
      <StatCard
        title="班级覆盖数"
        value={displayValue(stats.classCoverageCount)}
        description="已分配至少一个班级"
        Icon={School}
      />
      <StatCard
        title="学科统计"
        value={displayValue(stats.subjectCount)}
        Icon={BookOpen}
      />
      <StatCard
        title="未配置教师"
        value={displayValue(stats.unconfiguredCount)}
        description="尚未分配任何班级"
        Icon={AlertCircle}
      />
    </div>
  );
}
