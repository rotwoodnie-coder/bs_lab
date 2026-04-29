"use client";

import * as React from "react";
import { Award, Clock, Coins, ShieldCheck } from "@bs-lab/ui/icons";

import type { AuthUser, ScoreTitleProgress } from "@/hooks/use-auth";
import { authRoleToUserRole } from "@/hooks/use-auth";
import { fetchV2ScaleTitles, type V2ScaleTitleItem } from "@/lib/v2/v2-scale-api";
import type { CoreApiActor } from "@/lib/core-api-shared";

import { formatDateTime, formatNullable } from "./profile-format";

function accountStatusLabel(status: string | null): string {
  const s = (status ?? "").trim().toLowerCase();
  if (s === "y") return "正常";
  if (s === "n") return "禁用";
  return formatNullable(status);
}

function pickTitleFromTiers(
  tiers: NonNullable<ScoreTitleProgress["tiers"]>,
  score: number,
): { currentName: string | null; nextName: string | null; nextThreshold: number | null } {
  const sorted = [...tiers].sort((a, b) => a.scoreNum - b.scoreNum);
  let last: (typeof tiers)[number] | null = null;
  for (const t of sorted) {
    if (t.scoreNum <= score) last = t;
  }
  const next = sorted.find((t) => t.scoreNum > score) ?? null;
  return {
    currentName: last?.titleName?.trim() || null,
    nextName: next?.titleName?.trim() || null,
    nextThreshold: next != null ? next.scoreNum : null,
  };
}

function v2ItemsToTiers(rows: V2ScaleTitleItem[]): NonNullable<ScoreTitleProgress["tiers"]> {
  return rows.map((r) => ({
    seqId: r.seqId,
    titleName: r.titleName,
    scoreNum: r.scoreNum,
    icon: r.icon,
  }));
}

function resolveTitleProgress(
  stp: ScoreTitleProgress | null | undefined,
  tiersOverride: NonNullable<ScoreTitleProgress["tiers"]> | null,
  score: number,
): { headline: string; hint: string } {
  const stpTiers = stp?.tiers ?? [];
  const tiers = tiersOverride && tiersOverride.length > 0 ? tiersOverride : stpTiers;

  let headline = stp?.currentTitleName?.trim() || "";
  let nextName = stp?.nextTitleName?.trim() || "";
  let nextThreshold = stp?.nextThreshold != null && Number.isFinite(Number(stp.nextThreshold)) ? Number(stp.nextThreshold) : null;
  let pointsToNext = stp?.pointsToNext != null && Number.isFinite(Number(stp.pointsToNext)) ? Number(stp.pointsToNext) : null;

  if (!headline && tiers.length > 0) {
    const picked = pickTitleFromTiers(tiers, score);
    headline = picked.currentName || "未达成";
    if (!nextName) nextName = picked.nextName || "";
    if (nextThreshold == null && picked.nextThreshold != null) nextThreshold = picked.nextThreshold;
  }
  if (!headline) headline = tiers.length === 0 ? "—" : "未达成";

  if (pointsToNext != null && Number.isFinite(pointsToNext) && nextName) {
    return { headline, hint: `下一档「${nextName}」还差 ${Math.max(0, Math.trunc(pointsToNext))} 分` };
  }
  if (nextThreshold != null && nextName) {
    const gap = Math.max(0, Math.ceil(nextThreshold - score));
    return { headline, hint: `下一档「${nextName}」阈值 ${nextThreshold} 分，还差 ${gap} 分` };
  }
  if (nextName) {
    return { headline, hint: `下一档：${nextName}` };
  }
  if (tiers.length === 0) {
    return { headline, hint: "暂无 scale_title 档位（按角色）" };
  }
  return { headline, hint: "已达最高档或当前分数满足最高档" };
}

function KpiCell({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border-0 bg-[#ffffff] p-4 shadow-sm md:p-5">
      <div className="flex items-start gap-2.5">
        <div className="mt-0.5 shrink-0 text-muted-foreground" aria-hidden>
          <Icon className="size-5 sm:size-[1.35rem]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-slate-600 sm:text-base">{label}</p>
          <div className="mt-2 min-h-[2.75rem] text-base font-semibold leading-snug text-foreground sm:text-lg">{children}</div>
        </div>
      </div>
    </div>
  );
}

/** KPI 栅格：数据映射 GET /v2/auth/profile → AuthUser；称号档位不足时补拉 /v2/scale/title */
export function ProfileKpiGrid({ user }: { user: AuthUser }) {
  const score = Number(user.perScore ?? 0);
  const embedded = user.scoreTitleProgress?.tiers ?? [];
  const fromProfile = embedded.length > 0;

  const actor: CoreApiActor = React.useMemo(
    () => ({
      role: authRoleToUserRole(user.role),
      userId: user.userId,
      userName: user.userName || user.userId,
      orgId: user.orgId || "",
      tenantId: user.tenantId,
      appId: user.appId,
    }),
    [user.appId, user.orgId, user.role, user.tenantId, user.userId, user.userName],
  );

  const [fetchedTiers, setFetchedTiers] = React.useState<NonNullable<ScoreTitleProgress["tiers"]> | null>(null);

  React.useEffect(() => {
    if (fromProfile || !user.userId) {
      setFetchedTiers(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const tryRoleIds = [String(user.roleId ?? "").trim(), String(user.recordUserRoleId ?? "").trim()].filter(
        (id, i, a) => id.length > 0 && a.indexOf(id) === i,
      );
      for (const rid of tryRoleIds.length > 0 ? tryRoleIds : [""]) {
        try {
          const rows = await fetchV2ScaleTitles(actor, rid || undefined);
          const tiers = v2ItemsToTiers(Array.isArray(rows) ? rows : []);
          if (!cancelled && tiers.length > 0) {
            setFetchedTiers(tiers);
            return;
          }
        } catch {
          /* 单角色失败则尝试下一 roleId */
        }
      }
      if (!cancelled) setFetchedTiers([]);
    })();
    return () => {
      cancelled = true;
    };
  }, [actor, fromProfile, user.recordUserRoleId, user.roleId, user.userId]);

  const effectiveOverride =
    fromProfile || fetchedTiers == null ? null : fetchedTiers.length > 0 ? fetchedTiers : null;
  const { headline, hint } = resolveTitleProgress(user.scoreTitleProgress, effectiveOverride, score);

  return (
    <div className="grid w-full min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCell label="当前积分（per_score）" icon={Coins}>
        <span className="tabular-nums text-xl sm:text-2xl">{score.toLocaleString("zh-CN")}</span>
      </KpiCell>
      <KpiCell label="称号进度（score_title）" icon={Award}>
        <p className="line-clamp-2">{headline}</p>
        <p className="mt-1 line-clamp-2 text-sm font-normal leading-snug text-muted-foreground sm:text-base">{hint}</p>
      </KpiCell>
      <KpiCell label="账号状态（status）" icon={ShieldCheck}>
        <span>{accountStatusLabel(user.status)}</span>
      </KpiCell>
      <KpiCell label="最近登录（last_login_time）" icon={Clock}>
        <span className="font-medium tabular-nums text-foreground">{formatDateTime(user.lastLoginTime)}</span>
      </KpiCell>
    </div>
  );
}
