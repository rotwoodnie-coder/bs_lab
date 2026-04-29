"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@bs-lab/ui";

export default function ConsoleDistrictAnalyticsPage() {
  return (
    <div className="space-y-4">
      <Card className="border-border shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">做实验数据一览</CardTitle>
          <CardDescription>数据统计中，等待真实数据接入。</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-lg border border-border bg-background p-4 shadow-none">
              <p className="text-xs font-medium text-muted-foreground">正在做实验</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">—</p>
              <p className="mt-1 text-xs text-muted-foreground">数据统计中</p>
            </div>
            <div className="rounded-lg border border-border bg-background p-4 shadow-none">
              <p className="text-xs font-medium text-muted-foreground">活跃老师与学生</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">—</p>
              <p className="mt-1 text-xs text-muted-foreground">数据统计中</p>
            </div>
            <div className="rounded-lg border border-border bg-background p-4 shadow-none">
              <p className="text-xs font-medium text-muted-foreground">教室画面在线</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">—</p>
              <p className="mt-1 text-xs text-muted-foreground">数据统计中</p>
            </div>
            <div className="rounded-lg border border-border bg-background p-4 shadow-none">
              <p className="text-xs font-medium text-muted-foreground">待处理的讨论</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">—</p>
              <p className="mt-1 text-xs text-muted-foreground">数据统计中</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
