"use client";

import * as React from "react";
import { sonnerToast } from "@bs-lab/ui";

import { useAuth } from "@/hooks/use-auth";
import type { CoreApiActor } from "@/lib/core-api-shared";
import {
  createSubjectGroup,
  fetchSubjectGroups,
  patchSubjectGroup,
} from "@/lib/v2/v2-group-api";
import type { V2SysOrgItem } from "@/lib/v2/v2-sys-api";

export type ResearchGroupOrgFilter = "all" | "y" | "n";

/** 与 Researcher 教研组 hooks 对齐；后端使用 `subject_group` 表 + `/api/group` 路由。 */
export function useTeacherResearchProjectGroups() {
  const { user } = useAuth();
  const actor = React.useMemo<CoreApiActor>(
    () => ({ role: "", orgId: user.orgId, userId: user.userId, userName: user.userName }),
    [user.orgId, user.userId, user.userName],
  );

  const [filter, setFilter] = React.useState<ResearchGroupOrgFilter>("all");
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editTarget, setEditTarget] = React.useState<V2SysOrgItem | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [rows, setRows] = React.useState<V2SysOrgItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const list = await fetchSubjectGroups(actor);
      const mapped: V2SysOrgItem[] = list.map((g) => ({
        orgId: g.groupId,
        orgName: g.groupName,
        orgTypeId: null,
        gradeId: null,
        parentOrgId: null,
        orgPath: null,
        status: g.status === "Y" ? "y" : "n",
        sortOrder: null,
        createUserId: g.createUserId,
        createTime: g.createTime,
        updateTime: g.updateTime,
        isDeleted: 0,
      }));
      setRows(mapped);
    } catch (err) {
      sonnerToast.error("加载课题组失败", {
        description: err instanceof Error ? err.message : "请稍后重试",
      });
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [actor]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const handleCreate = React.useCallback(
    async (payload: { groupName: string }) => {
      setSubmitting(true);
      try {
        await createSubjectGroup(actor, { group_name: payload.groupName });
        sonnerToast.success("已创建课题组");
        setCreateOpen(false);
        void load();
      } catch (err) {
        sonnerToast.error("创建失败", {
          description: err instanceof Error ? err.message : "请稍后重试",
        });
      } finally {
        setSubmitting(false);
      }
    },
    [actor, load],
  );

  const handlePatch = React.useCallback(
    async (orgId: string, patch: { orgName?: string; status?: "y" | "n" }) => {
      setSubmitting(true);
      try {
        await patchSubjectGroup(actor, orgId, {
          group_name: patch.orgName,
          status: patch.status === "y" ? "Y" : "N",
        });
        sonnerToast.success("已更新课题组");
        setEditTarget(null);
        void load();
      } catch (err) {
        sonnerToast.error("更新失败", {
          description: err instanceof Error ? err.message : "请稍后重试",
        });
      } finally {
        setSubmitting(false);
      }
    },
    [actor, load],
  );

  const parentOrgName = user.orgId;

  return {
    loading,
    submitting,
    parentOrgName,
    rows: filter === "all" ? rows : rows.filter((r) => (filter === "y" ? (r.status ?? "y") === "y" : (r.status ?? "y") === "n")),
    filter,
    setFilter,
    createOpen,
    setCreateOpen,
    handleCreate,
    editTarget,
    setEditTarget,
    handlePatch,
  };
}
