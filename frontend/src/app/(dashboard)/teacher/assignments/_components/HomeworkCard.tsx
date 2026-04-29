"use client";

import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Progress,
} from "@bs-lab/ui";
import type { V2HomeworkItem } from "@/lib/v2/v2-homework-api";
import { formatZhDateTime } from "@/lib/datetime/format-zh";

interface Props {
  item: V2HomeworkItem;
}

export function HomeworkCard({ item }: Props) {
  const pct =
    item.studentTotal > 0
      ? Math.round((item.submittedCount / item.studentTotal) * 100)
      : 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">{item.expName || "（未命名实验）"}</CardTitle>
            <CardDescription className="mt-1">班级：{item.classId}</CardDescription>
          </div>
          <Badge variant="secondary">进行中</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {item.requireDate && (
          <p>
            <span className="text-muted-foreground">截止：</span>
            {formatZhDateTime(item.requireDate)}
          </p>
        )}
        <p>
          <span className="text-muted-foreground">布置时间：</span>
          {formatZhDateTime(item.createTime)}
        </p>
        {item.studentTotal > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-muted-foreground">
              <span>已提交 / 总人数</span>
              <span className="tabular-nums text-foreground">
                {item.submittedCount} / {item.studentTotal}
              </span>
            </div>
            <Progress value={pct} />
          </div>
        )}
        {item.pendingMarkCount > 0 && (
          <p>
            <span className="text-muted-foreground">待批改：</span>
            <span className="font-medium text-foreground">{item.pendingMarkCount}</span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
