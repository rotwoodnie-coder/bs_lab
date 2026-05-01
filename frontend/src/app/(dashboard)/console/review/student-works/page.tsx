"use client";

import * as React from "react";
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Checkbox, ScrollArea, Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle, sonnerToast, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Textarea } from "@bs-lab/ui";
import { PageHeader } from "@/components/layout/page-header";
import { withPermission } from "@/lib/permissions/with-permission";
import { useStudentWorksReview } from "./page.hooks";

const STATUS_LABEL: Record<string, string> = { t: "待审核", y: "已通过", n: "已驳回" };
const STATUS_VARIANT: Record<string, "secondary" | "default" | "destructive"> = { t: "secondary", y: "default", n: "destructive" };

function StudentWorksReviewPage() {
  const {
    list,
    total,
    page,
    pageSize,
    loading,
    error,
    selected,
    allSelected,
    someSelected,
    rejectOpen,
    rejectReason,
    pendingIds,
    toggleAll,
    toggleOne,
    handleApprove,
    openReject,
    setRejectOpen,
    setRejectReason,
    handleReject,
    load,
  } = useStudentWorksReview();

  const totalPages = Math.ceil(total / pageSize);

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="作品审核" description="校级管理员审核学生上传的实验作品，通过后进入实验广场。" />
        <Card className="border-border shadow-none">
          <CardContent className="flex flex-col items-center justify-center gap-4 py-12 text-center">
            <p className="text-destructive">{error}</p>
            <Button variant="outline" onClick={() => load(page)}>重试</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
              {loading && <span className="text-xs italic">加载中…</span>}
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" disabled={selected.size === 0} onClick={handleApprove}>批量通过</Button>
              <Button variant="destructive" disabled={selected.size === 0} onClick={() => openReject([...selected])}>批量驳回</Button>
            </div>
          </div>
          <ScrollArea className="h-[min(70vh,560px)] rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10" />
                  <TableHead>作品ID</TableHead>
                  <TableHead>学生</TableHead>
                  <TableHead>标题</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead className="w-[100px] text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">暂无作品</TableCell>
                  </TableRow>
                )}
                {list.map((r) => (
                  <TableRow key={r.expId}>
                    <TableCell>
                      <Checkbox checked={selected.has(r.expId)} onCheckedChange={(v) => toggleOne(r.expId, v === true)} disabled={r.status !== "t"} />
                    </TableCell>
                    <TableCell className="font-mono text-xs">{r.expId}</TableCell>
                    <TableCell>{r.displayOwnerName ?? r.createUserId}</TableCell>
                    <TableCell>{r.expName}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[r.status ?? "t"]}>
                        {STATUS_LABEL[r.status ?? "t"]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{r.createTime}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" disabled={r.status !== "t"} onClick={() => openReject([r.expId])}>驳回</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2 text-sm text-muted-foreground">
              <span>共 {total} 条，第 {page}/{totalPages} 页</span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => load(page - 1)}>上一页</Button>
                <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => load(page + 1)}>下一页</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      <Sheet open={rejectOpen} onOpenChange={setRejectOpen}>
        <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
          <SheetHeader>
            <SheetTitle>驳回作品</SheetTitle>
            <p className="text-sm text-muted-foreground">将处理 {pendingIds.length} 条，必须输出理由。</p>
          </SheetHeader>
          <div className="flex flex-1 flex-col gap-3 py-4">
            <Textarea rows={8} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="填写驳回原因…" />
          </div>
          <SheetFooter className="gap-2 sm:justify-end">
            <Button variant="outline" onClick={() => setRejectOpen(false)}>取消</Button>
            <Button variant="destructive" onClick={handleReject}>确认驳回</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default withPermission(StudentWorksReviewPage, "/console/review/student-works");
