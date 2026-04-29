"use client";

import * as React from "react";
import { sonnerToast } from "@bs-lab/ui";

import { authRoleToUserRole, useAuth } from "@/hooks/use-auth";
import type { CoreApiActor } from "@/lib/core-api-shared";
import {
  createV2OrgType,
  deleteV2OrgType,
  fetchV2OrgTypesAdmin,
  patchV2OrgType,
  type CreateV2OrgTypeInput,
  type PatchV2OrgTypeInput,
  type V2OrgTypeItem,
} from "@/lib/v2/v2-org-type-api";
import { UserRole } from "@/types/auth";

export function useOrgTypesTab() {
  const { user } = useAuth();
  const role = authRoleToUserRole(user.role);
  const actor = React.useMemo<CoreApiActor>(
    () => ({ role, orgId: user.orgId, userId: user.userId, userName: user.userName }),
    [role, user.orgId, user.userId, user.userName],
  );

  const canMutate = role === UserRole.SUPER_ADMIN || role === UserRole.DISTRICT_ADMIN;

  const [rows, setRows] = React.useState<V2OrgTypeItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchV2OrgTypesAdmin(actor, true);
      setRows(data);
    } catch (e: unknown) {
      sonnerToast.error("组织类型加载失败", { description: e instanceof Error ? e.message : "未知错误" });
    } finally {
      setLoading(false);
    }
  }, [actor]);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleCreate = React.useCallback(
    async (input: CreateV2OrgTypeInput) => {
      setSubmitting(true);
      try {
        await createV2OrgType(actor, input);
        sonnerToast.success("组织类型已创建");
        await refresh();
      } catch (e: unknown) {
        sonnerToast.error("创建失败", { description: e instanceof Error ? e.message : "未知错误" });
        throw e;
      } finally {
        setSubmitting(false);
      }
    },
    [actor, refresh],
  );

  const handlePatch = React.useCallback(
    async (typeId: string, input: PatchV2OrgTypeInput) => {
      setSubmitting(true);
      try {
        await patchV2OrgType(actor, typeId, input);
        sonnerToast.success("组织类型已保存");
        await refresh();
      } catch (e: unknown) {
        sonnerToast.error("保存失败", { description: e instanceof Error ? e.message : "未知错误" });
        throw e;
      } finally {
        setSubmitting(false);
      }
    },
    [actor, refresh],
  );

  const handleDelete = React.useCallback(
    async (typeId: string) => {
      setSubmitting(true);
      try {
        await deleteV2OrgType(actor, typeId);
        sonnerToast.success("组织类型已删除");
        await refresh();
      } catch (e: unknown) {
        sonnerToast.error("删除失败", { description: e instanceof Error ? e.message : "未知错误" });
        throw e;
      } finally {
        setSubmitting(false);
      }
    },
    [actor, refresh],
  );

  return {
    rows,
    loading,
    submitting,
    canMutate,
    refreshTypes: refresh,
    handleCreate,
    handlePatch,
    handleDelete,
  };
}
