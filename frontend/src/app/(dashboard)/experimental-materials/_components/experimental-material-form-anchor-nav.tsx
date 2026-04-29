"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const NAV: { id: string; label: string }[] = [
  { id: "material-section-basic", label: "基础信息" },
  { id: "material-section-usage", label: "教学用途" },
  { id: "material-section-safety", label: "安全风险" },
  { id: "material-section-related", label: "关联实验" },
];

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function ExperimentalMaterialFormAnchorNav(props: { className?: string; compact?: boolean }) {
  if (props.compact) {
    return (
      <nav
        className={cn(
          "flex gap-2 overflow-x-auto pb-1 text-xs [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          props.className,
        )}
        aria-label="页面分区"
      >
        {NAV.map((item) => (
          <button
            key={item.id}
            type="button"
            className="shrink-0 snap-start rounded-full border border-border bg-background px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground sm:px-2.5 sm:py-1.5"
            onClick={() => scrollToSection(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>
    );
  }

  return (
    <nav className={cn("space-y-1 border-r border-border pr-3 text-xs", props.className)} aria-label="页面分区">
      {NAV.map((item) => (
        <button
          key={item.id}
          type="button"
          className="block w-full rounded-md px-2 py-1.5 text-left text-muted-foreground hover:bg-muted hover:text-foreground"
          onClick={() => scrollToSection(item.id)}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}
