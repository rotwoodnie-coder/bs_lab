"use client";

import * as React from "react";
import {
  Badge,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Separator,
} from "@bs-lab/ui";

export type ExperimentReportData = {
  experimentCode: string;
  studentName: string;
  instructorName: string;
  experimentDate: string;
  purpose: string;
  equipment: string[];
  stepsSummary: string;
  resultFigureCaption: string;
  conclusion: string;
  teacherComment: string;
};

export type ReportDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: ExperimentReportData | null;
};

export function ReportDialog({ open, onOpenChange, data }: ReportDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="max-h-[min(92vh,880px)] w-[min(94vw,520px)] max-w-none gap-0 overflow-hidden border-0 bg-transparent p-0 shadow-none sm:max-w-none"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>数字化实验报告预览</DialogTitle>
          <DialogDescription>实验编号 {data?.experimentCode ?? ""} 的报告内容</DialogDescription>
        </DialogHeader>

        {data ? (
          <div className="max-h-[min(92vh,880px)] overflow-y-auto rounded-xl border border-border bg-background shadow-xl">
            <article className="relative mx-auto max-w-none space-y-8 px-6 py-8 sm:px-10 sm:py-10">
              <header className="space-y-4 border-b border-border pb-6">
                <p className="text-center text-xs font-medium tracking-widest text-muted-foreground uppercase">
                  数字化实验报告
                </p>
                <div className="grid gap-3 text-sm sm:grid-cols-2">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">实验编号</p>
                    <p className="font-mono text-sm font-medium text-foreground">{data.experimentCode}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">学生姓名</p>
                    <p className="text-sm font-medium text-foreground">{data.studentName}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">指导教师</p>
                    <p className="text-sm font-medium text-foreground">{data.instructorName}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">实验日期</p>
                    <p className="text-sm font-medium text-foreground">{data.experimentDate}</p>
                  </div>
                </div>
              </header>

              <section className="space-y-3">
                <h2 className="text-sm font-semibold text-foreground">实验目的</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">{data.purpose}</p>
              </section>

              <section className="space-y-3">
                <h2 className="text-sm font-semibold text-foreground">器材清单</h2>
                <div className="flex flex-wrap gap-2">
                  {data.equipment.map((name) => (
                    <Badge key={name} variant="secondary">
                      {name}
                    </Badge>
                  ))}
                </div>
              </section>

              <section className="space-y-3">
                <h2 className="text-sm font-semibold text-foreground">实验步骤简述</h2>
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
                  {data.stepsSummary}
                </p>
              </section>

              <Separator />

              <section className="space-y-4">
                <h2 className="text-sm font-semibold text-foreground">实验成果</h2>
                <figure className="space-y-2">
                  <div className="overflow-hidden rounded-lg border-2 border-border bg-muted/40 p-2 shadow-inner">
                    <div
                      className="relative aspect-video w-full overflow-hidden rounded-md bg-gradient-to-br from-primary/15 via-muted to-accent/20"
                      role="img"
                      aria-label="实验现象示意（Mock）"
                    >
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="flex gap-2 opacity-80">
                          <span className="size-16 rounded-full border-2 border-primary/40 bg-primary/10" />
                          <span className="size-10 self-end rounded-md border border-border bg-background/80" />
                          <span className="size-12 rounded-full border border-dashed border-muted-foreground/40" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <figcaption className="text-center text-xs text-muted-foreground">
                    {data.resultFigureCaption}
                  </figcaption>
                </figure>
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">结论</h3>
                  <p className="text-sm leading-relaxed text-foreground">{data.conclusion}</p>
                </div>
              </section>

              <footer className="border-t border-dashed border-border pt-6">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  教师评语
                </p>
                <blockquote
                  className="border-l-4 border-primary/25 bg-muted/30 py-3 pr-4 pl-5 text-sm leading-relaxed text-foreground italic"
                  style={{ fontFamily: "ui-serif, Georgia, 'Segoe Script', 'Brush Script MT', cursive" }}
                >
                  {data.teacherComment}
                </blockquote>
              </footer>
            </article>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
