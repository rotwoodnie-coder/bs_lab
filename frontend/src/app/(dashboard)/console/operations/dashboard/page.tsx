"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@bs-lab/ui";
import { Database, Monitor, RefreshCw, ShieldCheck } from "@bs-lab/ui/icons";

import { DASHBOARD_MAIN_CONTAINER_CLASS } from "@/lib/layout-container-classes";
import { PageHeader } from "@/components/layout/page-header";
import { withPermission } from "@/lib/permissions/with-permission";
import { cn } from "@/lib/utils";

const OPS_ITEMS = [
  { id: "dict-sync", label: "业务字典同步", description: "备份/恢复业务字典配置，按版本管理字典快照", href: "/console/operations/dict-sync", Icon: RefreshCw },
  { id: "data-export", label: "数据导出", description: "导出字典快照、配置清单等运维数据", href: "/console/operations/data-export", Icon: Database },
  { id: "cache-mgmt", label: "缓存管理", description: "刷新 Redis 缓存、重置缓存键", href: "/console/operations/cache-mgmt", Icon: Monitor },
  { id: "consistency", label: "数据一致性检查", description: "扫描参照完整性、字典与表数据差异", href: "/console/operations/consistency", Icon: ShieldCheck },
] as const;

function OpsDashboardPage() {
  return (
    <div className={cn(DASHBOARD_MAIN_CONTAINER_CLASS, "flex flex-col gap-6 py-4")}>
      <PageHeader
        title="运维概览"
        description="系统运维与管理工具集，仅超级管理员可见。"
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {OPS_ITEMS.map((item) => (
          <Card key={item.id} className="border-border shadow-none transition-shadow hover:shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                  <item.Icon className="size-5 text-foreground" />
                </div>
                <div>
                  <CardTitle className="text-base">{item.label}</CardTitle>
                  <CardDescription className="text-xs">{item.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default withPermission(OpsDashboardPage, "/console/operations/dashboard");