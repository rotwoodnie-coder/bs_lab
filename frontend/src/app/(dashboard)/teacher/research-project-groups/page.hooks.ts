"use client";

import * as React from "react";
import { sonnerToast } from "@bs-lab/ui";

import { useAuth } from "@/hooks/use-auth";
import type { CoreApiActor } from "@/lib/core-api-shared";
import {
  addSubjectGroupMember,
  createSubjectGroup,
  fetchAvailableGroups,
  fetchMySubjectGroups,
  fetchSubjectGroupMembers,
  joinSubjectGroup,
  patchSubjectGroup,
  removeSubjectGroupMember,
} from "@/lib/v2/v2-group-api";
import type { AvailableGroupRecord, SubjectGroupMemberRecord, SubjectGroupMembershipRecord } from "@/lib/v2/v2-group-api";
import { fetchV2SchoolSubjects } from "@/lib/v2/v2-exp-api";

export type ResearchGroupOrgFilter = "all" | "y" | "n";

export type TeacherGroupRow = SubjectGroupMembershipRecord & {
  members: SubjectGroupMemberRecord[];
  memberCount: number;
  adminCount: number;
  teacherCount: number;
  /** 学科名称（由 hooks 层映射） */
  subjectName: string | null;
};

/** 可加入教研组扩展类型（含 subjectName 映射） */
export type AvailableGroupRow = AvailableGroupRecord & { subjectName: string | null };

/**
 * 加载学科映射表
 */
async function loadSubjectNameMap(actor: CoreApiActor): Promise<Map<string, string>> {
  try {
    const list = await fetchV2SchoolSubjects(actor);
    return new Map(list.map((s) => [s.id, s.name]));
  } catch {
    return new Map();
  }
}

