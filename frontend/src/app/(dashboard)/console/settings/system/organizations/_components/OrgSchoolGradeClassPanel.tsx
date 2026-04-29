"use client";

import * as React from "react";
import {
  AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  Button, Card, CardContent, CardDescription, CardHeader, CardTitle,
  Checkbox, Input, Label, Switch,
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@bs-lab/ui";
import { Lock } from "@bs-lab/ui/icons";
import { sonnerToast } from "@bs-lab/ui";

import { DEFAULT_CLASS_COUNT, type Row, type StageKey, STAGE_RANGES } from "../org-school-structure-utils";
import { type OrgSchoolGradeClassPanelProps } from "./OrgSchoolGradeClassPanel.hooks";
import { useSchoolGradeClassPanel } from "./OrgSchoolGradeClassPanel.hooks";
import { OrgConfirmDeleteDialog } from "./OrgConfirmDeleteDialog";

export function OrgSchoolGradeClassPanel(props: OrgSchoolGradeClassPanelProps) {
  const h = useSchoolGradeClassPanel(props);
  const { isSuperAdmin, submitting, orgTypeMode, levelOptions, gradeLabels } = props;

  const renderGradeRows = (items: Row[]) => (
    <>
      {items.map((r) => {
        const g = h.gradeInfoById.get(r.gradeId);
        const ln = g ? String(levelOptions.find((l) => l.id === String(g.levelId))?.name ?? "—") : "—";
        const isLocked = h.phase === "maintenance" && !isSuperAdmin && (h.gradeHasStudentsMap[r.gradeId] ?? false);
        return (
          <TableRow key={r.gradeId}>
            <TableCell className="font-medium">{gradeLabels[r.gradeId] ?? r.gradeId}</TableCell>
            <TableCell className="text-muted-foreground">{ln}</TableCell>
            <TableCell className="text-center">
              <Switch
                checked={r.offered}
                disabled={submitting || isLocked}
                onCheckedChange={(v) => {
                  if (isLocked) {
                    sonnerToast.warning("该年级班级含学生数据，无法取消开设", { description: "请先迁移学生或联系超级管理员。" });
                    return;
                  }
                  const on = v === true;
                  h.setRows((prev: Row[]) => prev.map((x) =>
                    x.gradeId === r.gradeId ? { ...x, offered: on, classCount: on && x.classCount === 0 ? DEFAULT_CLASS_COUNT : on ? x.classCount : 0 } : x,
                  ));
                  h.setDirty(true);
                }}
              />
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-1.5">
                <Input className="h-8" inputMode="numeric" disabled={submitting || !r.offered || isLocked}
                  value={r.offered ? String(r.classCount) : "0"}
                  onChange={(e) => {
                    if (isLocked) return;
                    const raw = e.target.value.replace(/\D/g, "");
                    const n = raw === "" ? 0 : Math.min(99, Number.parseInt(raw, 10) || 0);
                    h.setRows((prev: Row[]) => prev.map((x) => x.gradeId === r.gradeId ? { ...x, classCount: n } : x));
                    h.setDirty(true);
                  }} />
                {isLocked && <Lock className="size-3.5 shrink-0 text-muted-foreground" />}
              </div>
            </TableCell>
          </TableRow>
        );
      })}
    </>
  );

  return (
    <Card className="border-border shadow-none">
      <AlertDialog open={h.clearOpen} onOpenChange={h.setClearOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认清空年级与班级架构？</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span>已清空当前勾选。请点击「保存年级与班级架构」完成清空或重建。</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>取消</AlertDialogCancel>
            <Button type="button" disabled={submitting} onClick={() => h.setClearOpen(false)}>知道了</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={h.saveClearOpen} onOpenChange={h.setSaveClearOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认执行清空？</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span>继续保存将物理删除该学校下已有的年级/班级架构（并清空学校开设年级）。</span>
              <span>确认后将按当前勾选结果重新生成年级与班级。</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>取消</AlertDialogCancel>
            <Button type="button" variant="destructive" disabled={submitting}
              onClick={() => { h.setSaveClearOpen(false); h.setPendingClear(false); void props.onClear().then(() => void h.handleSave()); }}>
              确认并保存
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <OrgConfirmDeleteDialog
        open={h.confirmOpen}
        onOpenChange={(v) => { h.setConfirmOpen(v); if (!v) h.setPendingDiff(null); }}
        confirmItems={h.pendingDiff?.confirmItems ?? []}
        isSuperAdmin={isSuperAdmin}
        submitting={submitting}
        onConfirm={h.handleConfirmDelete}
      />

      <CardHeader className="pb-2">
        <CardTitle className="text-base">年级与班级</CardTitle>
        <CardDescription className="text-xs leading-relaxed">
          勾选「开设」并填写班数后保存。
          {h.phase === "maintenance" && (
            <span className="text-amber-600 dark:text-amber-400">
              {" "}检测到历史数据，当前处于<strong>运维阶段</strong>，删除操作将受保护限制。
            </span>
          )}
          {h.phase === "initialization" && (
            <span> 班级总数约 <span className="font-medium text-foreground">{h.totalClasses}</span>。</span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          {orgTypeMode === "school" && (
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" size="sm" variant="outline" disabled={submitting} onClick={h.applyAllGrades}>全选</Button>
              <Button type="button" size="sm" variant="outline" disabled={submitting} onClick={h.clearAllGrades}>清空</Button>
              <div className="mx-1 h-4 w-px bg-border" aria-hidden />
              <div className="flex flex-wrap items-center gap-4">
                {(Object.keys(STAGE_RANGES) as StageKey[]).map((k) => {
                  const state = h.stageAggregate(k);
                  const id = `stage-${k}`;
                  return (
                    <div key={k} className="flex items-center gap-2">
                      <Checkbox id={id} checked={state} disabled={submitting}
                        onCheckedChange={(v) => h.toggleStage(k, v !== false)}
                        aria-label={`按${STAGE_RANGES[k].label}默认开通年级`} />
                      <Label htmlFor={id} className="text-xs text-foreground">{STAGE_RANGES[k].label}</Label>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="overflow-x-auto rounded-md border border-border">
          <Table className="min-w-[480px] text-xs">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[28%]">年级</TableHead>
                <TableHead className="w-[22%]">学段</TableHead>
                <TableHead className="w-24 text-center">开设</TableHead>
                <TableHead className="w-28">班数</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orgTypeMode === "school" ? (
                <>
                  {(["primary", "junior", "senior"] as StageKey[]).map((k) => (
                    <React.Fragment key={k}>
                      <TableRow className="bg-muted/40 hover:bg-muted/40">
                        <TableCell colSpan={2} className="px-3 py-2 text-xs font-medium text-foreground">{STAGE_RANGES[k].label}</TableCell>
                        <TableCell className="px-3 py-2 text-center text-xs text-muted-foreground">批量</TableCell>
                        <TableCell className="px-3 py-2">
                          <Input className="h-8" inputMode="numeric" disabled={submitting}
                            value={h.stageHeaderState(k).value} placeholder={h.stageHeaderState(k).placeholder}
                            onChange={(e) => { const raw = e.target.value.replace(/\D/g, ""); h.applyStageClassCount(k, raw === "" ? 0 : Math.min(99, Number.parseInt(raw, 10) || 0)); }} />
                        </TableCell>
                      </TableRow>
                      {renderGradeRows(h.groupedRows[k])}
                    </React.Fragment>
                  ))}
                  {h.groupedRows.other.length > 0 && renderGradeRows(h.groupedRows.other)}
                </>
              ) : renderGradeRows(h.rows)}
            </TableBody>
          </Table>
        </div>

        <div className="flex justify-end border-t border-border pt-3">
          <Button type="button" size="sm" disabled={submitting || !h.dirty} onClick={() => void h.handleSave()}>
            {submitting ? "保存中…" : "保存年级与班级架构"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
