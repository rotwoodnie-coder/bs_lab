"use client";

import * as React from "react";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  Label,
  ScrollArea,
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  sonnerToast,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Textarea,
} from "@bs-lab/ui";

type ReviewRow = { id: string; user: string; target: string; excerpt: string; score: number };

const ROWS: ReviewRow[] = Array.from({ length: 24 }).map((_, i) => ({
  id: `rev-${1000 + i}`,
  user: `用户_${(i % 9) + 1}`,
  target: `实验 exp-${(i % 5) + 1}`,
  excerpt: ["步骤清晰", "数据可疑", "涉及不当用语", "与课标不符", "建议加安全提示"][i % 5]!,
  score: 60 + (i % 5) * 8,
}));

export default function ConsoleSocialReviewPage() {
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [rejectOpen, setRejectOpen] = React.useState(false);
  const [rejectReason, setRejectReason] = React.useState("");
  const [pendingRejectIds, setPendingRejectIds] = React.useState<string[]>([]);

  const allIds = ROWS.map((r) => r.id);
  const allSelected = selected.size === allIds.length && allIds.length > 0;
  const someSelected = selected.size > 0 && !allSelected;

  const toggleAll = (next: boolean) => {
    setSelected(next ? new Set(allIds) : new Set());
  };

  const toggleOne = (id: string, next: boolean) => {
    setSelected((prev) => {
      const n = new Set(prev);
      if (next) n.add(id);
      else n.delete(id);
      return n;
    });
  };

  const openReject = (ids: string[]) => {
    if (ids.length === 0) {
      sonnerToast.error("请先选择评价");
      return;
    }
    setPendingRejectIds(ids);
    setRejectReason("");
    setRejectOpen(true);
  };

  const confirmReject = () => {
    const reason = rejectReason.trim();
    if (!reason) {
      sonnerToast.error("必须填写驳回理由");
      return;
    }
    sonnerToast.success(`已驳回 ${pendingRejectIds.length} 条`, { description: reason });
    setSelected(new Set());
    setRejectOpen(false);
  };

  const approveBatch = () => {
    const ids = [...selected];
    if (ids.length === 0) {
      sonnerToast.error("请先选择评价");
      return;
    }
    sonnerToast.success(`已通过 ${ids.length} 条（）`);
    setSelected(new Set());
  };

  return (
    <>
      <Card className="border-border shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">评价审核工作台</CardTitle>
          <CardDescription>
            支持一次处理 20 条以上；驳回必须通过侧栏抽屉填写理由（禁止空理由）。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="sticky top-0 z-10 flex flex-col gap-2 border-b border-border bg-card py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Checkbox
                checked={allSelected ? true : someSelected ? "indeterminate" : false}
                onCheckedChange={(v) => toggleAll(v === true)}
                aria-label="全选"
              />
              <span>已选 {selected.size} 条</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" onClick={approveBatch}>
                批量通过
              </Button>
              <Button type="button" variant="destructive" onClick={() => openReject([...selected])}>
                批量驳回
              </Button>
            </div>
          </div>

          <ScrollArea className="h-[min(70vh,560px)] rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10" />
                  <TableHead>评价 ID</TableHead>
                  <TableHead>用户</TableHead>
                  <TableHead>对象</TableHead>
                  <TableHead>摘要</TableHead>
                  <TableHead className="text-right">分</TableHead>
                  <TableHead className="w-[100px] text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ROWS.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <Checkbox
                        checked={selected.has(r.id)}
                        onCheckedChange={(v) => toggleOne(r.id, v === true)}
                        aria-label={`选择 ${r.id}`}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-xs">{r.id}</TableCell>
                    <TableCell>{r.user}</TableCell>
                    <TableCell className="text-muted-foreground">{r.target}</TableCell>
                    <TableCell>{r.excerpt}</TableCell>
                    <TableCell className="text-right">{r.score}</TableCell>
                    <TableCell className="text-right">
                      <Button type="button" size="sm" variant="outline" onClick={() => openReject([r.id])}>
                        驳回
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      <Sheet open={rejectOpen} onOpenChange={setRejectOpen}>
        <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
          <SheetHeader>
            <SheetTitle>驳回评价</SheetTitle>
            <p className="text-sm text-muted-foreground">将处理 {pendingRejectIds.length} 条，必须输出理由。</p>
          </SheetHeader>
          <div className="flex flex-1 flex-col gap-3 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">驳回理由（必填）</Label>
              <Textarea
                id="reason"
                rows={8}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="面向教师与学生可见的驳回说明…"
              />
            </div>
          </div>
          <SheetFooter className="gap-2 sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setRejectOpen(false)}>
              取消
            </Button>
            <Button type="button" variant="destructive" onClick={confirmReject}>
              确认驳回
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
