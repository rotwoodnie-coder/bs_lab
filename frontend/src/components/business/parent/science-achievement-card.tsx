"use client";

import * as React from "react";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, sonnerToast } from "@bs-lab/ui";
import { Share2 } from "@bs-lab/ui/icons";

import type { ParentReportRecord } from "@/types/parent-contract";

export type ScienceAchievementCardProps = {
  report: ParentReportRecord;
  experimentTitle: string;
  heroImageUrl?: string;
  shareUrl: string;
  /** 批改闭环：展示教师署名（） */
  teacherDisplayName?: string;
  /** 1–5 结构化汇总星（） */
  teacherStarRating?: number;
};

/** AI 点评雷达（Mock）：五维 0–1，与 improvements/strengths 长度弱相关 */
function AiRadarMock({ report }: { report: ParentReportRecord }) {
  const base = 0.72 + Math.min(report.strengths.length, 4) * 0.04;
  const imp = Math.min(report.improvements.length, 4) * 0.03;
  const values = [
    Math.min(0.95, base),
    Math.min(0.94, base + 0.06 - imp),
    Math.min(0.9, base - imp),
    Math.min(0.92, base + 0.02),
    Math.min(0.93, base + 0.04 - imp * 0.5),
  ];
  const cx = 100;
  const cy = 100;
  const r = 72;
  const axes = values.length;
  const points = values
    .map((v, i) => {
      const a = (-Math.PI / 2 + (i * 2 * Math.PI) / axes) as number;
      const x = cx + r * v * Math.cos(a);
      const y = cy + r * v * Math.sin(a);
      return `${x},${y}`;
    })
    .join(" ");
  const labels = ["探究习惯", "安全规范", "观察记录", "表达交流", "好奇心"];
  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-xs font-medium text-muted-foreground">AI 点评雷达（）</p>
      <svg viewBox="0 0 200 200" className="h-40 w-40 text-primary" aria-hidden>
        <polygon
          points={`${cx},${cy - r} ${cx + r * 0.95},${cy - r * 0.3} ${cx + r * 0.6},${cy + r * 0.85} ${cx - r * 0.6},${cy + r * 0.85} ${cx - r * 0.95},${cy - r * 0.3}`}
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.15}
          strokeWidth={1}
        />
        <polygon points={points} fill="currentColor" fillOpacity={0.22} stroke="currentColor" strokeWidth={1.5} />
        {labels.map((label, i) => {
          const a = (-Math.PI / 2 + (i * 2 * Math.PI) / axes) as number;
          const lx = cx + (r + 18) * Math.cos(a);
          const ly = cy + (r + 18) * Math.sin(a);
          return (
            <text
              key={label}
              x={lx}
              y={ly}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-muted-foreground text-[9px]"
            >
              {label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

export function ScienceAchievementCard({
  report,
  experimentTitle,
  heroImageUrl,
  shareUrl,
  teacherDisplayName,
  teacherStarRating,
}: ScienceAchievementCardProps) {
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      sonnerToast.success("已复制分享链接", { description: shareUrl });
    } catch {
      sonnerToast.error("复制失败", { description: shareUrl });
    }
  };

  return (
    <Card className="overflow-hidden border-border shadow-sm">
      <CardHeader className="border-b border-border bg-muted/20 pb-3">
        <CardTitle className="text-base">科学成就卡</CardTitle>
        <CardDescription className="text-xs">
          字段对齐亲子报告契约 · 可分享展示
          {teacherDisplayName ? (
            <span className="mt-1 block text-foreground/90">指导老师 · {teacherDisplayName}</span>
          ) : null}
          {typeof teacherStarRating === "number" ? (
            <span className="mt-0.5 block font-medium text-primary">综合星级 · {teacherStarRating} / 5</span>
          ) : null}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 p-4">
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="grid gap-3 p-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] sm:items-center">
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">实验瞬间</p>
              {heroImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- mock data URL
                <img src={heroImageUrl} alt="" className="aspect-video w-full rounded-lg border border-border object-cover" />
              ) : (
                <div className="flex aspect-video w-full items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 text-xs text-muted-foreground">
                  暂无抓拍图
                </div>
              )}
              <p className="text-sm font-semibold text-foreground">{experimentTitle}</p>
              <p className="text-sm text-foreground/90">{report.summary}</p>
            </div>
            <AiRadarMock report={report} />
          </div>
        </div>

        <div className="rounded-lg border border-border bg-muted/15 p-3 text-xs text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">亮点：</span>
            {report.strengths.join("、")}
          </p>
          <p className="mt-2">
            <span className="font-medium text-foreground">AI 建议：</span>
            {report.improvements.join("、")}
          </p>
          <p className="mt-2">
            <span className="font-medium text-foreground">教师评语：</span>
            {report.teacherComment?.trim() || "老师评语文案将在批改后同步（）"}
          </p>
        </div>

        <Button type="button" variant="secondary" className="w-full gap-2" onClick={() => void copyLink()}>
          <Share2 className="size-4" aria-hidden />
          复制分享链接
        </Button>
      </CardContent>
    </Card>
  );
}
