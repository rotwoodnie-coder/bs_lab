"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, Separator } from "@bs-lab/ui";

/**
 * 成就卡 / 周报预览：Props **仅**暴露 parent-reports 契约字段子集（禁止扩展临时业务字段）。
 * 契约：`summary`、`nextRecommendations`（见 `docs/contracts/api-contract.md` POST /v1/parent-reports）。
 */
export type ParentReportPreviewCardProps = {
  summary: string;
  nextRecommendations: string[];
};

export function ParentReportPreviewCard({ summary, nextRecommendations }: ParentReportPreviewCardProps) {
  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">成就卡预览（契约字段）</CardTitle>
        <CardDescription className="text-xs">仅 summary · nextRecommendations</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p className="font-medium leading-relaxed text-foreground">{summary}</p>
        <Separator />
        <div>
          <p className="mb-1 text-xs font-medium text-muted-foreground">nextRecommendations</p>
          <ul className="list-inside list-disc space-y-1 text-muted-foreground">
            {nextRecommendations.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
