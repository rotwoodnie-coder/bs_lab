"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
  dashboardCommandSearchFieldClassName,
  dashboardCommandSearchIconFieldClassName,
} from "@bs-lab/ui";
import { Search } from "@bs-lab/ui/icons";

import { useAppMode } from "@/context/app-mode-context";
import { RESOURCE_CENTER_NAV_ID } from "@/config/resource-center-policy";
import {
  DASHBOARD_FOOTER_NAV,
  getPrimaryNavItemsForRole,
  type AppViewMode,
} from "@/config/nav-config";
import { useResourceCenterPolicy } from "@/components/layout/resource-center-policy-context";
import { OPEN_COMMAND_PALETTE_EVENT } from "@/lib/command-palette-bridge";
import type { UserRole } from "@/types/auth";
import { useSessionActor } from "@/hooks/use-session-actor";

const GLOBAL_SEARCH_PLACEHOLDER = "搜索功能…";

function isModKey(e: KeyboardEvent) {
  return e.key === "k" && (e.metaKey || e.ctrlKey);
}

function useFilteredNav(role: UserRole, viewMode: AppViewMode, menuConfigRevision: number) {
  const { getEffectiveForRole } = useResourceCenterPolicy();
  return React.useMemo(() => {
    void menuConfigRevision;
    let defs = getPrimaryNavItemsForRole(role, viewMode);
    if (viewMode !== "portal") {
      const rc = getEffectiveForRole(role);
      defs = defs.filter((d) => d.id !== RESOURCE_CENTER_NAV_ID || rc.moduleEnabled);
    }
    return defs;
  }, [role, viewMode, menuConfigRevision, getEffectiveForRole]);
}

function CommandPaletteBody({ onOpenChange }: { onOpenChange: (open: boolean) => void }) {
  const router = useRouter();
  const { role } = useSessionActor();
  const { viewMode, menuConfigRevision } = useAppMode();
  const primary = useFilteredNav(role, viewMode, menuConfigRevision);

  const run = React.useCallback(
    (href: string) => {
      onOpenChange(false);
      router.push(href);
    },
    [router, onOpenChange],
  );

  return (
    <>
      <CommandInput placeholder={GLOBAL_SEARCH_PLACEHOLDER} />
      <CommandList>
        <CommandEmpty>未找到相关内容</CommandEmpty>
        <CommandGroup heading="导航与功能">
          {primary.map((item) => (
            <CommandItem
              key={item.id}
              value={`${item.label} ${item.id}`}
              onSelect={() => run(item.href)}
            >
              <item.Icon className="size-4 text-muted-foreground" />
              <span>{item.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="账户">
          {DASHBOARD_FOOTER_NAV.map((item) => (
            <CommandItem
              key={item.id}
              value={`${item.label} ${item.id}`}
              onSelect={() => run(item.href)}
            >
              <item.Icon className="size-4 text-muted-foreground" />
              <span>{item.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </>
  );
}

/**
 * 顶栏全局搜索：关键词过滤导航；⌘K / Ctrl+K 打开。
 * 用户、话题、实验搜索待接入真实 API。
 */
export function DashboardCommandPalette() {
  const [open, setOpen] = React.useState(false);
  const { viewMode } = useAppMode();

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!isModKey(e)) return;
      e.preventDefault();
      setOpen((o) => !o);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  React.useEffect(() => {
    const onExternalOpen = () => setOpen(true);
    window.addEventListener(OPEN_COMMAND_PALETTE_EVENT, onExternalOpen);
    return () => window.removeEventListener(OPEN_COMMAND_PALETTE_EVENT, onExternalOpen);
  }, []);

  return (
    <>
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="全局搜索"
        description="按关键词筛选导航功能"
        paletteChrome={viewMode === "portal" ? "portal" : "management"}
      >
        <CommandPaletteBody onOpenChange={setOpen} />
      </CommandDialog>

      <div className="hidden w-full sm:block">
        <Button
          type="button"
          variant="outline"
          className={dashboardCommandSearchFieldClassName(
            viewMode === "portal" ? "portal" : "management",
          )}
          onClick={() => setOpen(true)}
        >
          <Search className="size-4 shrink-0 opacity-70" aria-hidden />
          <span className="flex-1 truncate text-sm">{GLOBAL_SEARCH_PLACEHOLDER}</span>
          <CommandShortcut className="hidden text-[10px] sm:inline-flex">⌘K</CommandShortcut>
        </Button>
      </div>

      <div className="sm:hidden">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className={dashboardCommandSearchIconFieldClassName(
            viewMode === "portal" ? "portal" : "management",
          )}
          aria-label="打开搜索"
          onClick={() => setOpen(true)}
        >
          <Search className="size-4" />
        </Button>
      </div>
    </>
  );
}
