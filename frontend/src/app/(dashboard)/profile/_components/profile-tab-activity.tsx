"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@bs-lab/ui";
import { Activity } from "@bs-lab/ui/icons";

import type { AuthUser } from "@/hooks/use-auth";

import { ProfileAuditCard } from "./ProfileAuditCard";
import { formatDateTime, formatNullable } from "./profile-format";
import { ProfileSectionTitle } from "./profile-section-title";
import { PROFILE_CARD_FLOAT_CLASS, PROFILE_INSET_SURFACE_CLASS } from "./profile-ui-classes";

export function ProfileTabActivity({ user }: { user: AuthUser }) {
  const rows = user.sysLogRecent ?? [];

  return (
    <div className="space-y-3">
      <Card className={PROFILE_CARD_FLOAT_CLASS}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">
            <ProfileSectionTitle icon={Activity}>系统日志（sys_log）</ProfileSectionTitle>
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">近期系统侧操作记录摘要。</CardDescription>
        </CardHeader>
        <CardContent className={["divide-y divide-slate-100 overflow-hidden", PROFILE_INSET_SURFACE_CLASS].join(" ")}>
          {rows.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">暂无系统日志。</p>
          ) : (
            rows.map((r) => (
              <div key={r.logId} className="grid gap-1 px-4 py-3 text-sm sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                <div className="min-w-0 space-y-0.5">
                  <p className="text-xs text-slate-500">{formatDateTime(r.logTime)}</p>
                  <p className="truncate font-medium text-foreground">{formatNullable(r.logType)}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {formatNullable(r.logDataType)} / {formatNullable(r.logDataId)}
                  </p>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <ProfileAuditCard user={user} />
    </div>
  );
}
