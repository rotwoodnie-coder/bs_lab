"use client";

import * as React from "react";
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, Input, Label, Textarea } from "@bs-lab/ui";
import { sonnerToast } from "@bs-lab/ui";

import type { ExperimentManageRow } from "../page.hooks";
import { useAuth } from "@/hooks/use-auth";
import { getTeacherAuthorizedClasses, type TeacherAuthorizedClassRow } from "@/lib/v2/v2-sys-org-api";
import type { CoreApiActor } from "@/lib/core-api-shared";

function useTeacherClasses(open: boolean, subjectId?: string | null) {
  const { user } = useAuth();
  const [options, setOptions] = React.useState<TeacherAuthorizedClassRow[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [errorHint, setErrorHint] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    let cancelled = false;

    void (async () => {
      setLoading(true);
      setErrorHint(null);
      try {
        const actor: CoreApiActor = {
          role: user.role,
          orgId: user.orgId,
          userId: user.userId,
          userName: user.userName,
          tenantId: user.tenantId,
          appId: user.appId,
        };

        const rows = await getTeacherAuthorizedClasses(actor, subjectId);
        if (cancelled) return;

        setOptions(rows);
        if (rows.length === 0) {
          setErrorHint(
            subjectId
              ? "您尚未绑定该学科的授课班级，请联系管理员或在个人中心配置。"
              : "您尚未绑定授课班级，请先去个人中心关联。",
          );
        }
      } catch {
        if (!cancelled) setErrorHint("加载授课班级失败，请稍后再试。");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, subjectId, user.appId, user.orgId, user.role, user.tenantId, user.userId, user.userName]);

  return { options, loading, errorHint };
}

export function PublishAssignmentDialog(props: {
  open: boolean;
  onClose: () => void;
  onConfirm: (payload: { targetClassId: string; deadline?: string | null; requirement?: string | null }) => Promise<void>;
  target: ExperimentManageRow | null;
}) {
  const { options: teacherClasses, loading, errorHint } = useTeacherClasses(props.open, props.target?.subjectId);

  const [targetClassId, setTargetClassId] = React.useState("");
  const [deadline, setDeadline] = React.useState("");
  const [requirement, setRequirement] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!props.open) return;
    setTargetClassId("");
    setDeadline("");
    setRequirement("");
  }, [props.open, props.target?.expId]);

  React.useEffect(() => {
    if (props.open && teacherClasses.length > 0 && !targetClassId) {
      setTargetClassId(teacherClasses[0]!.orgId);
    }
  }, [props.open, teacherClasses, targetClassId]);

  return (
    <Dialog open={props.open} onOpenChange={(v) => !v && props.onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>布置实验任务</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>实验名称</Label>
            <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">
              {props.target?.expName ?? "未选择实验"}
            </div>
          </div>

          <div className="space-y-2">
            <Label>授课班级</Label>
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3"
              value={targetClassId}
              onChange={(e) => setTargetClassId(e.target.value)}
              disabled={loading || teacherClasses.length === 0 || submitting}
            >
              {loading ? (
                <option value="">加载班级中...</option>
              ) : teacherClasses.length === 0 ? (
                <option value="">无可用班级</option>
              ) : (
                <>
                  <option value="">请选择班级</option>
                  {teacherClasses.map((c) => (
                    <option key={c.orgId} value={c.orgId}>
                      {c.fullPathName?.trim() ? c.fullPathName : c.orgName}
                    </option>
                  ))}
                </>
              )}
            </select>
            {errorHint ? <p className="mt-1 text-xs text-destructive">{errorHint}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="assign-deadline">截止日期</Label>
            <Input
              id="assign-deadline"
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              disabled={submitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="assign-requirement">实验要求</Label>
            <Textarea
              id="assign-requirement"
              value={requirement}
              onChange={(e) => setRequirement(e.target.value)}
              rows={5}
              placeholder="请输入作业要求"
              disabled={submitting}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={props.onClose} disabled={submitting}>
            取消
          </Button>
          <Button
            disabled={!targetClassId || loading || submitting}
            onClick={async () => {
              if (!targetClassId) return;
              setSubmitting(true);
              try {
                await props.onConfirm({
                  targetClassId,
                  deadline: deadline || null,
                  requirement: requirement || null,
                });
                sonnerToast.success("发布成功");
                props.onClose();
              } catch (err) {
                const msg = err instanceof Error ? err.message : "发布失败";
                sonnerToast.error("发布失败", { description: msg });
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {submitting ? "发布中..." : "确认发布"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
