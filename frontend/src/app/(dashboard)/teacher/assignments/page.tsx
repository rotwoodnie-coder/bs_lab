"use client";

import * as React from "react";
import {
  Badge,
  Button,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@bs-lab/ui";
import { ListChecks, Plus, Inbox } from "@bs-lab/ui/icons";
import { useAssignments } from "./page.hooks";
import { CreateHomeworkDialog } from "./_components/CreateHomeworkDialog";
import { HomeworkCard } from "./_components/HomeworkCard";

export default function TeacherAssignmentsPage() {
  const {
    actor,
    items,
    total,
    loading,
    page,
    pageSize,
    setPage,
    dialogOpen,
    setDialogOpen,
    expLibraryItems,
    expLibLoading,
    submitting,
    handleCreate,
  } = useAssignments();

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ListChecks className="size-6 text-primary" />
            <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              作业任务
            </h1>
            {total > 0 && (
              <Badge variant="secondary">{total} 条</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            管理已布置的实验作业，跟踪学生提交与批改进度。
          </p>
        </div>
        <Button type="button" size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="size-4" />
          布置作业
        </Button>
      </header>

      {loading && items.length === 0 ? (
        <div className="py-10 text-center text-sm text-muted-foreground">加载中…</div>
      ) : items.length === 0 ? (
        <Empty className="border border-dashed bg-muted/20 py-12">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Inbox className="size-5" />
            </EmptyMedia>
            <EmptyTitle>暂无作业记录</EmptyTitle>
            <EmptyDescription>点击「布置作业」从实验库选择实验下发给学生。</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="grid gap-4">
          {items.map((item) => (
            <HomeworkCard key={item.workId} item={item} />
          ))}
        </div>
      )}

      {total > pageSize && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            上一页
          </Button>
          <span className="text-sm text-muted-foreground">
            第 {page} 页 · 共 {Math.ceil(total / pageSize)} 页
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page >= Math.ceil(total / pageSize)}
            onClick={() => setPage(page + 1)}
          >
            下一页
          </Button>
        </div>
      )}

      <CreateHomeworkDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        actor={actor}
        expLibraryItems={expLibraryItems}
        expLibLoading={expLibLoading}
        submitting={submitting}
        onSubmit={handleCreate}
      />
    </div>
  );
}
