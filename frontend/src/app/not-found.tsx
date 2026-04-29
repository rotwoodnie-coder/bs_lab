"use client";

import Link from "next/link";
import * as React from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@bs-lab/ui";
import { Home, SearchX } from "@bs-lab/ui/icons";
import { Button } from "@bs-lab/ui";

import { useAuth, authRoleToUserRole } from "@/hooks/use-auth";
import { getPrimaryNavItemsForRole } from "@/config/nav-config/primary-nav";
import type { NavIconComponent } from "@/config/nav-config.types";

type EntryItem = {
  label: string;
  href: string;
  Icon: NavIconComponent;
};

const FALLBACK_ENTRY: EntryItem = { label: "返回首页", href: "/", Icon: Home };

const MAX_ENTRIES = 5;

export default function NotFoundPage() {
  const { user, loading } = useAuth();

  const entries = React.useMemo<EntryItem[]>(() => {
    if (loading) return [FALLBACK_ENTRY];
    try {
      const userRole = authRoleToUserRole(user.role);
      const items = getPrimaryNavItemsForRole(userRole, "management");
      const result = items.slice(0, MAX_ENTRIES).map(({ label, href, Icon }) => ({
        label,
        href,
        Icon,
      }));
      return result.length > 0 ? result : [FALLBACK_ENTRY];
    } catch {
      return [FALLBACK_ENTRY];
    }
  }, [user.role, loading]);

  return (
    <div className="mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-[2000px] items-center justify-center px-4">
      <Card className="w-full max-w-lg border-border shadow-none">
        <CardHeader className="items-center gap-4 pb-0 text-center">
          <div className="flex size-20 items-center justify-center rounded-full bg-muted">
            <SearchX className="size-10 text-muted-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold">页面未找到</CardTitle>
          <p className="text-muted-foreground text-sm">
            您访问的页面不存在或已被移除，请检查链接是否正确。
          </p>
        </CardHeader>
        <CardContent className="mt-6 flex flex-col items-center gap-3">
          {entries.map(({ label, href, Icon }) => (
            <Button key={href} asChild variant="outline" size="sm" className="w-full gap-2 rounded-lg">
              <Link href={href}>
                <Icon className="size-4" />
                {label}
              </Link>
            </Button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
