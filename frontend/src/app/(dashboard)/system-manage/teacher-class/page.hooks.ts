"use client";

import * as React from "react";
import { sonnerToast } from "@bs-lab/ui";

import { useAuth } from "@/hooks/use-auth";
import type { CoreApiActor } from "@/lib/core-api-shared";
import { fetchV2SysUserList, type V2SysUserItem, fetchV2SysOrgTree, type V2SysOrgItem } from "@/lib/v2/v2-sys-api";
import { getTeacherAuthorizedClasses, syncTeacherClasses } from "@/lib/v2/v2-sys-org-api";
import { fetchTeacherSubjects, type TeacherSubjectRow } from "@/lib/v2/v2-sys-org-api";
import { fetchV2SchoolSubjects } from "@/lib/v2/v2-exp-api";
import { V2_ORG_TYPE_IDS } from "@/lib/v2/v2-org-type-constants";
import type { TeacherStats } from "./_components/StatsCards";
import { buildOrgTreeFromFlat } from "@/lib/v2/build-org-tree-from-flat";
import { buildOrgByIdMap, resolveSchoolNameFromTree, resolveSchoolOrgIdFromTree } from "./_lib/teacher-class-org-resolve";

export type SubjectOption = { id: string; name: string };
export type TeacherClassRelationRow = { classOrgId: string; subjectId: string };

export interface UseTeacherClassAdminReturn {
  actor: CoreApiActor;
  teachers: V2SysUserItem[];
  teacherLoading: boolean;
  teacherQuery: string;
  setTeacherQuery: (v: string) => void;
  selectedTeacher: V2SysUserItem | null;
  setSelectedTeacherId: (id: string | null) => void;
  subjects: SubjectOption[];
  classTree: V2SysOrgItem[];
  classNameById: Record<string, string>;
  subjectNameById: Record<string, string>;
  schoolOrgId: string | null;
  schoolOrgName: string | null;
  configDefaultSchoolOrgId: string | null;
  configDefaultSchoolDisplayName: string | null;
  relationMap: Record<string, Set<string>>;
  relationLoading: boolean;
  dirty: boolean;
  savePending: boolean;
  handleAdd: (subjectId: string, classIds: string[]) => void;
  handleRemove: (subjectId: string, classOrgId: string) => void;
  handleSave: () => Promise<void>;
  handleSaveAndContinue: () => Promise<void>;
  reloadRelations: () => Promise<void>;
  allRelationsMap: Record<string, TeacherClassRelationRow[]>;
  /** 教师可教学科（来自教研组），表格展示"授课学科"的来源之一 */
  teacherSubjectsMap: Record<string, SubjectOption[]>;
  batchLoading: boolean;
  configDialogOpen: boolean;
  openConfigDialog: (teacherId: string) => void;
  closeConfigDialog: () => void;
  stats: TeacherStats;
}

function buildClassNameMap(nodes: V2SysOrgItem[]): Record<string, string> {
  const out: Record<string, string> = {};
  const walk = (items: V2SysOrgItem[]) => {
    for (const n of items) {
      if (n.orgTypeId === V2_ORG_TYPE_IDS.class) out[n.orgId] = n.orgName;
      if (n.children?.length) walk(n.children);
    }
  };
  walk(nodes);
  return out;
}

function relationKey(subjectId: string) { return `subject:${subjectId}`; }

function relationMapToRows(map: Record<string, Set<string>>): TeacherClassRelationRow[] {
  return Object.entries(map).flatMap(([subjectKey, classIds]) => {
    const subjectId = subjectKey.replace(/^subject:/, "");
    return Array.from(classIds).map((classOrgId) => ({ classOrgId, subjectId }));
  });
}

function rowsToRelationMap(rows: TeacherClassRelationRow[]): Record<string, Set<string>> {
  const out: Record<string, Set<string>> = {};
  for (const row of rows) {
    const key = relationKey(row.subjectId);
    if (!out[key]) out[key] = new Set<string>();
    out[key]!.add(row.classOrgId);
  }
  return out;
}

