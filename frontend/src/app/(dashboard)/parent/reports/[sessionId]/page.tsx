"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@bs-lab/ui";

import { ErrorBoundary } from "@/components/business/error-boundary";
import { ScienceAchievementCard } from "@/components/business/parent/science-achievement-card";
import { useSessionActor } from "@/hooks/use-session-actor";
import { useParentReportPage } from "./page.hooks";
import { adaptReportForCard } from "@/lib/v2/v2-parent-session-api";
import { isSuperUserRole } from "@/lib/rbac/management-access";
import { UserRole } from "@/types/auth";

export default function ParentReportAchievementPage() {
  return (
    <ErrorBoundary>
      <ParentReportAchievementPageInner />
    </ErrorBoundary>
  );
}

function ParentReportAchievementPageInner() {
  const { role } = useSessionActor();
  const { loading, report, sessionDetail, sessionId } = useParentReportPage();
  const [origin, setOrigin] = React.useState("");

  React.useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  if (role !== UserRole.PARENT && !isSuperUserRole(role)) {
    return (
      <div className="rounded-xl border border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
        仅家长可查看成就卡。
        <div className="mt-4">
          <Link href="/" className="text-primary underline-offset-4 hover:underline">返回首页</Link>
        </div>
      </div>
    );
  }

  if (!sessionId || (!loading && !report)) {
    return (
      <div className="mx-auto max-w-lg space-y-4 px-1 py-8">
        <p className="text-sm text-muted-foreground">
          未找到该会话或报告未生成。完成亲子辅导后生成报告即可在此查看成就卡。
        </p>
        <Button type="button" variant="outline" asChild>
          <Link href="/parent/tasks">返回任务中心</Link>
        </Button>
      </div>
    );
  }

  if (loading || !report) {
    return (
      <div className="mx-auto max-w-lg py-8 text-center text-sm text-muted-foreground">加载中…</div>
    );
  }

  const shareUrl = origin ? `${origin}/parent/reports/${sessionId}` : `/parent/reports/${sessionId}`;
  const teacherDisplayName = sessionDetail?.teacherName ? `${sessionDetail.teacherName}老师` : undefined;
  const experimentTitle = sessionDetail?.expName ?? "亲子实验";

  return (
    <div className="mx-auto max-w-lg space-y-4 py-4">
      <ScienceAchievementCard
        report={adaptReportForCard(report)}
        experimentTitle={experimentTitle}
        shareUrl={shareUrl}
        teacherDisplayName={teacherDisplayName}
        teacherStarRating={sessionDetail?.teacherStarRating ?? undefined}
      />
      <Button type="button" variant="ghost" size="sm" className="w-full" asChild>
        <Link href={`/parent/sessions/${sessionId}`}>返回辅导会话</Link>
      </Button>
    </div>
  );
}
