"use client";

import * as React from "react";
import Link from "next/link";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  sonnerToast,
} from "@bs-lab/ui";
import { ArrowLeft, Footprints, Sparkles } from "@bs-lab/ui/icons";

import { ErrorBoundary } from "@/components/business/error-boundary";
import { useDemoRole } from "@/components/layout/demo-role-context";
import { simulateAcademicPromotion } from "@/lib/data-management";
import { DEMO_PARENT_USER_ID } from "@/lib/parent/demo-parent-ids";
import { readParentFamilyBinding } from "@/lib/parent/parent-family-binding-mock";
import {
  getCurrentAcademicYear,
  getUnifiedTask,
  listUnifiedSessions,
  listUnifiedWorksForSession,
  subscribeUnifiedMock,
  type UnifiedSessionMock,
} from "@/lib/unified-mock-store";
import { isSuperUserRole } from "@/lib/rbac/management-access";
import { UserRole } from "@/types/auth";

type FootprintTab = "current" | "archive";

function sessionsForParent(studentFilter: string | null): UnifiedSessionMock[] {
  const all = listUnifiedSessions().filter((s) => s.parentUserId === DEMO_PARENT_USER_ID);
  if (!studentFilter) return all;
  return all.filter((s) => s.studentUserId === studentFilter);
}

function filterByTab(sessions: UnifiedSessionMock[], tab: FootprintTab, currentYear: string): UnifiedSessionMock[] {
  if (tab === "current") {
    return sessions.filter((s) => !s.is_archived && s.academic_year === currentYear);
  }
  return sessions.filter((s) => s.is_archived || s.academic_year !== currentYear);
}

export default function ParentLabFootprintsPage() {
  return (
    <ErrorBoundary>
      <ParentLabFootprintsPageInner />
    </ErrorBoundary>
  );
}

