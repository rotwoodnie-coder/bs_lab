"use client";

import * as React from "react";
import { Button, Sheet, SheetContent, SheetHeader, SheetTitle } from "@bs-lab/ui";
import { ChevronLeft, ChevronRight, Layers, Minimize2, PanelLeft } from "@bs-lab/ui/icons";

import { useInsideConsoleWorkbenchChrome } from "@/components/console/console-workbench-chrome-context";
import { cn } from "@/lib/utils";

import { LeftTreeRailContext, type LeftTreeRailContextValue } from "./left-tree-rail-context";

export type LeftTreeRightTableLayoutProps = {
  leftTitle?: string;
  left: React.ReactNode;
  right: React.ReactNode;
  className?: string;
  leftClassName?: string;
  rightClassName?: string;
  /** 强制隐藏左侧区域（全屏等场景） */
  hideLeft?: boolean;
  /** 容器宽度小于该值且为自动模式时收缩左侧轨（默认 1280） */
  autoCollapseBreakpointPx?: number;
  /** 展开态左侧列宽度（默认 360；用户页等可传 640） */
  expandedRailWidthPx?: number;
  /** 收缩态左侧列宽度（默认 64） */
  collapsedRailWidthPx?: number;
  /**
   * 是否根据容器宽度自动调整左侧宽度与折叠阈值（默认开启）。
   * - 宽屏（如 2560）会适当加宽侧栏与主区间距
   * - 窄屏会自动收缩侧栏，避免主区拥挤
   */
  responsive?: boolean;
  /** 为 true 时仅手动折叠，不随宽度自动收缩 */
  disableAutoCollapse?: boolean;
  /**
   * 收缩态下向左抵消工作台主区内边距（`AppShell` 主区 `sm:p-6` + `DASHBOARD_MAIN_CONTAINER` 的 `px-8`），
   * 使「主导航—侧轨」视觉间距与侧轨—列表区接近。默认开启；不需要时可关。
   */
  compensateShellPaddingWhenCollapsed?: boolean;
  /** 左侧树：一键收起全部节点 */
  onCollapseAllLeft?: () => void;
};

