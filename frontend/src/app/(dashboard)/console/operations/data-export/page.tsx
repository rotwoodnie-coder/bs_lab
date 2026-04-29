"use client";

import * as React from "react";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Checkbox, sonnerToast } from "@bs-lab/ui";
import { Database, FileText, Layers } from "@bs-lab/ui/icons";

import { DASHBOARD_MAIN_CONTAINER_CLASS } from "@/lib/layout-container-classes";
import { PageHeader } from "@/components/layout/page-header";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { buildMaterialsApiActor } from "@/lib/materials-api-actor";
import { buildApiUrl, buildCoreApiReadHeaders } from "@/lib/core-api-shared";
import type { CoreApiActor } from "@/lib/core-api-shared";
import { UserRole } from "@/types/auth";
import { AccessDenied } from "../_components/access-denied";

const EXPORT_TABLES = [
  { tableName: "data_material_type", label: "材料分类" },
  { tableName: "data_role", label: "角色" },
  { tableName: "data_school_level", label: "学段" },
  { tableName: "data_school_grade", label: "年级" },
  { tableName: "data_school_subject", label: "学科" },
] as const;

export default function DataExportPage() {
  const auth = useAuth();
  const actor = React.useMemo<CoreApiActor>(() => {
    return buildMaterialsApiActor(auth.user.role as UserRole, auth.user.orgId, "admin-dict") as unknown as CoreApiActor;
  }, [auth.user.orgId, auth.user.role]);
  const [busyTables, setBusyTables] = React.useState<Set<string>>(new Set());
  const [selectedTables, setSelectedTables] = React.useState<Set<string>>(new Set());

  if (auth.user.role !== UserRole.SUPER_ADMIN) {
    return <AccessDenied />;
  }

  const allSelected = selectedTables.size === EXPORT_TABLES.length;
  const hasSelection = selectedTables.size > 0;
  const isBusy = busyTables.size > 0;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedTables(new Set());
    } else {
      setSelectedTables(new Set(EXPORT_TABLES.map((t) => t.tableName)));
    }
  };

  const toggleTable = (tableName: string) => {
    const next = new Set(selectedTables);
    if (next.has(tableName)) {
      next.delete(tableName);
    } else {
      next.add(tableName);
    }
    setSelectedTables(next);
  };

  const handleExportSingle = async (tableName: string) => {
    setBusyTables((prev) => new Set(prev).add(tableName));
    try {
      const res = await fetch(buildApiUrl("/v2/ops/data-export"), {
        method: "POST",
        headers: { ...buildCoreApiReadHeaders(actor), "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ tableName, format: "json" }),
      });
      const json = await res.json();
      if (!res.ok || json.success === false) {
        throw new Error(json.error?.message ?? "导出请求失败");
      }
      const data = json.data;
      const blob = new Blob([JSON.stringify(data.rows, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${tableName}_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      sonnerToast.success(`"${EXPORT_TABLES.find((t) => t.tableName === tableName)?.label ?? tableName}" 导出完成，共 ${data.recordCount} 条记录`);
    } catch (e) {
      sonnerToast.error(e instanceof Error ? e.message : `导出异常（${tableName}）`);
    } finally {
      setBusyTables((prev) => {
        const next = new Set(prev);
        next.delete(tableName);
        return next;
      });
    }
  };

  const handleBatchExport = async () => {
    if (!hasSelection) return;
    const tables = EXPORT_TABLES.filter((t) => selectedTables.has(t.tableName));
    const results: Record<string, unknown> = {};
    let successCount = 0;
    let failCount = 0;

    setBusyTables(new Set(tables.map((t) => t.tableName)));

    for (const t of tables) {
      try {
        const res = await fetch(buildApiUrl("/v2/ops/data-export"), {
          method: "POST",
          headers: { ...buildCoreApiReadHeaders(actor), "content-type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ tableName: t.tableName, format: "json" }),
        });
        const json = await res.json();
        if (!res.ok || json.success === false) {
          throw new Error(json.error?.message ?? "导出失败");
        }
        results[t.tableName] = { label: t.label, rows: json.data.rows, recordCount: json.data.recordCount };
        successCount++;
      } catch (e) {
        results[t.tableName] = { label: t.label, error: e instanceof Error ? e.message : "未知错误" };
        failCount++;
      }
    }

    setBusyTables(new Set());

    const combined = {
      exportTime: new Date().toISOString(),
      totalTables: tables.length,
      successCount,
      failCount,
      data: results,
    };

    const blob = new Blob([JSON.stringify(combined, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `batch_export_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);

    if (failCount === 0) {
      sonnerToast.success(`批量导出完成，共 ${successCount} 张表`);
    } else {
      sonnerToast.warning(`批量导出完成：${successCount} 张成功，${failCount} 张失败`);
    }
  };

  return (
    <div className={cn(DASHBOARD_MAIN_CONTAINER_CLASS, "flex flex-col gap-6")}>
      <PageHeader
        title="数据导出"
        description="导出字典快照、配置清单等运维数据，用于审计与备份。"
      />
      <div className="flex items-center gap-3">
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <Checkbox checked={allSelected} onCheckedChange={toggleSelectAll} />
          全选 / 取消全选
        </label>
        <span className="text-xs text-muted-foreground">已选 {selectedTables.size} 张表</span>
        {hasSelection ? (
          <Button
            size="sm"
            className="gap-1.5 rounded-lg bg-foreground text-background hover:bg-foreground/90"
            disabled={isBusy}
            onClick={handleBatchExport}
          >
            <Layers className="size-3.5" />
            {isBusy ? "批量导出中…" : "批量导出"}
          </Button>
        ) : null}
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {EXPORT_TABLES.map((t) => (
          <Card key={t.tableName} className={cn("border-border shadow-none", selectedTables.has(t.tableName) && "ring-1 ring-primary/40")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Checkbox
                  checked={selectedTables.has(t.tableName)}
                  onCheckedChange={() => toggleTable(t.tableName)}
                />
                <Database className="size-4" />
                {t.label}数据
              </CardTitle>
              <CardDescription>导出 {t.label} 配置数据为 JSON 文件。</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                size="sm"
                className="gap-1.5 rounded-lg bg-foreground text-background hover:bg-foreground/90"
                disabled={busyTables.has(t.tableName)}
                onClick={() => handleExportSingle(t.tableName)}
              >
                <FileText className="size-3.5" />
                {busyTables.has(t.tableName) ? "导出中…" : "导出"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
