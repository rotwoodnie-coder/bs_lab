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
  Switch,
  sonnerToast,
} from "@bs-lab/ui";
import { CheckCircle2, Trophy, Video } from "@bs-lab/ui/icons";

import { useDemoRole } from "@/components/layout/demo-role-context";
import { UserRole } from "@/types/auth";
import {
  markStudentWorkAsDistrictSample,
  useStudentWorksPipeline,
} from "@/store/works-pipeline-mock-store";

export type StudentWorksPipelineCardProps = {
  /** 仅展示关联该实验台账 id 的待审作品（与评审页 expId 对齐） */
  sourceExperimentId?: string | null;
};

/** 与 Gemini 建议一致：学生拍同款 → 待审 → 通过后进实验圈并触发亲子报告（Mock 提示）。 */
export function StudentWorksPipelineCard({ sourceExperimentId }: StudentWorksPipelineCardProps) {
  const { role } = useDemoRole();
  const isResearcher = role === UserRole.RESEARCHER || role === UserRole.SUPER_ADMIN;
  const [globalScope, setGlobalScope] = React.useState(true);
  const { pending, approve, reject } = useStudentWorksPipeline();

  const filteredPending = React.useMemo(() => {
    if (!sourceExperimentId) return pending;
    return pending.filter((w) => w.sourceExperimentId === sourceExperimentId);
  }, [pending, sourceExperimentId]);

  const visiblePending = React.useMemo(() => {
    if (!isResearcher || globalScope) return filteredPending;
    return filteredPending.filter((w) => (w.schoolName ?? "宝山实验学校") === "宝山实验学校");
  }, [isResearcher, globalScope, filteredPending]);

  if (filteredPending.length === 0) {
    return (
      <Card className="border-dashed border-border bg-muted/20 shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">学生作品队列（拍同款）</CardTitle>
          <CardDescription className="text-xs">
            {sourceExperimentId
              ? "当前实验暂无待审核作品。学生提交拍同款或过程素材后将出现在此。"
              : "暂无待审核。学生可在实验详情页「拍同款并提交审核」后，此处将出现条目并与实验圈 Feed 联动（）。"}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (visiblePending.length === 0) {
    return (
      <Card className="border-dashed border-border bg-muted/20 shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">学生作品队列（拍同款）</CardTitle>
          <CardDescription className="text-xs">
            当前为「本校」视图，暂无待审条目。可开启「全区巡检」查看跨校队列（）。
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="border-primary/25 bg-primary/5 shadow-none">
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-sm font-medium">学生作品队列（拍同款）</CardTitle>
          <Badge variant="secondary" className="font-normal">
            待审 {filteredPending.length}
          </Badge>
        </div>
        <CardDescription className="text-xs">
          通过后将上架「实验圈」动态，并提示生成亲子报告（Mock）。
        </CardDescription>
        {isResearcher ? (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/60 bg-background/60 px-2 py-1.5">
            <span className="text-xs text-muted-foreground">全区巡检（跨校只读）</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{globalScope ? "全区" : "本校"}</span>
              <Switch checked={globalScope} onCheckedChange={setGlobalScope} aria-label="全区巡检" />
            </div>
          </div>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-2">
        {visiblePending.map((w) => (
          <div
            key={w.id}
            className="flex flex-col gap-2 rounded-lg border border-border bg-background px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex min-w-0 flex-1 gap-3">
              {w.capturePreviewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- mock data URL
                <img
                  src={w.capturePreviewUrl}
                  alt=""
                  className="size-14 shrink-0 rounded-md border border-border object-cover"
                />
              ) : (
                <div className="flex size-14 shrink-0 items-center justify-center rounded-md border border-border bg-muted/30">
                  <Video className="size-6 text-muted-foreground" aria-hidden />
                </div>
              )}
              <div className="min-w-0 space-y-0.5">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Video className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                  <span className="truncate">{w.title}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  源实验：{w.sourceExperimentTitle} · {w.studentLabel}
                  {w.schoolName ? (
                    <span className="ml-1 font-medium text-foreground">· {w.schoolName}</span>
                  ) : null}
                  {w.sessionId ? (
                    <span className="ml-1 font-mono text-[10px] opacity-80">· {w.sessionId.slice(0, 8)}…</span>
                  ) : null}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              {isResearcher ? (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="gap-1"
                  onClick={() => {
                    markStudentWorkAsDistrictSample(w.id);
                    sonnerToast.success("已标注全区样板（Mock）", {
                      description: "实验圈动态已插入 DISTRICT_MODEL 条目",
                    });
                  }}
                >
                  <Trophy className="size-3.5" />
                  全区样板
                </Button>
              ) : null}
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  reject(w.id);
                  sonnerToast.message("已驳回（Mock）", { description: w.id });
                }}
              >
                驳回
              </Button>
              <Button
                type="button"
                size="sm"
                className="gap-1"
                onClick={() => {
                  approve(w.id);
                  sonnerToast.success("已通过 · 已上架实验圈（Mock）", {
                    description: `亲子报告生成任务已入队（）· ${w.id}`,
                  });
                }}
              >
                <CheckCircle2 className="size-3.5" />
                通过
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
