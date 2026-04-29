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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Label,
  Separator,
  StatMetric,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
} from "@bs-lab/ui";
import { BookMarked, FileQuestion, Inbox, Layers, ShieldCheck } from "@bs-lab/ui/icons";
import { useQuestionBank } from "./page.hooks";
import { QuestionCard } from "./_components/QuestionCard";

export default function TeacherQuestionBankPage() {
  const {
    pendingItems, approvedItems, rejectedItems, loading,
    rejectDialogId, setRejectDialogId,
    difficultyTypes, questionTypes, questionCapacities,
    handleApprove, handleReject, handleRetract,
  } = useQuestionBank();

  const [rejectNote, setRejectNote] = React.useState("");

  const openRejectDialog = (id: string) => {
    setRejectDialogId(id);
    setRejectNote("");
  };

  const confirmReject = async () => {
    if (!rejectDialogId) return;
    await handleReject(rejectDialogId, rejectNote.trim() || undefined);
  };

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex size-11 items-center justify-center rounded-xl border border-border bg-muted/40">
            <FileQuestion className="size-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              题库管理
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              集中查看候选题，完成<strong className="text-foreground">入库与驳回</strong>，维护已开放给学生的题目。
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="text-xs text-muted-foreground">题型字典：{questionTypes.length}</span>
              <span className="text-xs text-muted-foreground">难度字典：{difficultyTypes.length}</span>
              <span className="text-xs text-muted-foreground">能力侧重点：{questionCapacities.length}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="shadow-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">待处理</CardTitle>
            <Inbox className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold tabular-nums tracking-tight text-foreground">
              <StatMetric value={pendingItems.length} durationMs={0} />
            </div>
            <p className="text-xs text-muted-foreground">需决定入库或驳回</p>
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">已入库</CardTitle>
            <ShieldCheck className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold tabular-nums tracking-tight text-foreground">
              <StatMetric value={approvedItems.length} durationMs={0} />
            </div>
            <p className="text-xs text-muted-foreground">学生闯关可抽取</p>
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">已驳回</CardTitle>
            <Layers className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold tabular-nums tracking-tight text-foreground">
              <StatMetric value={rejectedItems.length} durationMs={0} />
            </div>
            <p className="text-xs text-muted-foreground">可重新送审</p>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden shadow-none">
        <CardHeader className="pb-0">
          <CardTitle className="text-lg">题目工作台</CardTitle>
          <CardDescription>按状态切换视图，完成入库决策或后续调整。</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {loading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">加载中…</p>
          ) : (
            <Tabs defaultValue="pending" className="w-full">
              <TabsList className="h-auto w-full flex-wrap justify-start gap-1 bg-muted/40 p-1 sm:w-auto">
                <TabsTrigger value="pending" className="gap-1.5 data-[state=active]:bg-background">
                  待处理
                  <Badge variant="outline" className="font-mono text-[10px]">{pendingItems.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="approved" className="gap-1.5 data-[state=active]:bg-background">
                  已入库
                  <Badge variant="outline" className="font-mono text-[10px]">{approvedItems.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="rejected" className="gap-1.5 data-[state=active]:bg-background">
                  已驳回
                  <Badge variant="outline" className="font-mono text-[10px]">{rejectedItems.length}</Badge>
                </TabsTrigger>
              </TabsList>
              <Separator className="my-5" />

              <TabsContent value="pending" className="mt-0 space-y-4 focus-visible:outline-none">
                {pendingItems.length === 0 ? (
                  <Empty className="border border-dashed bg-muted/20 py-10">
                    <EmptyHeader>
                      <EmptyMedia variant="icon"><Inbox className="size-5" /></EmptyMedia>
                      <EmptyTitle>暂无待处理题目</EmptyTitle>
                      <EmptyDescription>新候选题生成后将出现在此处。</EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                ) : (
                  pendingItems.map((q) => (
                    <QuestionCard key={q.questionId} question={q} mode="pending"
                      onApprove={handleApprove} onOpenReject={openRejectDialog} onRetract={handleRetract} />
                  ))
                )}
              </TabsContent>

              <TabsContent value="approved" className="mt-0 space-y-4 focus-visible:outline-none">
                {approvedItems.length === 0 ? (
                  <Empty className="border border-dashed bg-muted/20 py-10">
                    <EmptyHeader>
                      <EmptyMedia variant="icon"><ShieldCheck className="size-5" /></EmptyMedia>
                      <EmptyTitle>暂无已入库题目</EmptyTitle>
                      <EmptyDescription>通过待处理中的题目后将汇总至此。</EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                ) : (
                  approvedItems.map((q) => (
                    <QuestionCard key={q.questionId} question={q} mode="approved"
                      onApprove={handleApprove} onOpenReject={openRejectDialog} onRetract={handleRetract} />
                  ))
                )}
              </TabsContent>

              <TabsContent value="rejected" className="mt-0 space-y-4 focus-visible:outline-none">
                {rejectedItems.length === 0 ? (
                  <Empty className="border border-dashed bg-muted/20 py-10">
                    <EmptyHeader>
                      <EmptyMedia variant="icon"><Layers className="size-5" /></EmptyMedia>
                      <EmptyTitle>暂无驳回记录</EmptyTitle>
                      <EmptyDescription>被驳回的题目可在此查看并一键重新送审。</EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                ) : (
                  rejectedItems.map((q) => (
                    <QuestionCard key={q.questionId} question={q} mode="rejected"
                      onApprove={handleApprove} onOpenReject={openRejectDialog} onRetract={handleRetract} />
                  ))
                )}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(rejectDialogId)} onOpenChange={(o) => !o && setRejectDialogId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>驳回原因（可选）</DialogTitle>
            <DialogDescription>驳回后本题不会进入学生闯关题库；之后仍可在「已驳回」中重新送审。</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reject-note">说明</Label>
            <Textarea
              id="reject-note"
              rows={3}
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              placeholder="例如：题干与当前班级进度不符…"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setRejectDialogId(null)}>
              取消
            </Button>
            <Button type="button" variant="destructive" onClick={confirmReject}>
              确认驳回
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
