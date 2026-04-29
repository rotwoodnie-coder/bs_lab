"use client";

import * as React from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  sonnerToast,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@bs-lab/ui";

import { ManagementAnimatedNumber } from "@/components/dashboard/management-animated-metric";
import { useDemoRole } from "@/components/layout/demo-role-context";
import {
  BS_LAB_CURRICULUM_STANDARDS_UPDATED,
  computeCurriculumStandardsDashboardPayload,
  readCurriculumStandardsStore,
  type CurriculumStandardsDashboardPayload,
} from "@/lib/curriculum-standards-storage";
import { listWorkflowEvents, type WorkflowEvent } from "@/lib/workflow-events-api";
import { UserRole, userRoleLabelZh } from "@/types/auth";

export default function DistrictOverviewPage() {
  const { role, orgId } = useDemoRole();
  const [curriculumDash, setCurriculumDash] = React.useState<CurriculumStandardsDashboardPayload | null>(null);
  const [events, setEvents] = React.useState<WorkflowEvent[]>([]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const sync = () => {
      setCurriculumDash(computeCurriculumStandardsDashboardPayload(readCurriculumStandardsStore()));
    };
    sync();
    const onUpdated = (ev: Event) => {
      const e = ev as CustomEvent<CurriculumStandardsDashboardPayload>;
      if (e.detail?.totals) setCurriculumDash(e.detail);
      else sync();
    };
    window.addEventListener(BS_LAB_CURRICULUM_STANDARDS_UPDATED, onUpdated);
    return () => window.removeEventListener(BS_LAB_CURRICULUM_STANDARDS_UPDATED, onUpdated);
  }, []);

  React.useEffect(() => {
    listWorkflowEvents(
      {
        role,
        orgId,
        userId: `${role}-demo`,
        userName: `${role}-demo`,
      },
      8,
    )
      .then(setEvents)
      .catch(() => {
        setEvents([]);
      });
  }, [role, orgId]);

  const allowed =
    role === UserRole.DISTRICT_ADMIN ||
    role === UserRole.RESEARCHER ||
    role === UserRole.SUPER_ADMIN;

  if (!allowed) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/30 px-6 py-16 text-center">
        <p className="text-sm font-medium text-foreground">页面不可见</p>
        <p className="mt-2 text-sm text-muted-foreground">
          「全区业务概览」仅对
          <span className="font-medium text-foreground"> {userRoleLabelZh(UserRole.DISTRICT_ADMIN)} </span>
          、
          <span className="font-medium text-foreground"> {userRoleLabelZh(UserRole.RESEARCHER)} </span>
          与
          <span className="font-medium text-foreground"> {userRoleLabelZh(UserRole.SUPER_ADMIN)} </span>
          开放。请使用具备相应权限的账号访问。
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">全区业务概览</h1>
        <p className="text-sm text-muted-foreground">
          区级视角：实验室运行、申请与安全态势。
        </p>
      </header>

      <section aria-label="区本课标目录（课标仓实时）" className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">区本课标目录（实时）</h2>
          <p className="text-sm text-muted-foreground">
            数据来自 <span className="font-mono text-foreground">curriculum-standards-storage</span>
            ；在课标维护页保存后通过 CustomEvent 同步本页，无需刷新。
          </p>
          {curriculumDash ? (
            <p className="mt-1 text-xs text-muted-foreground tabular-nums">
              最近更新 {new Date(curriculumDash.updatedAt).toLocaleString("zh-CN")}
            </p>
          ) : null}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Card className="border-border shadow-xs">
            <CardHeader className="pb-2">
              <CardDescription>课标条目总数</CardDescription>
              <CardTitle className="text-3xl tabular-nums tracking-tight text-foreground">
                <ManagementAnimatedNumber
                  value={curriculumDash?.totals.entryTotal ?? 0}
                  format={(n) => String(Math.round(n))}
                  durationMs={900}
                />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">全学科《实验教学基本目录》条目合计</p>
            </CardContent>
          </Card>
          <Card className="border-border shadow-xs">
            <CardHeader className="pb-2">
              <CardDescription>已关联基本实验活动的条目</CardDescription>
              <CardTitle className="text-3xl tabular-nums tracking-tight text-foreground">
                <ManagementAnimatedNumber
                  value={curriculumDash?.totals.rowsWithExperiments ?? 0}
                  format={(n) => String(Math.round(n))}
                  durationMs={900}
                />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">至少填写过一条「基本实验活动」的课标行</p>
            </CardContent>
          </Card>
          <Card className="border-border shadow-xs sm:col-span-2 xl:col-span-1">
            <CardHeader className="pb-2">
              <CardDescription>基本实验活动细目数</CardDescription>
              <CardTitle className="text-3xl tabular-nums tracking-tight text-foreground">
                <ManagementAnimatedNumber
                  value={curriculumDash?.totals.linkedExperimentItems ?? 0}
                  format={(n) => String(Math.round(n))}
                  durationMs={900}
                />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">各条目下列出的实验活动字符串条数之和</p>
            </CardContent>
          </Card>
        </div>
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-xs">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[120px]">学科</TableHead>
                <TableHead className="text-right">条目总数</TableHead>
                <TableHead className="text-right">含实验条目</TableHead>
                <TableHead className="text-right">实验活动细目</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {curriculumDash == null ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                    正在读取课标仓…
                  </TableCell>
                </TableRow>
              ) : (
                curriculumDash.subjects.map((s) => (
                  <TableRow key={s.subjectId}>
                    <TableCell className="font-medium">{s.subjectName}</TableCell>
                    <TableCell className="text-right tabular-nums">{s.entryTotal}</TableCell>
                    <TableCell className="text-right tabular-nums">{s.rowsWithExperiments}</TableCell>
                    <TableCell className="text-right tabular-nums">{s.linkedExperimentItems}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      <section aria-label="事件台账（可追溯）" className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">事件台账（可追溯）</h2>
          <p className="text-sm text-muted-foreground">提交、审核、发布等关键动作会写入台账，支持按组织追溯。</p>
        </div>
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-xs">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>时间</TableHead>
                <TableHead>事件类型</TableHead>
                <TableHead>资源</TableHead>
                <TableHead>操作者</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                    暂无事件（或后端未连接）
                  </TableCell>
                </TableRow>
              ) : (
                events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(event.createdAt).toLocaleString("zh-CN")}
                    </TableCell>
                    <TableCell className="font-medium">{event.type}</TableCell>
                    <TableCell>{event.resourceType}:{event.resourceId}</TableCell>
                    <TableCell>{event.actorName}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      <section aria-label="核心统计">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="border-border shadow-xs">
            <CardHeader className="pb-2">
              <CardDescription>全区实验室总数</CardDescription>
              <CardTitle className="text-3xl tabular-nums tracking-tight text-foreground">
                <ManagementAnimatedNumber
                  value={0}
                  format={() => "—"}
                  durationMs={0}
                />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">数据统计中</p>
            </CardContent>
          </Card>
          <Card className="border-border shadow-xs">
            <CardHeader className="pb-2">
              <CardDescription>今日在线实验</CardDescription>
              <CardTitle className="text-3xl tabular-nums tracking-tight text-foreground">
                <ManagementAnimatedNumber
                  value={0}
                  format={() => "—"}
                  durationMs={0}
                />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">数据统计中</p>
            </CardContent>
          </Card>
          <Card className="border-border shadow-xs">
            <CardHeader className="pb-2">
              <CardDescription>本月申请单量</CardDescription>
              <CardTitle className="text-3xl tabular-nums tracking-tight text-foreground">
                <ManagementAnimatedNumber
                  value={0}
                  format={() => "—"}
                  durationMs={0}
                />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">数据统计中</p>
            </CardContent>
          </Card>
          <Card className="border-border shadow-xs">
            <CardHeader className="pb-2">
              <CardDescription>安全预警数</CardDescription>
              <CardTitle className="text-3xl tabular-nums tracking-tight text-foreground">
                <ManagementAnimatedNumber
                  value={0}
                  format={() => "—"}
                  durationMs={0}
                />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">数据统计中</p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section aria-label="实验通过率排行" className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">实验通过率排行（教研内参）</h2>
          <p className="text-sm text-muted-foreground">
            数据统计中，等待真实数据接入。
          </p>
        </div>
      </section>

      <section aria-label="高频错题榜" className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">高频错题榜</h2>
          <p className="text-sm text-muted-foreground">数据统计中，等待真实数据接入。</p>
        </div>
      </section>

      <section aria-label="学校实验进度" className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">学校实验进度排名</h2>
          <p className="text-sm text-muted-foreground">数据统计中，等待真实数据接入。</p>
        </div>
      </section>
    </div>
  );
}
