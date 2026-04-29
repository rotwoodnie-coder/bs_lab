"use client";

import * as React from "react";
import { Progress } from "@bs-lab/ui";
import { Coins } from "@bs-lab/ui/icons";

import type { AuthUser } from "@/hooks/use-auth";
import { authRoleToUserRole } from "@/hooks/use-auth";
import { fetchV2ScaleTitles, type V2ScaleTitleItem } from "@/lib/v2/v2-scale-api";

function safeInt(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  if (Number.isFinite(n)) return Math.trunc(n);
  return 0;
}

function computeProgress(args: { score: number; currentMin: number; nextMin: number | null }): number {
  if (args.nextMin == null) return 100;
  const base = Math.max(0, safeInt(args.currentMin));
  const next = Math.max(base + 1, safeInt(args.nextMin));
  const s = safeInt(args.score);
  if (s <= base) return 0;
  if (s >= next) return 100;
  return Math.round(((s - base) / (next - base)) * 100);
}

function pickCurrentAndNext(titles: V2ScaleTitleItem[], score: number): { current: V2ScaleTitleItem | null; next: V2ScaleTitleItem | null } {
  const sorted = titles.slice().sort((a, b) => safeInt(a.scoreNum) - safeInt(b.scoreNum));
  let current: V2ScaleTitleItem | null = null;
  let next: V2ScaleTitleItem | null = null;
  for (const t of sorted) {
    if (safeInt(t.scoreNum) <= score) current = t;
    if (safeInt(t.scoreNum) > score) {
      next = t;
      break;
    }
  }
  return { current, next };
}

export function ProfileScoreMiniPanel({ user }: { user: AuthUser }) {
  const actor = React.useMemo(() => {
    return {
      role: authRoleToUserRole(user.role),
      userId: user.userId,
      userName: user.userName || user.userId,
      orgId: user.orgId || "",
      tenantId: user.tenantId,
      appId: user.appId,
    };
  }, [user.appId, user.orgId, user.role, user.tenantId, user.userId, user.userName]);

  const [titles, setTitles] = React.useState<V2ScaleTitleItem[]>([]);

  React.useEffect(() => {
    if (!user.userId) return;
    let cancelled = false;
    (async () => {
      try {
        const roleId = String(user.roleId ?? "").trim();
        const rows = await fetchV2ScaleTitles(actor, roleId || undefined);
        if (!cancelled) setTitles(Array.isArray(rows) ? rows : []);
      } catch {
        if (!cancelled) setTitles([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [actor, user.roleId, user.userId]);

  const score = safeInt(user.perScore ?? 0);
  const { current, next } = React.useMemo(() => pickCurrentAndNext(titles, score), [titles, score]);
  const currentMin = current ? safeInt(current.scoreNum) : 0;
  const nextMin = next ? safeInt(next.scoreNum) : null;
  const pct = computeProgress({ score, currentMin, nextMin });
  const gap = nextMin == null ? 0 : Math.max(0, nextMin - score);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">个人积分</p>
        <p className="inline-flex items-center gap-1 text-sm font-semibold tabular-nums text-foreground">
          <Coins className="size-4 text-emerald-700" />
          {score.toLocaleString("zh-CN")}
        </p>
      </div>
      <Progress value={pct} className="h-2 bg-emerald-600/15 [&_[data-slot=progress-indicator]]:bg-emerald-700" />
      <p className="text-xs text-muted-foreground">
        {titles.length === 0 ? "暂无称号规则配置" : next ? `升级还需 ${gap.toLocaleString("zh-CN")} 积分` : "已达最高称号"}
      </p>
    </div>
  );
}

