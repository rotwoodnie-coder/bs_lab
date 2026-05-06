 "use client";

import * as React from "react";
import Link from "next/link";
import { Badge, Card } from "@bs-lab/ui";
import { Eye, ThumbsUp } from "@bs-lab/ui/icons";

import { ExpMsgCoverPreview } from "@/components/business/experiment-manage/ExpMsgCoverPreview";
import { cn } from "@/lib/utils";
import type { EditorPeerRow } from "@/app/(dashboard)/teacher/experiment-editor/utils/editor-peer-row-types";
import { EXP_MSG_STATUS_LABEL } from "@/lib/v2/exp-display-mapping";

function statusTagText(row: EditorPeerRow): string {
  if (row.lifecycleStatus === "PUBLISHED" || row.workflowStatus === "published") return EXP_MSG_STATUS_LABEL.y;
  if (row.workflowStatus === "changes_requested") return EXP_MSG_STATUS_LABEL.n;
  return EXP_MSG_STATUS_LABEL.t;
}

function metricText(n: number | null | undefined): string {
  if (n == null) return "-";
  if (!Number.isFinite(n) || n <= 0) return "-";
  return Math.round(n).toLocaleString("zh-CN");
}

function metricActive(n: number | null | undefined): boolean {
  if (n == null) return false;
  if (!Number.isFinite(n)) return false;
  return n > 0;
}

export function ExperimentCourseGridCard(props: { row: EditorPeerRow; href: string }) {
  const { row, href } = props;

  const subject = row.subjectLabel?.trim() ? row.subjectLabel.trim() : "—";
  const grade = row.gradeLabels?.length ? row.gradeLabels.join("、") : "—";
  const likes = row.copyCount ?? 0;

  return (
    <Link
      href={href}
      className="block w-[362.89px] outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
      aria-label={`查看实验：${row.title}`}
    >
      <Card className="group relative overflow-hidden rounded-xl border border-border bg-card shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
        <div className="relative p-2">
          <div className="overflow-hidden rounded-xl bg-muted/10">
            {row.coverVideoUrl ? (
              <ExpMsgCoverPreview coverUrl={row.coverVideoUrl} title={row.title} />
            ) : (
              <div className="flex aspect-video w-full items-center justify-center bg-muted text-sm text-muted-foreground">
                暂无封面
              </div>
            )}
          </div>

          <div className="pointer-events-none absolute right-3 top-3">
            <Badge variant="secondary" className="pointer-events-auto h-5 rounded-md bg-slate-100 px-2 text-[10px] font-medium text-slate-500">
              {statusTagText(row)}
            </Badge>
          </div>
        </div>

        <div className="space-y-2 px-3 pb-3 pt-1">
          <div className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">{row.title}</div>
          <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
            <span className="truncate">{subject} · {grade}</span>
            <span className="inline-flex shrink-0 items-center gap-3">
              <span className="inline-flex items-center gap-1 text-xs text-slate-500 tabular-nums">
                <Eye className={cn("size-4 text-slate-400", !metricActive(null) && "opacity-40")} aria-hidden />
                {metricText(null)}
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-slate-500 tabular-nums">
                <ThumbsUp className={cn("size-4 text-slate-400", !metricActive(likes) && "opacity-40")} aria-hidden />
                {metricText(likes)}
              </span>
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}

