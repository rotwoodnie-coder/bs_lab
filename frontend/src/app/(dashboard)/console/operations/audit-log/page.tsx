"use client";

import * as React from "react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@bs-lab/ui";
import { FileDiff, Loader2 } from "@bs-lab/ui/icons";
import {
  AUDIT_CATEGORY_LABEL,
  AUDIT_RISK_LABEL,
  type AuditTimePreset,
  type ConsoleAuditCategory,
  type ConsoleAuditLogRow,
  type ConsoleAuditRisk,
  computeConsoleAuditStats,
  filterLogsByTimePreset,
  getConsoleAuditLogs,
  sortAuditLogsForDisplay,
} from "@/lib/console-audit-log";
import { formatZhDateTimeSeconds } from "@/lib/datetime/format-zh";
import { DASHBOARD_MAIN_CONTAINER_CLASS } from "@/lib/layout-container-classes";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { fetchSysLogList } from "@/lib/v2/v2-sys-log-api";
import { buildMaterialsApiActor } from "@/lib/materials-api-actor";
import type { CoreApiActor } from "@/lib/core-api-shared";
import { UserRole } from "@/types/auth";
import { DiffDialog } from "./_components/audit-log-diff-dialog";
import { AuditLogFilterBar } from "./_components/audit-log-filter-bar";
import { riskBadgeVariant, toAuditRow } from "./_components/audit-log-utils";

function formatTs(ts: string) {
  return formatZhDateTimeSeconds(ts);
}

function StatsCard({
  title,
  value,
  subtitle,
  valueClassName,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  valueClassName?: string;
}) {
  return (
    <Card className="border-border shadow-none">
      <CardHeader className="space-y-0 pb-2 pt-4">
        <CardDescription>{title}</CardDescription>
        <CardTitle className={cn("font-mono text-2xl tabular-nums", valueClassName)}>{value}</CardTitle>
      </CardHeader>
      <CardContent className="pb-4 pt-0">
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </CardContent>
    </Card>
  );
}

