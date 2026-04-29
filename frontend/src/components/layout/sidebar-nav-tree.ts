import type * as React from "react";

import type { AppShellNavEntry, AppShellNavItem } from "@/components/layout/app-shell/types";

export function isNavGroup(
  item: AppShellNavEntry,
): item is { id: string; label: string; icon?: React.ReactNode; children: AppShellNavEntry[] } {
  return (item as { children?: unknown }).children != null;
}

export function flattenNavItems(
  items: AppShellNavEntry[],
): { id: string; label: string; icon?: React.ReactNode }[] {
  const out: { id: string; label: string; icon?: React.ReactNode }[] = [];
  for (const item of items) {
    if (isNavGroup(item)) {
      out.push(...flattenNavItems(item.children as AppShellNavEntry[]));
    } else if (!(item as AppShellNavItem).id.startsWith("__section__")) {
      out.push(item as AppShellNavItem);
    }
  }
  return out;
}
