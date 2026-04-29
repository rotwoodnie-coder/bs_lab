"use client";

import * as React from "react";
import { Button, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea, sonnerToast } from "@bs-lab/ui";
import { Send } from "@bs-lab/ui/icons";

import { StudentAiCoachPanel } from "@/components/business/experiment-detail/student-ai-coach-panel";
import { ExperimentLayoutBottomSlot } from "@/components/business/experiment-detail/experiment-layout";
import { DASHBOARD_MAIN_CONTAINER_CLASS } from "@/lib/layout-container-classes";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { fetchStudentTasks, submitStudentTask } from "@/lib/v2/v2-student-task-api";
import type { ExperimentDetail } from "@/types/experiment";
import type { CoreApiActor } from "@/lib/core-api-shared";

export type SubmissionBarProps = {
  detail: ExperimentDetail;
  className?: string;
};

/** 学生底部槽位：自评与实验报告提交。 */
export function SubmissionBar({ detail, className }: SubmissionBarProps) {
  const [rating, setRating] = React.useState("4");
  const [reportNote, setReportNote] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [taskSeqId, setTaskSeqId] = React.useState<string | null>(null);
  const { user } = useAuth();

  const actor = React.useMemo<CoreApiActor>(
    () => ({
      role: user.role as any,
      userId: user.userId,
      userName: user.userName || user.userId,
      orgId: user.orgId || "",
      tenantId: user.tenantId,
      appId: user.appId,
    }),
    [user],
  );

  // Fetch student tasks on mount to find the pending one matching this experiment
  React.useEffect(() => {
    if (!user.userId) return;
    let cancelled = false;
    (async () => {
      try {
        const tasks = await fetchStudentTasks(actor);
        if (cancelled) return;
        const match = tasks.find((t) => t.expId === detail.id && t.status === "pending");
        if (match) setTaskSeqId(match.seqId);
      } catch {
        /* silently fail — user will see error when submitting */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [actor, detail.id, user.userId]);

  const handleSubmit = React.useCallback(async () => {
    setSubmitting(true);
    try {
      if (!taskSeqId) {
        sonnerToast.error("未找到待提交的作业", {
          description: "当前实验未在任务列表中，请确认教师已发布该实验作业。",
        });
        return;
      }
      await submitStudentTask(actor, taskSeqId);
      sonnerToast.success("已提交", {
        description: `${detail.title} · 自评 ${rating} 星`,
      });
    } catch (e) {
      sonnerToast.error(e instanceof Error ? e.message : "提交失败");
    } finally {
      setSubmitting(false);
    }
  }, [actor, detail.title, rating, taskSeqId]);

  const gradeLabel = detail.teaching?.gradeLabel ?? detail.gradeLabel;

  return (
    <ExperimentLayoutBottomSlot id="student-submission-bar" className={cn("z-30", className)}>
      <div className={cn(DASHBOARD_MAIN_CONTAINER_CLASS, "space-y-4 py-3")}>
        <StudentAiCoachPanel gradeLabel={gradeLabel} experimentTitle={detail.title} />

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground sm:text-sm">学习反馈</span>
          <span className="text-xs text-muted-foreground">实验：{detail.title}</span>
        </div>
        <div className="grid gap-3 md:grid-cols-[minmax(0,160px)_1fr] md:items-end">
          <div className="space-y-2">
            <Label htmlFor="submission-rating">自评</Label>
            <Select value={rating} onValueChange={setRating}>
              <SelectTrigger id="submission-rating" className="w-full md:w-[160px]">
                <SelectValue placeholder="星级" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 星 · 完全掌握</SelectItem>
                <SelectItem value="4">4 星 · 基本掌握</SelectItem>
                <SelectItem value="3">3 星 · 仍需练习</SelectItem>
                <SelectItem value="2">2 星 · 困难较多</SelectItem>
                <SelectItem value="1">1 星 · 需要辅导</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="submission-report">实验报告摘要</Label>
            <Textarea
              id="submission-report"
              placeholder="记录现象、数据与反思…"
              value={reportNote}
              onChange={(e) => setReportNote(e.target.value)}
              className="min-h-[52px] resize-y sm:min-h-[56px]"
            />
          </div>
        </div>
        <Button type="button" size="sm" className="h-9 gap-1.5" onClick={handleSubmit} disabled={submitting}>
          <Send className="size-3.5" />
          {submitting ? "提交中…" : "提交评价与报告"}
        </Button>
      </div>
    </ExperimentLayoutBottomSlot>
  );
}
