"use client";

import * as React from "react";
import { Badge, Button, Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@bs-lab/ui";
import { Building2, Shield } from "@bs-lab/ui/icons";

import type { AuthUser, UserRoleBinding } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { formatNullable } from "./profile-format";

function isActiveBinding(
  b: UserRoleBinding,
  user: AuthUser,
): boolean {
  const sameRole = String(b.roleId ?? "").trim() === String(user.roleId ?? "").trim();
  const sameOrg = String(b.orgId ?? "").trim() === String(user.orgId ?? "").trim();
  return sameRole && sameOrg;
}

export function ProfileRoleBindingsSheet({ user }: { user: AuthUser }) {
  const [open, setOpen] = React.useState(false);
  const list = user.userRoleBindings ?? [];
  if (list.length === 0) return null;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="rounded-lg border-slate-200/60">
          查看全部组织与角色
          {list.length > 1 ? <Badge variant="secondary" className="ml-2 tabular-nums">{list.length}</Badge> : null}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="flex w-[min(100vw,24rem)] flex-col border-l border-slate-200/60 sm:max-w-md">
        <SheetHeader>
          <SheetTitle>组织与角色（sys_user_role）</SheetTitle>
          <SheetDescription>多组织/多角色绑定列表；高亮为当前会话身份。</SheetDescription>
        </SheetHeader>
        <div className="sidebar-scroll-v0 mt-4 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1">
          {list.map((b) => {
            const active = isActiveBinding(b, user);
            return (
              <div
                key={b.seqId}
                className={cn(
                  "rounded-xl border px-3 py-2.5 text-sm transition-colors",
                  active ? "border-primary/30 bg-primary/10 text-primary" : "border-slate-200/60 bg-card hover:bg-secondary",
                )}
              >
                <div className="flex items-start gap-2">
                  <Shield className="mt-0.5 size-4 shrink-0 opacity-80" />
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="font-medium text-foreground">{formatNullable(b.roleName ?? b.roleId)}</p>
                    <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Building2 className="size-3.5 shrink-0" />
                      <span className="truncate">{formatNullable(b.orgName ?? b.orgId)}</span>
                    </p>
                    {active ? (
                      <Badge variant="outline" className="mt-1 border-primary/40 text-xs text-primary">
                        当前会话
                      </Badge>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
