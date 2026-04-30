"use client";

import * as React from "react";
import { sonnerToast } from "@bs-lab/ui";

import { authRoleToUserRole, useAuth } from "@/hooks/use-auth";
import type { CoreApiActor } from "@/lib/core-api-shared";
import { UserRole } from "@/types/auth";
import {
  createSubjectGroup,
  fetchSubjectGroupMembers,
  fetchSubjectGroups,
  type SubjectGroupMemberRecord,
  type SubjectGroupRecord,
} from "@/lib/v2/v2-group-api";
import { fetchV2SysUserById, type V2SysUserItem } from "@/lib/v2/v2-sys-api";
import { fetchV2SchoolSubjects } from "@/lib/v2/v2-exp-api";

export type TeachingResearchGroupMemberView = SubjectGroupMemberRecord & {
  userName: string;
  loginName: string;
  roleName: string | null;
  avatarUrl: string | null;
};

export type TeachingResearchGroupRow = SubjectGroupRecord & {
  ownerName: string;
  ownerLoginName: string;
  createUserName: string;
  memberCount: number;
  members: TeachingResearchGroupMemberView[];
  /** 学科名称（由 hooks 层映射） */
  subjectName: string | null;
};

async function loadUserNameMap(actor: CoreApiActor, userIds: string[]): Promise<Map<string, V2SysUserItem>> {
  const uniq = [...new Set(userIds.map((s) => s.trim()).filter(Boolean))];
  const pairs = await Promise.all(uniq.map(async (id) => {
    try {
      return [id, await fetchV2SysUserById(actor, id)] as const;
    } catch {
      return null;
    }
  }));
  return new Map(pairs.filter(Boolean) as Array<readonly [string, V2SysUserItem]>);
}

