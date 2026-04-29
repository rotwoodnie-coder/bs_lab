"use client";

import { readUnifiedStore } from "../unified-mock-store.core";
import { ensureUnifiedStoreSeeded } from "../unified-mock-store.seed";
import type { MockStudentUser } from "../unified-mock-store.types";

export function listStudentUsersByAdminClass(adminClassId: string): MockStudentUser[] {
  ensureUnifiedStoreSeeded();
  return readUnifiedStore().studentUsers.filter((u) => u.adminClassId === adminClassId);
}

export function listUnassignedPoolStudentUsers(): MockStudentUser[] {
  ensureUnifiedStoreSeeded();
  return readUnifiedStore().studentUsers.filter((u) => u.adminClassId == null);
}

export function getMockStudentUser(userId: string): MockStudentUser | undefined {
  ensureUnifiedStoreSeeded();
  return readUnifiedStore().studentUsers.find((u) => u.userId === userId);
}

export function buildAdminClassRosterCsv(adminClassId: string): string {
  const rows = listStudentUsersByAdminClass(adminClassId);
  const header = "userId,displayName,labGroupId,orgClassNodeId";
  const lines = [
    header,
    ...rows.map((r) => [r.userId, r.displayName, r.groupId ?? "", r.orgClassNodeId ?? ""].join(",")),
  ];
  return lines.join("\n");
}

