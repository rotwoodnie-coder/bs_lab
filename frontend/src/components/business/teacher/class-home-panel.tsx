"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  sonnerToast,
} from "@bs-lab/ui";
import { Send, Users } from "@bs-lab/ui/icons";

export function ClassHomePanel() {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">行政班 vs 实验小组</p>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li>
            <span className="text-foreground">行政班</span>：由校管在「组织架构」维护；教师侧通常为只读，可导出花名册。
          </li>
          <li>
            <span className="text-foreground">实验小组</span>：由教师在本页勾选学生并命名；小组 ID 可作为作业下发的最小单位。
          </li>
        </ul>
      </div>

      <Card className="border-border shadow-xs">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="size-4 text-primary" />
            暂无班级数据
          </CardTitle>
          <CardDescription>请等待组织架构同步或联系校管维护。</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="secondary" asChild>
            <Link href="/teacher/assignments">
              <Send className="size-3.5" />
              下发新任务
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
