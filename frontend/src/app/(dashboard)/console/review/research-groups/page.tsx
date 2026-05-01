"use client";

import * as React from "react";
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Checkbox, ScrollArea, Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle, sonnerToast, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Textarea } from "@bs-lab/ui";
import { PageHeader } from "@/components/layout/page-header";
import { withPermission } from "@/lib/permissions/with-permission";
import { useResearchGroupsReview } from "./page.hooks";

const STATUS_LABEL: Record<string, string> = { t: "待审核", y: "已通过", n: "已驳回" };
const STATUS_VARIANT: Record<string, "secondary" | "default" | "destructive"> = { t: "secondary", y: "default", n: "destructive" };

function ResearchGroupsReviewPage() {
  const {
    list,
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
  } = useResearchGroupsReview();

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="课题组审核" description="教研员审核教师创建的课题组，通过后进入正式使用状态。" />
        <Card className="border-border shadow-none">
          <CardContent className="flex flex-col items-center justify-center gap-4 py-12 text-center">
            <p className="text-destructive">{error}</p>
            <Button variant="outline" onClick={() => load()}>重试</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="课题组审核" description="教研员审核教师创建的课题组，通过后进入正式使用状态。" />
      <Card className="border-border shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">教研课题组审核工作台</CardTitle>
          <CardDescription>支持批量审核，驳回必须填写理由；课题组通过后教师可继续管理成员并发起活动。</CardDescription>
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
                  <TableHead>课题组ID</TableHead>
                  <TableHead>负责人</TableHead>
                  <TableHead>组名</TableHead>
                  <TableHead>说明</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead className="w-[100px] text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">暂无课题组</TableCell>
                  </TableRow>
                )}
                {list.map((r) => (
                  <TableRow key={r.groupId}>
                    <TableCell>
                      <Checkbox checked={selected.has(r.groupId)} onCheckedChange={(v) => toggleOne(r.groupId, v === true)} disabled={r.reviewStatus !== "t"} />
                    </TableCell>
                    <TableCell className="font-mono text-xs">{r.groupId}</TableCell>
                    <TableCell>{r.ownerName ?? r.ownerId}</TableCell>
                    <TableCell>{r.groupName}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">{r.comments ?? "-"}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[r.reviewStatus]}>
                        {STATUS_LABEL[r.reviewStatus]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{r.createTime}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" disabled={r.reviewStatus !== "t"} onClick={() => openReject([r.groupId])}>驳回</Button>
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
            <SheetTitle>驳回课题组</SheetTitle>
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

export default withPermission(ResearchGroupsReviewPage, "/console/review/research-groups");
