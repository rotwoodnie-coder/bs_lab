"use client";

import * as React from "react";
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@bs-lab/ui";
import { Plus, UserPlus, UsersRound } from "@bs-lab/ui/icons";

import { cn } from "@/lib/utils";
import { EmptyPlaceholder } from "@/components/business/common/EmptyPlaceholder";
import { ManagementPageFrame } from "@/components/business/common/ManagementPageFrame";

import { ResearchGroupCard } from "./_components/ResearchGroupCard";
import {
  CreateResearchGroupDialog,
  EditResearchGroupDialog,
  GroupDetailSheet,
} from "./_components/ResearchGroupDialogs";
import { type ResearchGroupOrgFilter, type TeacherGroupRow, useTeacherResearchProjectGroups } from "./page.hooks";

const FILTER_TABS: { id: ResearchGroupOrgFilter; label: string }[] = [
  { id: "all", label: "全部" },
  { id: "y", label: "启用" },
  { id: "n", label: "停用" },
];

function TeacherResearchProjectGroupsContent() {
  const {
    loading,
    submitting,
    actor,
    rows,
    filter,
    setFilter,
    editTarget,
    setEditTarget,
    handlePatch,
    handleCreate,
    handleAddMember,
    handleRemoveMember,
    currentUserId,
    isResearcher,
    detailGroup,
    detailMembers,
    detailMembersLoading,
    openDetail,
    closeDetail,
    refreshDetailMembers,
    availableGroups,
    availableLoading,
    handleJoin,
  } = useTeacherResearchProjectGroups();

  const [createOpen, setCreateOpen] = React.useState(false);
  const [joinOpen, setJoinOpen] = React.useState(false);

  return (
    <ManagementPageFrame
      title={
        <div className="flex flex-wrap items-center gap-2">
          <UsersRound className="size-6 text-primary" />
          <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">我的教研组</h1>
          <Badge variant="secondary">资源汇聚</Badge>
        </div>
      }
      description="查看我参与的教研组、组内共享资源和待审核资源。教研员默认是组管理员，负责组内资源审核与广场准入。"
      kpis={
        <div className="flex flex-wrap gap-2">
          {FILTER_TABS.map((tab) => (
            <Button
              key={tab.id}
              type="button"
              size="sm"
              variant={filter === tab.id ? "default" : "outline"}
              className={cn("rounded-full", filter !== tab.id && "border-border bg-background")}
              onClick={() => setFilter(tab.id)}
            >
              {tab.label}
            </Button>
          ))}
        </div>
      }
      cardTitle="教研组资源汇聚"
      cardToolbar={
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {isResearcher ? (
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="mr-1 size-4" />
              新建教研组
            </Button>
          ) : null}
          <Button size="sm" variant="outline" onClick={() => setJoinOpen(true)}>
            <UserPlus className="mr-1 size-4" />
            加入教研组
          </Button>
          <Badge variant="outline" className="rounded-full">学科组</Badge>
          <Badge variant="outline" className="rounded-full">组内共享</Badge>
          <Badge variant="outline" className="rounded-full">广场准入</Badge>
          <Badge variant="outline" className="rounded-full">资源汇聚</Badge>
        </div>
      }
    >
      {loading ? (
        <p className="text-sm text-muted-foreground">加载中…</p>
      ) : rows.length === 0 ? (
        <EmptyPlaceholder title="当前筛选下暂无教研组" />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <ul className="grid list-none gap-4 p-0 sm:grid-cols-2 xl:grid-cols-2">
            {rows.map((g) => (
              <li key={g.groupId}>
                <ResearchGroupCard
                  row={g}
                  currentUserId={currentUserId}
                  onEdit={setEditTarget}
                  onViewDetail={openDetail}
                />
              </li>
            ))}
          </ul>

          <div className="grid gap-4">
            <div className="rounded-xl border border-border bg-background p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-foreground">资源汇聚入口</p>
                  <p className="mt-1 text-xs text-muted-foreground">一期统一接入实验列表、实验素材、实验材料库、实验课程、参考教材和实验题库。</p>
                </div>
                <Badge variant="secondary" className="rounded-full">一期全量</Badge>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2">
                {[
                  { label: '实验列表', hint: '课程导入', tone: 'bg-sky-50 text-sky-700' },
                  { label: '实验素材', hint: '组内共享', tone: 'bg-emerald-50 text-emerald-700' },
                  { label: '实验材料库', hint: '待审核', tone: 'bg-amber-50 text-amber-700' },
                  { label: '实验课程', hint: '广场准入', tone: 'bg-violet-50 text-violet-700' },
                  { label: '参考教材', hint: '组内共享', tone: 'bg-cyan-50 text-cyan-700' },
                  { label: '实验题库', hint: '教研员审核', tone: 'bg-rose-50 text-rose-700' },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    className="group rounded-lg border border-border bg-muted/20 px-3 py-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:bg-muted/30"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-medium text-foreground group-hover:text-primary">{item.label}</div>
                      <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", item.tone)}>{item.hint}</span>
                    </div>
                    <div className="mt-2 h-1.5 rounded-full bg-muted/60">
                      <div className="h-1.5 rounded-full bg-primary/60" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-border bg-background p-4 shadow-sm">
              <p className="text-sm font-medium text-foreground">组内说明</p>
              <p className="mt-1 text-xs leading-6 text-muted-foreground">
                教研员默认是管理员，普通成员仅组内和自己可见。资源审核通过后可进入广场，一期统一接入实验列表、实验素材、实验材料库、实验课程、参考教材和实验题库。
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 编辑弹窗 */}
      <EditResearchGroupDialog
        target={editTarget}
        onOpenChange={(v) => {
          if (!v) setEditTarget(null);
        }}
        submitting={submitting}
        actor={actor}
        onSubmit={async (groupId, input) => {
          await handlePatch(groupId, {
            groupName: input.groupName,
            comments: input.comments,
            status: input.status,
            subjectId: input.subjectId,
          });
        }}
      />

      {/* 新建弹窗 */}
      <CreateResearchGroupDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        submitting={submitting}
        onSubmit={async (input) => {
          await handleCreate(input);
          setCreateOpen(false);
        }}
      />

      {/* 详情 Sheet */}
      <GroupDetailSheet
        group={detailGroup}
        onOpenChange={(v) => {
          if (!v) closeDetail();
        }}
        members={detailMembers}
        membersLoading={detailMembersLoading}
        currentUserId={currentUserId}
        actor={actor}
        onAddMember={handleAddMember}
        onRemoveMember={handleRemoveMember}
      />

      {/* 加入教研组弹窗 */}
      <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="size-5 text-primary" />
              加入教研组
            </DialogTitle>
            <DialogDescription>选择下方一个教研组加入，加入后组内资源对你可见。</DialogDescription>
          </DialogHeader>
          <div className="max-h-80 overflow-y-auto">
            {availableLoading ? (
              <p className="py-4 text-center text-sm text-muted-foreground">加载中…</p>
            ) : availableGroups.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">暂无可加入的教研组</p>
            ) : (
              <ul className="divide-y divide-border">
                {availableGroups.map((g) => (
                  <li key={g.groupId} className="flex items-center justify-between gap-3 px-1 py-3">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-foreground">{g.groupName}</div>
                      <div className="text-xs text-muted-foreground">
                        {g.ownerName ? `负责人：${g.ownerName}` : "—"}
                        {g.subjectName ? ` · 学科：${g.subjectName}` : ""}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        void handleJoin(g.groupId);
                        setJoinOpen(false);
                      }}
                    >
                      加入
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setJoinOpen(false)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ManagementPageFrame>
  );
}

export default function TeacherResearchProjectGroupsPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex min-h-[30vh] items-center justify-center text-sm text-muted-foreground">加载教研组…</div>
      }
    >
      <TeacherResearchProjectGroupsContent />
    </React.Suspense>
  );
}
