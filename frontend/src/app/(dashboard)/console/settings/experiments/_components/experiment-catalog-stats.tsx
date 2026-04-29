"use client";

import { Card, CardDescription, CardHeader, CardTitle } from "@bs-lab/ui";

export function ExperimentCatalogStats(props: {
  filteredCount: number;
  mandatoryCount: number;
  phaseStats: { primary: number; junior: number; senior: number; other: number };
  keywordScopeTotal: number;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
      <Card className="py-3">
        <CardHeader className="px-4 pb-2 pt-0">
          <CardDescription>当前筛选条目</CardDescription>
          <CardTitle className="text-2xl">{props.filteredCount}</CardTitle>
        </CardHeader>
      </Card>
      <Card className="py-3">
        <CardHeader className="px-4 pb-2 pt-0">
          <CardDescription>必做（当前筛选）</CardDescription>
          <CardTitle className="text-2xl">{props.mandatoryCount}</CardTitle>
        </CardHeader>
      </Card>
      <Card className="py-3">
        <CardHeader className="px-4 pb-2 pt-0">
          <CardDescription>按学段（关键词范围内已加载列表）</CardDescription>
          <CardTitle className="text-base">
            小 {props.phaseStats.primary} / 初 {props.phaseStats.junior} / 高 {props.phaseStats.senior}
            {props.phaseStats.other > 0 ? ` / 其他 ${props.phaseStats.other}` : ""}
          </CardTitle>
        </CardHeader>
      </Card>
      <Card className="py-3">
        <CardHeader className="px-4 pb-2 pt-0">
          <CardDescription>关键词范围内总条目</CardDescription>
          <CardTitle className="text-2xl">{props.keywordScopeTotal}</CardTitle>
        </CardHeader>
      </Card>
    </div>
  );
}
