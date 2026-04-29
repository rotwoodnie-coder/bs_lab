"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { Badge, Button, sonnerToast } from "@bs-lab/ui";
import { Plus, UsersRound } from "@bs-lab/ui/icons";

import type { V2SysOrgItem } from "@/lib/v2/v2-sys-api";
import { cn } from "@/lib/utils";
import { EmptyPlaceholder } from "@/components/business/common/EmptyPlaceholder";
import { ManagementPageFrame } from "@/components/business/common/ManagementPageFrame";

import { ResearchGroupCard } from "./_components/ResearchGroupCard";
import { CreateResearchGroupDialog, EditResearchGroupDialog } from "./_components/ResearchGroupDialogs";
import { type ResearchGroupOrgFilter, useTeacherResearchProjectGroups } from "./page.hooks";

const FILTER_TABS: { id: ResearchGroupOrgFilter; label: string }[] = [
  { id: "all", label: "全部" },
  { id: "y", label: "启用" },
  { id: "n", label: "停用" },
];

function TeacherResearchProjectGroupsContent() {
  const searchParams = useSearchParams();
  const {
    loading,
    submitting,
    parentOrgName,
    rows,
    filter,
    setFilter,
    createOpen,
    setCreateOpen,
    handleCreate,
    editTarget,
    setEditTarget,
    handlePatch,
  } = useTeacherResearchProjectGroups();

  const prefilledRef = React.useRef(false);

  React.useEffect(() => {
    if (prefilledRef.current) return;
    const subject = searchParams.get("subject");
    const hint = searchParams.get("curriculumHint");
    if (!subject && !hint) return;
    prefilledRef.current = true;
    setCreateOpen(true);
    let decoded = hint ?? "";
    if (hint) {
      try {
        decoded = decodeURIComponent(hint);
      } catch {
        decoded = hint;
      }
    }
    sonnerToast.message("已带入课标参数", {
      description: [subject ? `学科：${subject}` : null, decoded ? `参考：${decoded}` : null].filter(Boolean).join("；"),
    });
  }, [searchParams, setCreateOpen]);

  const onToggleStatus = (row: V2SysOrgItem) => {
    const next = (row.status ?? "y") === "y" ? "n" : "y";
    void handlePatch(row.orgId, { status: next });
  };

  return (
    <ManagementPageFrame
      title={
        <div className="flex flex-wrap items-center gap-2">
          <UsersRound className="size-6 text-primary" />
          <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">课题组管理</h1>
          <Badge variant="secondary">subject_group · V2</Badge>
        </div>
      }
      description="课题组对应库表 subject_group。列表按当前教师所属组织路径范围筛选。"
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
      cardTitle="课题组列表"
      cardToolbar={
        <Button
          size="sm"
          className="gap-1.5 rounded-lg bg-foreground text-background hover:bg-foreground/90"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="size-3.5" aria-hidden />
          新建课题组
        </Button>
      }
    >
      {loading ? (
        <p className="text-sm text-muted-foreground">加载中…</p>
      ) : rows.length === 0 ? (
        <EmptyPlaceholder
          title="当前筛选下暂无课题组"
          action={
            <Button
              type="button"
              size="sm"
              className="gap-1.5 rounded-lg bg-foreground text-background hover:bg-foreground/90"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="size-3.5" aria-hidden />
              新建课题组
            </Button>
          }
        />
      ) : (
        <ul className="grid list-none gap-4 p-0 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((g) => (
            <li key={g.orgId}>
              <ResearchGroupCard
                row={g}
                onEdit={setEditTarget}
                onToggleStatus={onToggleStatus}
              />
            </li>
          ))}
        </ul>
      )}

      <CreateResearchGroupDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        parentOrgName={parentOrgName}
        submitting={submitting}
        onSubmit={handleCreate}
      />

      <EditResearchGroupDialog
        target={editTarget}
        onOpenChange={(v) => {
          if (!v) setEditTarget(null);
        }}
        submitting={submitting}
        onSubmit={async (orgId, input) => {
          await handlePatch(orgId, { orgName: input.orgName });
        }}
      />
    </ManagementPageFrame>
  );
}

export default function TeacherResearchProjectGroupsPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex min-h-[30vh] items-center justify-center text-sm text-muted-foreground">加载课题组…</div>
      }
    >
      <TeacherResearchProjectGroupsContent />
    </React.Suspense>
  );
}
