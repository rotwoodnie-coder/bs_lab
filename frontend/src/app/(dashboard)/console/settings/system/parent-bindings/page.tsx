"use client";

import * as React from "react";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Input, Label, sonnerToast } from "@bs-lab/ui";

import { PageHeader } from "@/components/layout/page-header";
import { useAuth } from "@/hooks/use-auth";
import { fetchAuditPending, postAudit, type PendingBindingRow } from "@/lib/v2/v2-parent-binding-api";

export default function ParentBindingsAuditPage() {
  const auth = useAuth();
  const actor = React.useMemo(
    () => ({
      role: auth.user.role as any,
      userId: auth.user.userId,
      userName: auth.user.userName || auth.user.userId,
      orgId: auth.user.orgId || "",
      tenantId: auth.user.tenantId,
      appId: auth.user.appId,
    }),
    [auth.user.appId, auth.user.orgId, auth.user.role, auth.user.tenantId, auth.user.userId, auth.user.userName],
  );

  const [items, setItems] = React.useState<PendingBindingRow[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [busyId, setBusyId] = React.useState<string>("");
  const [rejectOpen, setRejectOpen] = React.useState(false);
  const [rejectId, setRejectId] = React.useState<string>("");
  const [rejectReason, setRejectReason] = React.useState("");

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const rows = await fetchAuditPending(actor);
      setItems(rows);
    } catch (e) {
      sonnerToast.error(e instanceof Error ? e.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, [actor]);

  React.useEffect(() => {
    if (!auth.user.userId) return;
    void load();
  }, [auth.user.userId, load]);

  const approve = async (seqId: string) => {
    if (busyId) return;
    setBusyId(seqId);
    try {
      await postAudit(actor, { seqId, auditStatus: "Y", auditComments: null });
      sonnerToast.success("已通过");
      await load();
    } catch (e) {
      sonnerToast.error(e instanceof Error ? e.message : "操作失败");
    } finally {
      setBusyId("");
    }
  };

  const openReject = (seqId: string) => {
    setRejectId(seqId);
    setRejectReason("");
    setRejectOpen(true);
  };

  const confirmReject = async () => {
    if (!rejectId) return;
    if (!rejectReason.trim()) {
      sonnerToast.error("请填写驳回原因");
      return;
    }
    setBusyId(rejectId);
    try {
      await postAudit(actor, { seqId: rejectId, auditStatus: "N", auditComments: rejectReason.trim() });
      sonnerToast.success("已驳回");
      setRejectOpen(false);
      await load();
    } catch (e) {
      sonnerToast.error(e instanceof Error ? e.message : "操作失败");
    } finally {
      setBusyId("");
    }
  };

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        title="家长绑定审核"
        description={<>校级管理员审核家长与学生的绑定申请；审核通过后家长可正常进入系统。</>}
      />

      <Card className="border-border shadow-none">
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-base">待审核列表</CardTitle>
            <CardDescription>仅显示当前学校范围内的待审申请。</CardDescription>
          </div>
          <Button type="button" variant="secondary" size="sm" disabled={loading} onClick={() => void load()}>
            {loading ? "刷新中…" : "刷新"}
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">{loading ? "加载中…" : "暂无待审核记录"}</p>
          ) : (
            items.map((r) => (
              <div key={r.seqId} className="rounded-lg border border-border bg-card px-3 py-3 text-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <p className="font-medium text-foreground">
                      {r.parentUserName ?? r.parentUserId}（{r.parentLoginName ?? "—"}）申请绑定
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {r.schoolOrgName ?? "—"} / {r.gradeOrgName ?? "—"} / {r.classOrgName ?? "—"} / {r.studentUserName ?? r.studentUserId}
                    </p>
                    <p className="text-xs text-muted-foreground">申请时间：{r.createTime}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Button type="button" size="sm" disabled={!!busyId} onClick={() => void approve(r.seqId)}>
                      通过
                    </Button>
                    <Button type="button" size="sm" variant="outline" disabled={!!busyId} onClick={() => openReject(r.seqId)}>
                      驳回
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>驳回申请</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>驳回原因</Label>
            <Input value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="请填写驳回原因（将展示给家长）" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setRejectOpen(false)} disabled={!!busyId}>
              取消
            </Button>
            <Button type="button" onClick={() => void confirmReject()} disabled={!!busyId}>
              确认驳回
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

