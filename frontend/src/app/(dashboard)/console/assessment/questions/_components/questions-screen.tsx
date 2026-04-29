"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  sonnerToast,
} from "@bs-lab/ui";
import { Plus } from "@bs-lab/ui/icons";

import type { ConsoleAssessmentQuestionsScreen } from "../page.hooks";
import { PageHeader } from "@/components/layout/page-header";
import { DASHBOARD_MAIN_CONTAINER_CLASS } from "@/lib/layout-container-classes";
import { QuestionFormSheet } from "./question-form-sheet";
import { QuestionsListCard } from "./questions-list-card";
import type { V2QuestionItem } from "@/lib/v2/v2-question-api";

export function QuestionsScreen({ screen }: { screen: ConsoleAssessmentQuestionsScreen }) {
  const {
    items,
    keyword,
    setKeyword,
    statusFilter,
    setStatusFilter,
    questionTypeId,
    setQuestionTypeId,
    difficultyTypeId,
    setDifficultyTypeId,
    questionTypes,
    difficultyTypes,
    questionCapacities,
    loading,
    refresh,
    serverPagination,
    removeQuestion,
    saveCreate,
    saveUpdate,
    setStatus,
  } = screen;

  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [sheetMode, setSheetMode] = React.useState<"create" | "edit">("create");
  const [editRow, setEditRow] = React.useState<V2QuestionItem | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<V2QuestionItem | null>(null);
  const [deactivateTarget, setDeactivateTarget] = React.useState<V2QuestionItem | null>(null);
  const [rejectReason, setRejectReason] = React.useState("");

  const openCreate = React.useCallback(() => {
    setSheetMode("create");
    setEditRow(null);
    setSheetOpen(true);
  }, []);

  const openEdit = React.useCallback((row: V2QuestionItem) => {
    setSheetMode("edit");
    setEditRow(row);
    setSheetOpen(true);
  }, []);

  const runDelete = async () => {
    if (!deleteTarget) return;
    try {
      await removeQuestion(deleteTarget.questionId);
      setDeleteTarget(null);
    } catch (e) {
      sonnerToast.error(e instanceof Error ? e.message : "删除失败");
    }
  };

  const runDeactivate = async () => {
    if (!deactivateTarget) return;
    try {
      await setStatus(deactivateTarget.questionId, "n", rejectReason.trim() || undefined);
      setDeactivateTarget(null);
      setRejectReason("");
    } catch (e) {
      sonnerToast.error(e instanceof Error ? e.message : "更新状态失败");
    }
  };

  const previewHref =
    items.length > 0 ? `/console/assessment/questions/preview?ids=${items.map((q) => q.questionId).join(",")}` : "/console/assessment/questions/preview";

  return (
    <div className={DASHBOARD_MAIN_CONTAINER_CLASS}>
      <div className="flex w-full flex-1 flex-col space-y-4">
        <PageHeader
        title="实验题库"
        description={
          <>数据来自 <span className="font-mono text-xs">exp_question</span> / <span className="font-mono text-xs">exp_question_select</span>，支持筛选、分页与增删改查。</>
        }
        actions={
          <>
            <Button type="button" variant="outline" size="sm" asChild className="rounded-md">
              <Link href={previewHref}>预览本页题目</Link>
            </Button>
            <Button type="button" size="sm" className="rounded-md" onClick={openCreate}>
              <Plus className="size-3.5" />
              新建题目
            </Button>
          </>
        }
      />

      <QuestionsListCard
        items={items}
        loading={loading}
        keyword={keyword}
        setKeyword={setKeyword}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        questionTypeId={questionTypeId}
        setQuestionTypeId={setQuestionTypeId}
        difficultyTypeId={difficultyTypeId}
        setDifficultyTypeId={setDifficultyTypeId}
        questionTypes={questionTypes}
        difficultyTypes={difficultyTypes}
        questionCapacities={questionCapacities}
        serverPagination={serverPagination}
        refresh={refresh}
        onEdit={openEdit}
        onDelete={setDeleteTarget}
        onStatus={(row, status) => {
          void setStatus(row.questionId, status).catch((e) => {
            sonnerToast.error(e instanceof Error ? e.message : "更新状态失败");
          });
        }}
        onRequestDeactivate={(row) => {
          setDeactivateTarget(row);
          setRejectReason("");
        }}
      />

      <QuestionFormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        mode={sheetMode}
        initial={editRow}
        questionTypes={questionTypes}
        difficultyTypes={difficultyTypes}
        questionCapacities={questionCapacities}
        onSubmitCreate={saveCreate}
        onSubmitUpdate={saveUpdate}
      />

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除题目？</AlertDialogTitle>
            <AlertDialogDescription>
              将逻辑删除该题（is_deleted=1），列表中不再展示。若题目已被引用，请谨慎操作。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel type="button">取消</AlertDialogCancel>
            <Button type="button" variant="destructive" onClick={() => void runDelete()}>
              确认删除
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={Boolean(deactivateTarget)} onOpenChange={(o) => !o && setDeactivateTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>停用题目</DialogTitle>
            <DialogDescription>状态将设为已停用（n）。可填写驳回原因，写入 reject_reason。</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="reject-reason">驳回原因（可选）</Label>
            <Input
              id="reject-reason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="例如：题干表述不规范"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setDeactivateTarget(null)}>
              取消
            </Button>
            <Button type="button" onClick={() => void runDeactivate()}>
              确认停用
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}
