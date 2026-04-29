"use client";

import * as React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  sonnerToast,
} from "@bs-lab/ui";
import { CheckCircle2, RefreshCw, ShieldCheck, XCircle } from "@bs-lab/ui/icons";

import { DASHBOARD_MAIN_CONTAINER_CLASS } from "@/lib/layout-container-classes";
import { PageHeader } from "@/components/layout/page-header";
import { useAuth } from "@/hooks/use-auth";
import { buildMaterialsApiActor } from "@/lib/materials-api-actor";
import { buildApiUrl, buildCoreApiReadHeaders } from "@/lib/core-api-shared";
import type { CoreApiActor } from "@/lib/core-api-shared";
import { UserRole } from "@/types/auth";
import { cn } from "@/lib/utils";
import { AccessDenied } from "../_components/access-denied";

interface CheckResult {
  label: string;
  status: "pass" | "fail";
  message: string;
  detail?: string[];
}

export default function ConsistencyCheckPage() {
  const auth = useAuth();
  const actor = React.useMemo<CoreApiActor>(() => {
    return buildMaterialsApiActor(auth.user.role as UserRole, auth.user.orgId, "admin-dict") as unknown as CoreApiActor;
  }, [auth.user.orgId, auth.user.role]);

  // Hooks must be called before the early return for role check (React rules of hooks)
  const [results, setResults] = React.useState<CheckResult[]>([]);
  const [running, setRunning] = React.useState(false);
  const [checkedAt, setCheckedAt] = React.useState<string | null>(null);

  if (auth.user.role !== UserRole.SUPER_ADMIN) {
    return <AccessDenied />;
  }

  const runAll = async () => {
    setRunning(true);
    setResults([]);
    try {
      const res = await fetch(buildApiUrl("/v2/ops/consistency"), {
        method: "GET",
        headers: buildCoreApiReadHeaders(actor),
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok || json.success === false) {
        throw new Error(json.error?.message ?? "检查请求失败");
      }
      setResults(json.data.checks ?? []);
      setCheckedAt(json.data.timestamp ?? new Date().toISOString());
      const failCount = (json.data.checks ?? []).filter((c: CheckResult) => c.status === "fail").length;
      if (failCount === 0) {
        sonnerToast.success("所有检查项通过");
      } else {
        sonnerToast.warning(`发现 ${failCount} 项异常`);
      }
    } catch (e) {
      sonnerToast.error(e instanceof Error ? e.message : "检查执行异常");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className={cn(DASHBOARD_MAIN_CONTAINER_CLASS, "flex flex-col gap-6")}>
      <PageHeader
        title="数据一致性检查"
        description="扫描字典表、组织树、用户角色之间的参照完整性，发现数据异常。仅超级管理员可操作。"
      />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <p className="text-sm text-muted-foreground">
            {results.length > 0 ? `共 ${results.length} 项检查` : "点击按钮开始检查"}
          </p>
          {checkedAt ? (
            <span className="text-xs text-muted-foreground">
              上次检查：{new Date(checkedAt).toLocaleString("zh-CN")}
            </span>
          ) : null}
        </div>
        <Button
          size="sm"
          className="gap-1.5 rounded-lg bg-foreground text-background hover:bg-foreground/90"
          disabled={running}
          onClick={runAll}
        >
          <ShieldCheck className="size-3.5" />
          {running ? "检查中…" : "运行全部检查"}
        </Button>
      </div>
      <div className="space-y-3">
        {running ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="size-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">正在扫描数据一致性…</span>
          </div>
        ) : results.length === 0 ? (
          <Card className="border-dashed border-border shadow-none">
            <CardContent className="flex flex-col items-center gap-3 py-12">
              <ShieldCheck className="size-12 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">点击"运行全部检查"开始扫描</p>
            </CardContent>
          </Card>
        ) : (
          results.map((check) => (
            <Card key={check.label} className="border-border shadow-none">
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div className="space-y-1">
                  <CardTitle className="text-sm font-medium">{check.label}</CardTitle>
                  <CardDescription className="text-xs">{check.message}</CardDescription>
                  {check.detail && check.detail.length > 0 ? (
                    <ul className="mt-2 space-y-1">
                      {check.detail.map((d, i) => (
                        <li key={i} className="text-xs text-destructive">{d}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
                <Badge variant={check.status === "pass" ? "default" : "destructive"} className="shrink-0">
                  {check.status === "pass" ? (
                    <CheckCircle2 className="mr-1 size-3" />
                  ) : (
                    <XCircle className="mr-1 size-3" />
                  )}
                  {check.status === "pass" ? "通过" : "异常"}
                </Badge>
              </CardHeader>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
