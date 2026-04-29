"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@bs-lab/ui";
import { LayoutGrid } from "@bs-lab/ui/icons";

import {
  listMaterialShortageByExperiment,
  listUnifiedSessions,
  subscribeUnifiedMock,
} from "@/lib/unified-mock-store";

function aggregateSessionStress(): { experimentId: string; avgError: number; sessionCount: number }[] {
  const map = new Map<string, { total: number; n: number }>();
  for (const s of listUnifiedSessions()) {
    const cur = map.get(s.experimentId) ?? { total: 0, n: 0 };
    cur.total += s.errorCount;
    cur.n += 1;
    map.set(s.experimentId, cur);
  }
  return [...map.entries()]
    .map(([experimentId, v]) => ({
      experimentId,
      avgError: v.n ? v.total / v.n : 0,
      sessionCount: v.n,
    }))
    .sort((a, b) => b.avgError - a.avgError)
    .slice(0, 8);
}

/**
 * P2：班级/区级学情 Mock — 与 unified-mock-store 同源，展示材料缺失热力与互动压力。
 */
export function ClassAnalyticsMock() {
  const [, bump] = React.useReducer((n) => n + 1, 0);
  React.useEffect(() => subscribeUnifiedMock(() => bump()), []);

  const shortage = listMaterialShortageByExperiment();
  const stress = aggregateSessionStress();
  const maxShort = Math.max(1, ...shortage.map((x) => x.shortageCount));
  const maxErr = Math.max(0.01, ...stress.map((x) => x.avgError));

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <LayoutGrid className="size-5 text-primary" aria-hidden />
          <CardTitle className="text-base">班级学情 · 材料与互动（Mock）</CardTitle>
        </div>
        <CardDescription className="text-xs">
          数据来自统一 Mock 仓：家长「材料难凑」反馈、会话错误预警累计（errorCount）。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">材料缺失分布（颜色越深 = 反馈次数越高）</p>
          {shortage.length === 0 ? (
            <p className="text-xs text-muted-foreground">暂无材料反馈。家长勾选「材料难凑齐」后此处会出现色块。</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {shortage.map((row) => {
                const intensity = row.shortageCount / maxShort;
                return (
                  <div
                    key={row.experimentId}
                    className="flex flex-col items-center gap-1 rounded-md border border-border px-2 py-2 text-center"
                    title={`${row.experimentId} · ${row.shortageCount} 次`}
                  >
                    <div
                      className="size-10 rounded-sm border border-border/60 bg-destructive"
                      style={{ opacity: 0.15 + intensity * 0.75 }}
                    />
                    <span className="max-w-[88px] truncate font-mono text-[10px] text-muted-foreground">
                      {row.experimentId.slice(-10)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">互动压力（按实验平均 errorCount）</p>
          {stress.length === 0 ? (
            <p className="text-xs text-muted-foreground">暂无会话数据。</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {stress.map((row) => {
                const t = row.avgError / maxErr;
                return (
                  <div
                    key={row.experimentId}
                    className="flex items-center justify-between gap-2 rounded-lg border border-border/70 bg-muted/10 px-3 py-2"
                  >
                    <span className="truncate font-mono text-[10px] text-muted-foreground">{row.experimentId}</span>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary/80"
                          style={{ width: `${Math.round(t * 100)}%` }}
                        />
                      </div>
                      <span className="shrink-0 text-xs tabular-nums text-foreground">{row.avgError.toFixed(1)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
