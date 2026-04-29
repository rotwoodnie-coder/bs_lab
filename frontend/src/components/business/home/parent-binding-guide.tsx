"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@bs-lab/ui";
import { FlaskConical, Link, Users2 } from "@bs-lab/ui/icons";

import { useAuth } from "@/hooks/use-auth";
import { buildMaterialsApiActor } from "@/lib/materials-api-actor";
import { fetchMyBindings, type MyBindingRow } from "@/lib/v2/v2-parent-binding-api";
import type { CoreApiActor } from "@/lib/core-api-shared";
import { UserRole } from "@/types/auth";

type BindStatus = "loading" | "unbound" | "pending" | "bound";

export function ParentBindingGuard({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const isParent = auth.user.role === UserRole.PARENT;
  const router = useRouter();

  const actor = React.useMemo<CoreApiActor | null>(() => {
    if (auth.loading || !isParent) return null;
    return buildMaterialsApiActor(auth.user.role as UserRole, auth.user.orgId, "admin-dict") as unknown as CoreApiActor;
  }, [auth.loading, auth.user.orgId, auth.user.role, isParent]);

  const [status, setStatus] = React.useState<BindStatus>("loading");
  const [bindings, setBindings] = React.useState<MyBindingRow[]>([]);

  React.useEffect(() => {
    if (!actor) return;
    fetchMyBindings(actor)
      .then((rows) => {
        setBindings(rows);
        const approved = rows.filter((r) => r.auditStatus === "Y");
        const pendingRows = rows.filter((r) => r.auditStatus !== "Y");
        if (approved.length > 0) {
          setStatus("bound");
        } else if (pendingRows.length > 0) {
          setStatus("pending");
        } else {
          setStatus("unbound");
        }
      })
      .catch(() => setStatus("unbound"));
  }, [actor]);

  // 不是家长角色，直接渲染子节点
  if (!isParent) return <>{children}</>;

  if (status === "loading") {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-sm text-muted-foreground">正在加载绑定信息…</p>
      </div>
    );
  }

  if (status === "bound") return <>{children}</>;

  return <ParentBindGuide status={status} bindings={bindings} onGoBind={() => router.push("/parent/tasks")} />;
}

function ParentBindGuide({
  status,
  bindings,
  onGoBind,
}: {
  status: "unbound" | "pending";
  bindings: MyBindingRow[];
  onGoBind: () => void;
}) {
  if (status === "unbound") {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-8 py-16 text-center">
        <div className="flex size-20 items-center justify-center rounded-full bg-teal-50 dark:bg-teal-950/20">
          <Users2 className="size-10 text-teal-600 dark:text-teal-400" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">绑定孩子</h2>
          <p className="text-sm text-muted-foreground">
            绑定您的孩子后，您可以查看实验任务、家庭实验室和成长进度。
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <Card className="w-full border-border shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Link className="size-4 text-teal-600" />
                如何绑定？
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>1. 在「任务中心」中，点击「绑定孩子」</p>
              <p>2. 选择孩子所在的学校和班级</p>
              <p>3. 填写孩子姓名，系统将验证学生身份</p>
              <p>4. 提交申请后，等待学校管理员审核</p>
            </CardContent>
          </Card>
          <Card className="w-full border-border shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <FlaskConical className="size-4 text-teal-600" />
                绑定后可以做什么？
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm text-muted-foreground">
              <p>查看孩子的实验任务和完成情况</p>
              <p>在家庭实验室中与孩子一起做实验</p>
              <p>追踪孩子的成长足迹和学习进度</p>
            </CardContent>
          </Card>
        </div>
        <Button
          size="sm"
          className="gap-1.5 rounded-lg bg-foreground text-background hover:bg-foreground/90"
          onClick={onGoBind}
        >
          <Link className="size-3.5" />
          前往绑定
        </Button>
      </div>
    );
  }

  // pending 状态
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-6 py-16 text-center">
      <div className="flex size-20 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950/20">
        <Link className="size-10 text-amber-600 dark:text-amber-400" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">绑定申请已提交</h2>
        <p className="text-sm text-muted-foreground">
          您已提交了 {bindings.length} 个绑定申请，等待学校管理员审核。
        </p>
      </div>
      <Card className="w-full max-w-sm border-border shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">申请列表</CardTitle>
          <CardDescription className="text-xs">审核通过后即可使用完整功能</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {bindings.map((b) => {
            const schoolName = b.schoolOrgName ?? b.schoolOrgId ?? "未知学校";
            const statusLabel = b.auditStatus === "T" ? "待审核" : "已拒绝";
            return (
              <div key={b.seqId} className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2 text-sm">
                <span className="truncate text-muted-foreground">{schoolName}</span>
                <span className={b.auditStatus === "T" ? "text-amber-600" : "text-red-500"}>
                  {statusLabel}
                </span>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
