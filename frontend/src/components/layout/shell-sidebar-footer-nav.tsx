"use client";

import { SidebarNavLabel } from "@/components/layout/sidebar-nav-label";
import { cn } from "@/lib/utils";

import type { AppShellNavItem, AppShellSidebarContext } from "./app-shell/types";

export function ShellSidebarFooterNav({
  items,
  activeNavId,
  onSelect,
  ctx,
}: {
  items: AppShellNavItem[];
  activeNavId: string;
  onSelect: (id: string) => void;
  ctx: AppShellSidebarContext;
}) {
  const iconOnly = ctx.collapsed;
  const { viewMode } = ctx;

  return (
    <div
      className={cn(
        "flex flex-col transition-all duration-300 ease-in-out",
        iconOnly ? "gap-2" : "gap-1",
      )}
    >
      {items.map((item) => {
        const active = item.id === activeNavId;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            title={iconOnly ? item.label : undefined}
            className={cn(
              "flex items-center rounded-lg text-left text-sm font-medium transition-colors duration-300 ease-in-out",
              viewMode === "portal" &&
                cn(
                  "text-muted-foreground hover:bg-muted/80 hover:text-foreground",
                  active && "bg-primary/10 text-primary",
                ),
              viewMode === "management" &&
                cn(
                  "text-slate-400 hover:bg-slate-800 hover:text-slate-100",
                  active &&
                    "bg-primary text-primary-foreground shadow-sm hover:bg-primary hover:text-primary-foreground",
                ),
              iconOnly
                ? "mx-auto size-11 shrink-0 justify-center p-0"
                : "w-full gap-3 px-3 py-2.5",
            )}
          >
            {item.icon != null && (
              <span
                className={cn(
                  "inline-flex shrink-0 [&_svg]:size-4",
                  iconOnly && "mx-auto",
                  viewMode === "portal" &&
                    (active ? "text-primary" : "text-muted-foreground"),
                  viewMode === "management" &&
                    (active ? "text-primary-foreground" : "text-slate-500"),
                )}
              >
                {item.icon}
              </span>
            )}
            <SidebarNavLabel expanded={!iconOnly}>
              {item.label}
            </SidebarNavLabel>
          </button>
        );
      })}
    </div>
  );
}