export function useTeachingResearchGroupsList() {
  const { user } = useAuth();
  const role = authRoleToUserRole(user.role);
  const actor = React.useMemo<CoreApiActor>(() => ({ role, orgId: user.orgId, userId: user.userId, userName: user.userName }), [role, user.orgId, user.userId, user.userName]);

  const canCreate = role === UserRole.RESEARCHER || role === UserRole.DISTRICT_ADMIN || role === UserRole.SUPER_ADMIN;

  const [rows, setRows] = React.useState<TeachingResearchGroupRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [memberManageOpen, setMemberManageOpen] = React.useState(false);
  const [selectedGroup, setSelectedGroup] = React.useState<TeachingResearchGroupRow | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [membersLoading, setMembersLoading] = React.useState(false);

  // 学科名称映射缓存
  const subjectNameMapRef = React.useRef<Map<string, string> | null>(null);

  const enrichGroups = React.useCallback(async (list: SubjectGroupRecord[]) => {
    const memberLists = await Promise.all(list.map(async (group) => {
      try { return [group.groupId, await fetchSubjectGroupMembers(actor, group.groupId)] as const; }
      catch { return [group.groupId, [] as SubjectGroupMemberRecord[]] as const; }
    }));
    const memberMap = new Map(memberLists);
    const ownerIds = list.map((g) => g.ownerId).filter((v): v is string => Boolean(v));
    const creatorIds = list.map((g) => g.createUserId).filter((v): v is string => Boolean(v));
    const memberUserIds = memberLists.flatMap(([, members]) => members.map((m) => m.userId));
    const userMap = await loadUserNameMap(actor, [...ownerIds, ...creatorIds, ...memberUserIds]);
    // 加载学科映射
    let subjectMap = subjectNameMapRef.current;
    if (!subjectMap || subjectMap.size === 0) {
      try { const subjects = await fetchV2SchoolSubjects(actor); subjectMap = new Map(subjects.map((s) => [s.id, s.name])); subjectNameMapRef.current = subjectMap; } catch { subjectMap = new Map<string, string>(); }
    }
    return list.map((group) => {
      const owner = group.ownerId ? userMap.get(group.ownerId) : null;
      const creator = group.createUserId ? userMap.get(group.createUserId) : null;
      const members = memberMap.get(group.groupId) ?? [];
      return {
        ...group,
        ownerName: owner?.userName ?? group.ownerId ?? "—",
        ownerLoginName: owner?.loginName ?? "",
        createUserName: creator?.userName ?? group.createUserId ?? "—",
        memberCount: members.length,
        members: members.map((m) => {
          const u = userMap.get(m.userId);
          return { ...m, userName: u?.userName ?? m.userId, loginName: u?.loginName ?? "", roleName: u?.roleName ?? null, avatarUrl: u?.userLogo ?? null };
        }),
        subjectName: group.subjectId ? (subjectMap!.get(group.subjectId) ?? group.subjectId) : null,
      };
    });
  }, [actor]);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      setRows(await enrichGroups(await fetchSubjectGroups(actor)));
    } catch (e) {
      sonnerToast.error(e instanceof Error ? e.message : "加载失败");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [actor, enrichGroups]);

  const reloadMembers = React.useCallback(async (groupId: string) => {
    setMembersLoading(true);
    try {
      const members = await fetchSubjectGroupMembers(actor, groupId);
      const userMap = await loadUserNameMap(actor, members.map((m) => m.userId));
      setRows((prev) => prev.map((row) => row.groupId === groupId ? {
        ...row,
        memberCount: members.length,
        members: members.map((m) => {
          const u = userMap.get(m.userId);
          return { ...m, userName: u?.userName ?? m.userId, loginName: u?.loginName ?? "", roleName: u?.roleName ?? null, avatarUrl: u?.userLogo ?? null };
        }),
      } : row));
      setSelectedGroup((prev) => prev && prev.groupId === groupId ? {
        ...prev,
        memberCount: members.length,
        members: members.map((m) => {
          const u = userMap.get(m.userId);
          return { ...m, userName: u?.userName ?? m.userId, loginName: u?.loginName ?? "", roleName: u?.roleName ?? null, avatarUrl: u?.userLogo ?? null };
        }),
      } : prev);
    } catch (e) {
      sonnerToast.error(e instanceof Error ? e.message : "成员加载失败");
    } finally {
      setMembersLoading(false);
    }
  }, [actor]);

  React.useEffect(() => { void load(); }, [load]);
  React.useEffect(() => { if (memberManageOpen && selectedGroup?.groupId) void reloadMembers(selectedGroup.groupId); }, [memberManageOpen, selectedGroup?.groupId, reloadMembers]);

  const refresh = React.useCallback(() => { void load(); }, [load]);

  const handleCreateSubmit = React.useCallback(async (payload: { groupName: string; comments: string | null; subjectId: string | null; ownerId: string | null; status: "Y" | "N"; createUserId: string }) => {
    setSubmitting(true);
    try {
      await createSubjectGroup(actor, { group_name: payload.groupName, comments: payload.comments, subject_id: payload.subjectId, owner_id: payload.ownerId, status: payload.status });
      sonnerToast.success("已创建教研组");
      setCreateOpen(false);
      await load();
    } catch (e) {
      sonnerToast.error(e instanceof Error ? e.message : "创建失败");
    } finally {
      setSubmitting(false);
    }
  }, [actor, load]);

  const closeOrgDialogs = React.useCallback(() => {
    setEditOpen(false);
    setDeleteOpen(false);
    setMemberManageOpen(false);
    setSelectedGroup(null);
  }, []);

  const openEdit = React.useCallback((row: TeachingResearchGroupRow) => { setSelectedGroup(row); setEditOpen(true); }, []);
  const openDelete = React.useCallback((row: TeachingResearchGroupRow) => { setSelectedGroup(row); setDeleteOpen(true); }, []);
  const openMemberManage = React.useCallback((row: TeachingResearchGroupRow) => { setSelectedGroup(row); setMemberManageOpen(true); }, []);

  return {
    actor,
    role,
    loading,
    rows,
    canCreate,
    createOpen,
    setCreateOpen,
    submitting,
    handleCreateSubmit,
    selectedOrg: selectedGroup,
    editOpen,
    deleteOpen,
    memberManageOpen,
    closeOrgDialogs,
    refresh,
    selectedMembers: selectedGroup?.members ?? [],
    membersLoading,
    reloadMembers,
    openEdit,
    openDelete,
    openMemberManage,
  };
}