export function LeftTreeRightTableLayout(props: LeftTreeRightTableLayoutProps) {
  const {
    leftTitle = "筛选",
    left,
    right,
    className,
    leftClassName,
    rightClassName,
    hideLeft = false,
    autoCollapseBreakpointPx,
    expandedRailWidthPx,
    collapsedRailWidthPx = 64,
    disableAutoCollapse = false,
    compensateShellPaddingWhenCollapsed = true,
    responsive = true,
    onCollapseAllLeft,
  } = props;

  const rootRef = React.useRef<HTMLDivElement>(null);
  const [manualExpanded, setManualExpanded] = React.useState<boolean | null>(null);
  const [vpWidth, setVpWidth] = React.useState(0);

  // 用窗口视口宽度而非容器宽度做折叠判断，避免侧栏折叠/展开改变容器宽导致振荡
  React.useEffect(() => {
    const measure = () => setVpWidth(window.innerWidth);
    measure();
    const ro = new ResizeObserver(() => measure());
    ro.observe(document.documentElement);
    window.addEventListener("resize", measure, { passive: true });
    return () => {
      window.removeEventListener("resize", measure);
      ro.disconnect();
    };
  }, []);

  const viewportWidth = vpWidth > 0 ? vpWidth : (typeof window !== "undefined" ? window.innerWidth : 1200);

  const resolvedExpandedRailWidthPx = React.useMemo(() => {
    if (!responsive) return expandedRailWidthPx ?? 360;
    const w = viewportWidth;
    const raw = Math.round(w * 0.22);
    return expandedRailWidthPx ?? Math.min(520, Math.max(320, raw || 360));
  }, [viewportWidth, expandedRailWidthPx, responsive]);

  const resolvedBreakpointPx = React.useMemo(() => {
    if (!responsive) return autoCollapseBreakpointPx ?? 1280;
    const minMain = 960;
    return autoCollapseBreakpointPx ?? Math.round(resolvedExpandedRailWidthPx + minMain);
  }, [autoCollapseBreakpointPx, resolvedExpandedRailWidthPx, responsive]);

  const narrow = !disableAutoCollapse && viewportWidth > 0 && viewportWidth < resolvedBreakpointPx;
  const effectiveExpanded = manualExpanded === null ? !narrow : manualExpanded;
  const collapsed = hideLeft ? true : !effectiveExpanded;

  const togglePinned = React.useCallback(() => {
    setManualExpanded((prev) => {
      const expandedNow = prev === null ? !narrow : prev;
      return !expandedNow;
    });
  }, [narrow]);

  const resetAuto = React.useCallback(() => {
    setManualExpanded(null);
  }, []);

  const railCtx = React.useMemo<LeftTreeRailContextValue>(
    () => ({
      collapsed,
      manualExpanded,
      setManualExpanded,
      togglePinned,
      resetAuto,
    }),
    [collapsed, manualExpanded, togglePinned, resetAuto],
  );

  const [open, setOpen] = React.useState(false);
  const asideWidthPx = hideLeft ? 0 : (collapsed ? collapsedRailWidthPx : resolvedExpandedRailWidthPx);
  const inConsoleWorkbench = useInsideConsoleWorkbenchChrome();
  const collapsedLeftPullClass =
    collapsed && compensateShellPaddingWhenCollapsed
      ? inConsoleWorkbench
        ? "lg:-ml-[52px]"
        : "lg:-ml-10"
      : "";

  return (
    <LeftTreeRailContext.Provider value={railCtx}>
      <div
        ref={rootRef}
        className={cn("min-h-0", collapsedLeftPullClass, className)}
      >
        <div className="hidden min-h-0 lg:flex lg:flex-row lg:gap-0">
          <aside
            style={{ width: asideWidthPx, transition: "width 200ms ease" }}
            className={cn(
              "min-h-0 shrink-0 overflow-hidden transition-[width,opacity] duration-300 ease-in-out",
              hideLeft && "opacity-0 pointer-events-none",
              leftClassName,
            )}
            aria-label={leftTitle}
          >
            <div className="flex h-full min-h-0 min-w-0 flex-col rounded-lg border border-border bg-card shadow-xs">
              <div className="flex shrink-0 items-center gap-2 border-b border-border bg-slate-50/50 px-4 py-2">
                {collapsed ? (
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="size-9 shrink-0"
                    title="展开侧栏（双击恢复随宽度自动折叠）"
                    aria-expanded={false}
                    onClick={togglePinned}
                    onDoubleClick={(e) => {
                      e.preventDefault();
                      resetAuto();
                    }}
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                ) : (
                  <>
                    <div className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground inline-flex items-center gap-2">
                      <Layers className="size-4 text-slate-500" aria-hidden />
                      {leftTitle}
                    </div>
                    {onCollapseAllLeft ? (
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="size-9 shrink-0 opacity-40 transition-opacity hover:opacity-100"
                        title="收起全部节点"
                        aria-label="收起全部节点"
                        onClick={onCollapseAllLeft}
                      >
                        <Minimize2 className="size-4" />
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="size-9 shrink-0 opacity-40 transition-opacity hover:opacity-100"
                      title="折叠侧栏（双击恢复随宽度自动折叠）"
                      aria-expanded
                      onClick={togglePinned}
                      onDoubleClick={(e) => {
                        e.preventDefault();
                        resetAuto();
                      }}
                    >
                      <ChevronLeft className="size-4" />
                    </Button>
                  </>
                )}
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
                <div className={cn(collapsed ? "px-1 py-2" : "p-3")}>{left}</div>
              </div>
            </div>
          </aside>

          <section
            className={cn(
              "min-h-0 min-w-0 flex-1 transition-[padding] duration-300 ease-in-out",
              hideLeft ? "pl-0" : (collapsed ? "pl-3" : "pl-4"),
              rightClassName,
            )}
          >
            {right}
          </section>
        </div>

        <div className="min-h-0 lg:hidden">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="text-sm font-medium text-foreground">{leftTitle}</div>
            <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
              <PanelLeft className="mr-2 size-4 opacity-80" />
              打开
            </Button>
          </div>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetContent side="left" className="flex w-full flex-col sm:max-w-sm">
              <SheetHeader>
                <SheetTitle>{leftTitle}</SheetTitle>
              </SheetHeader>
              <div className="min-h-0 flex-1 overflow-auto py-4">
                <div className="pr-3">{left}</div>
              </div>
            </SheetContent>
          </Sheet>

          {right}
        </div>
      </div>
    </LeftTreeRailContext.Provider>
  );
}
