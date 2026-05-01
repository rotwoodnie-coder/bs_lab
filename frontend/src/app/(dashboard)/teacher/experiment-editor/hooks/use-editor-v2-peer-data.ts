"use client";

import * as React from "react";

import { useAuth } from "@/hooks/use-auth";
import type { CoreApiActor } from "@/lib/core-api-shared";
import {
  fetchV2Difficulties,
  fetchV2ExpLibraryList,
  fetchV2MaterialSecurities,
  fetchV2SchoolGrades,
  fetchV2SchoolLevels,
  fetchV2SchoolSubjects,
  type V2DictGradeItem,
  type V2DictItem,
  type V2ExpLibraryItem,
  type V2ExpLibraryListQuery,
} from "@/lib/v2/v2-exp-api";
import type { EducationPhase, SubjectDiscipline } from "@/types/subject";

import type { EditorPeerRow } from "../utils/editor-peer-row-types";
import { resolveExpListFilterQueryIds } from "../utils/resolve-exp-list-filter-query";
import { v2ExpLibraryItemToMgmtRow } from "../../../experiment-manage/v2-exp-library-item-to-mgmt-row";

export type UseEditorV2PeerDataResult = {
  actor: CoreApiActor;
  subjects: V2DictItem[];
  grades: V2DictGradeItem[];
  difficulties: V2DictItem[];
  securities: V2DictItem[];
  peerRows: EditorPeerRow[];
  /** 标准试验库 `exp_library` 列表项（含列表接口聚合的 `grades`） */
  v2LibraryItems: V2ExpLibraryItem[];
  loading: boolean;
  total: number;
  refresh: () => void;
};

type UseEditorV2PeerDataArgs = {
  keyword?: string;
  /** 实验列表筛选：空数组表示该维度不限 */
  listPhases?: EducationPhase[];
  listDisciplines?: SubjectDiscipline[];
  listGradeCodes?: string[];
  page?: number;
  pageSize?: number;
};

function norm(v: string | null | undefined): string {
  return String(v ?? "").trim();
}

/**
 * 实验编辑器侧 V2 数据：学科/年级字典与实验列表分离拉取。
 * 避免「搜索关键词」触发的列表刷新反复 setSubjects/setGrades（新数组引用），
 * 进而触发 `useEditorExperimentHydration` 中依赖 grades/subjects 的 effect，覆盖用户手选的学段。
 */
export function useEditorV2PeerData(args: UseEditorV2PeerDataArgs = {}): UseEditorV2PeerDataResult {
  const { user } = useAuth();
  const actor = React.useMemo<CoreApiActor>(
    () => ({
      role: user.role,
      orgId: user.orgId,
      userId: user.userId,
      userName: user.userName,
      tenantId: user.tenantId,
      appId: user.appId,
    }),
    [user.appId, user.orgId, user.role, user.tenantId, user.userId, user.userName],
  );

  const [subjects, setSubjects] = React.useState<V2DictItem[]>([]);
  const [grades, setGrades] = React.useState<V2DictGradeItem[]>([]);
  const [schoolLevels, setSchoolLevels] = React.useState<V2DictItem[]>([]);
  const [difficulties, setDifficulties] = React.useState<V2DictItem[]>([]);
  const [securities, setSecurities] = React.useState<V2DictItem[]>([]);
  const [v2LibraryItems, setV2LibraryItems] = React.useState<V2ExpLibraryItem[]>([]);
  const [dictLoading, setDictLoading] = React.useState(true);
  const [listLoading, setListLoading] = React.useState(true);
  const [total, setTotal] = React.useState(0);
  const [refreshNonce, setRefreshNonce] = React.useState(0);

  const refresh = React.useCallback(() => setRefreshNonce((n) => n + 1), []);

  React.useEffect(() => {
    if (!user.userId) {
      setSubjects([]);
      setGrades([]);
      setSchoolLevels([]);
      setDifficulties([]);
      setSecurities([]);
      setDictLoading(false);
      return;
    }
    let cancelled = false;
    setDictLoading(true);
    void (async () => {
      try {
        const [subj, gr, lv, diff, sec] = await Promise.all([
          fetchV2SchoolSubjects(actor),
          fetchV2SchoolGrades(actor),
          fetchV2SchoolLevels(actor),
          fetchV2Difficulties(actor),
          fetchV2MaterialSecurities(actor),
        ]);
        if (cancelled) return;
        setSubjects(subj);
        setGrades(gr);
        setSchoolLevels(lv);
        setDifficulties(diff);
        setSecurities(sec);
      } catch {
        if (!cancelled) {
          setSubjects([]);
          setGrades([]);
          setSchoolLevels([]);
          setDifficulties([]);
          setSecurities([]);
        }
      } finally {
        if (!cancelled) setDictLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [actor, refreshNonce, user.userId]);

  React.useEffect(() => {
    if (!user.userId) {
      setV2LibraryItems([]);
      setTotal(0);
      setListLoading(false);
      return;
    }
    let cancelled = false;
    setListLoading(true);
    void (async () => {
      try {
        const ids = resolveExpListFilterQueryIds({
          phases: args.listPhases ?? [],
          disciplines: args.listDisciplines ?? [],
          gradeCodes: args.listGradeCodes ?? [],
          subjects,
          grades,
          levels: schoolLevels,
        });
        const query: V2ExpLibraryListQuery = {
          keyword: norm(args.keyword) || undefined,
          page: args.page ?? 1,
          pageSize: args.pageSize ?? 50,
          subjectIds: ids.subject_ids ? [ids.subject_ids] : undefined,
          gradeIds: ids.grade_ids ? [ids.grade_ids] : undefined,
          schoolLevelIds: ids.school_level_ids ? [ids.school_level_ids] : undefined,
        };
        const list = await fetchV2ExpLibraryList(actor, query);
        if (cancelled) return;
        setV2LibraryItems(list.items);
        setTotal(list.total ?? list.items.length);
      } catch {
        if (!cancelled) {
          setV2LibraryItems([]);
          setTotal(0);
        }
      } finally {
        if (!cancelled) setListLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    actor,
    args.keyword,
    args.listDisciplines,
    args.listGradeCodes,
    args.listPhases,
    args.page,
    args.pageSize,
    grades,
    refreshNonce,
    schoolLevels,
    subjects,
    user.userId,
  ]);

  const peerRows = React.useMemo(
    () =>
      v2LibraryItems.map((it) =>
        v2ExpLibraryItemToMgmtRow(it, { subjects, grades }),
      ),
    [grades, subjects, v2LibraryItems],
  );

  const loading = dictLoading || listLoading;

  return { actor, subjects, grades, difficulties, securities, peerRows, v2LibraryItems, loading, total, refresh };
}
