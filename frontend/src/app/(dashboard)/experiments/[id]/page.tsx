"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@bs-lab/ui";

import { ErrorBoundary } from "@/components/business/error-boundary";
import { ExperimentHubView } from "@/components/business/experiment-detail/experiment-hub-view";
import { useAuth } from "@/hooks/use-auth";
import { fetchV2ExpDetail, fetchV2SchoolGrades, fetchV2SchoolSubjects, type V2DictGradeItem, type V2DictItem, type V2ExpMsgDetail } from "@/lib/v2/v2-exp-api";
import { V2ApiServiceError } from "@/lib/v2/apiService";
import { v2ExpMsgDetailToExperimentHubDetail } from "@/lib/v2/v2-exp-to-experiment";

export default function ExperimentDetailDashboardPage() {
  return (
    <ErrorBoundary>
      <ExperimentDetailDashboardPageInner />
    </ErrorBoundary>
  );
}

function ExperimentDetailDashboardPageInner() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const { user } = useAuth();
  const actor = React.useMemo(
    () => ({ role: user.role, orgId: user.orgId, userId: user.userId, userName: user.userName, tenantId: user.tenantId, appId: user.appId }),
    [user.appId, user.orgId, user.role, user.tenantId, user.userId, user.userName],
  );

  const [subjects, setSubjects] = React.useState<V2DictItem[]>([]);
  const [grades, setGrades] = React.useState<V2DictGradeItem[]>([]);
  const [rawDetail, setRawDetail] = React.useState<V2ExpMsgDetail | null>(null);
  const [loadError, setLoadError] = React.useState<"not_found" | "error" | null>(null);

  React.useEffect(() => {
    void fetchV2SchoolSubjects(actor).then(setSubjects).catch(() => {});
    void fetchV2SchoolGrades(actor).then(setGrades).catch(() => {});
  }, [actor]);

  React.useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setRawDetail(null);
    setLoadError(null);
    void fetchV2ExpDetail(actor, id)
      .then((d) => {
        if (cancelled) return;
        setRawDetail(d);
      })
      .catch((err) => {
        if (cancelled) return;
        const http = V2ApiServiceError.getHttpStatus(err);
        if (http === 404) {
          setLoadError("not_found");
          return;
        }
        setLoadError("error");
      });
    return () => {
      cancelled = true;
    };
  }, [actor, id]);

  const detail = React.useMemo(() => {
    if (!rawDetail) return null;
    return v2ExpMsgDetailToExperimentHubDetail(rawDetail, { grades, subjects });
  }, [grades, rawDetail, subjects]);

  if (!id) {
    return (
      <div className="space-y-4 rounded-xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center">
        <p className="text-sm text-muted-foreground">缺少实验 ID。</p>
        <Button type="button" variant="outline" size="sm" asChild>
          <Link href="/experiments">返回实验库</Link>
        </Button>
      </div>
    );
  }

  if (loadError === "not_found") {
    return (
      <div className="space-y-4 rounded-xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center">
        <p className="text-sm text-muted-foreground">实验不存在。</p>
        <Button type="button" variant="outline" size="sm" asChild>
          <Link href="/experiments">返回实验库</Link>
        </Button>
      </div>
    );
  }

  if (loadError === "error") {
    return (
      <div className="space-y-4 rounded-xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center">
        <p className="text-sm text-muted-foreground">加载失败，请稍后重试。</p>
        <Button type="button" variant="outline" size="sm" asChild>
          <Link href="/experiments">返回实验库</Link>
        </Button>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="space-y-4 rounded-xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center">
        <p className="text-sm text-muted-foreground">加载中…</p>
        <Button type="button" variant="outline" size="sm" asChild>
          <Link href="/experiments">返回实验库</Link>
        </Button>
      </div>
    );
  }

  return <ExperimentHubView detail={detail} variant="B" />;
}
