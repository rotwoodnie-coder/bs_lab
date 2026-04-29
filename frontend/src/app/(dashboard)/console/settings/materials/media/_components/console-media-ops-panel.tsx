"use client";

import * as React from "react";
import { Alert, AlertDescription, AlertTitle, Button, Card, CardContent, CardHeader, CardTitle } from "@bs-lab/ui";

import type { MediaActor } from "../page.api";
import {
  completeMediaPendingJobs,
  getMediaOrphanReport,
  processMediaOutbox,
} from "../page.api";
import type { MediaOrphanGovernanceReport } from "../page.types";
import { UserRole } from "@/types/auth";

type Props = {
  actor: MediaActor;
  onCompleted?: () => void;
};

function canMediaRead(role: MediaActor["role"]): boolean {
  return role !== UserRole.STUDENT && role !== UserRole.PARENT;
}

function canOutboxOps(role: MediaActor["role"]): boolean {
  return (
    role === UserRole.RESEARCHER ||
    role === UserRole.SCHOOL_ADMIN ||
    role === UserRole.DISTRICT_ADMIN ||
    role === UserRole.SUPER_ADMIN
  );
}

export function ConsoleMediaOpsPanel({ actor, onCompleted }: Props) {
  const [orphan, setOrphan] = React.useState<MediaOrphanGovernanceReport | null>(null);
  const [jobMsg, setJobMsg] = React.useState<string | null>(null);
  const [outboxMsg, setOutboxMsg] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [err, setErr] = React.useState<string | null>(null);

  const run = React.useCallback(
    async (label: string, fn: () => Promise<void>) => {
      setBusy(label);
      setErr(null);
      try {
        await fn();
        onCompleted?.();
      } catch (e) {
        setErr(e instanceof Error ? e.message : "操作失败");
      } finally {
        setBusy(null);
      }
    },
    [onCompleted],
  );

  if (!canMediaRead(actor.role)) {
    return (
      <Alert>
        <AlertTitle>联调运维</AlertTitle>
        <AlertDescription>请将角色切换为教师或管理员后，可使用异步任务与治理快照能力。</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="border-border shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">联调运维</CardTitle>
        <p className="text-muted-foreground text-sm">
          无登录环境下用于推进异步任务、Outbox 与孤儿资源观察；不影响业务数据唯一性规则。
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {err ? (
          <Alert variant="destructive">
            <AlertTitle>操作失败</AlertTitle>
            <AlertDescription>{err}</AlertDescription>
          </Alert>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={!!busy}
            onClick={() =>
              void run("orphan", async () => {
                const data = await getMediaOrphanReport(actor);
                setOrphan(data);
                setJobMsg(null);
                setOutboxMsg(null);
              })
            }
          >
            {busy === "orphan" ? "加载中…" : "刷新孤儿治理快照"}
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={!!busy}
            onClick={() =>
              void run("jobs", async () => {
                const res = await completeMediaPendingJobs(actor, 50);
                setJobMsg(`已消化 ${res.completed} 条异步任务`);
                setOutboxMsg(null);
              })
            }
          >
            {busy === "jobs" ? "处理中…" : "消化待处理异步任务"}
          </Button>
          {canOutboxOps(actor.role) ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={!!busy}
              onClick={() =>
                void run("outbox", async () => {
                  const res = await processMediaOutbox(actor, 50);
                  setOutboxMsg(
                    `扫描 ${res.scanned}，已发布 ${res.published}，退避 ${res.scheduledRetry}，失败 ${res.failed}，并发跳过 ${res.skippedInflight}`,
                  );
                  setJobMsg(null);
                })
              }
            >
              {busy === "outbox" ? "处理中…" : "处理 Outbox 队列"}
            </Button>
          ) : null}
        </div>

        {!canOutboxOps(actor.role) ? (
          <p className="text-muted-foreground text-xs">
            Outbox 批量处理需要教研员或管理员角色（<code className="text-foreground">media:outbox</code>
            权限）。
          </p>
        ) : null}

        {jobMsg ? (
          <Alert>
            <AlertTitle>异步任务</AlertTitle>
            <AlertDescription>{jobMsg}</AlertDescription>
          </Alert>
        ) : null}

        {outboxMsg ? (
          <Alert>
            <AlertTitle>Outbox</AlertTitle>
            <AlertDescription>{outboxMsg}</AlertDescription>
          </Alert>
        ) : null}

        {orphan ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1 rounded-md border border-border p-3 text-sm">
              <p className="font-medium text-foreground">零引用物理资源（refCount=0）</p>
              <p className="text-muted-foreground">{orphan.assetsWithZeroRefCount.length} 条</p>
              <ul className="text-muted-foreground max-h-32 list-inside list-disc overflow-auto text-xs">
                {orphan.assetsWithZeroRefCount.slice(0, 12).map((a) => (
                  <li key={a.id}>
                    {a.id.slice(0, 8)}… · {a.mediaType}
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-1 rounded-md border border-border p-3 text-sm">
              <p className="font-medium text-foreground">未被业务引用指向的登记</p>
              <p className="text-muted-foreground">{orphan.registriesWithNoReferences.length} 条</p>
              <ul className="text-muted-foreground max-h-32 list-inside list-disc overflow-auto text-xs">
                {orphan.registriesWithNoReferences.slice(0, 12).map((r) => (
                  <li key={r.id}>
                    {r.title} · {r.reviewStatus}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
