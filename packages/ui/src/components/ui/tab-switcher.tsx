"use client";

import * as React from "react";
import { motion } from "framer-motion";

import { cn } from "../../lib/utils";

export type TabSwitcherVariant = "underline" | "pill" | "sidebar" | "segmented";

export type TabSwitcherItem = {
  id: string;
  label: string;
  /** 由调用方传入图标节点（如来自 @bs-lab/ui/icons 的组件实例） */
  icon?: React.ReactNode;
  badge?: number;
};

export interface TabSwitcherProps {
  items: TabSwitcherItem[];
  activeId: string;
  onChange: (id: string) => void;
  variant?: TabSwitcherVariant;
  className?: string;
  /**
   * 同一页多个 TabSwitcher 时需区分 framer-motion layoutId，避免指示条动画串台。
   * @default "bs-tab-switcher"
   */
  layoutIdPrefix?: string;
}

function TabIconWrap({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  if (children == null) return null;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function TabSwitcher({
  items,
  activeId,
  onChange,
  variant = "underline",
  className,
  layoutIdPrefix = "bs-tab-switcher",
}: TabSwitcherProps) {
  if (!items || items.length === 0) return null;

  if (variant === "segmented") {
    return (
      <div
        role="tablist"
        className={cn("relative flex w-full rounded-lg bg-muted/50 p-1", className)}
      >
        {items.map((item) => {
          const isActive = item.id === activeId;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(item.id)}
              className={cn(
                "relative z-10 flex min-h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {isActive ? (
                <motion.div
                  layoutId={`${layoutIdPrefix}-segment-pill`}
                  className="absolute inset-0 rounded-md bg-background shadow-sm ring-1 ring-border/60"
                  transition={{ type: "spring", stiffness: 400, damping: 34 }}
                />
              ) : null}
              <span className="relative z-10 flex items-center justify-center gap-2">
                <TabIconWrap>{item.icon}</TabIconWrap>
                <span className="truncate">{item.label}</span>
                {typeof item.badge === "number" && item.badge > 0 ? (
                  <span className="relative z-10 rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground tabular-nums">
                    {item.badge}
                  </span>
                ) : null}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  if (variant === "sidebar") {
    return (
      <nav className={cn("flex flex-col gap-1", className)}>
        {items.map((item) => {
          const isActive = item.id === activeId;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange(item.id)}
              className={cn(
                "group relative flex min-h-11 w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition-all",
                "text-muted-foreground hover:text-foreground",
                isActive && "text-primary",
              )}
            >
              {isActive && (
                <motion.div
                  layoutId={`${layoutIdPrefix}-sidebar-highlight`}
                  className="absolute inset-0 rounded-xl bg-primary/10"
                />
              )}
              {!isActive && (
                <span className="absolute inset-0 rounded-xl bg-transparent transition-colors group-hover:bg-muted/80" />
              )}
              <div
                className={cn(
                  "relative z-10 flex min-h-[20px] w-[3px] shrink-0 self-stretch rounded-full",
                  isActive ? "bg-primary" : "bg-transparent",
                )}
              />
              <div className="relative z-10 flex min-w-0 items-center gap-2">
                <TabIconWrap
                  className={cn(
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground group-hover:text-foreground",
                  )}
                >
                  {item.icon}
                </TabIconWrap>
                <span className="truncate text-left">{item.label}</span>
                {typeof item.badge === "number" && item.badge > 0 && (
                  <span className="ml-auto shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground tabular-nums">
                    {item.badge}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </nav>
    );
  }

  const baseTabCls =
    variant === "underline"
      ? "relative min-h-11 px-4 py-2 text-sm font-medium"
      : "relative min-h-11 rounded-full border px-3 py-2 text-xs";

  const activeTabCls =
    variant === "underline"
      ? "text-primary"
      : "border-primary bg-primary text-primary-foreground shadow-sm";

  const inactiveTabCls =
    variant === "underline"
      ? "text-muted-foreground hover:text-foreground"
      : "border-border text-muted-foreground hover:border-ring/40 hover:text-foreground";

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-muted/40 p-1",
        variant === "underline" &&
          "rounded-none border-b border-border bg-transparent p-0",
        className,
      )}
    >
      {items.map((item) => {
        const isActive = item.id === activeId;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            className={cn(baseTabCls, isActive ? activeTabCls : inactiveTabCls)}
          >
            {variant === "underline" && isActive && (
              <motion.div
                layoutId={`${layoutIdPrefix}-underline-indicator`}
                className="absolute inset-x-1 -bottom-[2px] h-[2px] rounded-full bg-primary"
              />
            )}
            {item.icon != null && (
              <TabIconWrap
                className={cn(
                  "mr-1 align-middle",
                  variant === "pill" && isActive && "text-primary-foreground",
                )}
              >
                {item.icon}
              </TabIconWrap>
            )}
            <span>{item.label}</span>
            {typeof item.badge === "number" && item.badge > 0 && (
              <span className="ml-1 rounded-full bg-background/60 px-1 text-[10px] text-muted-foreground tabular-nums">
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
