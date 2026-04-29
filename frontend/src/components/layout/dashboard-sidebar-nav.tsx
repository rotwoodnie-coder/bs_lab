"use client";

import * as React from "react";

import type { AppShellNavEntry } from "@/components/layout/app-shell/types";
import { SidebarNavLabel } from "@/components/layout/sidebar-nav-label";
import { flattenNavItems } from "@/components/layout/sidebar-nav-tree";
import { cn } from "@/lib/utils";

type Props = {
  navItems: AppShellNavEntry[];
  activeNavId: string;
  onNavSelect: (id: string) => void;
  collapsed: boolean;
};

function leafButtonClass(active: boolean, collapsed: boolean) {
  return cn(
    "flex min-h-11 w-full min-w-0 items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors",
    active ? "bg-primary/10 text-primary" : "text-foreground hover:bg-secondary",
    collapsed && "justify-center gap-0 px-2",
  );
}

function leafIconClass(active: boolean, collapsed: boolean) {
  return cn(
    "inline-flex shrink-0 [&_svg]:h-5 [&_svg]:w-5",
    collapsed && "mx-auto",
    active ? "text-primary" : "text-muted-foreground",
  );
}

export function DashboardSidebarNav({ navItems, activeNavId, onNavSelect, collapsed }: Props) {
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
      className={cn(
        "sidebar-scroll-v0 flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto overflow-x-hidden pt-1",
      )}
      aria-label="主导航"
    >
      {flatItems.map((item) => {
        const active = item.id === activeNavId;
        return (
          <button
            key={item.id}
            type="button"
            title={collapsed ? item.label : undefined}
            onClick={() => onNavSelect(item.id)}
            className={leafButtonClass(active, collapsed)}
          >
            {item.icon != null ? <span className={leafIconClass(active, collapsed)}>{item.icon}</span> : null}
            <SidebarNavLabel expanded={!collapsed}>{item.label}</SidebarNavLabel>
          </button>
        );
      })}
    </nav>
  );
}
