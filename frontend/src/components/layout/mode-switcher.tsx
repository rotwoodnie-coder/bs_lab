"use client";

import * as React from "react";
import { Switch, Tooltip, TooltipContent, TooltipTrigger } from "@bs-lab/ui";

import type { AppShellSidebarContext } from "@/components/layout/app-shell/types";
import type { AppViewMode } from "@/config/nav-config";
import { useAppMode } from "@/context/app-mode-context";
import { useNavigateViewMode } from "@/hooks/use-navigate-view-mode";
import { cn } from "@/lib/utils";

function sidebarEndLabelClass(
  which: "portal" | "management",
  viewMode: AppViewMode,
): string {
  const active =
    which === "portal" ? viewMode === "portal" : viewMode === "management";
  if (viewMode === "management") {
    return active ? "font-medium text-slate-100" : "text-slate-400";
  }
  return active ? "font-medium text-foreground" : "text-muted-foreground";
}

/** 移动端顶栏：门户 / 工作台，`Switch` lg 与文案中线对齐。 */
export function HeaderViewModeSwitch({ className }: { className?: string }) {
  const { viewMode } = useAppMode();
  const goViewMode = useNavigateViewMode();
  const viewModeRef = React.useRef(viewMode);
  viewModeRef.current = viewMode;
  const goRef = React.useRef(goViewMode);
  goRef.current = goViewMode;

  const onCheckedChange = React.useCallback((v: boolean) => {
    const next = v ? "management" : "portal";
    if (next === viewModeRef.current) return;
    goRef.current(next);
  }, []);

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-full border border-border/50 bg-muted/25 px-2 py-1",
        className,
      )}
    >
      <span
        className={cn(
          "text-xs leading-none",
          viewMode === "portal" ? "font-medium text-foreground" : "text-muted-foreground",
        )}
      >
        门户
      </span>
      <Switch
        size="lg"
        checked={viewMode === "management"}
        onCheckedChange={onCheckedChange}
        aria-label="在门户首页与管理工作台之间切换"
      />
      <span
        className={cn(
          "text-xs leading-none",
          viewMode === "management" ? "font-medium text-foreground" : "text-muted-foreground",
        )}
      >
        工作台
      </span>
    </div>
  );
}

/** 侧栏底部：门户 / 工作台切换；`Switch` **lg**；收起时为单列居中 + Tooltip。 */
export function ModeSwitcher({
  ctx,
  className,
}: {
  ctx: AppShellSidebarContext;
  className?: string;
}) {
  const { viewMode } = useAppMode();
  const goViewMode = useNavigateViewMode();
  const viewModeRef = React.useRef(viewMode);
  viewModeRef.current = viewMode;
  const goRef = React.useRef(goViewMode);
  goRef.current = goViewMode;

  const onCheckedChange = React.useCallback((v: boolean) => {
    const next = v ? "management" : "portal";
    if (next === viewModeRef.current) return;
    goRef.current(next);
  }, []);

  const iconOnly = ctx.collapsed && !ctx.narrowViewport;

  const switchEl = (
    <Switch
      size="lg"
      checked={viewMode === "management"}
      onCheckedChange={onCheckedChange}
      aria-label="在门户首页与管理工作台之间切换"
    />
  );

  if (iconOnly) {
    return (
      <div
        className={cn(
          "flex w-full shrink-0 flex-col items-center justify-center",
          className,
        )}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex justify-center">{switchEl}</div>
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-xs">
            {viewMode === "portal"
              ? "当前为门户首页，打开开关进入管理工作台"
              : "当前为管理工作台，关闭开关回到门户首页"}
          </TooltipContent>
        </Tooltip>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex w-full min-w-0 shrink-0 items-center justify-center gap-2 px-0.5",
        className,
      )}
    >
      <span
        className={cn(
          "hidden text-xs leading-none sm:inline",
          sidebarEndLabelClass("portal", viewMode),
        )}
      >
        门户
      </span>
      {switchEl}
      <span
        className={cn(
          "hidden text-xs leading-none sm:inline",
          sidebarEndLabelClass("management", viewMode),
        )}
      >
        工作台
      </span>
    </div>
  );
}
