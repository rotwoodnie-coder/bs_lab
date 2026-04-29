"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "@bs-lab/ui/icons";
import { Label, Switch } from "@bs-lab/ui";

import { useDemoRole } from "@/components/layout/demo-role-context";
import { DevInspectorProvider, useDevInspector } from "@/contexts/dev-inspector-context";
import { consoleBreadcrumb } from "@/config/console-nav";
import { cn } from "@/lib/utils";

import { ConsoleWorkbenchChromeContext } from "@/components/console/console-workbench-chrome-context";

function ConsoleWorkbenchHeader() {
  const pathname = usePathname();
  const { role } = useDemoRole();
  const { enabled, setEnabled } = useDevInspector();
  const pathOnly = pathname.split("?")[0] || pathname;
  const crumbs = React.useMemo(() => consoleBreadcrumb(pathOnly, role), [pathOnly, role]);

  return (
    <header className="shrink-0 border-b border-border bg-background px-3 py-2 sm:px-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <nav className="flex min-w-0 flex-wrap items-center gap-1 text-sm text-muted-foreground" aria-label="面包屑">
          {crumbs.map((c, i) => {
            const last = i === crumbs.length - 1;
            return (
              <React.Fragment key={`${c.label}-${i}`}>
                {i > 0 ? <ChevronRight className="size-3.5 shrink-0 opacity-60" aria-hidden /> : null}
                {last || !c.href ? (
                  <span className={cn(last && "font-medium text-foreground")}>{c.label}</span>
                ) : (
                  <Link href={c.href} className="hover:text-foreground">
                    {c.label}
                  </Link>
                )}
              </React.Fragment>
            );
          })}
        </nav>
        <div className="flex shrink-0 items-center gap-2">
          <Switch id="console-dev-inspector" checked={enabled} onCheckedChange={setEnabled} />
          <Label htmlFor="console-dev-inspector" className="cursor-pointer text-xs text-muted-foreground">
            开发者视图
          </Label>
        </div>
      </div>
    </header>
  );
}

export function ConsoleWorkbenchLayout({ children }: { children: React.ReactNode }) {
  return (
    <DevInspectorProvider>
      <div className="flex min-h-0 flex-1 flex-col gap-4 lg:min-h-[calc(100dvh-7.5rem)] lg:flex-row lg:gap-0 lg:rounded-lg lg:border lg:border-border lg:bg-card lg:shadow-xs">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <ConsoleWorkbenchHeader />
          <ConsoleWorkbenchChromeContext.Provider value={true}>
            <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2 sm:px-3 sm:py-3">{children}</div>
          </ConsoleWorkbenchChromeContext.Provider>
        </div>
      </div>
    </DevInspectorProvider>
  );
}
