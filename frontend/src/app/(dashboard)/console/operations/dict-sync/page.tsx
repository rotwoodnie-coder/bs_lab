"use client";

import * as React from "react";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, sonnerToast } from "@bs-lab/ui";
import { Download, RefreshCw, Upload } from "@bs-lab/ui/icons";

import { PageHeader } from "@/components/layout/page-header";
import { useAuth } from "@/hooks/use-auth";
import { buildMaterialsApiActor } from "@/lib/materials-api-actor";
import { buildApiUrl, buildCoreApiReadHeaders } from "@/lib/core-api-shared";
import type { CoreApiActor } from "@/lib/core-api-shared";
import { UserRole } from "@/types/auth";
import { AccessDenied } from "../_components/access-denied";

export default function DictSyncPage() {
  const auth = useAuth();
  const [exporting, setExporting] = React.useState(false);
  const [importing, setImporting] = React.useState(false);
  const [lastSyncInfo, setLastSyncInfo] = React.useState<string | null>(null);
  const actor = React.useMemo<CoreApiActor>(() => {
    return buildMaterialsApiActor(auth.user.role as UserRole, auth.user.orgId, "admin-dict") as unknown as CoreApiActor;
  }, [auth.user.orgId, auth.user.role]);

  if (auth.user.role !== UserRole.SUPER_ADMIN) {
    return <AccessDenied />;
  }

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch(buildApiUrl("/v2/ops/dict-sync"), {
        method: "POST",
        headers: { ...buildCoreApiReadHeaders(actor), "content-type": "application/json" },
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok || json.success === false) {
        throw new Error(json.error?.message ?? "导出请求失败");
      }
      const data = json.data;
      setLastSyncInfo(`共导出 ${data.totalRecords} 条记录（${data.syncedTables} 张表），同步 ID：${data.syncId}`);
      sonnerToast.success(`字典快照已生成，共 ${data.totalRecords} 条记录`);
    } catch (e) {
      sonnerToast.error(e instanceof Error ? e.message : "导出异常");
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async () => {
    setImporting(true);
    try {
      const res = await fetch(buildApiUrl("/v2/ops/dict-sync"), {
        method: "GET",
        headers: buildCoreApiReadHeaders(actor),
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok || json.success === false) {
        throw new Error(json.error?.message ?? "查询失败");
      }
      const data = json.data;
      const passCount = data.tables.filter((t: { recordCount: number }) => t.recordCount >= 0).length;
      const failCount = data.tables.filter((t: { recordCount: number }) => t.recordCount < 0).length;
      setLastSyncInfo(`共 ${data.totalTables} 张字典表，${passCount} 张正常${failCount > 0 ? `，${failCount} 张不可访问` : ""}`);
      sonnerToast.success(`字典状态查询完成，共 ${data.totalTables} 张表`);
    } catch (e) {
      sonnerToast.error(e instanceof Error ? e.message : "查询异常");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="业务字典同步"
        description="备份、恢复和版本管理业务字典配置。仅超级管理员可操作。"
      />
      {lastSyncInfo ? (
        <p className="text-sm text-muted-foreground">上次操作：{lastSyncInfo}</p>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-border shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Download className="size-4" />
              导出字典快照
            </CardTitle>
            <CardDescription>将当前字典数据导出为 JSON 快照，便于回溯和版本管理。</CardDescription>
          </CardHeader>
          <CardContent>
            <Button size="sm" className="gap-1.5 rounded-lg bg-foreground text-background hover:bg-foreground/90" disabled={exporting} onClick={handleExport}>
              <Download className="size-3.5" />
              {exporting ? "导出中…" : "导出"}
            </Button>
          </CardContent>
        </Card>
        <Card className="border-border shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Upload className="size-4" />
              查询字典快照状态
            </CardTitle>
            <CardDescription>查看各字典表的当前状态和记录数。</CardDescription>
          </CardHeader>
          <CardContent>
            <Button size="sm" className="gap-1.5 rounded-lg bg-foreground text-background hover:bg-foreground/90" disabled={importing} onClick={handleImport}>
              <RefreshCw className={`size-3.5 ${importing ? "animate-spin" : ""}`} />
              {importing ? "查询中…" : "查询状态"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
