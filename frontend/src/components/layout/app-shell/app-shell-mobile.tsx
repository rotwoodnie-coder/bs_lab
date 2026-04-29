"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import {
  Button,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@bs-lab/ui";
import { Menu } from "@bs-lab/ui/icons";
import { DashboardNavChips } from "@/components/layout/dashboard-nav-chips";
import { DashboardSidebarNav } from "@/components/layout/dashboard-sidebar-nav";
import { SidebarUserPanel } from "@/components/layout/sidebar-user-panel";
import { ViewModeMainTransition } from "@/components/layout/view-mode-main-transition";
import { useLandscapeShortNav } from "@/hooks/use-landscape-short-nav";
import { cn } from "@/lib/utils";

import type { AppShellProps } from "./types";

function managementHeaderChrome(_tone: AppShellProps["managementWorkspaceTone"]): string {
  return "border-slate-200/80 bg-white shadow-sm";
}

export function AppShellMobile({
  logoSlot,
  userSlot,
  navItems,
  activeNavId,
  onNavSelect,
  children,
  headerCenterSlot,
  headerTrailingSlot,
  modeSwitchSlot,
  mobileHeaderTitle = "应用",
  sidebarFooterSlot,
  sidebarTopSlot,
  viewMode = "management",
  managementWorkspaceTone = "default",
}: AppShellProps) {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();
  const landscapeShortNav = useLandscapeShortNav();

  React.useEffect(() => {
    setOpen((was) => (was ? false : was));
  }, [pathname]);

  React.useEffect(() => {
    if (landscapeShortNav) {
      setOpen(false);
    }
  }, [landscapeShortNav]);

  const handleSelect = React.useCallback(
    (id: string) => {
      onNavSelect(id);
      setOpen(false);
    },
    [onNavSelect],
  );

  const sidebarCtx = React.useMemo(
    () => ({
      collapsed: false,
      narrowViewport: true,
      viewMode,
      sidebarHydrated: true,
    }),
    [viewMode],
  );

  return (
    <div
      data-view-mode={viewMode}
      className={cn(
        "flex h-dvh max-h-dvh flex-col overflow-hidden transition-colors duration-300",
        viewMode === "portal" && "bg-slate-50",
        viewMode === "management" && "bg-[#f8fafc]",
      )}
    >
      <header
        className={cn(
          "sticky top-0 z-50 flex min-h-14 shrink-0 items-center gap-2 border-b px-3 py-1 transition-colors duration-300 sm:px-4",
          viewMode === "portal" &&
            "border-slate-200/80 bg-white/90 backdrop-blur-md supports-[backdrop-filter]:bg-white/75",
          viewMode === "management" && managementHeaderChrome(managementWorkspaceTone),
        )}
        aria-label={mobileHeaderTitle}
      >
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-11 min-h-11 min-w-11 shrink-0"
          aria-label={landscapeShortNav ? "打开账户与辅助菜单" : "打开导航菜单"}
          onClick={() => setOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex min-w-0 flex-1 items-center gap-2">{logoSlot}</div>
        {headerCenterSlot != null ? (
          <div className="flex shrink-0 items-center">{headerCenterSlot}</div>
        ) : null}
        <div className="flex shrink-0 items-center gap-1">
          {headerTrailingSlot}
          {modeSwitchSlot}
          {userSlot}
        </div>
      </header>

      {landscapeShortNav ? (
        <DashboardNavChips navItems={navItems} activeNavId={activeNavId} onNavSelect={handleSelect} />
      ) : null}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="left"
          className="w-[min(100vw,18rem)] max-w-[min(100vw,18rem)] gap-0 border-r border-slate-200/60 bg-white p-0 pt-10 sm:max-w-72 landscape:max-h-[500px]"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>主导航</SheetTitle>
          </SheetHeader>
          <div className="flex max-h-[calc(100dvh-2.5rem)] flex-col gap-0 overflow-hidden px-3 pb-safe-bottom pt-2 landscape:max-h-[500px]">
            {sidebarTopSlot != null ? <div className="mb-2 shrink-0">{sidebarTopSlot}</div> : null}
            {landscapeShortNav ? (
              <p className="mb-2 shrink-0 rounded-md border border-dashed border-border/80 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                横屏精简模式：请使用顶部标签切换功能模块。
              </p>
            ) : (
              <div className="flex min-h-0 flex-1 flex-col">
                <DashboardSidebarNav
                  navItems={navItems}
                  activeNavId={activeNavId}
                  onNavSelect={handleSelect}
                  collapsed={false}
                />
              </div>
            )}
            <SidebarUserPanel collapsed={false} className="pt-2" />
            {sidebarFooterSlot != null ? (
              <div className="mt-2 shrink-0 border-t border-slate-200/80 pt-2">
                {typeof sidebarFooterSlot === "function" ? sidebarFooterSlot(sidebarCtx) : sidebarFooterSlot}
              </div>
            ) : null}
          </div>
        </SheetContent>
      </Sheet>

      <main
        className={cn(
          "flex min-h-0 min-w-0 flex-1 flex-col overflow-auto transition-colors duration-300",
          viewMode === "portal" && "text-slate-800",
          viewMode === "management" && "text-foreground",
        )}
      >
        <ViewModeMainTransition
          viewMode={viewMode}
          className="flex min-h-0 min-w-0 flex-1 flex-col overflow-auto px-0 py-3 sm:py-4"
        >
          {children}
        </ViewModeMainTransition>
      </main>
    </div>
  );
}
