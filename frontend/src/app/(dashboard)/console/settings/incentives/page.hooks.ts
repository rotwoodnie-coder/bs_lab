"use client";

import * as React from "react";
import { sonnerToast } from "@bs-lab/ui";

import { authRoleToUserRole, useAuth } from "@/hooks/use-auth";
import type { CoreApiActor } from "@/lib/core-api-shared";
import { fetchV2Roles, type V2DictItem } from "@/lib/v2/v2-exp-api";
import {
  createV2ScaleTitle,
  deleteV2ScaleTitle,
  fetchV2ScaleLogAdminPage,
  fetchV2ScaleTitles,
  patchV2ScaleTitle,
  type CreateV2ScaleTitleBody,
  type PatchV2ScaleTitleBody,
  type V2ScaleLogItem,
  type V2ScaleTitleItem,
} from "@/lib/v2/v2-scale-api";

export function useIncentivesConsole() {
  const { user, loading: authLoading, error: authError } = useAuth();
  const role = authRoleToUserRole(user.role);
  const actor = React.useMemo<CoreApiActor>(
    () => ({
      role,
      orgId: user.orgId,
      userId: user.userId,
      userName: user.userName,
      tenantId: user.tenantId,
      appId: user.appId,
    }),
    [role, user.orgId, user.userId, user.userName, user.tenantId, user.appId],
  );

  const [roleOptions, setRoleOptions] = React.useState<V2DictItem[]>([]);
  const [titleRoleFilter, setTitleRoleFilter] = React.useState<string>("");
  const [titles, setTitles] = React.useState<V2ScaleTitleItem[]>([]);
  const [titlesLoading, setTitlesLoading] = React.useState(false);

  const roleNameById = React.useCallback(
    (id: string) => roleOptions.find((r) => r.id === id)?.name ?? id,
    [roleOptions],
  );

  const loadRoles = React.useCallback(async () => {
    try {
      const rows = await fetchV2Roles(actor);
      setRoleOptions(rows);
    } catch (e) {
      sonnerToast.error(e instanceof Error ? e.message : "加载角色字典失败");
    }
  }, [actor]);

  const loadTitles = React.useCallback(async () => {
    setTitlesLoading(true);
    try {
      const rid = titleRoleFilter.trim() || undefined;
      const rows = await fetchV2ScaleTitles(actor, rid);
      setTitles(rows);
    } catch (e) {
      sonnerToast.error(e instanceof Error ? e.message : "加载称号规则失败");
      setTitles([]);
    } finally {
      setTitlesLoading(false);
    }
  }, [actor, titleRoleFilter]);

  React.useEffect(() => {
    if (authLoading || !user.userId.trim()) return;
    void loadRoles();
  }, [authLoading, user.userId, loadRoles]);

  React.useEffect(() => {
    if (authLoading || !user.userId.trim()) return;
    void loadTitles();
  }, [authLoading, user.userId, loadTitles]);

  const [logPageIndex, setLogPageIndex] = React.useState(0);
  const [logPageSize, setLogPageSize] = React.useState(20);
  const [logDraftUserId, setLogDraftUserId] = React.useState("");
  const [logDraftSource, setLogDraftSource] = React.useState("");
  const [logAppliedUserId, setLogAppliedUserId] = React.useState("");
  const [logAppliedSource, setLogAppliedSource] = React.useState("");
  const [logQueryNonce, setLogQueryNonce] = React.useState(0);
  const [logItems, setLogItems] = React.useState<V2ScaleLogItem[]>([]);
  const [logTotal, setLogTotal] = React.useState(0);
  const [logLoading, setLogLoading] = React.useState(false);

  const loadLogs = React.useCallback(async () => {
    setLogLoading(true);
    try {
      const res = await fetchV2ScaleLogAdminPage(actor, {
        page: logPageIndex + 1,
        page_size: logPageSize,
        user_id: logAppliedUserId.trim() || undefined,
        scale_source: logAppliedSource.trim() || undefined,
      });
      setLogItems(res.items);
      setLogTotal(res.total);
    } catch (e) {
      sonnerToast.error(e instanceof Error ? e.message : "加载积分流水失败");
      setLogItems([]);
      setLogTotal(0);
    } finally {
      setLogLoading(false);
    }
  }, [actor, logPageIndex, logPageSize, logAppliedUserId, logAppliedSource, logQueryNonce]);

  React.useEffect(() => {
    if (authLoading || !user.userId.trim()) return;
    void loadLogs();
  }, [authLoading, user.userId, loadLogs]);

  const applyLogFilters = React.useCallback(() => {
    setLogAppliedUserId(logDraftUserId);
    setLogAppliedSource(logDraftSource);
    setLogPageIndex(0);
    setLogQueryNonce((n) => n + 1);
  }, [logDraftUserId, logDraftSource]);

  const saveCreateTitle = React.useCallback(
    async (body: CreateV2ScaleTitleBody) => {
      await createV2ScaleTitle(actor, body);
      sonnerToast.success("已新增称号规则");
      await loadTitles();
    },
    [actor, loadTitles],
  );

  const savePatchTitle = React.useCallback(
    async (seqId: string, body: PatchV2ScaleTitleBody) => {
      await patchV2ScaleTitle(actor, seqId, body);
      sonnerToast.success("已保存修改");
      await loadTitles();
    },
    [actor, loadTitles],
  );

  const removeTitle = React.useCallback(
    async (seqId: string) => {
      await deleteV2ScaleTitle(actor, seqId);
      sonnerToast.success("已删除");
      await loadTitles();
    },
    [actor, loadTitles],
  );

  return {
    authLoading,
    authError,
    actor,
    roleOptions,
    roleNameById,
    titleRoleFilter,
    setTitleRoleFilter,
    titles,
    titlesLoading,
    loadTitles,
    saveCreateTitle,
    savePatchTitle,
    removeTitle,
    logItems,
    logTotal,
    logLoading,
    logPageIndex,
    setLogPageIndex,
    logPageSize,
    setLogPageSize,
    logDraftUserId,
    setLogDraftUserId,
    logDraftSource,
    setLogDraftSource,
    applyLogFilters,
    loadLogs,
  };
}

export type IncentivesConsole = ReturnType<typeof useIncentivesConsole>;
