"use client";

import * as React from "react";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@bs-lab/ui";
import { Clock, ScrollText } from "@bs-lab/ui/icons";

import type { AuthUser } from "@/hooks/use-auth";
import { formatDateTime, formatNullable } from "./profile-format";

export function ProfileRecentActivityCard({ user }: { user: AuthUser }) {
  const [scaleOpen, setScaleOpen] = React.useState(false);
  const sysLogs = user.sysLogRecent ?? [];
  const scaleLogs = user.scaleLogRecent ?? [];

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="rounded-xl border border-slate-200/60 bg-card shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <ScrollText className="size-4 text-primary" />
            活动记录
          </CardTitle>
          <CardDescription>最近系统操作（sys_log，只读）。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {sysLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground">暂无记录</p>
          ) : (
            sysLogs.slice(0, 8).map((log, idx) => (
              <div
                key={log.logId || idx}
                className="rounded-lg border border-slate-200/50 bg-[#f8fafc]/80 px-3 py-2.5 text-sm"
              >
                <p className="text-xs text-muted-foreground">{formatDateTime(log.logTime)}</p>
                <p className="font-medium text-foreground">
                  {formatNullable(log.logType)} · {formatNullable(log.logDataType)}
                </p>
                {log.logDataId ? <p className="truncate font-mono text-xs text-muted-foreground">{log.logDataId}</p> : null}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="rounded-xl border border-slate-200/60 bg-card shadow-sm">
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2 pb-2">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Clock className="size-4 text-primary" />
              积分流水
            </CardTitle>
            <CardDescription>scale_log（只读）；完整列表在侧栏查看。</CardDescription>
          </div>
          <Sheet open={scaleOpen} onOpenChange={setScaleOpen}>
            <SheetTrigger asChild>
              <Button type="button" variant="outline" size="sm" className="shrink-0 rounded-lg border-slate-200/60" disabled={scaleLogs.length === 0}>
                查看详情
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="flex w-[min(100vw,26rem)] flex-col border-l border-slate-200/60 sm:max-w-lg">
              <SheetHeader>
                <SheetTitle>积分流水</SheetTitle>
                <SheetDescription>按时间倒序。</SheetDescription>
              </SheetHeader>
              <div className="sidebar-scroll-v0 mt-4 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1">
                {scaleLogs.map((row, idx) => (
                  <div key={row.seqId || idx} className="rounded-lg border border-slate-200/50 px-3 py-2.5 text-sm">
                    <p className="text-xs text-muted-foreground">{formatDateTime(row.createTime)}</p>
                    <p className="text-foreground">
                      <span className="font-medium tabular-nums">{row.scaleNum > 0 ? "+" : ""}{row.scaleNum}</span>
                      <span className="text-muted-foreground"> · {formatNullable(row.scaleSource)}</span>
                    </p>
                  </div>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </CardHeader>
        <CardContent className="space-y-2">
          {scaleLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground">暂无流水</p>
          ) : (
            scaleLogs.slice(0, 5).map((row, idx) => (
              <div key={row.seqId || idx} className="rounded-lg border border-slate-200/50 bg-[#f8fafc]/80 px-3 py-2.5 text-sm">
                <p className="text-xs text-muted-foreground">{formatDateTime(row.createTime)}</p>
                <p className="text-foreground">
                  <span className="font-medium tabular-nums">{row.scaleNum > 0 ? "+" : ""}{row.scaleNum}</span>
                  <span className="text-muted-foreground"> · {formatNullable(row.scaleSource)}</span>
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