/** 教师端教研组 hooks：以"我参与的教研组"视角加载 */
export function useTeacherResearchProjectGroups() {
  const { user } = useAuth();
  const actor = React.useMemo<CoreApiActor>(
    () => ({ role: user.role, orgId: user.orgId, userId: user.userId, userName: user.userName }),
    [user.role, user.orgId, user.userId, user.userName],
  );

  const [filter, setFilter] = React.useState<ResearchGroupOrgFilter>("all");
  const [editTarget, setEditTarget] = React.useState<TeacherGroupRow | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [rows, setRows] = React.useState<TeacherGroupRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  /** 详情 Sheet */
  const [detailGroup, setDetailGroup] = React.useState<TeacherGroupRow | null>(null);
  const [detailMembers, setDetailMembers] = React.useState<SubjectGroupMemberRecord[]>([]);
  const [detailMembersLoading, setDetailMembersLoading] = React.useState(false);

  /** 学科名称映射表（惰性加载） */
  const subjectNameMapRef = React.useRef<Map<string, string> | null>(null);

  const ensureSubjectMap = React.useCallback(async (): Promise<Map<string, string>> => {
    if (subjectNameMapRef.current && subjectNameMapRef.current.size > 0) return subjectNameMapRef.current;
    const map = await loadSubjectNameMap(actor);
    subjectNameMapRef.current = map;
    return map;
  }, [actor]);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const list = await fetchMySubjectGroups(actor);
      const subjectMap = await ensureSubjectMap();
      const enriched: TeacherGroupRow[] = await Promise.all(
        list.map(async (g) => {
          try {
            const members = await fetchSubjectGroupMembers(actor, g.groupId);
            const adminCount = members.filter((m) => (m.status ?? "Y") === "Y").length > 0 ? 1 : 0;
            const teacherCount = Math.max(0, members.length - adminCount);
            return {
              ...g,
              members,
              memberCount: members.length,
              adminCount,
              teacherCount,
              subjectName: g.subjectId ? (subjectMap.get(g.subjectId) ?? g.subjectId) : null,
            };
          } catch {
            return {
              ...g,
              members: [],
              memberCount: 0,
              adminCount: 0,
              teacherCount: 0,
              subjectName: g.subjectId ? (subjectMap.get(g.subjectId) ?? g.subjectId) : null,
            };
          }
        }),
      );
      setRows(enriched);
    } catch (err) {
      sonnerToast.error("加载教研组失败", {
        description: err instanceof Error ? err.message : "请稍后重试",
      });
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [actor, ensureSubjectMap]);

  /** 可加入的教研组列表 */
  const [availableGroups, setAvailableGroups] = React.useState<AvailableGroupRow[]>([]);
  const [availableLoading, setAvailableLoading] = React.useState(false);

  const loadAvailable = React.useCallback(async () => {
    setAvailableLoading(true);
    try {
      const list = await fetchAvailableGroups(actor);
      const subjectMap = await ensureSubjectMap();
      setAvailableGroups(list.map((g) => ({
        ...g,
        subjectName: g.subjectId ? (subjectMap.get(g.subjectId) ?? g.subjectId) : null,
      })));
    } catch (err) {
      sonnerToast.error("加载可加入的教研组失败", {
        description: err instanceof Error ? err.message : "请稍后重试",
      });
      setAvailableGroups([]);
    } finally {
      setAvailableLoading(false);
    }
  }, [actor, ensureSubjectMap]);

  /** 申请加入教研组 */
  const handleJoin = React.useCallback(
    async (groupId: string) => {
      try {
        await joinSubjectGroup(actor, groupId);
        sonnerToast.success("已加入教研组");
        void load();
        void loadAvailable();
      } catch (err) {
        sonnerToast.error("加入失败", {
          description: err instanceof Error ? err.message : "请稍后重试",
        });
      }
    },
    [actor, load, loadAvailable],
  );

  React.useEffect(() => {
    void load();
  }, [load]);

  React.useEffect(() => {
    void loadAvailable();
  }, [loadAvailable]);

  const handlePatch = React.useCallback(
    async (groupId: string, patch: { groupName?: string; comments?: string | null; status?: "Y" | "N"; subjectId?: string | null }) => {
      setSubmitting(true);
      try {
        await patchSubjectGroup(actor, groupId, {
          group_name: patch.groupName,
          comments: patch.comments ?? null,
          status: patch.status,
          subject_id: patch.subjectId,
        });
        sonnerToast.success("已更新教研组");
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

  /** 创建新的教研组 */
  const handleCreate = React.useCallback(
    async (input: { groupName: string; comments?: string | null; subjectId?: string | null }) => {
      setSubmitting(true);
      try {
        await createSubjectGroup(actor, {
          group_name: input.groupName,
          comments: input.comments ?? null,
          subject_id: input.subjectId ?? null,
        });
        sonnerToast.success("教研组已创建");
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

  /** 加载指定组的成员（供 handleAddMember/handleRemoveMember 和 openDetail 共用） */
  const refreshDetailMembers = React.useCallback(
    async (group: TeacherGroupRow) => {
      setDetailMembersLoading(true);
      try {
        const members = await fetchSubjectGroupMembers(actor, group.groupId);
        setDetailMembers(members);
      } catch {
        setDetailMembers([]);
      } finally {
        setDetailMembersLoading(false);
      }
    },
    [actor],
  );

  /** 添加成员到教研组 */
  const handleAddMember = React.useCallback(
    async (groupId: string, userId: string) => {
      try {
        await addSubjectGroupMember(actor, groupId, userId);
        sonnerToast.success("成员已添加");
        void load();
        // 如果详情 Sheet 正打开着，刷新它的成员列表
        if (detailGroup?.groupId === groupId) {
          void refreshDetailMembers(detailGroup);
        }
        return true;
      } catch (err) {
        sonnerToast.error("添加成员失败", {
          description: err instanceof Error ? err.message : "请稍后重试",
        });
        return false;
      }
    },
    [actor, load, detailGroup, refreshDetailMembers],
  );

  /** 移除教研组成员 */
  const handleRemoveMember = React.useCallback(
    async (seqId: string) => {
      try {
        await removeSubjectGroupMember(actor, seqId);
        sonnerToast.success("成员已移除");
        void load();
        if (detailGroup) {
          void refreshDetailMembers(detailGroup);
        }
        return true;
      } catch (err) {
        sonnerToast.error("移除成员失败", {
          description: err instanceof Error ? err.message : "请稍后重试",
        });
        return false;
      }
    },
    [actor, load, detailGroup, refreshDetailMembers],
  );

  /** 打开详情 Sheet（同时加载成员） */
  const openDetail = React.useCallback(
    async (group: TeacherGroupRow) => {
      setDetailGroup(group);
      void refreshDetailMembers(group);
    },
    [refreshDetailMembers],
  );

  const closeDetail = React.useCallback(() => {
    setDetailGroup(null);
    setDetailMembers([]);
  }, []);

  const currentUserId = user.userId;
  const isResearcher = user.role === "Role_Researcher";

  return {
    loading,
    submitting,
    actor,
    currentUserId,
    isResearcher,
    rows: filter === "all" ? rows : rows.filter((r) => (filter === "y" ? (r.status ?? "Y") === "Y" : (r.status ?? "Y") === "N")),
    filter,
    setFilter,
    editTarget,
    setEditTarget,
    handlePatch,
    handleCreate,
    handleAddMember,
    handleRemoveMember,
    detailGroup,
    detailMembers,
    detailMembersLoading,
    openDetail,
    closeDetail,
    refreshDetailMembers,
    availableGroups,
    availableLoading,
    handleJoin,
  };
}
