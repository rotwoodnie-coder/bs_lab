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
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  sonnerToast,
} from "@bs-lab/ui";
import { RefreshCw } from "@bs-lab/ui/icons";

import { DASHBOARD_MAIN_CONTAINER_CLASS } from "@/lib/layout-container-classes";
import { PageHeader } from "@/components/layout/page-header";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { buildMaterialsApiActor } from "@/lib/materials-api-actor";
import { buildApiUrl, buildCoreApiReadHeaders } from "@/lib/core-api-shared";
import type { CoreApiActor } from "@/lib/core-api-shared";
import { UserRole } from "@/types/auth";
import { AccessDenied } from "../_components/access-denied";

interface CacheGroup {
  id: string;
  label: string;
  description: string;
  status: string;
}

function DeleteConfirmDialog({
  open,
  onOpenChange,
  groupLabel,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  groupLabel: string;
  onConfirm: () => void;
}) {
  const [input, setInput] = React.useState("");

  React.useEffect(() => {
    if (!open) setInput("");
  }, [open]);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>确认刷新缓存</AlertDialogTitle>
          <AlertDialogDescription>
            刷新 {groupLabel} 缓存将清空该组所有缓存数据，重新从数据库加载。此操作可能导致短暂性能影响。如需继续，请在下方输入 <code className="rounded bg-muted px-1 py-0.5 text-xs font-mono">DELETE</code> 确认。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Input
          placeholder="输入 DELETE 确认"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="text-sm"
        />
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction
            disabled={input !== "DELETE"}
            className="gap-1.5 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={onConfirm}
          >
            确认执行
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default function CacheManagementPage() {
  const auth = useAuth();
  const [flushing, setFlushing] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [cacheGroups, setCacheGroups] = React.useState<CacheGroup[]>([]);
  const [confirmGroup, setConfirmGroup] = React.useState<CacheGroup | null>(null);

  const actor = React.useMemo<CoreApiActor>(() => {
    return buildMaterialsApiActor(auth.user.role as UserRole, auth.user.orgId, "admin-dict") as unknown as CoreApiActor;
  }, [auth.user.orgId, auth.user.role]);

  const loadCacheGroups = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(buildApiUrl("/v2/ops/cache"), {
        method: "GET",
        headers: buildCoreApiReadHeaders(actor),
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok || json.success === false) {
        throw new Error(json.error?.message ?? "加载缓存组失败");
      }
      setCacheGroups(json.data.groups ?? []);
    } catch (e) {
      sonnerToast.error(e instanceof Error ? e.message : "加载缓存组异常");
    } finally {
      setLoading(false);
    }
  }, [actor]);

  React.useEffect(() => {
    void loadCacheGroups();
  }, [loadCacheGroups]);

  if (auth.user.role !== UserRole.SUPER_ADMIN) {
    return <AccessDenied />;
  }

  const handleFlush = async (id: string) => {
    setFlushing(id);
    try {
      const res = await fetch(buildApiUrl("/v2/ops/cache"), {
        method: "POST",
        headers: { ...buildCoreApiReadHeaders(actor), "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ groupId: id }),
      });
      const json = await res.json();
      if (!res.ok || json.success === false) {
        throw new Error(json.error?.message ?? "刷新缓存失败");
      }
      const group = cacheGroups.find((g) => g.id === id);
      sonnerToast.success(`${group?.label ?? id}缓存已刷新`);
    } catch (e) {
      sonnerToast.error(e instanceof Error ? e.message : "刷新缓存异常");
    } finally {
      setFlushing(null);
    }
  };

  const groups = loading
    ? [
        { id: "dict", label: "字典缓存", description: "刷新所有 data_* 字典缓存" },
        { id: "org", label: "组织树缓存", description: "刷新 sys_org 组织架构缓存" },
        { id: "media", label: "媒体缓存", description: "刷新文件/媒体元数据缓存" },
      ] as CacheGroup[]
    : cacheGroups;

  return (
    <div className={cn(DASHBOARD_MAIN_CONTAINER_CLASS, "flex flex-col gap-6")}>
      <PageHeader
        title="缓存管理"
        description="手动刷新缓存。非紧急情况无需操作，系统会自动维护缓存一致性。"
      />
      <div className="grid gap-4 md:grid-cols-3">
        {groups.map((group) => (
          <Card key={group.id} className="border-border shadow-none">
            <CardHeader>
              <CardTitle className="text-base">{group.label}</CardTitle>
              <CardDescription>{group.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                size="sm"
                variant="destructive"
                className="gap-1.5 rounded-lg"
                disabled={flushing === group.id}
                onClick={() => setConfirmGroup(group)}
              >
                <RefreshCw className={`size-3.5 ${flushing === group.id ? "animate-spin" : ""}`} />
                {flushing === group.id ? "刷新中…" : "刷新缓存"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <DeleteConfirmDialog
        open={Boolean(confirmGroup)}
        onOpenChange={(v) => { if (!v) setConfirmGroup(null); }}
        groupLabel={confirmGroup?.label ?? ""}
        onConfirm={() => {
          const id = confirmGroup?.id;
          setConfirmGroup(null);
          if (id) handleFlush(id);
        }}
      />
    </div>
  );
}
