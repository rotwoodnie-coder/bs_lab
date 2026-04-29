"use client";

import * as React from "react";

import { UserRole } from "@/types/auth";
import type { CoreApiActor } from "@/lib/core-api-shared";
import { fetchSubjectGroupMembers } from "@/lib/v2/v2-group-api";
import type { ExperimentManageRow } from "./page.hooks";

/**
 * 实验课程可见性过滤 hook。
 *
 * 规则：
 *  - 超级管理员：全可见
 *  - 教研员：本教研组教师创建的实验可见
 *  - 教师及其他：仅本人创建的实验可见
 */
export function useExperimentVisibilityFilter(
  actor: CoreApiActor,
  currentRole: UserRole,
  teachingResearchGroupIds: Array<{ groupId: string }>,
  currentUserId: string,
) {
  const [researchGroupMemberIds, setResearchGroupMemberIds] = React.useState<Set<string>>(new Set());

  // 加载当前用户的教研组成员 ID
  React.useEffect(() => {
    if (currentRole !== UserRole.RESEARCHER) return;
    const groupIds = teachingResearchGroupIds.map((g) => g.groupId);
    if (groupIds.length === 0) return;
    let cancelled = false;
    Promise.all(groupIds.map((gid) => fetchSubjectGroupMembers(actor, gid).catch(() => [] as Array<{ userId: string }>)))
      .then((results) => {
        if (cancelled) return;
        const ids = new Set<string>();
        for (const members of results) {
          for (const m of members) ids.add(m.userId);
        }
        setResearchGroupMemberIds(ids);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [actor, currentRole, teachingResearchGroupIds]);

  const filterVisibleExperiments = React.useCallback(
    (items: ExperimentManageRow[]): ExperimentManageRow[] => {
      const uid = currentUserId?.trim() || "";
      if (currentRole === UserRole.SUPER_ADMIN) return items;
      if (currentRole === UserRole.RESEARCHER) {
        return items.filter((it) => {
          if (!it.createUserId) return false;
          const owner = it.createUserId.trim();
          return owner === uid || researchGroupMemberIds.has(owner);
        });
      }
      return items.filter((it) => {
        if (!it.createUserId) return false;
        return it.createUserId.trim() === uid;
      });
    },
    [currentRole, researchGroupMemberIds, currentUserId],
  );

  return { filterVisibleExperiments };
}
