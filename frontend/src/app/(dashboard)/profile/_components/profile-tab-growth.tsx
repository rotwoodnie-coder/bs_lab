"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@bs-lab/ui";
import { ListOrdered } from "@bs-lab/ui/icons";

import type { AuthUser } from "@/hooks/use-auth";

import { ProfileScoreTitleProgressCard } from "./ProfileScoreTitleProgressCard";
import { formatDateTime, formatNullable } from "./profile-format";
import { ProfileSectionTitle } from "./profile-section-title";
import { PROFILE_CARD_FLOAT_CLASS, PROFILE_INSET_SURFACE_CLASS } from "./profile-ui-classes";

export function ProfileTabGrowth({ user }: { user: AuthUser }) {
  const logs = user.scaleLogRecent ?? [];

  return (
    <div className="space-y-3">
      <ProfileScoreTitleProgressCard user={user} variant="compact" />

      <Card className={PROFILE_CARD_FLOAT_CLASS}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">
            <ProfileSectionTitle icon={ListOrdered}>积分流水（scale_log）</ProfileSectionTitle>
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">近期变动记录，按时间倒序展示。</CardDescription>
        </CardHeader>
        <CardContent className={["divide-y divide-slate-100 overflow-hidden", PROFILE_INSET_SURFACE_CLASS].join(" ")}>
          {logs.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">暂无积分流水。</p>
          ) : (
            logs.map((row) => {
              const n = Number(row.scaleNum ?? 0);
              const pos = n >= 0;
              return (
                <div key={row.seqId} className="flex flex-col gap-1 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 space-y-0.5">
                    <p className="text-xs text-slate-500">{formatDateTime(row.createTime)}</p>
                    <p className="truncate text-foreground" title={row.scaleSource ?? ""}>
                      {formatNullable(row.scaleSource)}
                    </p>
                  </div>
                  <p
                    className={[
                      "shrink-0 text-right font-semibold tabular-nums",
                      pos ? "text-emerald-600" : "text-red-600",
                    ].join(" ")}
                  >
                    {pos ? "+" : ""}
                    {n}
                  </p>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
