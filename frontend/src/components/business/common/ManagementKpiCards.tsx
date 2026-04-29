"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@bs-lab/ui";
import { cn } from "@/lib/utils";

export type ManagementKpiTone = "default" | "success" | "warning" | "danger";

export type ManagementKpiCardItem = {
  key: string;
  label: string;
  value: React.ReactNode;
  tone?: ManagementKpiTone;
};

const TONE_CLASS: Record<ManagementKpiTone, { card: string; label: string; value: string }> = {
  default: { card: "bg-slate-50/30 border-slate-200/60", label: "text-muted-foreground", value: "text-foreground" },
  success: { card: "bg-emerald-50/30 border-emerald-200/60", label: "text-status-success", value: "text-status-success" },
  warning: { card: "bg-amber-50/30 border-amber-200/60", label: "text-status-warning", value: "text-status-warning" },
  danger: { card: "bg-rose-50/30 border-rose-200/60", label: "text-status-danger", value: "text-status-danger" },
};

export function ManagementKpiCards(props: { items: ManagementKpiCardItem[]; className?: string }) {
  return (
    <div className={cn("grid gap-3 md:grid-cols-4", props.className)}>
      {props.items.map((it) => {
        const tone = it.tone ?? "default";
        const cfg = TONE_CLASS[tone];
        return (
          <Card key={it.key} className={cn("border-border shadow-sm", cfg.card)}>
            <CardContent className="px-4 py-3 min-[2000px]:px-6 min-[2000px]:py-4">
              <div className="flex items-baseline justify-between gap-3">
                <div className={cn("text-xs font-medium text-slate-500", cfg.label)}>{it.label}</div>
                <div className={cn("text-2xl font-bold tracking-tight tabular-nums min-[2000px]:text-3xl", cfg.value)}>
                  {it.value}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

