"use client";

import * as React from "react";
import Link from "next/link";

import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Input, Label, Switch, Textarea } from "@bs-lab/ui";
import { Layers, Pencil, Plus, RefreshCw, Ban } from "@bs-lab/ui/icons";

import { PageHeader } from "@/components/layout/page-header";
import { useDemoRole } from "@/components/layout/demo-role-context";
import { buildMaterialsApiActor } from "@/lib/materials-api-actor";
import { DASHBOARD_MAIN_CONTAINER_CLASS } from "@/lib/layout-container-classes";
import { cn } from "@/lib/utils";
import { callNewCoreApi, getExperimentCatalogTenantId } from "@/lib/new-core-api";

import { useCoursesPage } from "./page.hooks";
import { CourseCreateStepper } from "./_components/course-create-stepper";

type SubjectItem = { id: string; name: string };

export default function ConsoleCourseListPage() {
  const { role, orgId } = useDemoRole();
  const actor = React.useMemo(() => buildMaterialsApiActor(role, orgId, "edu-textbooks"), [role, orgId]);
  const s = useCoursesPage();

  const [subjects, setSubjects] = React.useState<SubjectItem[]>([]);
  React.useEffect(() => {
    const headers = { "x-tenant-id": getExperimentCatalogTenantId(), "x-app-id": "console" };
    void callNewCoreApi<SubjectItem[]>(actor, "/v2/dict/school-subjects", "GET", undefined, headers).then(setSubjects).catch(() => {});
  }, [actor]);

  const maxExp = Math.max(1, ...s.items.map((i) => i.expCount));

  return (
    <div className={DASHBOARD_MAIN_CONTAINER_CLASS}>
      <div className="space-y-6">
        {s.toast && (
          <div className={cn("fixed right-4 top-4 z-50 rounded-md px-4 py-2 text-sm font-medium shadow-md", s.toast.type === "ok" ? "bg-foreground text-background" : "bg-destructive text-destructive-foreground")}>
            {s.toast.msg}
          </div>
        )}

        <PageHeader
          title={<div className="flex flex-wrap items-center gap-2"><span>实验课程</span><Badge variant="secondary" className="font-normal">课程管理</Badge></div>}
          description="基于教材构建的实验课程，包含章节结构与实验编排。"
        />

        <Card className="border-border shadow-none">
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0 pb-2">
            <div className="space-y-1 min-w-0">
              <CardTitle className="text-base">课程列表</CardTitle>
              <CardDescription>显示课程名称、学科、章节数、实验数与状态。</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Input className="h-8 w-40 text-sm" placeholder="搜索课程…" value={s.keyword} onChange={(e) => s.setKeyword(e.target.value)} />
              <Button type="button" variant="outline" size="sm" onClick={() => void s.load(s.keyword)} disabled={s.loading}><RefreshCw className="mr-1.5 h-3.5 w-3.5" />刷新</Button>
              <Button type="button" size="sm" onClick={s.openCreate}><Plus className="mr-1.5 h-3.5 w-3.5" />新建课程</Button>
            </div>
          </CardHeader>
          <CardContent>
            {s.loading ? (
              <p className="py-8 text-center text-sm text-muted-foreground">加载中…</p>
            ) : (
              <div className="overflow-hidden rounded-md border border-border">
                <table className="min-w-full table-fixed text-sm">
                  <thead className="bg-muted/60 text-left text-muted-foreground">
                    <tr>
                      <th className="w-[28%] px-4 py-3 font-medium">课程名称</th>
                      <th className="w-[12%] px-4 py-3 font-medium">学科</th>
                      <th className="w-[10%] px-4 py-3 font-medium">版本</th>
                      <th className="w-[24%] px-4 py-3 font-medium">实验进度</th>
                      <th className="w-[10%] px-4 py-3 font-medium">状态</th>
                      <th className="w-[16%] px-4 py-3 font-medium text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {s.items.map((item) => (
                      <tr key={item.coursebookId} className="border-t border-border/60 align-middle hover:bg-muted/20">
                        <td className="px-4 py-3 font-medium text-foreground">{item.coursebookName}</td>
                        <td className="px-4 py-3 text-muted-foreground">{item.subjectName ?? "—"}</td>
                        <td className="px-4 py-3 text-muted-foreground">{item.coursebookVersion ?? "—"}</td>
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>{item.chapterCount} 章 · {item.expCount} 个实验</span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-muted">
                              <div className="h-1.5 rounded-full bg-foreground transition-all" style={{ width: `${Math.round((item.expCount / maxExp) * 100)}%` }} />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={item.status === "y" ? "secondary" : "outline"} className={cn("font-medium", item.status === "y" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "text-muted-foreground")}>
                            {item.status === "y" ? "已发布" : "草稿"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex flex-wrap justify-end gap-1.5">
                            <Button asChild type="button" size="sm" variant="outline"><Link href={`/console/settings/textbooks/${encodeURIComponent(item.coursebookId)}/chapters`}><Layers className="mr-1 h-3.5 w-3.5" />章节管理</Link></Button>
                            <Button type="button" size="sm" variant="outline" onClick={() => s.openEdit(item)} disabled={s.busyId === item.coursebookId}><Pencil className="mr-1 h-3.5 w-3.5" />编辑</Button>
                            <Button type="button" size="sm" onClick={() => void s.removeCourse(item.coursebookId, item.coursebookName)} disabled={s.busyId === item.coursebookId}><Ban className="mr-1 h-3.5 w-3.5" />停用</Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {s.items.length === 0 && <div className="px-4 py-10 text-center text-sm text-muted-foreground">暂无课程，点击「新建课程」开始创建。</div>}
              </div>
            )}
          </CardContent>
        </Card>

        <CourseCreateStepper
          open={s.stepperOpen} onOpenChange={s.setStepperOpen}
          step={s.stepperStep} form={s.stepperForm} setForm={s.setStepperForm}
          submitting={s.submitting} onNext={s.stepperNext}
          onBack={() => s.setStepperStep((p) => Math.max(1, p - 1))}
          newCourseId={s.newCourseId} subjects={subjects}
          actor={s.actor}
        />

        <Dialog open={s.editOpen} onOpenChange={s.setEditOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader><DialogTitle>编辑课程</DialogTitle></DialogHeader>
            <div className="grid gap-3 py-2">
              <div className="grid gap-1"><Label>课程名称</Label><Input value={s.editForm.coursebookName} onChange={(e) => s.setEditForm((d) => ({ ...d, coursebookName: e.target.value }))} /></div>
              <div className="grid gap-1"><Label>版本号</Label><Input value={s.editForm.coursebookVersion} onChange={(e) => s.setEditForm((d) => ({ ...d, coursebookVersion: e.target.value }))} /></div>
              <div className="grid gap-1">
                <Label>课程说明</Label>
                <Textarea value={s.editForm.comments} onChange={(e) => s.setEditForm((d) => ({ ...d, comments: e.target.value }))} rows={3} maxLength={100} className="resize-none text-sm" placeholder="选填，最多 100 字" />
              </div>
              <div className="flex items-center gap-2"><Switch checked={s.editForm.status === "y"} onCheckedChange={(v) => s.setEditForm((d) => ({ ...d, status: v ? "y" : "n" }))} /><span className="text-sm text-muted-foreground">{s.editForm.status === "y" ? "已发布" : "草稿"}</span></div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => s.setEditOpen(false)}>取消</Button>
              <Button type="button" onClick={() => void s.submitEdit()} disabled={s.busyId != null}>保存</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
