"use client";

import * as React from "react";
import { sonnerToast } from "@bs-lab/ui";

import { buildStageTreeByGrade, buildStageTreeBySubject } from "@/lib/edu-dimension-stage-tree";

import { eduDimensionsApi } from "./page.api";
import { buildSubjectIconPath, EMPTY_SCHOOL_DIMENSION_SNAPSHOT } from "./page.constants";
import { applyLevelGradesWhenMatrixEmpty } from "./snapshot-level-grades-fallback";
import { useSubjectGradesMutations } from "./subject-grades-mutations.hooks";
import type {
  EduStageTreeListContext,
  GradeDrawerModel,
  SchoolDimensionSnapshot,
  SubjectCardRow,
} from "./page.types";

function subjectRowMatchesTreeFilter(
  row: SubjectCardRow,
  filter: EduStageTreeListContext,
  selectedLevelId: string,
  matrix: SchoolDimensionSnapshot["gradeSubjectMatrix"],
): boolean {
  if (!filter) return true;
  if (!selectedLevelId) return true;
  if (String(filter.levelId) !== String(selectedLevelId)) return true;
  if (filter.subjectId != null && String(row.subjectId) !== String(filter.subjectId)) return false;
  if (filter.gradeId == null) return true;
  return matrix.some(
    (m) =>
      String(m.levelId) === String(selectedLevelId) &&
      String(m.subjectId) === String(row.subjectId) &&
      String(m.gradeId) === String(filter.gradeId) &&
      m.lineActive === 1,
  );
}

export function useSubjectGradesPageState() {
  const [snapshot, setSnapshot] = React.useState<SchoolDimensionSnapshot>(EMPTY_SCHOOL_DIMENSION_SNAPSHOT);
  const [selectedLevelId, setSelectedLevelId] = React.useState<string>("");
  const [eduStageTreeListContext, setEduStageTreeListContext] = React.useState<EduStageTreeListContext>(null);
  const [selectedLinkKey, setSelectedLinkKey] = React.useState<string>("");
  const [subjectQuery, setSubjectQuery] = React.useState("");
  const [initialLoading, setInitialLoading] = React.useState(true);
  const [sortingStage, setSortingStage] = React.useState(false);
  const [sortingSubject, setSortingSubject] = React.useState(false);
  const [savingDrawer, setSavingDrawer] = React.useState(false);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [drawerModel, setDrawerModel] = React.useState<GradeDrawerModel | null>(null);

  const loadSnapshot = React.useCallback(async () => {
    setInitialLoading(true);
    try {
      const raw = await eduDimensionsApi.fetchSnapshot();
      const data = applyLevelGradesWhenMatrixEmpty(raw);
      setSnapshot(data);
      setEduStageTreeListContext(null);
      setSelectedLevelId((prev) => {
        const prevStr = String(prev);
        if (!data.levels.some((item) => String(item.levelId) === prevStr)) {
          return data.levels[0]?.levelId != null ? String(data.levels[0].levelId) : "";
        }
        return prevStr;
      });
      setSelectedLinkKey((prev) => {
        if (!data.levelSubjects.some((item) => item.linkKey === prev)) return "";
        return prev;
      });
      setDrawerModel((prev) => {
        if (!prev) return prev;
        const levelOk = data.levels.some((item) => String(item.levelId) === String(prev.levelId));
        const subjectOk = data.subjects.some((item) => String(item.subjectId) === String(prev.subjectId));
        return levelOk && subjectOk ? prev : null;
      });
    } catch (error) {
      sonnerToast.error(error instanceof Error ? error.message : "加载教育维度失败");
    } finally {
      setInitialLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadSnapshot();
  }, [loadSnapshot]);

  React.useEffect(() => {
    setEduStageTreeListContext((prev) => {
      if (!prev) return prev;
      return String(prev.levelId) === String(selectedLevelId) ? prev : null;
    });
  }, [selectedLevelId]);

  const stageTreeByGrade = React.useMemo(() => buildStageTreeByGrade(snapshot), [snapshot]);
  const stageTreeBySubject = React.useMemo(() => buildStageTreeBySubject(snapshot), [snapshot]);

  const levelMap = React.useMemo(
    () => new Map(snapshot.levels.map((lv) => [String(lv.levelId), lv])),
    [snapshot.levels],
  );
  const subjectMap = React.useMemo(
    () =>
      new Map(
        snapshot.subjects.map((sj) => [
          String(sj.subjectId),
          {
            ...sj,
            iconPath: sj.iconPath || buildSubjectIconPath(sj.subjectId),
          },
        ]),
      ),
    [snapshot.subjects],
  );

  const subjectRows = React.useMemo<SubjectCardRow[]>(() => {
    if (!selectedLevelId) return [];
    const query = subjectQuery.trim().toLowerCase();
    return snapshot.levelSubjects
      .filter((rel) => String(rel.levelId) === String(selectedLevelId))
      .map((rel) => {
        const subject = subjectMap.get(String(rel.subjectId));
        return {
          linkKey: rel.linkKey,
          levelId: String(rel.levelId),
          subjectId: String(rel.subjectId),
          subjectCode: String(rel.subjectId),
          subjectName: subject?.subjectName ?? "未知学科",
          subjectIconPath: subject?.iconPath ?? buildSubjectIconPath(String(rel.subjectId)),
          sortOrder: rel.sortOrder,
          lineActive: rel.lineActive,
        };
      })
      .filter(
        (row) =>
          !query ||
          row.subjectName.toLowerCase().includes(query) ||
          row.subjectCode.toLowerCase().includes(query),
      )
      .filter((row) => subjectRowMatchesTreeFilter(row, eduStageTreeListContext, selectedLevelId, snapshot.gradeSubjectMatrix))
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [
    eduStageTreeListContext,
    selectedLevelId,
    snapshot.gradeSubjectMatrix,
    snapshot.levelSubjects,
    subjectMap,
    subjectQuery,
  ]);

  const mutations = useSubjectGradesMutations(
    loadSnapshot,
    selectedLevelId,
    snapshot,
    setSnapshot,
    levelMap,
    subjectMap,
    drawerModel,
    setDrawerOpen,
    setSelectedLinkKey,
    setDrawerModel,
    setSortingStage,
    setSortingSubject,
    setSavingDrawer,
  );

  return {
    snapshot,
    selectedLevelId,
    setSelectedLevelId,
    setEduStageTreeListContext,
    selectedLinkKey,
    subjectQuery,
    setSubjectQuery,
    stageTreeByGrade,
    stageTreeBySubject,
    subjectRows,
    initialLoading,
    sortingStage,
    sortingSubject,
    drawerOpen,
    setDrawerOpen,
    drawerModel,
    setDrawerModel,
    savingDrawer,
    ...mutations,
    refresh: loadSnapshot,
    levelEnabledGradeIds: new Set(
      snapshot.levelGrades
        .filter((row) => String(row.levelId) === String(selectedLevelId) && row.lineActive === 1)
        .map((row) => String(row.gradeId)),
    ),
  };
}
