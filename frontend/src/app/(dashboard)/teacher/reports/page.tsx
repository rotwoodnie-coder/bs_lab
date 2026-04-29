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
  Checkbox,
  Label,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  sonnerToast,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Textarea,
} from "@bs-lab/ui";
import { ClipboardCheck } from "@bs-lab/ui/icons";

import { ClassAnalyticsMock } from "@/components/business/teacher/class-analytics-mock";
import { mergeTeacherEvaluationIntoParentReport } from "@/lib/parent/parent-sessions-mock-store";
import {
  bulkPublishWorks,
  buildSessionLogSummary,
  getEffectiveWorkSuggestion,
  getUnifiedSession,
  getUnifiedTask,
  listUnifiedWorks,
  subscribeUnifiedMock,
  suggestionSortPriority,
  updateUnifiedSession,
  updateUnifiedWorkTeacherRubric,
  updateUnifiedWorkTeacherStatus,
  type AiWorkSuggestion,
  type TeacherWorkRubricMock,
  type UnifiedSessionMock,
  type UnifiedWorkMock,
} from "@/lib/unified-mock-store";

type ReviewRow = {
  work: UnifiedWorkMock;
  session: UnifiedSessionMock;
  suggestion: AiWorkSuggestion;
};

const QUICK_PHRASES = ["亮点突出", "操作规范", "原理表述可加强", "已与孩子当面沟通"] as const;

function buildRows(includeArchivedWorks: boolean): ReviewRow[] {
  const works = listUnifiedWorks().filter((w) => {
    if (w.kind !== "capture" || w.teacherReviewStatus !== "pending_review") return false;
    if (includeArchivedWorks) return true;
    return !w.is_archived;
  });
  const out: ReviewRow[] = [];
  for (const work of works) {
    const session = getUnifiedSession(work.sessionId);
    if (!session) continue;
    const suggestion = getEffectiveWorkSuggestion(session, work);
    out.push({ work, session, suggestion });
  }
  out.sort((a, b) => {
    const pa = suggestionSortPriority(a.suggestion.status);
    const pb = suggestionSortPriority(b.suggestion.status);
    if (pa !== pb) return pa - pb;
    return b.work.createdAt.localeCompare(a.work.createdAt);
  });
  return out;
}

function rowEligible(session: UnifiedSessionMock, suggestion: AiWorkSuggestion): boolean {
  return suggestion.status === "pass" && Boolean(session.parent_attested_at);
}

