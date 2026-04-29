"use client";

import * as React from "react";
import { Button, Card, CardContent, Input, Label, sonnerToast, Switch } from "@bs-lab/ui";

import { useSessionActor } from "@/hooks/use-session-actor";
import type { UserRole } from "@/types/auth";
import { UserRole as R } from "@/types/auth";
import {
  forkMediaRegistryRevision,
  getMediaReviewPolicy,
  putMediaReviewPolicy,
  submitMediaRegistryReview,
  type MediaActor,
  upgradeMediaReferenceRegistry,
} from "@/app/(dashboard)/console/settings/materials/media/page.api";

function buildActor(role: UserRole, orgId: string): MediaActor {
  return { role, orgId, userId: `${role.toLowerCase()}-session`, userName: `${role.toLowerCase()}-session` };
}

export function TeacherMediaReviewTools(props: { omitIntro?: boolean }) {
  const { role, orgId, hydrated } = useSessionActor();
  const actor = React.useMemo(() => buildActor(role, orgId), [role, orgId]);
  const [registryId, setRegistryId] = React.useState("");
  const [referenceId, setReferenceId] = React.useState("");
  const [targetRegistryId, setTargetRegistryId] = React.useState("");
  const [policy, setPolicy] = React.useState<{ teacherUploadRequireReview: boolean } | null>(null);
  const [policyBusy, setPolicyBusy] = React.useState(false);

  const canManagePolicy =
    role === R.RESEARCHER || role === R.DISTRICT_ADMIN || role === R.SUPER_ADMIN;
  const canSubmit =
    role === R.STUDENT ||
    role === R.PARENT ||
    role === R.TEACHER ||
    role === R.SCHOOL_ADMIN ||
    canManagePolicy;

  const loadPolicy = React.useCallback(async () => {
    try {
      const p = await getMediaReviewPolicy(actor);
      setPolicy({ teacherUploadRequireReview: p.teacherUploadRequireReview });
    } catch (e) {
      sonnerToast.error(e instanceof Error ? e.message : "加载策略失败");
    }
  }, [actor]);

  React.useEffect(() => {
    if (!hydrated) return;
    void loadPolicy();
  }, [hydrated, loadPolicy]);

  const onTogglePolicy = async (checked: boolean) => {
    setPolicyBusy(true);
    try {
      const p = await putMediaReviewPolicy(actor, checked);
      setPolicy({ teacherUploadRequireReview: p.teacherUploadRequireReview });
      sonnerToast.success(checked ? "已设置为需审核后发布" : "已允许免审发布");
    } catch (e) {
      sonnerToast.error(e instanceof Error ? e.message : "更新失败");
    } finally {
      setPolicyBusy(false);
    }
  };

  return (
    <Card className="border-border shadow-none">
      <CardContent className="space-y-4 p-4">
        {props.omitIntro ? null : (
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-foreground">资源审核与版本</h2>
            <p className="text-sm text-muted-foreground">
              与媒体资源中台联调：提交审核、从已发布素材创建修订草稿、将业务引用升级到新版本登记。
            </p>
          </div>
        )}

        {policy ? (
          <div className="flex flex-col gap-2 rounded-md border border-border p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <div className="text-sm font-medium text-foreground">组织审核策略</div>
              <div className="text-xs text-muted-foreground">
                当前：{policy.teacherUploadRequireReview ? "教师上传需经审核后发布" : "教师上传可免审发布"}
              </div>
            </div>
            {canManagePolicy ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">教师上传需审核</span>
                <Switch
                  checked={policy.teacherUploadRequireReview}
                  disabled={policyBusy}
                  onCheckedChange={(v) => void onTogglePolicy(Boolean(v))}
                />
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="registry-id">登记资源 ID</Label>
            <Input
              id="registry-id"
              value={registryId}
              onChange={(e) => setRegistryId(e.target.value)}
              placeholder="用于提交审核或创建修订"
            />
            <div className="flex flex-wrap gap-2">
              {canSubmit ? (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    if (!registryId.trim()) {
                      sonnerToast.error("请填写登记资源 ID");
                      return;
                    }
                    void submitMediaRegistryReview(actor, registryId.trim())
                      .then(() => {
                        sonnerToast.success("已提交审核或已按策略发布");
                      })
                      .catch((e: unknown) =>
                        sonnerToast.error(e instanceof Error ? e.message : "提交失败"),
                      );
                  }}
                >
                  提交审核
                </Button>
              ) : null}
              {canSubmit ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (!registryId.trim()) {
                      sonnerToast.error("请填写已发布的登记资源 ID");
                      return;
                    }
                    void forkMediaRegistryRevision(actor, registryId.trim())
                      .then(() => {
                        sonnerToast.success("已创建修订草稿（新版本登记）");
                      })
                      .catch((e: unknown) =>
                        sonnerToast.error(e instanceof Error ? e.message : "创建失败"),
                      );
                  }}
                >
                  创建修订草稿
                </Button>
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ref-id">引用 ID</Label>
            <Input
              id="ref-id"
              value={referenceId}
              onChange={(e) => setReferenceId(e.target.value)}
              placeholder="媒体引用表主键 ID"
            />
            <Label htmlFor="target-reg">新版本登记 ID</Label>
            <Input
              id="target-reg"
              value={targetRegistryId}
              onChange={(e) => setTargetRegistryId(e.target.value)}
              placeholder="升级后的登记资源 ID"
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                if (!referenceId.trim() || !targetRegistryId.trim()) {
                  sonnerToast.error("请填写引用 ID 与目标登记 ID");
                  return;
                }
                void upgradeMediaReferenceRegistry(actor, referenceId.trim(), targetRegistryId.trim())
                  .then(() => sonnerToast.success("引用已升级到新版本"))
                  .catch((e: unknown) => sonnerToast.error(e instanceof Error ? e.message : "升级失败"));
              }}
            >
              升级引用到新版本
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
