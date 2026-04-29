"use client";

import * as React from "react";
import { sonnerToast } from "@bs-lab/ui";

import { eduDimensionsApi, patchLocalRelationStatus } from "./page.api";
import type { DataSchoolLevel, DataSchoolSubject, GradeDrawerModel, SchoolDimensionSnapshot, SchoolLevelTreeNode } from "./page.types";

type SubjectView = DataSchoolSubject & { iconPath: string };

export function useSubjectGradesMutations(
  loadSnapshot: () => Promise<void>,
  selectedLevelId: string,
  snapshot: SchoolDimensionSnapshot,
  setSnapshot: React.Dispatch<React.SetStateAction<SchoolDimensionSnapshot>>,
  levelMap: Map<string, DataSchoolLevel>,
  subjectMap: Map<string, SubjectView>,
  drawerModel: GradeDrawerModel | null,
  setDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>,
  setSelectedLinkKey: React.Dispatch<React.SetStateAction<string>>,
  setDrawerModel: React.Dispatch<React.SetStateAction<GradeDrawerModel | null>>,
  setSortingStage: React.Dispatch<React.SetStateAction<boolean>>,
  setSortingSubject: React.Dispatch<React.SetStateAction<boolean>>,
  setSavingDrawer: React.Dispatch<React.SetStateAction<boolean>>,
) {
  const onReorderStages = React.useCallback(
    async (treeItems: SchoolLevelTreeNode[]) => {
      const nextOrder = treeItems.filter((i) => i.nodeType === "level").map((i) => i.levelId);
      setSortingStage(true);
      try {
        await eduDimensionsApi.patchStageSort(nextOrder);
        await loadSnapshot();
        sonnerToast.success("学段排序已更新");
      } catch (error) {
        sonnerToast.error(error instanceof Error ? error.message : "学段排序更新失败");
      } finally {
        setSortingStage(false);
      }
    },
    [loadSnapshot, setSortingStage],
  );

  const onReorderSubjects = React.useCallback(
    async (linkKeysInOrder: string[]) => {
      if (!selectedLevelId || linkKeysInOrder.length === 0) return;
      setSortingSubject(true);
      try {
        await eduDimensionsApi.patchStageSubjectSort(selectedLevelId, linkKeysInOrder);
        await loadSnapshot();
        sonnerToast.success("学科排序已更新");
      } catch (error) {
        sonnerToast.error(error instanceof Error ? error.message : "学科排序更新失败");
      } finally {
        setSortingSubject(false);
      }
    },
    [loadSnapshot, selectedLevelId, setSortingSubject],
  );

  const onReorderTreeSubjectsByLevel = React.useCallback(
    async (levelId: string, linkKeysInOrder: string[]) => {
      if (!levelId || linkKeysInOrder.length === 0) return;
      setSortingSubject(true);
      try {
        await eduDimensionsApi.patchStageSubjectSort(levelId, linkKeysInOrder);
        await loadSnapshot();
      } catch (error) {
        sonnerToast.error(error instanceof Error ? error.message : "学科排序更新失败");
      } finally {
        setSortingSubject(false);
      }
    },
    [loadSnapshot, setSortingSubject],
  );

  const onReorderTreeGradesByLevel = React.useCallback(
    async (levelId: string, gradeIds: string[]) => {
      if (!levelId || gradeIds.length === 0) return;
      setSortingStage(true);
      try {
        await eduDimensionsApi.patchStageGradeSort(levelId, gradeIds);
        await loadSnapshot();
      } catch (error) {
        sonnerToast.error(error instanceof Error ? error.message : "年级排序更新失败");
      } finally {
        setSortingStage(false);
      }
    },
    [loadSnapshot, setSortingStage],
  );

  const onToggleSubjectStatus = React.useCallback(
    async (linkKey: string, next: 0 | 1) => {
      const prevRows = snapshot.levelSubjects;
      setSnapshot((prev) => ({
        ...prev,
        levelSubjects: patchLocalRelationStatus(prev.levelSubjects, linkKey, next),
      }));
      try {
        await eduDimensionsApi.patchStageSubjectStatus(linkKey, next);
        sonnerToast.success(next ? "已启用学科关联" : "已停用学科关联");
      } catch (error) {
        setSnapshot((prev) => ({ ...prev, levelSubjects: prevRows }));
        sonnerToast.error(error instanceof Error ? error.message : "学科启停保存失败，已回滚");
      }
    },
    [setSnapshot, snapshot.levelSubjects],
  );

  const openGradeDrawer = React.useCallback(
    (linkKey: string) => {
      const rel = snapshot.levelSubjects.find((item) => item.linkKey === linkKey);
      if (!rel) return;
      const level = levelMap.get(String(rel.levelId));
      const subject = subjectMap.get(String(rel.subjectId));
      const selectedGradeIds = snapshot.gradeSubjectMatrix
        .filter(
          (row) =>
            String(row.levelId) === String(rel.levelId) &&
            String(row.subjectId) === String(rel.subjectId) &&
            row.lineActive === 1,
        )
        .map((row) => String(row.gradeId));
      setSelectedLinkKey(linkKey);
      setDrawerModel({
        levelId: rel.levelId,
        levelName: level?.levelName ?? "未知学段",
        subjectId: rel.subjectId,
        subjectName: subject?.subjectName ?? "未知学科",
        selectedGradeIds,
      });
      setDrawerOpen(true);
    },
    [levelMap, setDrawerModel, setDrawerOpen, setSelectedLinkKey, snapshot.gradeSubjectMatrix, snapshot.levelSubjects, subjectMap],
  );

  const saveDrawerGrades = React.useCallback(async () => {
    if (!drawerModel) return;
    setSavingDrawer(true);
    try {
      await eduDimensionsApi.putStageSubjectGrades(
        drawerModel.levelId,
        drawerModel.subjectId,
        drawerModel.selectedGradeIds,
      );
      await loadSnapshot();
      setDrawerOpen(false);
      sonnerToast.success("年级关联已保存");
    } catch (error) {
      sonnerToast.error(error instanceof Error ? error.message : "年级关联保存失败");
    } finally {
      setSavingDrawer(false);
    }
  }, [drawerModel, loadSnapshot, setDrawerOpen, setSavingDrawer]);

  const closeGradeEditor = React.useCallback(() => {
    setDrawerOpen(false);
    setSelectedLinkKey("");
    setDrawerModel(null);
  }, [setDrawerModel, setDrawerOpen, setSelectedLinkKey]);

  const addSubjectToLevel = React.useCallback(
    async (payload: { subject_name: string; subject_id: string }) => {
      if (!selectedLevelId) return;
      const created = await eduDimensionsApi.createSubject(payload);
      await eduDimensionsApi.createStageSubject({ level_id: selectedLevelId, subject_id: created.id });
      await loadSnapshot();
      sonnerToast.success("学科已新增并关联到当前学段");
    },
    [loadSnapshot, selectedLevelId],
  );

  const linkExistingSubjectsToLevel = React.useCallback(
    async (subjectIds: string[]) => {
      if (!selectedLevelId || subjectIds.length === 0) return;
      setSortingSubject(true);
      try {
        await eduDimensionsApi.linkSubjectsToLevel(selectedLevelId, subjectIds);
        await loadSnapshot();
        sonnerToast.success("已关联所选学科到当前学段");
      } catch (error) {
        sonnerToast.error(error instanceof Error ? error.message : "关联学科失败");
      } finally {
        setSortingSubject(false);
      }
    },
    [loadSnapshot, selectedLevelId, setSortingSubject],
  );

  return {
    onReorderStages,
    onReorderSubjects,
    onReorderTreeSubjectsByLevel,
    onReorderTreeGradesByLevel,
    onToggleSubjectStatus,
    openGradeDrawer,
    saveDrawerGrades,
    closeGradeEditor,
    addSubjectToLevel,
    linkExistingSubjectsToLevel,
  };
}
