"use client";

import * as React from "react";
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Checkbox, ScrollArea, Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle, sonnerToast, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Textarea } from "@bs-lab/ui";
import { PageHeader } from "@/components/layout/page-header";
import { withPermission } from "@/lib/permissions/with-permission";

type WorkRow = { id: string; student: string; className: string; title: string; status: "待审核" | "已通过" | "已驳回"; summary: string };

const ROWS: WorkRow[] = Array.from({ length: 18 }).map((_, i) => ({
  id: `work-${2000 + i}`,
  student: `学生_${(i % 8) + 1}`,
  className: `三年级 ${(i % 4) + 1} 班`,
  title: `实验作品 ${(i % 6) + 1}`,
  status: i % 3 === 0 ? "待审核" : i % 3 === 1 ? "已通过" : "已驳回",
  summary: ["结构完整", "数据缺失", "图文清晰", "安全说明不足", "过程记录完整"][i % 5]!,
}));

function StudentWorksReviewPage() {
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [rejectOpen, setRejectOpen] = React.useState(false);
  const [rejectReason, setRejectReason] = React.useState("");
  const [pendingIds, setPendingIds] = React.useState<string[]>([]);

  const allIds = ROWS.map((r) => r.id);
  const allSelected = selected.size === allIds.length && allIds.length > 0;
  const someSelected = selected.size > 0 && !allSelected;

  const toggleAll = (next: boolean) => setSelected(next ? new Set(allIds) : new Set());
  const toggleOne = (id: string, next: boolean) => setSelected((prev) => { const n = new Set(prev); next ? n.add(id) : n.delete(id); return n; });
  const openReject = (ids: string[]) => { if (ids.length === 0) return sonnerToast.error("请先选择作品"); setPendingIds(ids); setRejectReason(""); setRejectOpen(true); };
  const approve = () => { const ids = [...selected]; if (!ids.length) return sonnerToast.error("请先选择作品"); sonnerToast.success(`已通过 ${ids.length} 条`); setSelected(new Set()); };
  const confirmReject = () => { if (!rejectReason.trim()) return sonnerToast.error("必须填写驳回理由"); sonnerToast.success(`已驳回 ${pendingIds.length} 条`, { description: rejectReason }); setSelected(new Set()); setRejectOpen(false); };

  return (
    <div className="space-y-6">
      <PageHeader title="作品审核" description="校级管理员审核学生上传的实验作品，通过后进入实验广场。" />
      <Card className="border-border shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">学生作品审核工作台</CardTitle>
          <CardDescription>支持批量审核，驳回必须填写理由；作品会绑定班级与学生身份。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="sticky top-0 z-10 flex flex-col gap-2 border-b border-border bg-card py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Checkbox checked={allSelected ? true : someSelected ? "indeterminate" : false} onCheckedChange={(v) => toggleAll(v === true)} />
              <span>已选 {selected.size} 条</span>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={approve}>批量通过</Button>
              <Button variant="destructive" onClick={() => openReject([...selected])}>批量驳回</Button>
            </div>
          </div>
          <ScrollArea className="h-[min(70vh,560px)] rounded-md border border-border">
            <Table>
              <TableHeader><TableRow><TableHead className="w-10" /><TableHead>作品ID</TableHead><TableHead>学生</TableHead><TableHead>班级</TableHead><TableHead>标题</TableHead><TableHead>状态</TableHead><TableHead>摘要</TableHead><TableHead className="w-[100px] text-right">操作</TableHead></TableRow></TableHeader>
              <TableBody>{ROWS.map((r) => (<TableRow key={r.id}><TableCell><Checkbox checked={selected.has(r.id)} onCheckedChange={(v) => toggleOne(r.id, v === true)} /></TableCell><TableCell className="font-mono text-xs">{r.id}</TableCell><TableCell>{r.student}</TableCell><TableCell>{r.className}</TableCell><TableCell>{r.title}</TableCell><TableCell><Badge variant={r.status === "待审核" ? "secondary" : r.status === "已通过" ? "default" : "destructive"}>{r.status}</Badge></TableCell><TableCell>{r.summary}</TableCell><TableCell className="text-right"><Button size="sm" variant="outline" onClick={() => openReject([r.id])}>驳回</Button></TableCell></TableRow>))}</TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
      <Sheet open={rejectOpen} onOpenChange={setRejectOpen}>
        <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
          <SheetHeader><SheetTitle>驳回作品</SheetTitle><p className="text-sm text-muted-foreground">将处理 {pendingIds.length} 条，必须输出理由。</p></SheetHeader>
          <div className="flex flex-1 flex-col gap-3 py-4"><Textarea rows={8} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="填写驳回原因…" /></div>
          <SheetFooter className="gap-2 sm:justify-end"><Button variant="outline" onClick={() => setRejectOpen(false)}>取消</Button><Button variant="destructive" onClick={confirmReject}>确认驳回</Button></SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default withPermission(StudentWorksReviewPage, "/console/review/student-works");
