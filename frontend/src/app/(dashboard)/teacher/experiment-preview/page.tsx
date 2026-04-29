"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@bs-lab/ui";
import { ArrowLeft, ClipboardList, FlaskConical, AlertTriangle, ShieldAlert, Beaker } from "@bs-lab/ui/icons";

import { fetchV2ExpDetail, type V2ExpMsgDetail } from "@/lib/v2/v2-exp-api";
import { splitPrincipleStored } from "@/app/(dashboard)/teacher/experiment-editor/utils/exp-editor-text-fences";
import { formatZhDateTime } from "@/lib/datetime/format-zh";

export default function TeacherExperimentPreviewPage() {
  const searchParams = useSearchParams();
  const expId = searchParams.get("id");

  const [detail, setDetail] = React.useState<V2ExpMsgDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!expId) {
      setLoading(false);
      return;
    }
    const actor = createV2ApiService({ userId: "", role: "" });
    let cancelled = false;
    setLoading(true);
    setError(null);
    void fetchV2ExpDetail(actor, expId)
      .then((d) => {
        if (!cancelled) setDetail(d);
      })
      .catch(() => {
        if (!cancelled) setError("加载失败，请稍后重试");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [expId]);

  const parsed = React.useMemo(() => {
    if (!detail) return null;
    return splitPrincipleStored(detail.expPrinciple ?? "");
  }, [detail]);

  if (!expId) {
    return (
      <div className="mx-auto max-w-screen-lg px-4 py-12">
        <div className="space-y-4 rounded-xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">缺少实验 ID。</p>
          <Button type="button" variant="outline" size="sm" asChild>
            <Link href="/teacher/experiment-editor">返回编辑器</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-screen-lg px-4 py-12">
        <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
          加载中…
        </div>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="mx-auto max-w-screen-lg px-4 py-12">
        <div className="space-y-4 rounded-xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">{error ?? "实验不存在。"}</p>
          <Button type="button" variant="outline" size="sm" asChild>
            <Link href={`/teacher/experiment-editor?id=${encodeURIComponent(expId)}`}>返回编辑器</Link>
          </Button>
        </div>
      </div>
    );
  }

  const sortedSteps = [...(detail.steps ?? [])].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  const sortedMaterials = [...(detail.materials ?? [])].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  return (
    <div className="mx-auto max-w-screen-lg space-y-6 px-4 py-4 sm:px-6 sm:py-6">
      {/* 头部 */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {detail.expName || "未命名实验"}
          </h1>
          <p className="text-xs text-muted-foreground">
            {detail.createTime ? formatZhDateTime(detail.createTime) : ""}
            {detail.createUserId ? ` · ${detail.createUserId}` : ""}
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" className="gap-1.5" asChild>
          <Link
            href={{
              pathname: "/teacher/experiment-editor",
              query: { id: expId },
            }}
          >
            <ArrowLeft className="size-3.5" />
            返回编辑
          </Link>
        </Button>
      </div>

      {/* 驳回原因 */}
      {detail.rejectReason ? (
        <Card className="border border-red-200 bg-red-50/30 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-red-700">
              <ShieldAlert className="size-4" />
              驳回原因
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-800">{detail.rejectReason}</p>
          </CardContent>
        </Card>
      ) : null}

      {/* 实验原理 */}
      {parsed?.principle ? (
        <Card className="border-border shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="size-4 text-muted-foreground" />
              实验原理
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="prose prose-sm max-w-none text-muted-foreground"
              dangerouslySetInnerHTML={{ __html: parsed.principle }}
            />
          </CardContent>
        </Card>
      ) : null}

      {/* 实验视频 */}
      {detail.videos && detail.videos.length > 0 ? (
        <Card className="border-border shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FlaskConical className="size-4 text-muted-foreground" />
              实验视频
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="aspect-video overflow-hidden rounded-lg bg-muted">
              <video
                src={detail.videos[0].videoUrl ?? undefined}
                controls
                className="h-full w-full"
                poster={detail.coverVideoUrl ?? undefined}
              >
                您的浏览器不支持视频播放。
              </video>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* 安全提示 */}
      <div className="grid gap-6 sm:grid-cols-2">
        {parsed?.safetyNotes ? (
          <Card className="border border-amber-200 bg-amber-50/30 shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-amber-700">
                <AlertTriangle className="size-4" />
                安全提示
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="prose prose-sm max-w-none text-amber-800"
                dangerouslySetInnerHTML={{ __html: parsed.safetyNotes }}
              />
            </CardContent>
          </Card>
        ) : null}
        {parsed?.dangerNotes ? (
          <Card className="border border-red-200 bg-red-50/30 shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-red-700">
                <ShieldAlert className="size-4" />
                危险提示
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="prose prose-sm max-w-none text-red-800"
                dangerouslySetInnerHTML={{ __html: parsed.dangerNotes }}
              />
            </CardContent>
          </Card>
        ) : null}
      </div>

      {/* 实验步骤 */}
      {sortedSteps.length > 0 ? (
        <Card className="border-border shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="size-4 text-muted-foreground" />
              实验步骤（{sortedSteps.length}）
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {sortedSteps.map((step, idx) => (
              <div key={step.stepId} className="rounded-lg border border-border bg-muted/20 p-4">
                <h3 className="mb-2 text-sm font-semibold text-foreground">
                  步骤 {idx + 1}：{step.stepName || `步骤 ${idx + 1}`}
                </h3>
                {step.stepComments ? (
                  <div
                    className="prose prose-sm max-w-none text-muted-foreground"
                    dangerouslySetInnerHTML={{ __html: step.stepComments }}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">—</p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {/* 实验材料 */}
      {sortedMaterials.length > 0 ? (
        <Card className="border-border shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Beaker className="size-4 text-muted-foreground" />
              实验材料（{sortedMaterials.length}）
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {sortedMaterials.map((m) => (
                <div key={m.expMaterialId} className="rounded-lg border border-border p-3">
                  <p className="text-sm font-medium text-foreground">{m.materialName || "材料"}</p>
                  {m.comments ? (
                    <p className="mt-1 text-xs text-muted-foreground">{m.comments}</p>
                  ) : null}
                  {m.mainPicUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={m.mainPicUrl}
                      alt={m.materialName || ""}
                      className="mt-2 h-20 w-full rounded object-cover"
                      loading="lazy"
                    />
                  ) : null}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* 底部返回 */}
      <div className="flex justify-center pt-2">
        <Button type="button" variant="outline" size="sm" className="gap-1.5" asChild>
          <Link
            href={{
              pathname: "/teacher/experiment-editor",
              query: { id: expId },
            }}
          >
            <ArrowLeft className="size-3.5" />
            返回编辑
          </Link>
        </Button>
      </div>
    </div>
  );
}
