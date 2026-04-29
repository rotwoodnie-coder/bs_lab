"use client";

import * as React from "react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  sonnerToast,
} from "@bs-lab/ui";
import {
  Activity,
  AlertTriangle,
  Bug,
  RefreshCw,
  TrendingUp,
  Wrench,
} from "@bs-lab/ui/icons";

import { PageHeader } from "@/components/layout/page-header";
import { useAppMode } from "@/context/app-mode-context";
import { useSessionActor } from "@/hooks/use-session-actor";
import {
  fetchV2FeedbackGovernanceStats,
  fetchV2FeedbackList,
  updateV2Feedback,
} from "@/lib/v2/v2-feedback-api";
import { FEEDBACK_STATUS_LABEL, FEEDBACK_TYPE_LABEL, type GovernanceStats, type FeedbackItem } from "@/types/feedback";
import { FeedbackDetailSheet } from "@/components/business/feedback/feedback-detail-sheet";

export default function AdminAutoHealPage() {
  const { viewMode, setViewMode } = useAppMode();
  const { actor } = useSessionActor();
  const [stats, setStats] = React.useState<GovernanceStats | null>(null);
  const [triagedFeedbacks, setTriagedFeedbacks] = React.useState<FeedbackItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  // 详情侧栏
  const [detailFeedbackId, setDetailFeedbackId] = React.useState<string | null>(null);
  const [detailOpen, setDetailOpen] = React.useState(false);

  const loadData = React.useCallback(async () => {
    if (!actor) return;
    setLoading(true);
    try {
      const [s, triagedResult, todoResult] = await Promise.all([
        fetchV2FeedbackGovernanceStats(actor).catch(() => null),
        fetchV2FeedbackList(actor, { status: "AUTO_TRIAGED", pageSize: 20 }).catch(() => null),
        fetchV2FeedbackList(actor, { status: "TODO", pageSize: 50 }).catch(() => null),
      ]);
      if (s) setStats(s);

      const merged: FeedbackItem[] = [];
      const seen = new Set<string>();
      for (const r of [triagedResult, todoResult]) {
        if (!r) continue;
        for (const item of r.items) {
          if (!seen.has(item.feedbackId)) {
            seen.add(item.feedbackId);
            merged.push(item);
          }
        }
      }
      // 自动分诊的排前面，待处理的排后面
      merged.sort((a, b) => {
        if (a.status === "AUTO_TRIAGED" && b.status !== "AUTO_TRIAGED") return -1;
        if (a.status !== "AUTO_TRIAGED" && b.status === "AUTO_TRIAGED") return 1;
        return 0;
      });
      setTriagedFeedbacks(merged);
    } finally {
      setLoading(false);
    }
  }, [actor]);

  React.useEffect(() => {
    if (viewMode !== "management") {
      setViewMode("management", { suppressToast: true });
    }
  }, [viewMode, setViewMode]);

  React.useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleRefresh = async () => {
    if (!actor) return;
    setRefreshing(true);
    try {
      await loadData();
      sonnerToast.success("已刷新数据");
    } finally {
      setRefreshing(false);
    }
  };

  const handleMarkTriage = async (feedbackId: string) => {
    if (!actor) return;
    try {
      await updateV2Feedback(actor, feedbackId, { status: "AUTO_TRIAGED" });
      setTriagedFeedbacks((prev) =>
        prev.map((f) => (f.feedbackId === feedbackId ? { ...f, status: "AUTO_TRIAGED" as const } : f)),
      );
      sonnerToast.success("已标记为自动分诊");
    } catch {
      sonnerToast.error("操作失败");
    }
  };

  const handleMarkDone = async (feedbackId: string) => {
    if (!actor) return;
    try {
      await updateV2Feedback(actor, feedbackId, { status: "DONE" });
      setTriagedFeedbacks((prev) => prev.filter((f) => f.feedbackId !== feedbackId));
      sonnerToast.success("已标记为已上线");
    } catch {
      sonnerToast.error("操作失败");
    }
  };

  const statCards = [
    {
      label: "待处理反馈",
      value: stats?.totalNew ?? "—",
      icon: Bug,
      color: "text-destructive",
    },
    {
      label: "已自动分诊",
      value: stats?.totalAutoTriaged ?? "—",
      icon: Activity,
      color: "text-chart-4",
    },
    {
      label: "高频指纹",
      value: stats?.topFingerprints.length ?? 0,
      icon: TrendingUp,
      color: "text-primary",
    },
  ];

  return (
    <>
    <div className="mx-auto flex min-h-0 max-w-6xl flex-col gap-6">
      <PageHeader
        title="自动修复"
        description="系统自动捕获前端错误并上报为反馈，结合审计脚本生成修复建议。"
      >
        <Button
          size="sm"
          className="gap-1.5 rounded-lg bg-foreground text-background hover:bg-foreground/90"
          disabled={refreshing}
          onClick={handleRefresh}
        >
          <RefreshCw className={`size-3.5 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "刷新中…" : "刷新"}
        </Button>
      </PageHeader>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {statCards.map((card) => (
          <Card key={card.label} className="border-border shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.label}</CardTitle>
              <card.icon className={`size-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tabular-nums">
                {typeof card.value === "number" ? card.value : card.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 高频指纹 */}
      {stats && stats.topFingerprints.length > 0 && (
        <Card className="border-border shadow-xs">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">高频故障指纹</CardTitle>
              <Badge variant="secondary" className="text-[11px]">
                前 {stats.topFingerprints.length} 个
              </Badge>
            </div>
            <CardDescription>
              按频率降序排列的故障指纹，每个指纹关联一组同源反馈
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {stats.topFingerprints.map((fp) => (
              <div
                key={fp.issueFingerprint}
                className="flex items-center gap-3 rounded-lg border border-border bg-muted/20 px-4 py-2.5"
              >
                <AlertTriangle className="size-4 shrink-0 text-chart-4" />
                <code className="rounded bg-muted px-1.5 py-0.5 text-[13px] font-mono">
                  {fp.issueFingerprint}
                </code>
                <span className="ml-auto text-sm tabular-nums text-muted-foreground">
                  出现 {fp.count} 次
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* 反馈列表（自动分诊 + 待处理） */}
      <Card className="border-border shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-base">待处理反馈</CardTitle>
            <CardDescription>
              包含自动分诊（AUTO_TRIAGED）与待处理（TODO）的反馈，点击可查看详情与处理
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="py-4 text-center text-sm text-muted-foreground">加载中…</p>
          ) : triagedFeedbacks.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <Wrench className="size-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">暂无待处理的反馈。</p>
              <p className="text-xs text-muted-foreground/60">
                当系统捕获到错误并自动上报后，会出现在这里等待查看与确认。
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {triagedFeedbacks.map((fb) => (
                <div
                  key={fb.feedbackId}
                  className="flex cursor-pointer flex-wrap items-start justify-between gap-3 rounded-lg border border-border bg-muted/20 px-4 py-3 transition-colors hover:bg-muted/40"
                  onClick={() => {
                    setDetailFeedbackId(fb.feedbackId);
                    setDetailOpen(true);
                  }}
                >
                  <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={fb.type === "BUG" ? "destructive" : fb.type === "OPTIMIZE" ? "success" : "default"}>
                      {FEEDBACK_TYPE_LABEL[fb.type]}
                    </Badge>
                    {fb.issueFingerprint && (
                      <code className="rounded bg-muted px-1.5 py-0.5 text-[11px] font-mono">
                        {fb.issueFingerprint}
                      </code>
                    )}
                    <Badge variant="secondary">{FEEDBACK_STATUS_LABEL[fb.status]}</Badge>
                  </div>
                  <p className="text-sm font-medium leading-snug">{fb.title}</p>
                  {fb.reporter && (
                    <p className="text-xs text-muted-foreground">
                      {fb.reporter.name} · {fb.reporter.orgName}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {fb.status === "TODO" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkTriage(fb.feedbackId);
                      }}
                    >
                      标记为自动分诊
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkDone(fb.feedbackId);
                    }}
                  >
                    标记已上线
                  </Button>
                </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 操作说明 */}
      <Card className="border-border shadow-xs">
        <CardHeader>
          <CardTitle className="text-base">自动修复流程说明</CardTitle>
        </CardHeader>
        <CardContent className="text-sm leading-relaxed text-muted-foreground">
          <ol className="ml-4 list-decimal space-y-1">
            <li>前端 <code className="rounded bg-muted px-1.5 py-0.5 text-xs">GlobalErrorSentinel</code> 在运行时捕获未处理错误，自动上报为 BUG 类型反馈。</li>
            <li><code className="rounded bg-muted px-1.5 py-0.5 text-xs">scripts/auto-heal-audit.mjs</code> 脚本从 <code className="rounded bg-muted px-1.5 py-0.5 text-xs">sys_log</code> 读取 24 小时内的阻断日志，生成审计报告。</li>
            <li>审计脚本将可关联的反馈标记为 <code className="rounded bg-muted px-1.5 py-0.5 text-xs">AUTO_TRIAGED</code> 并写入修复建议到 <code className="rounded bg-muted px-1.5 py-0.5 text-xs">AUTO_HEAL_AUDIT.md</code>。</li>
            <li>管理员在此页面查看分诊结果，确认修复完成后点击「标记已上线」。</li>
          </ol>
        </CardContent>
      </Card>
    </div>

    <FeedbackDetailSheet
      feedbackId={detailFeedbackId}
      open={detailOpen}
      onOpenChange={setDetailOpen}
      onUpdated={loadData}
    />
    </>
  );
}
