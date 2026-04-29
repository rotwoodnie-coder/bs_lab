"use client";

import * as React from "react";
import { Badge, Button, Card, CardContent } from "@bs-lab/ui";
import { FlaskConical, Loader2 } from "@bs-lab/ui/icons";

import { ErrorBoundary } from "@/components/business/error-boundary";
import { ReportDialog, type ExperimentReportData } from "@/components/business/report-dialog";
import { formatZhDateTime } from "@/lib/datetime/format-zh";
import { useFootprints, statusLabelZh, statusBadgeVariant } from "./page.hooks";
import type { StudentFootprintItem } from "@/lib/v2/v2-student-footprints-api";

function buildReportData(item: StudentFootprintItem): ExperimentReportData {
  return {
    experimentCode: item.expId,
    studentName: "",
    instructorName: item.teacherName,
    experimentDate: item.submitDate ?? "",
    purpose: "",
    equipment: [],
    stepsSummary: "",
    resultFigureCaption: "",
    conclusion: item.markComments ?? "（暂无评语）",
    teacherComment: item.markResult ? `批改结果：${item.markResult}` : "（待评价）",
  };
}

function primaryButtonLabel(item: StudentFootprintItem): string {
  if (item.status === "completed") return "查看报告";
  if (item.status === "pending_review") return "查看报告";
  return "查看";
}

function StudentFootprintsPageInner() {
  const { items, loading, error } = useFootprints();
  const [reportOpen, setReportOpen] = React.useState(false);
  const [activeReport, setActiveReport] = React.useState<ExperimentReportData | null>(null);

  const openReport = React.useCallback((item: StudentFootprintItem) => {
    setActiveReport(buildReportData(item));
    setReportOpen(true);
  }, []);

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">成长足迹</h1>
        <p className="text-sm text-muted-foreground">
          按时间回顾已完成的实验参与记录。
        </p>
      </header>

      <Card className="border-border shadow-xs">
        <CardContent className="p-6 sm:p-8">
          {loading ? (
            <div className="flex min-h-[200px] items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              加载中…
            </div>
          ) : error ? (
            <div className="flex min-h-[200px] items-center justify-center text-sm text-destructive">
              加载失败：{error}
            </div>
          ) : items.length === 0 ? (
            <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
              <FlaskConical className="size-10 opacity-40" />
              <p>暂无成长足迹记录</p>
            </div>
          ) : (
            <ol className="relative space-y-0 before:absolute before:top-2 before:bottom-2 before:left-[11px] before:w-px before:bg-border sm:before:left-[13px]">
              {items.map((item, index) => (
                <li key={item.seqId} className="relative flex gap-4 pb-10 last:pb-0 sm:gap-6">
                  <div
                    className="relative z-[1] flex size-6 shrink-0 items-center justify-center rounded-full border-2 border-background bg-primary shadow-xs ring-2 ring-border sm:size-7"
                    aria-hidden
                  >
                    <span className="size-2 rounded-full bg-primary-foreground sm:size-2.5" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-3 pt-0.5">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-1">
                        {item.submitDate && (
                          <time
                            className="text-xs font-medium text-muted-foreground tabular-nums"
                            dateTime={item.submitDate.replace(" ", "T")}
                          >
                            {formatZhDateTime(item.submitDate)}
                          </time>
                        )}
                        <h2 className="text-base font-semibold text-foreground">{item.expName}</h2>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant={statusBadgeVariant(item.status)}>
                            {statusLabelZh(item.status)}
                          </Badge>
                          {item.teacherName && (
                            <span className="text-xs text-muted-foreground">
                              {item.teacherName}
                            </span>
                          )}
                        </div>
                        {item.markResult && (
                          <p className="text-xs text-muted-foreground">
                            批改结果：{item.markResult}
                          </p>
                        )}
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant={item.status === "completed" ? "default" : "secondary"}
                        className="shrink-0 self-start"
                        onClick={() => openReport(item)}
                      >
                        {primaryButtonLabel(item)}
                      </Button>
                    </div>
                    {index < items.length - 1 ? (
                      <p className="sr-only">下一节点</p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>

      <ReportDialog open={reportOpen} onOpenChange={setReportOpen} data={activeReport} />
    </div>
  );
}

export default function StudentFootprintsPage() {
  return (
    <ErrorBoundary>
      <StudentFootprintsPageInner />
    </ErrorBoundary>
  );
}
