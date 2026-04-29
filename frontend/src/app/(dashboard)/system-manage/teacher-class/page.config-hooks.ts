/**
 * 教师课设配置辅助 Hook：教师可教学科、年级-学科映射、冲突查询。
 */
"use client";

import * as React from "react";
import { sonnerToast } from "@bs-lab/ui";

import type { CoreApiActor } from "@/lib/core-api-shared";
import { fetchTeacherSubjects, fetchGradeSubjectMap, fetchClassSubjectConflicts } from "@/lib/v2/v2-sys-org-api";
import type { SubjectOption } from "./page.hooks";

export type TeacherSubjectRow = { subjectId: string; subjectName: string };

export interface UseTeacherClassConfigReturn {
  configTeacherSubjects: SubjectOption[];
  configTeacherSubjectsLoading: boolean;
  gradeSubjectMap: Record<string, string[]>;
  conflictSet: Set<string>;
  loadTeacherSubjects: (teacherId: string) => Promise<void>;
  loadGradeSubjectMap: () => Promise<void>;
  reloadConflicts: (teacherId: string, gradeId: string) => Promise<void>;
}

export function useTeacherClassConfig(actor: CoreApiActor): UseTeacherClassConfigReturn {
  const [configTeacherSubjects, setConfigTeacherSubjects] = React.useState<SubjectOption[]>([]);
  const [configTeacherSubjectsLoading, setConfigTeacherSubjectsLoading] = React.useState(false);
  const [gradeSubjectMap, setGradeSubjectMap] = React.useState<Record<string, string[]>>({});
  const [conflictSet, setConflictSet] = React.useState<Set<string>>(new Set());

  const loadTeacherSubjects = React.useCallback(async (teacherId: string) => {
    setConfigTeacherSubjectsLoading(true);
    try {
      const rows = await fetchTeacherSubjects(actor, teacherId);
      setConfigTeacherSubjects(rows.map((r) => ({ id: r.subjectId, name: r.subjectName })));
    } catch {
      setConfigTeacherSubjects([]);
    } finally { setConfigTeacherSubjectsLoading(false); }
  }, [actor]);

  const loadGradeSubjectMap = React.useCallback(async () => {
    try {
      const map = await fetchGradeSubjectMap(actor);
      setGradeSubjectMap(map);
    } catch {
      // non-critical
    }
  }, [actor]);

  const reloadConflicts = React.useCallback(async (teacherId: string, gradeId: string) => {
    if (!teacherId || !gradeId) { setConflictSet(new Set()); return; }
    try {
      const items = await fetchClassSubjectConflicts(actor, teacherId, gradeId);
      const set = new Set(items.map((c) => `${c.classOrgId}::${c.subjectId}`));
      setConflictSet(set);
    } catch {
      setConflictSet(new Set());
    }
  }, [actor]);

  return {
    configTeacherSubjects,
    configTeacherSubjectsLoading,
    gradeSubjectMap,
    conflictSet,
    loadTeacherSubjects,
    loadGradeSubjectMap,
    reloadConflicts,
  };
}
