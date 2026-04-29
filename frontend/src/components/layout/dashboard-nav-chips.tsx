"use client";

import * as React from "react";

import type { AppShellNavEntry } from "@/components/layout/app-shell/types";
import { flattenNavItems } from "@/components/layout/sidebar-nav-tree";
import { cn } from "@/lib/utils";

type Props = {
  navItems: AppShellNavEntry[];
  activeNavId: string;
  onNavSelect: (id: string) => void;
};

export function DashboardNavChips({ navItems, activeNavId, onNavSelect }: Props) {
  const flatItems = React.useMemo(() => {
    const raw = flattenNavItems(navItems);
    const seen = new Set<string>();
    return raw.filter((it) => {
      if (seen.has(it.id)) return false;
      seen.add(it.id);
      return true;
    });
  }, [navItems]);

  return (
    <nav
      aria-label="主导航（横屏精简）"
      className="shrink-0 border-b border-slate-200/80 bg-white/95 backdrop-blur-sm supports-[backdrop-filter]:bg-white/80"
    >
      <div className="flex gap-2 overflow-x-auto overscroll-x-contain px-3 py-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {flatItems.map((item) => {
          const active = item.id === activeNavId;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavSelect(item.id)}
              className={cn(
                "inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-3.5 text-sm font-medium transition-colors",
                active
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border/80 bg-background text-foreground hover:bg-secondary",
              )}
            >
              {item.icon != null ? (
                <span className="inline-flex shrink-0 text-current [&_svg]:h-4 [&_svg]:w-4">{item.icon}</span>
              ) : null}
              <span className="whitespace-nowrap">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