function suggestionBadge(s: AiWorkSuggestion) {
  if (s.status === "error") {
    return (
      <Badge variant="destructive" className="shrink-0">
        异常
      </Badge>
    );
  }
  if (s.status === "warning") {
    return (
      <Badge variant="secondary" className="shrink-0">
        关注
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="shrink-0">
      建议通过
    </Badge>
  );
}

export default function TeacherReportsPage() {
  const [, bump] = React.useReducer((n) => n + 1, 0);
  const [showPriorYearWorks, setShowPriorYearWorks] = React.useState(false);
  const rows = React.useMemo(() => buildRows(showPriorYearWorks), [bump, showPriorYearWorks]);

  React.useEffect(() => subscribeUnifiedMock(() => bump()), []);

  const [selected, setSelected] = React.useState<Set<string>>(() => new Set());
  const [detailWorkId, setDetailWorkId] = React.useState<string | null>(null);

  const [rubric, setRubric] = React.useState<TeacherWorkRubricMock>({
    inquiry: 4,
    operation: 4,
    principle: 4,
  });
  const [note, setNote] = React.useState("");

  const detailRow = React.useMemo(
    () => rows.find((r) => r.work.workId === detailWorkId) ?? null,
    [rows, detailWorkId],
  );

  React.useEffect(() => {
    if (!detailRow) return;
    const tr = detailRow.work.teacherRubric;
    setRubric(tr ?? { inquiry: 4, operation: 4, principle: 4 });
    setNote(detailRow.work.teacherQuickNote ?? "");
  }, [detailRow]);

  const eligibleIds = React.useMemo(
    () => rows.filter((r) => rowEligible(r.session, r.suggestion)).map((r) => r.work.workId),
    [rows],
  );

  const toggleOne = (id: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const toggleAllEligible = (checked: boolean) => {
    if (checked) setSelected(new Set(eligibleIds));
    else setSelected(new Set());
  };

  const selectedEligible = [...selected].filter((id) => eligibleIds.includes(id));

  const openDetail = (workId: string) => {
    setDetailWorkId(workId);
  };

  const saveDetailAndPublish = () => {
    if (!detailRow) return;
    updateUnifiedWorkTeacherRubric(detailRow.work.workId, { teacherRubric: rubric, teacherQuickNote: note.trim() });
    updateUnifiedWorkTeacherStatus(detailRow.work.workId, "published");
    const avgStar = Math.round((rubric.inquiry + rubric.operation + rubric.principle) / 3);
    const feedback =
      note.trim() ||
      `结构化评分：探究 ${rubric.inquiry} 星 · 操作 ${rubric.operation} 星 · 原理 ${rubric.principle} 星`;
    const sid = detailRow.session.sessionId;
    updateUnifiedSession(sid, {
      teacher_feedback: feedback,
      teacher_star_rating: avgStar,
      evaluation_status: "evaluated",
      report_url: `/parent/reports/${sid}`,
    });
    mergeTeacherEvaluationIntoParentReport({
      sessionId: sid,
      teacherComment: feedback,
    });
    sonnerToast.success("已结课（）", {
      description: "评分已写入会话并同步家长成就卡，作品已标记为通过。",
    });
    setDetailWorkId(null);
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(detailRow.work.workId);
      return next;
    });
  };

  const runBulk = () => {
    if (selectedEligible.length === 0) {
      sonnerToast.message("请选择可批量结课的条目", { description: "需为「建议通过」且家长已背书。" });
      return;
    }
    bulkPublishWorks(selectedEligible);
    sonnerToast.success("批量结课完成", { description: `${selectedEligible.length} 条已标记通过。` });
    setSelected(new Set());
  };

  const StarRow = ({
    label,
    value,
    onChange,
  }: {
    label: string;
    value: number;
    onChange: (n: number) => void;
  }) => (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <Button
            key={n}
            type="button"
            size="sm"
            variant={value === n ? "default" : "outline"}
            className="h-8 w-8 px-0"
            onClick={() => onChange(n)}
          >
            {n}
          </Button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="size-6 text-primary" />
          <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">报告批改</h1>
          <Badge variant="secondary"></Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          P0：规则预审 + 结构化评价；P1：家长背书后可批量结课；数据与家长会话、统一 Mock 仓同源。
        </p>
      </header>

      <ClassAnalyticsMock />

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <CardTitle className="text-base">亲子过程素材 · 待批改</CardTitle>
            <CardDescription className="text-xs">
              默认「异常」优先排序；仅「建议通过」且家长已背书可勾选批量结课。默认不展示往届封存作品。
            </CardDescription>
            <div className="mt-3 flex items-center gap-2">
              <Switch
                id="teacher-reports-prior-year"
                checked={showPriorYearWorks}
                onCheckedChange={setShowPriorYearWorks}
              />
              <Label htmlFor="teacher-reports-prior-year" className="text-xs font-normal text-muted-foreground">
                显示往年作品
              </Label>
            </div>
          </div>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={selectedEligible.length === 0}
            onClick={runBulk}
          >
            批量一键结课（{selectedEligible.length}）
          </Button>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              暂无待批改抓拍。请在家长会话中完成拍照或确认背书后刷新。
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={eligibleIds.length > 0 && selectedEligible.length === eligibleIds.length}
                      onCheckedChange={(v) => toggleAllEligible(v === true)}
                      aria-label="全选可批量项"
                    />
                  </TableHead>
                  <TableHead>学生</TableHead>
                  <TableHead>实验</TableHead>
                  <TableHead>AI 预审</TableHead>
                  <TableHead>家长背书</TableHead>
                  <TableHead>时间</TableHead>
                  <TableHead className="text-end">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => {
                  const task = r.work.taskId ? getUnifiedTask(r.work.taskId) : undefined;
                  const elig = rowEligible(r.session, r.suggestion);
                  const checked = selected.has(r.work.workId);
                  return (
                    <TableRow key={r.work.workId}>
                      <TableCell>
                        <Checkbox
                          checked={checked}
                          disabled={!elig}
                          onCheckedChange={(v) => toggleOne(r.work.workId, v === true)}
                          aria-label={`选择 ${r.work.workId}`}
                        />
                      </TableCell>
                      <TableCell className="font-mono text-xs">{r.work.studentUserId}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-sm">
                        {task?.experimentTitle ?? r.work.experimentId}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {suggestionBadge(r.suggestion)}
                          <span className="text-[11px] text-muted-foreground">{r.suggestion.reason}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {r.session.parent_attested_at ? (
                          <Badge variant="outline">已背书</Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">待背书</span>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {r.work.createdAt.replace("T", " ").slice(0, 16)}
                      </TableCell>
                      <TableCell className="text-end">
                        <Button type="button" size="sm" variant="outline" onClick={() => openDetail(r.work.workId)}>
                          批改详情
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Sheet open={detailWorkId !== null} onOpenChange={(o) => !o && setDetailWorkId(null)}>
        <SheetContent side="right" className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-xl lg:max-w-3xl">
          {detailRow ? (
            <>
              <SheetHeader>
                <SheetTitle>结构化批改</SheetTitle>
                <SheetDescription className="font-mono text-xs">{detailRow.work.workId}</SheetDescription>
              </SheetHeader>
              <div className="grid flex-1 gap-4 py-4 lg:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">采集预览</Label>
                  <div className="overflow-hidden rounded-lg border border-border bg-muted/20">
                    {/* eslint-disable-next-line @next/next/no-img-element -- mock URL */}
                    <img
                      src={detailRow.work.mediaMock.videoUrl ?? detailRow.work.mediaMock.photoUrl ?? ""}
                      alt=""
                      className="aspect-video w-full object-contain"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">AI 摘要（Mock）</Label>
                    <p className="mt-1 rounded-md border border-border/80 bg-muted/20 p-2 text-sm leading-relaxed text-foreground">
                      {buildSessionLogSummary(detailRow.session, detailRow.work)}
                    </p>
                  </div>
                  <div className="space-y-3 rounded-lg border border-border p-3">
                    <p className="text-xs font-medium text-foreground">分项评分（1–5 星）</p>
                    <StarRow
                      label="探究精神"
                      value={rubric.inquiry}
                      onChange={(n) => setRubric((x) => ({ ...x, inquiry: n }))}
                    />
                    <StarRow
                      label="操作规范"
                      value={rubric.operation}
                      onChange={(n) => setRubric((x) => ({ ...x, operation: n }))}
                    />
                    <StarRow
                      label="科学原理"
                      value={rubric.principle}
                      onChange={(n) => setRubric((x) => ({ ...x, principle: n }))}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">寄语 / 快捷语</Label>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {QUICK_PHRASES.map((p) => (
                        <Button
                          key={p}
                          type="button"
                          size="sm"
                          variant="secondary"
                          className="h-7 text-xs"
                          onClick={() => setNote((prev) => (prev ? `${prev}；${p}` : p))}
                        >
                          {p}
                        </Button>
                      ))}
                    </div>
                    <Textarea
                      className="mt-2 min-h-[88px]"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="可编辑寄语，将随评分一并保存（）。"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button type="button" onClick={saveDetailAndPublish}>
                      保存并结课通过
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setDetailWorkId(null)}>
                      关闭
                    </Button>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
