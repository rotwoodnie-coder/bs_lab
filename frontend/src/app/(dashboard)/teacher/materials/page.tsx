"use client";

import * as React from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
} from "@bs-lab/ui";

import { userRoleLabelZh } from "@/types/auth";
import { useSessionActor } from "@/hooks/use-session-actor";

import { TeacherMaterialCreateDialog } from "./_components/TeacherMaterialCreateDialog";
import { TeacherMaterialDataTable } from "./_components/TeacherMaterialDataTable";
import { TeacherMaterialEditDialog } from "./_components/TeacherMaterialEditDialog";
import { TeacherMaterialDataFileDbInspectorTable } from "./_components/TeacherMaterialDataFileDbInspectorTable";
import { TeacherMaterialWaterfall } from "./_components/TeacherMaterialWaterfall";
import { TeacherMaterialsFiltersSection } from "./_components/teacher-materials-filter-sidebar";
import { TeacherMaterialsToolbar } from "./_components/teacher-materials-toolbar";
import { TeacherMediaReviewToolsCollapsible } from "./_components/teacher-media-review-tools-collapsible";
import { useTeacherMaterialsPage } from "./page.hooks";

export default function TeacherMaterialsPage() {
  const { role } = useSessionActor();
  const st = useTeacherMaterialsPage();
  const [dbInspectorOpen, setDbInspectorOpen] = React.useState(false);

  return (
    <div className="flex flex-col space-y-6 min-h-0" style={{ minHeight: "calc(100vh - 120px)" }}>
      <header className="space-y-1 shrink-0">
        <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">实验素材库</h1>
        <p className="text-sm text-muted-foreground">
          Word、PPT、PDF、图片、视频、Excel 等素材列表，各角色均可在此维护个人素材。当前身份：「{userRoleLabelZh(role)}」。
        </p>
      </header>

      <TeacherMaterialsToolbar
        keyword={st.keyword}
        onKeywordChange={st.setKeyword}
        onCreateClick={() => st.setCreateOpen(true)}
        dbInspectorOpen={dbInspectorOpen}
        onDbInspectorToggle={() => setDbInspectorOpen((v) => !v)}
      />

      <TeacherMediaReviewToolsCollapsible />

      {dbInspectorOpen ? (
        <TeacherMaterialDataFileDbInspectorTable actor={st.actor} keyword={st.keyword} />
      ) : null}

      {/* main: 撑满剩余空间 */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start" style={{ flex: 1, minHeight: 0 }}>
        <TeacherMaterialsFiltersSection
          kindFilter={st.kindFilter}
          kindOptions={st.kindOptions}
          onKindChange={st.setKindFilter}
        />

        <div className="flex min-w-0 flex-1 flex-col space-y-3">
          <ViewModeBar mode={st.mode} onModeChange={st.setMode} />
          {st.mode === "list" ? (
            <TeacherMaterialDataTable
              actor={st.actor}
              items={st.filtered}
              onRequestEdit={st.setEditTarget}
              onRequestDelete={st.setDeleteTarget}
              onVideoPosterPersisted={st.onVideoPosterPersisted}
            />
          ) : (
            <TeacherMaterialWaterfall
              actor={st.actor}
              items={st.filtered}
              mode={st.mode}
              onRequestEdit={st.setEditTarget}
              onRequestDelete={st.setDeleteTarget}
              onVideoPosterPersisted={st.onVideoPosterPersisted}
            />
          )}
        </div>
      </div>

      <TeacherMaterialCreateDialog
        open={st.createOpen}
        onOpenChange={st.setCreateOpen}
        onCreate={st.createMaterial}
        initialKind={st.createDialogInitialKind}
        kindOptions={st.kindOptions}
        experimentOptions={st.experimentOptions}
        experimentOptionsLoading={st.experimentOptionsLoading}
      />
      <TeacherMaterialEditDialog
        open={Boolean(st.editTarget)}
        target={st.editTarget}
        kindOptions={st.kindOptions.filter((item) => item.id !== "all").map((item) => ({ value: item.id, label: item.label }))}
        experimentOptions={st.experimentOptions}
        experimentOptionsLoading={st.experimentOptionsLoading}
        onOpenChange={(open) => {
          if (!open) st.setEditTarget(null);
        }}
        onSubmit={st.confirmEdit}
      />

      <AlertDialog
        open={Boolean(st.deleteTarget)}
        onOpenChange={(open) => {
          if (!open) st.setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认操作</AlertDialogTitle>
            <AlertDialogDescription>
              将解除您对此素材的引用。若您是唯一引用人，该文件将从存储中彻底清除。
            </AlertDialogDescription>
          </AlertDialogHeader>
          {st.deleteTarget ? (
            <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-foreground">{st.deleteTarget.title}</div>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={() => void st.confirmDelete()}>确认删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ViewModeBar(props: {
  mode: "waterfall" | "grid" | "list";
  onModeChange: (mode: "waterfall" | "grid" | "list") => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        size="sm"
        variant={props.mode === "waterfall" ? "default" : "outline"}
        onClick={() => props.onModeChange("waterfall")}
      >
        瀑布流
      </Button>
      <Button
        type="button"
        size="sm"
        variant={props.mode === "grid" ? "default" : "outline"}
        onClick={() => props.onModeChange("grid")}
      >
        网格
      </Button>
      <Button
        type="button"
        size="sm"
        variant={props.mode === "list" ? "default" : "outline"}
        onClick={() => props.onModeChange("list")}
      >
        列表
      </Button>
    </div>
  );
}
