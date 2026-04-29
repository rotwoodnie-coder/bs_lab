import * as React from "react";

import { sonnerToast } from "@bs-lab/ui";

import { batchSetConsoleUserStatus, fetchConsoleUsersList } from "@/lib/console/users/console-users.adapter";
import type { RoleId, UserRecord } from "@/lib/console/users/types";

import {
  SEARCH_DEBOUNCE_MS,
  type UserManagementCohort,
  type UserManagementStatus,
  useDebouncedValue,
} from "./user-management.constants";

export function useUserList(options: { orgFilterId: string | null }) {
  const fileRef = React.useRef<HTMLInputElement>(null);

  const [q, setQ] = React.useState("");
  const debouncedSearch = useDebouncedValue(q.trim(), SEARCH_DEBOUNCE_MS);
  const [roleFilter, setRoleFilter] = React.useState<RoleId | "all">("all");

  const [users, setUsers] = React.useState<UserRecord[]>([]);
  const [listLoading, setListLoading] = React.useState(true);
  const [listError, setListError] = React.useState<string | null>(null);
  const listRequestIdRef = React.useRef(0);

  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(
    () => new Set(),
  );

  React.useEffect(() => {
    setSelectedIds(new Set());
  }, [debouncedSearch, roleFilter, options.orgFilterId]);

  const listParams = React.useMemo(
    () => ({
      search: debouncedSearch,
      roleId: roleFilter,
      userOrgId: options.orgFilterId?.trim() || undefined,
    }),
    [debouncedSearch, roleFilter, options.orgFilterId],
  );

  const loadList = React.useCallback(async () => {
    const reqId = ++listRequestIdRef.current;
    setListLoading(true);
    setListError(null);

    try {
      const { items } = await fetchConsoleUsersList(listParams);
      if (reqId !== listRequestIdRef.current) return;
      setUsers(items);
    } catch {
      if (reqId !== listRequestIdRef.current) return;
      setListError("用户列表加载失败，请检查网络后重试。");
      sonnerToast.error("列表加载失败");
    } finally {
      if (reqId === listRequestIdRef.current) setListLoading(false);
    }
  }, [listParams]);

  React.useEffect(() => {
    void loadList();
  }, [loadList]);

  const toggleRowSelected = React.useCallback((id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const toggleSelectAllVisible = React.useCallback(
    (checked: boolean) => {
      if (!checked) {
        setSelectedIds(new Set());
        return;
      }
      setSelectedIds(new Set(users.map((u) => u.id)));
    },
    [users],
  );

  const selectedCount = selectedIds.size;
  const allVisibleSelected = users.length > 0 && users.every((u) => selectedIds.has(u.id));
  const someVisibleSelected = users.some((u) => selectedIds.has(u.id));
  const headerCheckboxState: boolean | "indeterminate" = allVisibleSelected
    ? true
    : someVisibleSelected
      ? "indeterminate"
      : false;

  const onBatchStatus = React.useCallback(
    async (status: UserManagementStatus) => {
      const ids = [...selectedIds];
      if (ids.length === 0) return;

      try {
        const n = await batchSetConsoleUserStatus(ids, status);
        sonnerToast.success(status === "冻结" ? "批量冻结完成" : "批量解冻完成", {
          description: `影响 ${n} 个账号`,
        });
        setSelectedIds(new Set());
        void loadList();
      } catch {
        sonnerToast.error("批量操作失败");
      }
    },
    [loadList, selectedIds],
  );

  const onExport = React.useCallback(async (cohort: UserManagementCohort | "all") => {
    try {
      const res = await fetch(`/api/console/users/export?cohort=${cohort}`);
      if (!res.ok) throw new Error(String(res.status));

      const blob = await res.blob();
      const dispo = res.headers.get("Content-Disposition");
      const match = /filename="([^"]+)"/.exec(dispo ?? "");
      const name = match?.[1] ?? `users-${cohort}.json`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      a.click();
      URL.revokeObjectURL(url);

      sonnerToast.success("导出成功", { description: "已下载 JSON，可对接第三方系统。" });
    } catch {
      sonnerToast.error("导出失败");
    }
  }, []);

  const onExportSelectedJson = React.useCallback(() => {
    const rows = users.filter((u) => selectedIds.has(u.id));
    if (rows.length === 0) return;

    const blob = new Blob(
      [JSON.stringify({ users: rows, exportedAt: new Date().toISOString() }, null, 2)],
      { type: "application/json" },
    );

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users-selected-${rows.length}.json`;
    a.click();
    URL.revokeObjectURL(url);

    sonnerToast.success("已导出所选用户", { description: `${rows.length} 条 JSON` });
  }, [selectedIds, users]);

  const onPickImport = React.useCallback(() => {
    fileRef.current?.click();
  }, []);

  const onImportFile = React.useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file) return;

      try {
        const text = await file.text();
        const json = JSON.parse(text) as { users?: unknown[]; cohort?: string };

        const res = await fetch("/api/console/users/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(json),
        });

        const data = (await res.json()) as {
          ok?: boolean;
          message?: string;
          accepted?: number;
        };

        if (!res.ok || !data.ok) {
          sonnerToast.error("导入被拒绝", {
            description: data.message ?? `HTTP ${res.status}`,
          });
          return;
        }

        sonnerToast.success("第三方导入已受理", {
          description: `共 ${data.accepted ?? 0} 条记录进入校验队列（）。`,
        });

        void loadList();
      } catch {
        sonnerToast.error("导入失败", { description: "请确认文件为 UTF-8 JSON。" });
      }
    },
    [loadList],
  );

  const tableBusy = listLoading && users.length === 0;

  return {
    fileRef,
    q,
    setQ,
    roleFilter,
    setRoleFilter,
    users,
    listLoading,
    listError,
    loadList,
    selectedIds,
    setSelectedIds,
    selectedCount,
    headerCheckboxState,
    toggleRowSelected,
    toggleSelectAllVisible,
    onBatchStatus,
    onExport,
    onExportSelectedJson,
    onPickImport,
    onImportFile,
    tableBusy,
  };
}

