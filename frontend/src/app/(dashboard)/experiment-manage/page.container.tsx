"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@bs-lab/ui";
import { BookOpen, CheckCircle2, CircleDot, FileEdit, FlaskConical, Layers, Maximize2, Minimize2, Plus, Search, XCircle } from "@bs-lab/ui/icons";
import { SubjectSelectionTree } from "@/components/business/tree/subject-selection-tree";
import { LeftTreeRightTableLayout } from "@/components/layout/left-tree-right-table-layout";
import { ManagementKpiCards } from "@/components/business/common/ManagementKpiCards";
import { ManagementListToolbar } from "@/components/business/common/ManagementListToolbar";
import { ManagementPageFrame } from "@/components/business/common/ManagementPageFrame";
import type { ApiActor } from "@/lib/new-core-api";
import { GRADE_FIRST_SUBJECT_TREE_INITIAL } from "@/lib/tree/subject-tree-grade-first-state";
import { lucideIconForSubjectLabel } from "@/lib/tree/discipline-tree-icons";
import { findDisciplineNode } from "@/lib/subject-taxonomy";
import { useSubjectTreeMetrics } from "@/hooks/use-subject-tree-metrics";
import { fetchV2ExpStats } from "@/lib/v2/v2-exp-api";

import { useExperimentManage } from "./page.hooks";
import { ExperimentManageV2TableView } from "./_components/ExperimentManageV2TableView";
import { ExperimentManageCardsView } from "./_components/ExperimentManageCardsView";
import { PublishAssignmentDialog } from "./_components/PublishAssignmentDialog";
import { v2ExpMsgItemToMgmtRow } from "./v2-exp-msg-to-mgmt-row";

const EXPERIMENT_MANAGE_EDITOR_PATH = "/experiment-manage/editor";