function normalizeRelationRows(rows: { orgId: string; subjectId: string | null }[]): TeacherClassRelationRow[] {
  return rows.map((r) => ({ classOrgId: r.orgId ?? "", subjectId: r.subjectId ?? "" }));
}

export function useTeacherClassAdmin(): UseTeacherClassAdminReturn {
  const { user } = useAuth();
  const actor = React.useMemo<CoreApiActor>(
    () => ({ role: user.role, orgId: user.orgId, userId: user.userId, userName: user.userName, tenantId: user.tenantId, appId: user.appId }),
    [user.appId, user.orgId, user.role, user.tenantId, user.userId, user.userName],
  );

  const [teacherQuery, setTeacherQuery] = React.useState("");
  const [teachers, setTeachers] = React.useState<V2SysUserItem[]>([]);
  const [teacherLoading, setTeacherLoading] = React.useState(false);
  const [selectedTeacherId, setSelectedTeacherId] = React.useState<string | null>(null);
  const selectedTeacher = React.useMemo(
    () => teachers.find((t) => t.userId === selectedTeacherId) ?? null,
    [teachers, selectedTeacherId],
  );

  const [subjects, setSubjects] = React.useState<SubjectOption[]>([]);
  const [classTree, setClassTree] = React.useState<V2SysOrgItem[]>([]);
  const [relationMap, setRelationMap] = React.useState<Record<string, Set<string>>>({});
  const [baselineMap, setBaselineMap] = React.useState<Record<string, Set<string>>>({});
  const [relationLoading, setRelationLoading] = React.useState(false);
  const [savePending, setSavePending] = React.useState(false);
  const [allRelationsMap, setAllRelationsMap] = React.useState<Record<string, TeacherClassRelationRow[]>>({});
  const [teacherSubjectsMap, setTeacherSubjectsMap] = React.useState<Record<string, SubjectOption[]>>({});
  const [batchLoading, setBatchLoading] = React.useState(false);
  const [configDialogOpen, setConfigDialogOpen] = React.useState(false);

  const classNameById = React.useMemo(() => buildClassNameMap(classTree), [classTree]);
  const subjectNameById = React.useMemo<Record<string, string>>(
    () => Object.fromEntries(subjects.map((s) => [s.id, s.name])),
    [subjects],
  );

  const schoolOrgId = React.useMemo<string | null>(() => {
    const r = (user.role ?? "").trim().toLowerCase();
    return (r === "role_school_admin" || r === "school_admin") ? (user.orgId ?? null) : null;
  }, [user.role, user.orgId]);

  const schoolOrgName = React.useMemo<string | null>(
    () => (schoolOrgId ? resolveSchoolNameFromTree(classTree, schoolOrgId) : null),
    [schoolOrgId, classTree],
  );

  const configDefaultSchoolOrgId = React.useMemo<string | null>(() => {
    if (selectedTeacher?.userOrgId?.trim()) {
      return resolveSchoolOrgIdFromTree(classTree, selectedTeacher.userOrgId);
    }
    return resolveSchoolOrgIdFromTree(classTree, user.orgId) ?? schoolOrgId ?? null;
  }, [classTree, user.orgId, schoolOrgId, selectedTeacher?.userOrgId]);

  const configDefaultSchoolDisplayName = React.useMemo<string | null>(() => {
    if (!configDefaultSchoolOrgId) return null;
    const node = buildOrgByIdMap(classTree).get(configDefaultSchoolOrgId);
    return node?.orgName ?? resolveSchoolNameFromTree(classTree, configDefaultSchoolOrgId);
  }, [classTree, configDefaultSchoolOrgId]);

  const dirty = React.useMemo(() => {
    const keys = new Set([...Object.keys(relationMap), ...Object.keys(baselineMap)]);
    for (const key of keys) {
      const a = relationMap[key] ?? new Set<string>();
      const b = baselineMap[key] ?? new Set<string>();
      if (a.size !== b.size) return true;
      for (const v of a) if (!b.has(v)) return true;
    }
    return false;
  }, [baselineMap, relationMap]);

  const stats = React.useMemo<TeacherStats>(() => {
    const allClasses = new Set<string>();
    let unconfigured = 0;
    for (const t of teachers) {
      const rels = allRelationsMap[t.userId];
      if (!rels || rels.length === 0) { unconfigured++; }
      else { for (const r of rels) allClasses.add(r.classOrgId); }
    }
    return {
      teacherCount: teachers.length,
      classCoverageCount: allClasses.size,
      subjectCount: subjects.length,
      unconfiguredCount: unconfigured,
    };
  }, [teachers, allRelationsMap, subjects]);

  const loadTeachers = React.useCallback(async () => {
    setTeacherLoading(true);
    try {
      const res = await fetchV2SysUserList(actor, {
        keyword: teacherQuery.trim() || undefined,
        userRoleId: "Role_Teacher",
        userOrgId: schoolOrgId ?? undefined,
        page: 1,
        pageSize: 50,
      });
      setTeachers(res.items);
    } catch (err) {
      sonnerToast.error("加载教师失败", { description: err instanceof Error ? err.message : "未知错误" });
    } finally { setTeacherLoading(false); }
  }, [actor, teacherQuery, schoolOrgId]);

  const loadClassTree = React.useCallback(async () => {
    try {
      const flat = await fetchV2SysOrgTree(actor);
      const built = buildOrgTreeFromFlat(flat);
      setClassTree(built);
    } catch (err) {
      sonnerToast.error("加载班级树失败", { description: err instanceof Error ? err.message : "未知错误" });
    }
  }, [actor]);

  const loadSubjects = React.useCallback(async () => {
    try {
      const rows = await fetchV2SchoolSubjects(actor);
      const enabled = rows.filter((r) => {
        const st = (r as { status?: string | null }).status;
        return st == null || st === "" || st === "y" || st === "Y";
      });
      setSubjects(enabled.map((r) => ({ id: r.id, name: r.name })));
    } catch {
      sonnerToast.error("加载学科列表失败");
    }
  }, [actor]);

  const loadBatchRelations = React.useCallback(async (teacherList: V2SysUserItem[]) => {
    if (teacherList.length === 0) { setAllRelationsMap({}); return; }
    setBatchLoading(true);
    try {
      const results = await Promise.all(
        teacherList.map((t) => getTeacherAuthorizedClasses(actor, null, t.userId).catch(() => [])),
      );
      const map: Record<string, TeacherClassRelationRow[]> = {};
      teacherList.forEach((t, i) => { map[t.userId] = normalizeRelationRows(results[i]!); });
      setAllRelationsMap(map);

      // 同时加载教师从教研组推导的可教学科（用于表格展示"授课学科")
      const subjectResults = await Promise.all(
        teacherList.map((t) =>
          fetchTeacherSubjects(actor, t.userId).catch((err) => {
            console.warn("[teacher-class] fetchTeacherSubjects failed for %s: %s", t.userId, err instanceof Error ? err.message : String(err));
            return [] as TeacherSubjectRow[];
          }),
        ),
      );
      const subjMap: Record<string, SubjectOption[]> = {};
      teacherList.forEach((t, i) => {
        const rows = subjectResults[i] ?? [];
        subjMap[t.userId] = rows
          .filter((r) => r.subjectId && r.subjectName)
          .map((r) => ({ id: r.subjectId!, name: r.subjectName! }));
      });
      setTeacherSubjectsMap(subjMap);
    } catch {
      sonnerToast.error("批量加载授课关系失败");
    } finally { setBatchLoading(false); }
  }, [actor]);

  const reloadRelations = React.useCallback(async () => {
    if (!selectedTeacherId) { setRelationMap({}); setBaselineMap({}); return; }
    setRelationLoading(true);
    try {
      const rows = await getTeacherAuthorizedClasses(actor, null, selectedTeacherId);
      const map = rowsToRelationMap(normalizeRelationRows(rows));
      setRelationMap(map);
      setBaselineMap(map);
    } catch (err) {
      sonnerToast.error("加载授课关系失败", { description: err instanceof Error ? err.message : "未知错误" });
    } finally { setRelationLoading(false); }
  }, [actor, selectedTeacherId]);

  React.useEffect(() => { void loadTeachers(); }, [loadTeachers, teacherQuery]);
  React.useEffect(() => { void loadClassTree(); void loadSubjects(); }, [loadClassTree, loadSubjects]);
  React.useEffect(() => { void reloadRelations(); }, [reloadRelations, selectedTeacherId]);
  React.useEffect(() => { void loadBatchRelations(teachers); }, [loadBatchRelations, teachers]);

  const handleAdd = React.useCallback((subjectId: string, classIds: string[]) => {
    setRelationMap((prev) => {
      const next = { ...prev };
      const key = relationKey(subjectId);
      const set = new Set(next[key] ?? []);
      for (const id of classIds) set.add(id);
      next[key] = set;
      return next;
    });
  }, []);

  const handleRemove = React.useCallback((subjectId: string, classOrgId: string) => {
    setRelationMap((prev) => {
      const next = { ...prev };
      const key = relationKey(subjectId);
      const set = new Set(next[key] ?? []);
      set.delete(classOrgId);
      next[key] = set;
      return next;
    });
  }, []);

  const persistCurrentTeacherRelations = React.useCallback(async (): Promise<boolean> => {
    if (!selectedTeacherId) return false;
    try {
      const relations = relationMapToRows(relationMap);
      await syncTeacherClasses(actor, selectedTeacherId, relations);
      await reloadRelations();
      await loadBatchRelations(teachers);
      return true;
    } catch (err) {
      sonnerToast.error("保存失败", { description: err instanceof Error ? err.message : "未知错误" });
      return false;
    }
  }, [actor, relationMap, reloadRelations, selectedTeacherId, loadBatchRelations, teachers]);

  const handleSave = React.useCallback(async () => {
    if (!selectedTeacherId) return;
    setSavePending(true);
    try {
      if (await persistCurrentTeacherRelations()) sonnerToast.success("保存成功");
    } finally { setSavePending(false); }
  }, [persistCurrentTeacherRelations, selectedTeacherId]);

  const handleSaveAndContinue = React.useCallback(async () => {
    if (!selectedTeacherId) return;
    setSavePending(true);
    try {
      if (!(await persistCurrentTeacherRelations())) return;
      sonnerToast.success("保存成功");
      const merged = { ...allRelationsMap, [selectedTeacherId]: relationMapToRows(relationMap) };
      const idx = teachers.findIndex((t) => t.userId === selectedTeacherId);
      const tail = idx >= 0 ? teachers.slice(idx + 1) : [];
      const next = tail.find((t) => {
        const rels = merged[t.userId];
        return !rels || rels.length === 0;
      });
      if (next) {
        setSelectedTeacherId(next.userId);
        sonnerToast.message("已切换到下一位", { description: `${next.userName}（${next.loginName}）` });
      } else {
        setConfigDialogOpen(false);
        sonnerToast.message("已完成", { description: "没有下一位未配置教师" });
      }
    } finally { setSavePending(false); }
  }, [allRelationsMap, persistCurrentTeacherRelations, relationMap, selectedTeacherId, teachers]);

  const openConfigDialog = React.useCallback((teacherId: string) => {
    setSelectedTeacherId(teacherId);
    setConfigDialogOpen(true);
  }, []);

  const closeConfigDialog = React.useCallback(() => { setConfigDialogOpen(false); }, []);

  return {
    actor, teachers, teacherLoading, teacherQuery, setTeacherQuery,
    selectedTeacher, setSelectedTeacherId, subjects, classTree, classNameById, subjectNameById,
    schoolOrgId, schoolOrgName, configDefaultSchoolOrgId, configDefaultSchoolDisplayName,
    relationMap, relationLoading, dirty, savePending,
    handleAdd, handleRemove, handleSave, handleSaveAndContinue, reloadRelations,
    allRelationsMap, teacherSubjectsMap, batchLoading, configDialogOpen, openConfigDialog, closeConfigDialog, stats,
  };
}