function ParentLabFootprintsPageInner() {
  const { role } = useDemoRole();
  const [, bump] = React.useReducer((n) => n + 1, 0);
  const [tab, setTab] = React.useState<FootprintTab>("current");
  const [binding, setBinding] = React.useState<ReturnType<typeof readParentFamilyBinding>>(null);
  const [pickSession, setPickSession] = React.useState<UnifiedSessionMock | null>(null);

  React.useEffect(() => subscribeUnifiedMock(() => bump()), []);

  React.useEffect(() => {
    const sync = () => setBinding(readParentFamilyBinding());
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("bs-lab-parent-family-binding", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("bs-lab-parent-family-binding", sync);
    };
  }, []);

  const currentYear = React.useMemo(() => getCurrentAcademicYear(), [bump]);
  const studentFilter = binding?.studentUserId ?? null;
  const baseSessions = React.useMemo(
    () => sessionsForParent(studentFilter),
    [bump, studentFilter],
  );
  const visible = React.useMemo(
    () => filterByTab(baseSessions, tab, currentYear),
    [baseSessions, tab, currentYear],
  );

  const runPromotionDemo = () => {
    const r = simulateAcademicPromotion();
    sonnerToast.success("学年更替已完成（）", {
      description: `已封存 ${r.oldYear}，当前学年 ${r.newYear}；快照键 ${r.snapshotKey}`,
    });
    const archived = baseSessions.filter((s) => s.academic_year === r.oldYear).length;
    sonnerToast.message("成长档案袋", {
      description: `上一学年已收入「往届档案」${archived ? `（本页可见 ${archived} 条会话）` : ""}。`,
    });
  };

  if (role !== UserRole.PARENT && !isSuperUserRole(role)) {
    return (
      <div className="rounded-xl border border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
        当前页面面向家长角色。
        <div className="mt-4">
          <Link href="/parent/lab" className="text-primary underline-offset-4 hover:underline">
            返回家庭实验室
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <header className="space-y-2">
        <div className="flex items-center gap-2">
          <Button type="button" size="sm" variant="ghost" className="h-8 gap-1 px-2" asChild>
            <Link href="/parent/lab">
              <ArrowLeft className="size-3.5" aria-hidden />
              返回
            </Link>
          </Button>
          <Badge variant="outline" className="font-mono text-[10px]">
            学年 {currentYear}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Footprints className="size-6 text-primary" aria-hidden />
          <h1 className="text-lg font-semibold text-foreground">我的足迹</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          本页与统一 Mock 仓同源：默认只看本学年；往届数据进入档案袋，可随时回看实验过程与老师评语。
        </p>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="gap-1"
          onClick={runPromotionDemo}
        >
          <Sparkles className="size-3.5" aria-hidden />
          模拟学年更替（）
        </Button>
      </header>

      <Tabs value={tab} onValueChange={(v) => setTab(v as FootprintTab)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="current">本学年</TabsTrigger>
          <TabsTrigger value="archive">往届档案</TabsTrigger>
        </TabsList>
        <TabsContent value="current" className="mt-4 space-y-3">
          <SessionList sessions={visible} onOpen={setPickSession} emptyHint="本学年暂无会话，或已全部封存至往届。" />
        </TabsContent>
        <TabsContent value="archive" className="mt-4 space-y-3">
          <SessionList sessions={visible} onOpen={setPickSession} emptyHint="尚无往届档案。可点击「模拟学年更替」生成数据。" />
        </TabsContent>
      </Tabs>

      <Sheet open={pickSession !== null} onOpenChange={(o) => !o && setPickSession(null)}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-xl">
          {pickSession ? (
            <>
              <SheetHeader>
                <SheetTitle className="text-base">学年档案袋</SheetTitle>
                <SheetDescription className="font-mono text-[11px]">
                  {pickSession.sessionId} · {pickSession.academic_year ?? "—"}
                  {pickSession.is_archived ? " · 已归档" : ""}
                </SheetDescription>
              </SheetHeader>
              <div className="mt-4 space-y-3 text-sm">
                <p className="text-muted-foreground">
                  状态：{pickSession.completion_status}
                  {pickSession.teacher_feedback ? (
                    <>
                      <br />
                      <span className="text-foreground">教师寄语：{pickSession.teacher_feedback}</span>
                    </>
                  ) : null}
                </p>
                <p className="text-xs font-medium text-muted-foreground">作品集（抓拍）</p>
                <ul className="space-y-2">
                  {listUnifiedWorksForSession(pickSession.sessionId).map((w) => (
                    <li
                      key={w.workId}
                      className="flex items-center justify-between gap-2 rounded-md border border-border/80 bg-muted/15 px-3 py-2"
                    >
                      <span className="truncate">{w.title}</span>
                      <Badge variant="outline" className="shrink-0 text-[10px]">
                        {w.teacherReviewStatus}
                      </Badge>
                    </li>
                  ))}
                </ul>
                {pickSession.report_url ? (
                  <Button type="button" size="sm" variant="outline" asChild>
                    <Link href={pickSession.report_url}>查看成就卡 / 报告</Link>
                  </Button>
                ) : null}
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function SessionList({
  sessions,
  onOpen,
  emptyHint,
}: {
  sessions: UnifiedSessionMock[];
  onOpen: (s: UnifiedSessionMock) => void;
  emptyHint: string;
}) {
  if (sessions.length === 0) {
    return (
      <Card className="border-dashed">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">暂无记录</CardTitle>
          <CardDescription className="text-xs">{emptyHint}</CardDescription>
        </CardHeader>
      </Card>
    );
  }
  return (
    <ul className="space-y-2">
      {sessions.map((s) => {
        const task = s.taskId ? getUnifiedTask(s.taskId) : undefined;
        return (
          <li key={s.sessionId}>
            <Card className="cursor-pointer transition-colors hover:bg-muted/30" onClick={() => onOpen(s)} role="button">
              <CardHeader className="space-y-1 pb-2 pt-3">
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="text-sm">{task?.experimentTitle ?? s.experimentId}</CardTitle>
                  {s.is_archived ? (
                    <Badge variant="secondary" className="text-[10px]">
                      往届
                    </Badge>
                  ) : null}
                </div>
                <CardDescription className="text-[11px]">
                  {s.academic_year} · {s.completion_status} · {listUnifiedWorksForSession(s.sessionId).length} 件作品
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-3 pt-0">
                <Button type="button" size="sm" variant="outline" className="w-full">
                  打开档案袋
                </Button>
              </CardContent>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
