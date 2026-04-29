"use client";

import { adminClassIdFromOrgClassNode } from "@/lib/class-cohort-mock";
import { readUnifiedStore, writeUnifiedStore } from "../unified-mock-store.core";
import { ensureUnifiedStoreSeeded } from "../unified-mock-store.seed";
import type { LabGroupMock, MockStudentUser } from "../unified-mock-store.types";
import { newLabGroupId } from "../experiment/ids";

export function listLabGroupsForAdminClass(adminClassId: string): LabGroupMock[] {
  ensureUnifiedStoreSeeded();
  return readUnifiedStore().labGroups.filter((g) => g.adminClassId === adminClassId);
}

export function getLabGroupById(groupId: string): LabGroupMock | undefined {
  ensureUnifiedStoreSeeded();
  return readUnifiedStore().labGroups.find((g) => g.groupId === groupId);
}

export function syncStudentGroupIdsFromLabGroups(labGroups: LabGroupMock[], users: MockStudentUser[]): MockStudentUser[] {
  const uidToGid = new Map<string, string>();
  for (const g of labGroups) {
    for (const uid of g.memberUserIds) uidToGid.set(uid, g.groupId);
  }
  return users.map((u) => ({ ...u, groupId: uidToGid.get(u.userId) ?? null }));
}

/**
 * 教师在行政班内勾选学生并创建实验小组；`groupId` 写入学生记录，作为作业下发最小单位。
 */
export function createLabGroupForAdminClass(params: {
  adminClassId: string;
  label: string;
  memberUserIds: string[];
}): LabGroupMock | null {
  ensureUnifiedStoreSeeded();
  const { adminClassId, memberUserIds } = params;
  const label = params.label.trim() || "实验小组";
  const uniq = [...new Set(memberUserIds)];
  if (uniq.length === 0) return null;
  const s = readUnifiedStore();
  const valid = uniq.filter((id) => {
    const u = s.studentUsers.find((x) => x.userId === id);
    return u && u.adminClassId === adminClassId;
  });
  if (valid.length === 0) return null;
  const groupId = newLabGroupId();
  let labGroups = s.labGroups
    .map((g) => ({
      ...g,
      memberUserIds: g.memberUserIds.filter((uid) => !valid.includes(uid)),
    }))
    .filter((g) => g.memberUserIds.length > 0);
  const group: LabGroupMock = {
    groupId,
    label,
    adminClassId,
    memberUserIds: valid,
    createdAt: new Date().toISOString(),
  };
  labGroups = [group, ...labGroups];
  const studentUsers = syncStudentGroupIdsFromLabGroups(labGroups, s.studentUsers);
  writeUnifiedStore({ ...s, labGroups, studentUsers });
  return group;
}

/** 校管：从未分班池划入某组织班级节点，并同步教师侧 adminClassId */
export function assignStudentsToOrgClassNode(orgClassNodeId: string, userIds: string[]): void {
  ensureUnifiedStoreSeeded();
  const admin = adminClassIdFromOrgClassNode(orgClassNodeId);
  if (!admin || userIds.length === 0) return;
  const s = readUnifiedStore();
  const pick = new Set(userIds);
  const studentUsers = s.studentUsers.map((u) => {
    if (!pick.has(u.userId)) return u;
    return {
      ...u,
      adminClassId: admin,
      orgClassNodeId: orgClassNodeId,
      groupId: null,
    };
  });
  const labGroups = s.labGroups
    .map((g) => ({
      ...g,
      memberUserIds: g.memberUserIds.filter((uid) => !pick.has(uid)),
    }))
    .filter((g) => g.memberUserIds.length > 0);
  const syncedUsers = syncStudentGroupIdsFromLabGroups(labGroups, studentUsers);
  writeUnifiedStore({ ...s, studentUsers: syncedUsers, labGroups });
}

/** 校管：退回未分班池（） */
export function moveStudentsToUnassignedPool(userIds: string[]): void {
  ensureUnifiedStoreSeeded();
  if (userIds.length === 0) return;
  const s = readUnifiedStore();
  const pick = new Set(userIds);
  const studentUsers = s.studentUsers.map((u) => {
    if (!pick.has(u.userId)) return u;
    return { ...u, adminClassId: null, orgClassNodeId: null, groupId: null };
  });
  let labGroups = s.labGroups
    .map((g) => ({
      ...g,
      memberUserIds: g.memberUserIds.filter((uid) => !pick.has(uid)),
    }))
    .filter((g) => g.memberUserIds.length > 0);
  const syncedUsers = syncStudentGroupIdsFromLabGroups(labGroups, studentUsers);
  writeUnifiedStore({ ...s, studentUsers: syncedUsers, labGroups });
}

