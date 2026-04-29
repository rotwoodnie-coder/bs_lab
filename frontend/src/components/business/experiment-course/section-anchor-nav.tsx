"use client";

import * as React from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@bs-lab/ui";

type SectionAnchor = {
  id: string;
  label: string;
  progressPct?: number;
  completed?: boolean;
};

type SectionAnchorNavProps = {
  anchors: SectionAnchor[];
  activeId: string;
  onNavigate: (id: string) => void;
  title?: string;
};

export function SectionAnchorNav({ anchors, activeId, onNavigate, title = "电梯导航" }: SectionAnchorNavProps) {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {anchors.map((anchor) => (
          <a
            key={anchor.id}
            href={`#${anchor.id}`}
            onClick={(event) => {
              event.preventDefault();
              onNavigate(anchor.id);
            }}
            className={
              activeId === anchor.id
                ? "flex items-center justify-between gap-2 rounded-md bg-primary/12 px-2 py-1 text-sm font-medium text-foreground transition-colors"
                : "flex items-center justify-between gap-2 rounded-md px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            }
          >
            <span className="truncate">{anchor.label}</span>
            {typeof anchor.progressPct === "number" ? (
              <span className="relative inline-flex size-6 items-center justify-center rounded-full border border-border bg-background text-[10px] font-medium">
                {anchor.completed ? (
                  <span className="text-status-success">✓</span>
                ) : (
                  <>
                    <span
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: `conic-gradient(var(--color-primary) ${anchor.progressPct}%, transparent ${anchor.progressPct}% 100%)`,
                      }}
                    />
                    <span className="absolute inset-[2px] rounded-full bg-background" />
                    <span className="relative z-10 text-[9px] text-muted-foreground">{Math.round(anchor.progressPct)}</span>
                  </>
                )}
              </span>
            ) : null}
          </a>
        ))}
      </CardContent>
    </Card>
  );
}
