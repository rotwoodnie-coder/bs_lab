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
import { Bell, ChevronRight, Loader2 } from "@bs-lab/ui/icons";

import { ErrorBoundary } from "@/components/business/error-boundary";
import { useParentTasksPage } from "./page.hooks";
import { useSessionActor } from "@/hooks/use-session-actor";
import { isSuperUserRole } from "@/lib/rbac/management-access";
import { UserRole } from "@/types/auth";

const STATUS_MAP: Record<string, { variant: "default" | "secondary" | "outline"; label: string }> = {
  pending: { variant: "outline", label: "待开始" },
  submitted: { variant: "secondary", label: "已提交" },
  marked: { variant: "default", label: "已批改" },
};

function formatDueDate(iso: string | null): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("zh-CN", {
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function ParentTasksPageInner() {
  const { role } = useSessionActor();
  const {
    loading,
    tasks,
    firstBinding,
    firstBindingDisplay,
    refresh,
    startFromTask,
  } = useParentTasksPage();

  if (role !== UserRole.PARENT && !isSuperUserRole(role)) {
    return (
      <div className="rounded-xl border border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
        当前页面面向家长角色。
        <div className="mt-4">
          <Link href="/" className="text-primary underline-offset-4 hover:underline">
            返回首页
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <Bell className="size-5 text-primary" aria-hidden />
          <h1 className="text-lg font-semibold text-foreground">任务中心</h1>
        </div>
        <p className="text-sm text-muted-foreground">展示已绑定孩子的实验作业任务，可跳转进入实验辅导。</p>
      </header>

      {!firstBinding ? (
        <Card className="border-dashed border-primary/35 bg-primary/5 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">尚未绑定孩子</CardTitle>
            <CardDescription>完成任务筛选前，请先建立家庭关系（不在本页嵌套绑定表单）。</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button type="button" asChild>
              <Link href="/profile/family" onClick={() => refresh()}>
                去绑定孩子
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border/80 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">老师下发的实验作业</CardTitle>
            <CardDescription className="text-xs">
              已绑定：{firstBindingDisplay.displayName}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                加载中…
              </div>
            ) : tasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">暂无作业。</p>
            ) : (
              tasks.map((t) => {
                const s = STATUS_MAP[t.status] ?? { variant: "outline", label: "待开始" };
                return (
                  <div
                    key={t.seqId}
                    className="flex items-start justify-between gap-3 rounded-lg border border-border/70 bg-card px-3 py-3"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="font-medium text-foreground">{t.expName}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.requireDate ? `截止：${formatDueDate(t.requireDate)}` : ""}
                        {t.teacherName ? ` · ${t.teacherName}老师` : ""}
                      </p>
                      <div className="flex flex-wrap gap-2 pt-1">
                        <Badge variant={s.variant}>{s.label}</Badge>
                        <Badge variant="outline" className="font-mono text-[10px]">
                          {t.studentName}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      className="shrink-0 gap-1"
                      disabled={t.status === "marked"}
                      onClick={() => startFromTask(t)}
                    >
                      {t.status === "marked" ? "已完成" : "开始实验"}
                      <ChevronRight className="size-4" aria-hidden />
                    </Button>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      )}

      <Button type="button" variant="outline" size="sm" className="w-full" asChild>
        <Link href="/parent/lab">进入家庭实验室</Link>
      </Button>
    </div>
  );
}

export default function ParentTasksPage() {
  return (
    <ErrorBoundary>
      <ParentTasksPageInner />
    </ErrorBoundary>
  );
}
