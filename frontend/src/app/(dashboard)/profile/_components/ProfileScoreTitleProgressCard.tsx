"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Progress } from "@bs-lab/ui";
import { Coins, Trophy } from "@bs-lab/ui/icons";

import type { AuthUser } from "@/hooks/use-auth";
import { authRoleToUserRole } from "@/hooks/use-auth";
import { fetchV2ScaleTitles, type V2ScaleTitleItem } from "@/lib/v2/v2-scale-api";

import { ProfileSectionTitle } from "./profile-section-title";
import { PROFILE_CARD_FLOAT_CLASS, PROFILE_INSET_SURFACE_CLASS } from "./profile-ui-classes";

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
  const sorted = titles
    .slice()
    .sort((a, b) => safeInt(a.scoreNum) - safeInt(b.scoreNum));
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

function colorKeyForRank(rank: number): "bronze" | "silver" | "gold" | "platinum" | "diamond" {
  if (rank <= 0) return "bronze";
  if (rank === 1) return "silver";
  if (rank === 2) return "gold";
  if (rank === 3) return "platinum";
  return "diamond";
}

export function ProfileScoreTitleProgressCard({
  user,
  variant = "full",
}: {
  user: AuthUser;
  /** compact：用于设置页「积分成就」Tab，仅水平进度与档位，隐藏大号圆形积分球 */
  variant?: "full" | "compact";
}) {
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

  const embeddedTiers = user.scoreTitleProgress?.tiers ?? [];
  const fromProfile: V2ScaleTitleItem[] = React.useMemo(
    () =>
      embeddedTiers.map((t) => ({
        seqId: t.seqId,
        roleId: String(user.roleId ?? ""),
        titleName: t.titleName,
        icon: t.icon,
        scoreNum: t.scoreNum,
      })),
    [embeddedTiers, user.roleId],
  );

  const [loading, setLoading] = React.useState(() => fromProfile.length === 0);
  const [titles, setTitles] = React.useState<V2ScaleTitleItem[]>(() => fromProfile);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (fromProfile.length > 0) {
      setTitles(fromProfile);
      setLoading(false);
      setErr(null);
      return;
    }
    if (!user.userId) return;
    let cancelled = false;
    setLoading(true);
    setErr(null);
    (async () => {
      try {
        const roleId = String(user.roleId ?? "").trim();
        const rows = await fetchV2ScaleTitles(actor, roleId || undefined);
        if (!cancelled) setTitles(Array.isArray(rows) ? rows : []);
      } catch (e) {
        if (!cancelled) {
          setTitles([]);
          setErr(e instanceof Error ? e.message : "积分等级加载失败");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [actor, fromProfile, user.roleId, user.userId]);

  const score = safeInt(user.perScore ?? 0);
  const sortedTitles = React.useMemo(
    () => titles.slice().sort((a, b) => safeInt(a.scoreNum) - safeInt(b.scoreNum)),
    [titles],
  );
  const displayTiers = React.useMemo(() => sortedTitles.slice(0, 5), [sortedTitles]);
  const { current, next } = React.useMemo(() => pickCurrentAndNext(sortedTitles, score), [sortedTitles, score]);
  const currentMin = current ? safeInt(current.scoreNum) : 0;
  const nextMin = next ? safeInt(next.scoreNum) : null;
  const pct = computeProgress({ score, currentMin, nextMin });
  const gap = nextMin == null ? 0 : Math.max(0, nextMin - score);
  const gapFromServer =
    user.scoreTitleProgress?.pointsToNext != null && Number.isFinite(user.scoreTitleProgress.pointsToNext)
      ? Math.max(0, safeInt(user.scoreTitleProgress.pointsToNext))
      : null;
  const gapDisplay = gapFromServer != null ? gapFromServer : gap;

  return (
    <Card className={PROFILE_CARD_FLOAT_CLASS}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">
          <ProfileSectionTitle icon={Trophy}>积分等级</ProfileSectionTitle>
        </CardTitle>
        <CardDescription className="text-xs text-slate-500">
          {loading ? "正在加载称号规则…" : err ? `加载失败：${err}` : "您的积分可用于兑换特权和参与活动"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {variant === "compact" ? (
          <div className={["mb-1 flex flex-wrap items-end justify-between gap-3 p-3", PROFILE_INSET_SURFACE_CLASS].join(" ")}>
            <div>
              <p className="text-xs font-medium text-slate-500">当前积分（per_score）</p>
              <p className="mt-1 inline-flex items-center gap-2 text-2xl font-semibold tabular-nums tracking-tight text-foreground">
                <Coins className="size-5 text-primary" />
                {score.toLocaleString("zh-CN")}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                当前称号：<span className="font-medium text-foreground">{current?.titleName ?? "未达成"}</span>
                {next?.titleName ? (
                  <>
                    {" "}
                    → 下一档：<span className="font-medium text-foreground">{next.titleName}</span>
                  </>
                ) : null}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-4 py-2">
            {(() => {
              const currentIndex = current ? Math.max(0, displayTiers.findIndex((t) => t.seqId === current.seqId)) : -1;
              const levelIndex = currentIndex >= 0 ? currentIndex : 0;
              const key = colorKeyForRank(levelIndex);
              const badgeClasses =
                key === "diamond"
                  ? "from-sky-500 to-cyan-500"
                  : key === "platinum"
                    ? "from-slate-500 to-zinc-500"
                    : key === "gold"
                      ? "from-amber-500 to-orange-500"
                      : key === "silver"
                        ? "from-zinc-300 to-slate-200"
                        : "from-emerald-400 to-emerald-500";
              const badgeText = key === "silver" ? "text-slate-800" : "text-white";
              return (
                <div className={["relative grid size-40 place-items-center rounded-full bg-gradient-to-b", badgeClasses, "shadow-sm"].join(" ")}>
                  <div className="text-center">
                    <p className={["inline-flex items-center justify-center gap-2 text-3xl font-bold tabular-nums tracking-tight", badgeText].join(" ")}>
                      <Coins className={["size-6", badgeText].join(" ")} />
                      {score.toLocaleString("zh-CN")}
                    </p>
                    <p className={["text-xs font-medium opacity-90", badgeText].join(" ")}>{current?.titleName ?? "未达成"}</p>
                  </div>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-800 shadow">
                    {current?.titleName ?? "未达成"}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>等级进度</span>
            <span className="tabular-nums text-muted-foreground">{pct}%</span>
          </div>
          <Progress value={pct} className="h-2 bg-primary/15 [&_[data-slot=progress-indicator]]:bg-primary" />
          <p className="text-center text-xs text-muted-foreground">
            {sortedTitles.length === 0
              ? "暂无该角色的称号规则配置。"
              : next
                ? `距离下一档还差 ${gapDisplay.toLocaleString("zh-CN")} 分`
                : "已达最高称号"}
          </p>
        </div>

        <div className="grid grid-cols-5 gap-2 pt-1 text-xs">
          {Array.from({ length: 5 }).map((_, idx) => {
            const t = displayTiers[idx];
            const name = t?.titleName ?? "—";
            const active = t?.seqId != null && current?.seqId === t.seqId;
            const hasTier = t != null;
            return (
              <div
                key={t?.seqId ?? `tier-${idx}`}
                className={[
                  "text-center font-medium",
                  active ? "text-primary" : "text-muted-foreground",
                  hasTier ? "" : "opacity-40",
                ].join(" ")}
              >
                {name}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