export default function ExperimentManagePageContainer() {
  const router = useRouter();
  const {
    actor,
    canShelf,
    items, total, draftTotal, loading,
    subjects, grades, difficulties,
    q, setQ,
    statusFilter, setStatusFilter,
    selectedSubject, setSelectedSubject,
    page, pageSize, setPage,
    view, setView,
    refresh,
    assignTarget,
    assignDialogOpen,
    assignPending,
    openAssignDialog,
    setAssignDialogOpen,
    confirmAssign,
    deletePending,
    deleteExperiment,
  } = useExperimentManage();
  const readOnly = !canShelf;
  const [collapseAllToken, setCollapseAllToken] = React.useState(0);
  const [fullScreen, setFullScreen] = React.useState(false);
  const [rightFontPx, setRightFontPx] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (typeof document === "undefined") return;
    const el = document.documentElement;
    if (fullScreen) el.setAttribute("data-exp-mgmt-fullscreen", "1");
    else el.removeAttribute("data-exp-mgmt-fullscreen");
    return () => {
      el.removeAttribute("data-exp-mgmt-fullscreen");
    };
  }, [fullScreen]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const clamp = (n: number, a: number, b: number) => Math.min(b, Math.max(a, n));
    const recompute = () => {
      const vw = window.innerWidth || 0;

      // 约束：<2000px 时随窗口缩小同步收敛字号与高度（基于 1920×900 的体感基准）
      if (vw > 0 && vw < 2000) {
        // 宽度驱动优先：以 1920 为基准，避免高度变化造成缩放“漂移”
        const scale = clamp(Math.min(vw / 1920, 1.0), 0.7, 1.0);
        const px = Math.round(16 * scale * 10) / 10; // 保留 0.1px，避免跳动
        setRightFontPx((prev) => (prev === px ? prev : px));
        return;
      }

      // >=2000px 交给 CSS 媒体查询（保持大屏效果不变）
      setRightFontPx((prev) => (prev == null ? prev : null));
    };

    recompute();
    window.addEventListener("resize", recompute, { passive: true });
    return () => window.removeEventListener("resize", recompute);
  }, []);

  const nameByIdMap = React.useMemo(() => {
    const subj = Object.fromEntries(subjects.map((s) => [s.id, s.name]));
    const gr = Object.fromEntries(grades.map((g) => [g.id, g.name]));
    const diff = Object.fromEntries(difficulties.map((d) => [d.id, d.name]));
    return { subjectNameById: subj, gradeNameById: gr, difficultyNameById: diff };
  }, [subjects, grades, difficulties]);

  const { subjectNameById, gradeNameById, difficultyNameById } = nameByIdMap;

  const cardRows = React.useMemo(
    () =>
      view !== "cards" ? [] :
      items.map((it) =>
        v2ExpMsgItemToMgmtRow(it, {
          subject: it.subjectId ? subjectNameById[it.subjectId] ?? it.subjectId : "—",
          grade: it.gradeId ? gradeNameById[it.gradeId] ?? it.gradeId : "—",
          authorDisplay: it.createUserId ?? "—",
        }),
      ),
    [items, subjectNameById, gradeNameById, view],
  );

  const apiActor = actor as ApiActor;
  const selectedSubjectId = React.useMemo(() => {
    if (!selectedSubject) return "";
    if (selectedSubject.kind === "discipline") return selectedSubject.nodeId;
    if (selectedSubject.kind === "leaf") return selectedSubject.leaf.nodeId;
    return "";
  }, [selectedSubject]);
  const SUBJECT_ALL_VALUE = "__all__";
  const experimentSubjectTreeStorageKey = "bs-lab:experiment-manage-subject-tree:v2";

  const { metrics: subjectTreeMetrics } = useSubjectTreeMetrics(actor, fetchV2ExpStats);

  const kpis = React.useMemo(() => {
    const counts = items.reduce(
      (acc, it) => {
        if (it.status === "y") acc.approved++;
        else if (it.status === "t") acc.drafts++;
        else if (it.status === "n") acc.rejected++;
        return acc;
      },
      { approved: 0, drafts: 0, rejected: 0 },
    );
    return [
      { key: "total", label: "实验总数", value: total },
      { key: "approved", label: "已通过", value: counts.approved, tone: "success" as const },
      { key: "drafts", label: "草稿", value: counts.drafts, tone: "warning" as const },
      { key: "rejected", label: "未通过", value: counts.rejected, tone: "danger" as const },
    ];
  }, [items, total]);

  return (
    <LeftTreeRightTableLayout
      className="min-h-[min(72dvh,640px)] -mx-2 sm:-mx-3 lg:-mx-4 min-[2000px]:mx-0 -ml-3 sm:-ml-4 lg:-ml-4 min-[2000px]:ml-0 pl-px"
      leftTitle="学科树"
      expandedRailWidthPx={390}
      autoCollapseBreakpointPx={1600}
      hideLeft={fullScreen}
      onCollapseAllLeft={() => setCollapseAllToken((x) => x + 1)}
      left={
        <SubjectSelectionTree
          storageKey={experimentSubjectTreeStorageKey}
          initialTreeState={GRADE_FIRST_SUBJECT_TREE_INITIAL}
          skipLegacyTreeHydration
          value={selectedSubject}
          onChange={setSelectedSubject}
          showEditToggle={false}
          collapseAllToken={collapseAllToken}
          metrics={subjectTreeMetrics}
        />
      }
      right={
        <div
          className="exp-mgmt-right-scale flex-1 w-full min-w-0"
          style={
            rightFontPx != null
              ? ({ ["--exp-mgmt-right-font" as any]: `${rightFontPx}px` } as React.CSSProperties)
              : undefined
          }
        >
          <ManagementPageFrame
            className="[scrollbar-gutter:stable]"
            cardClassName="w-full max-w-none"
              hideTopSection={fullScreen}
              title={
                <>
                  <FlaskConical className="size-6 shrink-0 text-muted-foreground" />
                  <h1 className="text-2xl font-bold text-foreground">实验课程管理</h1>
                  {readOnly ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="secondary" className="bg-slate-100 text-slate-500 font-medium">
                          只读模式
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent sideOffset={6}>
                        当前账号无流程治理权限，可查看列表但无法编辑或删除。
                      </TooltipContent>
                    </Tooltip>
                  ) : null}
                </>
              }
              description="管理平台上的所有实验内容和审核状态"
              kpis={<ManagementKpiCards items={kpis} />}
              cardTitle={
                <div className="flex items-center justify-between gap-3">
                  <span>实验列表</span>
                  <div className="flex shrink-0 items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 shrink-0 rounded-md"
                      onClick={() => setFullScreen((v) => !v)}
                      aria-label={fullScreen ? "退出全屏" : "进入全屏"}
                      title={fullScreen ? "退出全屏" : "进入全屏"}
                    >
                      {fullScreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
                    </Button>
                    <Button
                      type="button"
                      className="h-9 shrink-0 gap-1.5 rounded-md"
                      onClick={() => router.push(EXPERIMENT_MANAGE_EDITOR_PATH, { scroll: false })}
                    >
                      <Plus className="size-4" />
                      新建实验课程
                    </Button>
                  </div>
                </div>
              }
              cardToolbar={
                <div className="mt-4 rounded-md border border-slate-200/70 bg-slate-50/50 px-3 py-2">
                  <ManagementListToolbar
                    view={view}
                    onViewChange={setView}
                    left={
                    <div className="flex w-full min-w-0 flex-row flex-nowrap items-center gap-2 sm:gap-4">
                      <div className="relative min-w-0 max-w-[550px] flex-1 rounded-md shadow-sm">
                        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                        <Input
                          value={q}
                          onChange={(e) => setQ(e.target.value)}
                          placeholder="搜索实验名称"
                          aria-label="搜索实验名称"
                          className="h-10 w-full pl-10 rounded-md border-slate-200 bg-white shadow-none"
                        />
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Select
                          value={selectedSubjectId || SUBJECT_ALL_VALUE}
                          onValueChange={(v) => {
                            const nextId = String(v ?? "").trim();
                            if (!nextId || nextId === SUBJECT_ALL_VALUE) {
                              setSelectedSubject(null);
                              return;
                            }
                            const node = findDisciplineNode(nextId);
                            if (node?.phase && node?.discipline) {
                              setSelectedSubject({ kind: "discipline", nodeId: nextId, phase: node.phase, discipline: node.discipline });
                            } else {
                              setSelectedSubject(null);
                            }
                          }}
                        >
                          <SelectTrigger
                            className="h-10 w-[150px] rounded-md border-slate-200 bg-white"
                            aria-label="按学科筛选"
                          >
                            <SelectValue placeholder="全部学科" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={SUBJECT_ALL_VALUE}>
                              <span className="inline-flex items-center gap-2">
                                <Layers className="size-4 text-muted-foreground/60" aria-hidden />
                                全部学科
                              </span>
                            </SelectItem>
                            {subjects.map((s) => (
                              <SelectItem key={s.id} value={s.id}>
                                <span className="inline-flex items-center gap-2">
                                  {React.createElement(lucideIconForSubjectLabel(s.name), {
                                    className: "size-4 text-muted-foreground/60",
                                    "aria-hidden": true,
                                  })}
                                  {s.name}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                          <SelectTrigger
                            className="h-10 w-[130px] rounded-md border-slate-200 bg-white"
                            aria-label="按状态筛选"
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">
                              <span className="inline-flex items-center gap-2">
                                <CircleDot className="size-4 text-muted-foreground/60" aria-hidden />
                                全部
                              </span>
                            </SelectItem>
                            <SelectItem value="y">
                              <span className="inline-flex items-center gap-2">
                                <CheckCircle2 className="size-4 text-muted-foreground/60" aria-hidden />
                                已通过
                              </span>
                            </SelectItem>
                            <SelectItem value="t">
                              <span className="inline-flex items-center gap-2">
                                <FileEdit className="size-4 text-muted-foreground/60" aria-hidden />
                                草稿
                              </span>
                            </SelectItem>
                            <SelectItem value="n">
                              <span className="inline-flex items-center gap-2">
                                <XCircle className="size-4 text-muted-foreground/60" aria-hidden />
                                未通过
                              </span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  }
                  right={
                    <></>
                  }
                />
              </div>
            }
          >
              {view === "list" ? (
                <ExperimentManageV2TableView
                  items={items}
                  loading={loading}
                  page={page}
                  pageSize={pageSize}
                  total={total}
                  draftTotal={draftTotal}
                  readOnly={readOnly}
                  fullScreen={fullScreen}
                  onPageChange={setPage}
                  subjectNameById={subjectNameById}
                  gradeNameById={gradeNameById}
                  difficultyNameById={difficultyNameById}
                  onAssign={openAssignDialog}
                  onEdit={(row) => {
                    router.push(
                      `${EXPERIMENT_MANAGE_EDITOR_PATH}?id=${encodeURIComponent(row.expId)}`,
                      { scroll: false },
                    );
                  }}
                  onDelete={(row) => deleteExperiment(row.expId, row.expName)}
                  deletePending={deletePending}
                />
              ) : loading ? (
                <div className="flex min-h-[min(52dvh,420px)] items-center justify-center text-sm text-muted-foreground">
                  加载中…
                </div>
              ) : cardRows.length === 0 ? (
                <div className="flex min-h-[min(52dvh,420px)] items-center justify-center text-sm text-muted-foreground">
                  暂无数据
                </div>
              ) : (
                <ExperimentManageCardsView
                  actor={apiActor}
                  rows={cardRows}
                  onEdit={(id) => {
                    router.push(`${EXPERIMENT_MANAGE_EDITOR_PATH}?id=${encodeURIComponent(id)}`, { scroll: false });
                  }}
                  onReviewOrView={(id) => {
                    router.push(`/experiments/${encodeURIComponent(id)}`);
                  }}
                  onDelete={(id) => {
                    const row = cardRows.find((r) => r.id === id);
                    return deleteExperiment(id, row?.title);
                  }}
                />
              )}
          </ManagementPageFrame>
          <PublishAssignmentDialog
            open={assignDialogOpen}
            onClose={() => setAssignDialogOpen(false)}
            onConfirm={confirmAssign}
            target={assignTarget}
          />
        </div>
      }
    />
  );
}