export default function ConsoleAuditLogPage() {
  const auth = useAuth();
  const actor = React.useMemo<CoreApiActor>(() => {
    return buildMaterialsApiActor(auth.user.role as UserRole, auth.user.orgId, "admin-dict") as unknown as CoreApiActor;
  }, [auth.user.role, auth.user.orgId]);
  const [logs, setLogs] = React.useState<ConsoleAuditLogRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [useFallback, setUseFallback] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const result = await fetchSysLogList(actor, { page: 1, pageSize: 200 });
        if (!cancelled) {
          setLogs(result.items.map(toAuditRow));
          setUseFallback(false);
        }
      } catch {
        if (!cancelled) {
          setLogs(getConsoleAuditLogs());
          setUseFallback(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [actor]);

  const [q, setQ] = React.useState("");
  const [actorFilter, setActorFilter] = React.useState<string>("__all__");
  const [categoryFilter, setCategoryFilter] = React.useState<ConsoleAuditCategory | "all">("all");
  const [riskFilter, setRiskFilter] = React.useState<ConsoleAuditRisk | "all">("all");
  const [timePreset, setTimePreset] = React.useState<AuditTimePreset>("7d");
  const [diffRow, setDiffRow] = React.useState<ConsoleAuditLogRow | null>(null);

  const stats = React.useMemo(() => computeConsoleAuditStats(logs), [logs]);
  const actorOptions = React.useMemo(() => {
    const s = new Set<string>();
    for (const l of logs) s.add(l.actor);
    return [...s].sort();
  }, [logs]);

  const filtered = React.useMemo(() => {
    let r = filterLogsByTimePreset(logs, timePreset);
    if (actorFilter !== "__all__") r = r.filter((l) => l.actor === actorFilter);
    if (categoryFilter !== "all") r = r.filter((l) => l.category === categoryFilter);
    if (riskFilter !== "all") r = r.filter((l) => l.risk === riskFilter);
    const qq = q.trim().toLowerCase();
    if (qq) {
      r = r.filter(
        (l) =>
          l.actor.toLowerCase().includes(qq) ||
          l.actorRole.toLowerCase().includes(qq) ||
          l.resource.toLowerCase().includes(qq) ||
          l.summary.toLowerCase().includes(qq) ||
          l.targetId.toLowerCase().includes(qq) ||
          l.id.toLowerCase().includes(qq) ||
          (l.rejectionReason?.toLowerCase().includes(qq) ?? false),
      );
    }
    return sortAuditLogsForDisplay(r);
  }, [logs, q, actorFilter, categoryFilter, riskFilter, timePreset]);

  return (
    <div className={cn(DASHBOARD_MAIN_CONTAINER_CLASS, "flex flex-col gap-6")}>
      {useFallback ? (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-300">
          后端系统日志接口不可用，当前展示本地演示数据。仅超级管理员可查看完整日志。
        </div>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-3">
        <StatsCard title="今日操作总数" value={loading ? "—" : stats.todayTotal} subtitle="按当前数据聚合的全部审计条目" />
        <StatsCard
          title="异常操作预警"
          value={loading ? "—" : stats.anomalyAlerts}
          subtitle="Warning / Critical 级别条数"
          valueClassName="text-status-warning"
        />
        <StatsCard title="活跃操作员数" value={loading ? "—" : stats.activeAdmins} subtitle="今日有操作的不同操作人" />
      </div>

      <Card className="border-border shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">操作审计日志</CardTitle>
          <CardDescription>分类：内容变动、硬件控制、系统安全；高风险操作在列表中突出展示。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <AuditLogFilterBar
            q={q}
            onQChange={setQ}
            timePreset={timePreset}
            onTimePresetChange={setTimePreset}
            actorFilter={actorFilter}
            onActorFilterChange={setActorFilter}
            categoryFilter={categoryFilter}
            onCategoryFilterChange={setCategoryFilter}
            riskFilter={riskFilter}
            onRiskFilterChange={setRiskFilter}
            actorOptions={actorOptions}
          />
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="h-8 w-[108px] px-2 py-1.5 text-xs">时间</TableHead>
                    <TableHead className="h-8 w-[72px] px-2 py-1.5 text-xs">等级</TableHead>
                    <TableHead className="h-8 w-[88px] px-2 py-1.5 text-xs">分类</TableHead>
                    <TableHead className="h-8 min-w-[120px] px-2 py-1.5 text-xs">操作人</TableHead>
                    <TableHead className="h-8 min-w-[100px] px-2 py-1.5 text-xs">Target</TableHead>
                    <TableHead className="h-8 w-[56px] px-2 py-1.5 text-xs">动作</TableHead>
                    <TableHead className="h-8 min-w-[160px] px-2 py-1.5 text-xs">摘要</TableHead>
                    <TableHead className="h-8 w-[52px] px-2 py-1.5 text-xs">对比</TableHead>
                    <TableHead className="h-8 min-w-[100px] px-2 py-1.5 text-xs">驳回理由</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((l) => (
                    <TableRow key={l.id} className={cn(l.iotScope && "bg-destructive/5 dark:bg-destructive/10")}>
                      <TableCell className="px-2 py-1.5 font-mono text-[11px] text-muted-foreground">{formatTs(l.ts)}</TableCell>
                      <TableCell className="px-2 py-1.5">
                        <Badge variant={riskBadgeVariant(l.risk)} className="px-1.5 py-0 text-[10px] font-normal">{AUDIT_RISK_LABEL[l.risk]}</Badge>
                      </TableCell>
                      <TableCell className="px-2 py-1.5">
                        <span className="text-[11px] text-foreground">{AUDIT_CATEGORY_LABEL[l.category]}</span>
                        {l.iotScope ? <Badge variant="outline" className="ml-1 border-destructive/40 px-1 py-0 text-[9px] font-normal">IoT</Badge> : null}
                      </TableCell>
                      <TableCell className="max-w-[140px] px-2 py-1.5">
                        <div className="truncate font-mono text-[11px]" title={l.actor}>{l.actor}</div>
                        {l.actorRole ? <div className="truncate text-[10px] text-muted-foreground" title={l.actorRole}>{l.actorRole}</div> : null}
                      </TableCell>
                      <TableCell className="max-w-[120px] px-2 py-1.5 font-mono text-[11px]" title={l.targetId}>
                        <span className="line-clamp-2 break-all">{l.targetId}</span>
                      </TableCell>
                      <TableCell className="px-2 py-1.5 font-mono text-[11px]">{l.action}</TableCell>
                      <TableCell className="max-w-[220px] px-2 py-1.5 text-xs leading-snug" title={l.summary}>
                        <span className="line-clamp-2">{l.summary || "—"}</span>
                      </TableCell>
                      <TableCell className="px-2 py-1.5">
                        <Button type="button" variant="ghost" size="sm" className="h-7 gap-1 px-1.5 text-[11px]"
                          disabled={!l.payloadBefore?.trim() && !l.payloadAfter?.trim()}
                          onClick={() => setDiffRow(l)} aria-label="查看 Payload 对比">
                          <FileDiff className="size-3.5" />
                        </Button>
                      </TableCell>
                      <TableCell className="max-w-[160px] px-2 py-1.5 text-[11px] leading-snug text-muted-foreground" title={l.rejectionReason}>
                        {l.rejectionReason ? <span className="line-clamp-2 text-destructive">{l.rejectionReason}</span> : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {!loading && filtered.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground">当前筛选条件下无记录。</p>
          ) : null}
        </CardContent>
      </Card>
      <DiffDialog open={Boolean(diffRow)} onOpenChange={(o) => !o && setDiffRow(null)} row={diffRow} />
    </div>
  );
}
