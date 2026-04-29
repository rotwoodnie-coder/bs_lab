"use client";

import * as React from "react";
import { Button } from "@bs-lab/ui";
import { ChevronLeft, ChevronRight } from "@bs-lab/ui/icons";
import { DashboardSidebarNav } from "@/components/layout/dashboard-sidebar-nav";
import { SidebarUserPanel } from "@/components/layout/sidebar-user-panel";
import { ViewModeMainTransition } from "@/components/layout/view-mode-main-transition";
import { cn } from "@/lib/utils";

import type { AppShellProps } from "./types";

/** 管理台顶栏：统一轻量白底，与侧栏视觉一致 */
function managementHeaderChrome(_tone: AppShellProps["managementWorkspaceTone"]): string {
  return "border-slate-200/80 bg-white shadow-sm";
}

const COLLAPSED_STORAGE_KEY = "bs-lab-app-shell-sidebar-collapsed";
const SESSION_MANUAL_KEY = "bs-lab-sidebar-session-manual";
const WIDE_DESKTOP_MQ = "(min-width: 1920px)";

export function AppShellDesktop({
  logoSlot,
  userSlot,
  navItems,
  activeNavId,
  onNavSelect,
  children,
  headerCenterSlot,
  headerTrailingSlot,
  modeSwitchSlot,
  sidebarTopSlot,
  sidebarFooterSlot,
  viewMode = "management",
  managementWorkspaceTone = "default",
}: AppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    try {
      const manual = sessionStorage.getItem(SESSION_MANUAL_KEY) === "1";
      const mq = window.matchMedia(WIDE_DESKTOP_MQ);
      let nextCollapsed: boolean;
      if (manual) {
        const raw = localStorage.getItem(COLLAPSED_STORAGE_KEY);
        if (raw === "1") nextCollapsed = true;
        else if (raw === "0") nextCollapsed = false;
        else nextCollapsed = false;
      } else if (viewMode === "management") {
        nextCollapsed = false;
      } else {
        nextCollapsed = !mq.matches;
      }
      setSidebarCollapsed((prev) => (prev === nextCollapsed ? prev : nextCollapsed));
    } catch {
      setSidebarCollapsed((prev) => (prev ? prev : false));
    }
    setHydrated((h) => (h ? h : true));
  }, [viewMode]);

  React.useEffect(() => {
    if (!hydrated) return;
    const mq = window.matchMedia(WIDE_DESKTOP_MQ);
    const onChange = () => {
      try {
        if (sessionStorage.getItem(SESSION_MANUAL_KEY) === "1") return;
      } catch {
        /* ignore */
      }
      if (viewMode === "management") {
        setSidebarCollapsed((prev) => (prev === false ? prev : false));
      } else {
        const next = !mq.matches;
        setSidebarCollapsed((prev) => (prev === next ? prev : next));
      }
    };
    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    }
    mq.addListener(onChange);
    return () => mq.removeListener(onChange);
  }, [hydrated, viewMode]);

  const navIconOnly = hydrated && sidebarCollapsed;

  const asideWidthClass = !hydrated
    ? "w-[260px] min-w-[260px]"
    : sidebarCollapsed
      ? "w-20 min-w-20"
      : "w-[260px] min-w-[260px]";

  const toggleCollapsed = React.useCallback(() => {
    try {
      sessionStorage.setItem(SESSION_MANUAL_KEY, "1");
    } catch {
      /* ignore */
    }
    setSidebarCollapsed((c) => {
      const next = !c;
      try {
        localStorage.setItem(COLLAPSED_STORAGE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const sidebarCtx = React.useMemo(
    () => ({
      collapsed: navIconOnly,
      narrowViewport: false,
      viewMode,
      sidebarHydrated: hydrated,
    }),
    [navIconOnly, viewMode, hydrated],
  );

  return (
    <div
      data-view-mode={viewMode}
      className={cn(
        "flex h-dvh max-h-dvh overflow-hidden transition-colors duration-300",
        viewMode === "portal" && "bg-slate-50",
        viewMode === "management" && "bg-[#f8fafc]",
      )}
    >
      <aside
        data-app-shell-sidebar
        className={cn(
          "sticky top-0 z-30 flex h-dvh max-h-dvh shrink-0 flex-col overflow-hidden border-r border-slate-200/60 bg-white",
          "transition-[width,min-width] duration-300 ease-in-out",
          asideWidthClass,
          sidebarCollapsed ? "px-2 pb-3 pt-3 max-[1999px]:pb-1" : "px-3 pb-3 pt-4 max-[1999px]:pb-1",
        )}
      >
        {sidebarTopSlot != null ? (
          <div className={cn("mb-3 shrink-0", navIconOnly && "flex justify-center")}>{sidebarTopSlot}</div>
        ) : null}

        <div className="flex min-h-0 flex-1 flex-col">
          <DashboardSidebarNav
            navItems={navItems}
            activeNavId={activeNavId}
            onNavSelect={onNavSelect}
            collapsed={navIconOnly}
          />
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn(
            "mb-1 mt-1 min-h-11 shrink-0 text-muted-foreground hover:text-foreground",
            navIconOnly ? "w-full px-0" : "px-2",
          )}
          onClick={toggleCollapsed}
          aria-label={navIconOnly ? "展开侧栏" : "收起侧栏"}
        >
          {navIconOnly ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="mr-1 h-4 w-4" />}
          {!navIconOnly ? <span className="text-xs font-medium">收起</span> : null}
        </Button>

        <SidebarUserPanel collapsed={navIconOnly} />

        {sidebarFooterSlot != null ? (
          <div className="mt-2 shrink-0 pt-2 transition-all duration-300 ease-in-out">
            {typeof sidebarFooterSlot === "function" ? sidebarFooterSlot(sidebarCtx) : sidebarFooterSlot}
          </div>
        ) : null}
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <header
          className={cn(
            "sticky top-0 z-50 h-16 shrink-0 border-b transition-colors duration-300",
            viewMode === "portal" &&
              "border-slate-200/80 bg-white/85 backdrop-blur-md supports-[backdrop-filter]:bg-white/70",
            viewMode === "management" && managementHeaderChrome(managementWorkspaceTone),
          )}
        >
          <div className="flex h-full flex-wrap items-center justify-between gap-3 px-4 py-2 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">{logoSlot}</div>
            {headerCenterSlot != null ? (
              <div className="order-last flex w-full min-w-0 justify-center lg:order-none lg:flex-1 lg:px-4">
                <div className="w-full min-w-0">{headerCenterSlot}</div>
              </div>
            ) : null}
            <div className="flex flex-1 items-center justify-end gap-2 sm:min-w-0 lg:flex-none">
              {headerTrailingSlot}
              {modeSwitchSlot}
              {userSlot}
            </div>
          </div>
        </header>

        <main className="w-full max-w-none flex-1 flex-col overflow-auto transition-colors duration-300">
          <ViewModeMainTransition
            viewMode={viewMode}
            className="flex min-h-0 min-w-0 flex-1 flex-col overflow-auto p-3 sm:p-4 lg:p-4"
          >
            {children}
          </ViewModeMainTransition>
        </main>
      </div>
    </div>
  );
}
