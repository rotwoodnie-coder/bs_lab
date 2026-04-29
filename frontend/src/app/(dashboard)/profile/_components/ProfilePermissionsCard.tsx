"use client";

import * as React from "react";
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@bs-lab/ui";
import { KeyRound } from "@bs-lab/ui/icons";

import { groupPermissions } from "@/lib/auth/permission-present";

import { ProfileSectionTitle } from "./profile-section-title";
import { PROFILE_CARD_FLOAT_CLASS } from "./profile-ui-classes";

export function ProfilePermissionsCard({ permissions }: { permissions: readonly string[] }) {
  const groups = React.useMemo(() => groupPermissions(permissions), [permissions]);

  return (
    <Card className={PROFILE_CARD_FLOAT_CLASS}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">
          <ProfileSectionTitle icon={KeyRound}>权限</ProfileSectionTitle>
        </CardTitle>
        <CardDescription className="text-xs text-slate-500">按模块聚合展示（用于排查“权限不足”）。</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {groups.length === 0 ? <p className="text-muted-foreground">未分配任何权限。</p> : null}
        {groups.map((g) => (
          <section key={g.groupName} className="space-y-2">
            <p className="font-medium text-foreground">{g.groupName}</p>
            <div className="flex flex-wrap gap-2">
              {g.items.map((it) => (
                <Badge key={it.code} variant="secondary" className="max-w-full border-0 bg-slate-100/90 shadow-sm">
                  <span className="truncate">{it.label}</span>
                </Badge>
              ))}
            </div>
          </section>
        ))}
      </CardContent>
    </Card>
  );
}

