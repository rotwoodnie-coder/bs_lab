"use client";

import * as React from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  sonnerToast,
} from "@bs-lab/ui";

import { DASHBOARD_MAIN_CONTAINER_CLASS } from "@/lib/layout-container-classes";
import { EmptyPlaceholder } from "@/components/business/common/EmptyPlaceholder";
import type { V2ScaleTitleItem } from "@/lib/v2/v2-scale-api";

import type { IncentivesConsole } from "../page.hooks";
import { IncentivesLogsCard } from "./incentives-logs-card";
import { IncentivesTitlesCard } from "./incentives-titles-card";
import { ScaleTitleEditorSheet } from "./scale-title-editor-sheet";

export function IncentivesScreen({ screen }: { screen: IncentivesConsole }) {
  const {
    authLoading,
    authError,
    roleOptions,
    roleNameById,
    titleRoleFilter,
    setTitleRoleFilter,
    titles,
    titlesLoading,
    saveCreateTitle,
    savePatchTitle,
    removeTitle,
    logItems,
    logTotal,
    logLoading,
    logPageIndex,
    setLogPageIndex,
    logPageSize,
    setLogPageSize,
    logDraftUserId,
    setLogDraftUserId,
    logDraftSource,
    setLogDraftSource,
    applyLogFilters,
  } = screen;

  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [sheetMode, setSheetMode] = React.useState<"create" | "edit">("create");
  const [editTitle, setEditTitle] = React.useState<V2ScaleTitleItem | null>(null);
  const [deleteTitle, setDeleteTitle] = React.useState<V2ScaleTitleItem | null>(null);

  const onRequestCreate = React.useCallback(() => {
    setSheetMode("create");
    setEditTitle(null);
    setSheetOpen(true);
  }, []);

  const onRequestEdit = React.useCallback((row: V2ScaleTitleItem) => {
    setSheetMode("edit");
    setEditTitle(row);
    setSheetOpen(true);
  }, []);

  const runDeleteTitle = React.useCallback(async () => {
    if (!deleteTitle) return;
    try {
      await removeTitle(deleteTitle.seqId);
      setDeleteTitle(null);
    } catch (e) {
      sonnerToast.error(e instanceof Error ? e.message : "删除失败");
    }
  }, [deleteTitle, removeTitle]);

  return (
    <div className={`${DASHBOARD_MAIN_CONTAINER_CLASS} flex flex-col gap-4 py-4`}>
      <Card className="border-border shadow-none">
        <CardHeader>
          <CardTitle>积分与激励</CardTitle>
          <CardDescription>
            积分规则与 <span className="font-mono text-xs">data_role</span> 联动；积分流水只读，支持按用户与来源筛选。
          </CardDescription>
        </CardHeader>
        {authLoading ? (
          <CardContent>
            <EmptyPlaceholder title="正在加载登录身份…" />
          </CardContent>
        ) : null}
        {authError ? (
          <CardContent>
            <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert">
              {authError}
            </div>
          </CardContent>
        ) : null}
      </Card>

      <Tabs defaultValue="titles" className="w-full">
        <TabsList>
          <TabsTrigger value="titles">积分规则</TabsTrigger>
          <TabsTrigger value="logs">积分流水</TabsTrigger>
        </TabsList>

        <TabsContent value="titles" className="mt-4 space-y-4 outline-none">
          <IncentivesTitlesCard
            roleOptions={roleOptions}
            roleNameById={roleNameById}
            titleRoleFilter={titleRoleFilter}
            setTitleRoleFilter={setTitleRoleFilter}
            titles={titles}
            titlesLoading={titlesLoading}
            onRequestCreate={onRequestCreate}
            onRequestEdit={onRequestEdit}
            onRequestDelete={setDeleteTitle}
          />
        </TabsContent>

        <TabsContent value="logs" className="mt-4 space-y-4 outline-none">
          <IncentivesLogsCard
            logItems={logItems}
            logTotal={logTotal}
            logLoading={logLoading}
            logPageIndex={logPageIndex}
            setLogPageIndex={setLogPageIndex}
            logPageSize={logPageSize}
            setLogPageSize={setLogPageSize}
            logDraftUserId={logDraftUserId}
            setLogDraftUserId={setLogDraftUserId}
            logDraftSource={logDraftSource}
            setLogDraftSource={setLogDraftSource}
            applyLogFilters={applyLogFilters}
          />
        </TabsContent>
      </Tabs>

      <ScaleTitleEditorSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        mode={sheetMode}
        initial={editTitle}
        roleOptions={roleOptions}
        onSubmitCreate={saveCreateTitle}
        onSubmitPatch={savePatchTitle}
      />

      <AlertDialog open={Boolean(deleteTitle)} onOpenChange={(o) => !o && setDeleteTitle(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除该称号规则？</AlertDialogTitle>
            <AlertDialogDescription>将从 scale_title 中物理删除该条配置，不影响历史积分流水。</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel type="button">取消</AlertDialogCancel>
            <Button type="button" variant="destructive" onClick={() => void runDeleteTitle()}>
              确认删除
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
