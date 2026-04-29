"use client";

import Link from "next/link";

import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Input, Label, Switch } from "@bs-lab/ui";

import { EduTextbookMixedList } from "@/components/business/edu-textbook-mixed-list";
import { PageHeader } from "@/components/layout/page-header";
import { useDemoRole } from "@/components/layout/demo-role-context";
import { canWriteEduTextbooks } from "@/lib/rbac/management-access";
import { DASHBOARD_MAIN_CONTAINER_CLASS } from "@/lib/layout-container-classes";
import { cn } from "@/lib/utils";
import { userRoleLabelZh } from "@/types/auth";

import { useConsoleTextbooksPage } from "./page.hooks";

export default function ConsoleTextbooksPage() {
  const { role } = useDemoRole();
  const screen = useConsoleTextbooksPage();
  const canWrite = canWriteEduTextbooks(screen.actor as any);
  const selected = screen.items.find((item) => item.id === screen.selectedId) ?? screen.items[0];

  return (
    <div className={DASHBOARD_MAIN_CONTAINER_CLASS}>
      <div className="space-y-6">
      <PageHeader
        title={
          <div className="flex flex-wrap items-center gap-2">
            <span>教材管理</span>
            <Badge variant="secondary" className="font-normal">
              教材列表 / 章节管理
            </Badge>
          </div>
        }
        description={<>当前页面用于维护教材主数据，并进入章节管理。当前身份「{userRoleLabelZh(role)}」{canWrite ? "可执行教材新增、编辑、停用与复制。" : "仅可浏览。"}</>}
      />

      <Card className="border-border shadow-none">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0 pb-2">
          <div className="space-y-1 min-w-0">
            <CardTitle className="text-base">教材列表</CardTitle>
            <CardDescription>显示教材名称、学科、版本与状态；支持进入章节管理和版本对照。</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => void screen.refresh()} disabled={!screen.hydrated || screen.loading}>刷新</Button>
            {canWrite ? <Button type="button" size="sm" onClick={() => void screen.openCreate()}>新建教材</Button> : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!screen.hydrated || screen.loading ? (
            <p className="text-sm text-muted-foreground">{!screen.hydrated ? "正在恢复身份…" : "加载中…"}</p>
          ) : (
            <div className="overflow-hidden rounded-md border border-border">
              <table className="min-w-full table-fixed text-sm">
                <thead className="bg-muted/60 text-left text-muted-foreground">
                  <tr>
                    <th className="w-[28%] min-w-[18rem] px-4 py-3 font-medium">教材名称</th>
                    <th className="w-[16%] min-w-[10rem] px-4 py-3 font-medium">学科</th>
                    <th className="w-[16%] min-w-[10rem] px-4 py-3 font-medium">版本</th>
                    <th className="w-[16%] min-w-[8rem] px-4 py-3 font-medium">状态</th>
                    <th className="w-[24%] min-w-[14rem] px-4 py-3 font-medium text-right">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {screen.items.map((item) => (
                    <tr key={item.id} className={cn("cursor-pointer border-t border-border/60 align-top", screen.selectedId === item.id ? "bg-muted/30" : "hover:bg-muted/20")} onClick={() => screen.setSelectedId(item.id)}>
                      <td className="w-[28%] min-w-[18rem] px-4 py-4 font-medium text-foreground">{item.title}</td>
                      <td className="w-[16%] min-w-[10rem] px-4 py-4 text-muted-foreground">{item.subjectName || item.subjectId || "—"}</td>
                      <td className="w-[16%] min-w-[10rem] px-4 py-4 text-muted-foreground">{item.coursebookVersion || "—"}</td>
                      <td className="w-[16%] min-w-[8rem] px-4 py-4">
                        <Badge variant={item.status ? "secondary" : "outline"} className={cn("font-medium", item.status ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "")}>{item.status ? "正常" : "禁用"}</Badge>
                      </td>
                      <td className="w-[24%] min-w-[14rem] px-4 py-4 text-right">
                        <div className="flex flex-wrap justify-end gap-2">
                          <Button asChild type="button" size="sm" variant="outline"><Link href={`/console/settings/textbooks/${item.id}/chapters`}>章节管理</Link></Button>
                          {canWrite ? <Button type="button" size="sm" variant="outline" onClick={() => void screen.openEdit(item)}>编辑</Button> : null}
                          {canWrite ? <Button type="button" size="sm" onClick={() => void screen.duplicate(item.id)} disabled={screen.busyId === item.id}>复制整书</Button> : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {screen.items.length === 0 ? <div className="px-4 py-10 text-sm text-muted-foreground">暂无教材数据。</div> : null}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border shadow-none">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
          <div className="space-y-1 min-w-0">
            <CardTitle className="text-base">章节管理</CardTitle>
            <CardDescription>进入所选教材的章节管理页。</CardDescription>
          </div>
          {selected ? (
            <div className="flex flex-wrap gap-2">
              <Button asChild type="button" size="sm" variant="outline"><Link href={`/console/settings/textbooks/${selected.id}/chapters`}>打开章节管理</Link></Button>
            </div>
          ) : null}
        </CardHeader>
      </Card>

      <Dialog open={screen.createOpen} onOpenChange={(open) => screen.setCreateOpen(open)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>新建教材</DialogTitle></DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-1"><Label>教材名称</Label><Input value={screen.form.coursebookName} onChange={(e) => screen.setForm((d) => ({ ...d, coursebookName: e.target.value }))} /></div>
            <div className="grid gap-1"><Label>版本</Label><Input value={screen.form.coursebookVersion ?? ""} onChange={(e) => screen.setForm((d) => ({ ...d, coursebookVersion: e.target.value }))} /></div>
            <div className="grid gap-1"><Label>备注</Label><Input value={screen.form.comments ?? ""} onChange={(e) => screen.setForm((d) => ({ ...d, comments: e.target.value }))} /></div>
          </div>
          <DialogFooter><Button type="button" variant="outline" onClick={() => screen.setCreateOpen(false)}>取消</Button><Button type="button" onClick={() => void screen.submitCreate()}>保存</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={screen.editOpen} onOpenChange={(open) => screen.setEditOpen(open)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>编辑教材</DialogTitle></DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-1"><Label>教材名称</Label><Input value={screen.form.coursebookName} onChange={(e) => screen.setForm((d) => ({ ...d, coursebookName: e.target.value }))} /></div>
            <div className="grid gap-1"><Label>版本</Label><Input value={screen.form.coursebookVersion ?? ""} onChange={(e) => screen.setForm((d) => ({ ...d, coursebookVersion: e.target.value }))} /></div>
            <div className="grid gap-1"><Label>备注</Label><Input value={screen.form.comments ?? ""} onChange={(e) => screen.setForm((d) => ({ ...d, comments: e.target.value }))} /></div>
            <div className="flex items-center gap-2"><Switch checked={screen.form.status !== "n"} onCheckedChange={(v) => screen.setForm((d) => ({ ...d, status: v ? "y" : "n" }))} /><span className="text-sm text-muted-foreground">{screen.form.status !== "n" ? "正常" : "禁用"}</span></div>
          </div>
          <DialogFooter><Button type="button" variant="outline" onClick={() => screen.setEditOpen(false)}>取消</Button><Button type="button" onClick={() => void screen.submitEdit()}>保存</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="sr-only"><EduTextbookMixedList items={screen.items} canWrite={canWrite} busyId={screen.busyId} onDuplicate={screen.duplicate} /></div>
      </div>
    </div>
  );
}
