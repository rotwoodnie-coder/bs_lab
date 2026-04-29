"use client";

import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@bs-lab/ui";

export default function ConsoleSocialTopicsChallengesPage() {
  return (
    <div className="space-y-4">
      <Card className="border-border shadow-none">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <CardTitle className="text-base">话题与挑战赛</CardTitle>
              <CardDescription>
                学生做完实验后聊什么、比什么：拍同款话题与班级/年级挑战赛的入口（骨架）；后续对接话题与赛程规则。
              </CardDescription>
            </div>
            <Badge variant="secondary">骨架</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex min-h-40 items-center justify-center rounded-md border border-dashed border-border bg-muted/30 text-sm text-muted-foreground">
            话题列表 · 挑战赛配置 · 排行榜预览（待接入数据）
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
