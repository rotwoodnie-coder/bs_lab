"use client";

import * as React from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@bs-lab/ui";
import { ChevronLeft, ChevronRight, Play } from "@bs-lab/ui/icons";

import type { ResourceItem } from "@/types/resource";
import { cn } from "@/lib/utils";

export type ResourcePreviewProps = {
  resource: ResourceItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ResourcePreview({ resource, open, onOpenChange }: ResourcePreviewProps) {
  const [pdfPage, setPdfPage] = React.useState(1);
  const totalPdfPages = resource?.pdfPageCount ?? 6;

  React.useEffect(() => {
    if (resource?.kind === "pdf") setPdfPage(1);
  }, [resource?.id, resource?.kind]);

  if (!resource) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className={cn(
          "flex max-h-[100dvh] w-[100vw] max-w-none flex-col gap-0 overflow-hidden rounded-none border-0 p-0",
          "sm:max-h-[min(92dvh,880px)] sm:max-w-5xl sm:rounded-xl sm:border",
        )}
      >
        <DialogHeader className="shrink-0 space-y-1 border-b border-border px-4 py-3 text-left sm:px-6">
          <DialogTitle className="pr-10 text-base sm:text-lg">{resource.title}</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            {resource.stage} · {resource.subject} · 预览为界面，非真实文件流。
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
          {resource.kind === "video" ? (
            <div className="mx-auto max-w-4xl">
              <div className="relative aspect-video overflow-hidden rounded-lg border border-border bg-muted">
                <div
                  className={cn(
                    "absolute inset-0 bg-gradient-to-br opacity-90",
                    resource.coverClassName,
                  )}
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-foreground">
                  <div className="flex size-16 items-center justify-center rounded-full border-2 border-foreground/20 bg-background/80 shadow-md backdrop-blur-sm">
                    <Play className="size-8 text-primary" aria-hidden />
                  </div>
                  <p className="text-sm font-medium text-foreground">视频资源占位 · 点击播放（）</p>
                </div>
              </div>
            </div>
          ) : null}

          {resource.kind === "pdf" ? (
            <div className="mx-auto flex max-w-3xl flex-col gap-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm text-muted-foreground">
                  第 <span className="font-medium text-foreground">{pdfPage}</span> / {totalPdfPages} 页
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={pdfPage <= 1}
                    onClick={() => setPdfPage((p) => Math.max(1, p - 1))}
                    className="gap-1"
                  >
                    <ChevronLeft className="size-4" aria-hidden />
                    上一页
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={pdfPage >= totalPdfPages}
                    onClick={() => setPdfPage((p) => Math.min(totalPdfPages, p + 1))}
                    className="gap-1"
                  >
                    下一页
                    <ChevronRight className="size-4" aria-hidden />
                  </Button>
                </div>
              </div>

              <div
                className="relative perspective-[1200px]"
                style={{ perspective: "1200px" }}
              >
                <div
                  key={pdfPage}
                  className="origin-left animate-in fade-in-0 zoom-in-95 duration-300"
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border border-border bg-background p-4 shadow-md ring-1 ring-border/60">
                      <div className="mb-3 h-2 w-24 rounded bg-muted" />
                      <div className="space-y-2">
                        <div className="h-2 w-full rounded bg-muted" />
                        <div className="h-2 w-[92%] rounded bg-muted" />
                        <div className="h-2 w-[88%] rounded bg-muted" />
                        <div className="h-2 w-full rounded bg-muted" />
                        <div className="h-2 w-[70%] rounded bg-muted" />
                      </div>
                      <p className="mt-4 text-center text-xs text-muted-foreground">左页 · 正文区（示意）</p>
                    </div>
                    <div className="hidden rounded-lg border border-dashed border-border bg-muted/30 p-4 shadow-inner sm:block">
                      <div className="mb-3 h-2 w-20 rounded bg-muted-foreground/15" />
                      <div className="space-y-2">
                        <div className="h-2 w-full rounded bg-muted-foreground/15" />
                        <div className="h-2 w-[85%] rounded bg-muted-foreground/15" />
                        <div className="h-2 w-[90%] rounded bg-muted-foreground/15" />
                      </div>
                      <p className="mt-6 text-center text-xs text-muted-foreground">右页 · 图表/备注（示意）</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {resource.kind === "package" ? (
            <div className="mx-auto max-w-lg space-y-4 text-center">
              <div className="rounded-lg border border-border bg-muted/40 px-6 py-10">
                <p className="text-sm font-medium text-foreground">压缩包资源</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  实际产品中在此展示目录树或解压说明；当前为 UI 占位。
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
