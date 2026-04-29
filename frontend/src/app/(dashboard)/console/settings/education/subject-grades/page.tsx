"use client";

import * as React from "react";
import { Card, CardContent, sonnerToast } from "@bs-lab/ui";

import { PageHeader } from "@/components/layout/page-header";
import { useDemoRole } from "@/components/layout/demo-role-context";
import { LeftTreeRightTableLayout } from "@/components/layout/left-tree-right-table-layout";
import { UserRole } from "@/types/auth";
import type { EduGrade } from "./page.types";
import { ynToLineActive } from "./page.types";
import { EduGradeSettingsPanel } from "./_components/EduGradeSettingsPanel";
import { EduStageTreeBoard } from "./_components/EduStageTreeBoard";
import { SubjectLinkExistingPanel } from "./_components/SubjectLinkExistingPanel";
import { EduSubjectBoard } from "./_components/EduSubjectBoard";
import { eduDimensionsApi } from "./page.api";
import { useSubjectGradesPageState } from "./page.hooks";

export default function ConsoleSubjectGradesPage() {
  const state = useSubjectGradesPageState();
  const { role } = useDemoRole();
  const canManageTree =
    role === UserRole.SCHOOL_ADMIN ||
    role === UserRole.DISTRICT_ADMIN ||
    role === UserRole.SUPER_ADMIN;
  const levelName =
    state.snapshot.levels.find((item) => item.levelId === state.selectedLevelId)?.levelName ?? "未选择学段";
  const stageAvailableGrades = React.useMemo<EduGrade[]>(
    () =>
      state.snapshot.grades
        .filter((item) => ynToLineActive(item.status) === 1 && state.levelEnabledGradeIds.has(item.gradeId))
        .map((g) => ({
          id: g.gradeId,
          name: g.gradeName,
          code: g.gradeId,
          status: ynToLineActive(g.status),
        })),
    [state.levelEnabledGradeIds, state.snapshot.grades],
  );
  const [gradeSettingsBusy, setGradeSettingsBusy] = React.useState(false);

  const linkableSubjectsForLevel = React.useMemo(() => {
    if (!state.selectedLevelId) return [];
    const lid = String(state.selectedLevelId);
    const linked = new Set(
      state.snapshot.levelSubjects.filter((r) => String(r.levelId) === lid).map((r) => String(r.subjectId)),
    );
    return state.snapshot.subjects
      .filter((s) => ynToLineActive(s.status) === 1 && !linked.has(String(s.subjectId)))
      .map((s) => ({ id: String(s.subjectId), name: s.subjectName }));
  }, [state.selectedLevelId, state.snapshot.levelSubjects, state.snapshot.subjects]);

  const showSubjectLinkPanel =
    !state.initialLoading &&
    Boolean(state.selectedLevelId) &&
    state.subjectRows.length === 0 &&
    linkableSubjectsForLevel.length > 0;

  const runGradeAction = React.useCallback(
    async (fn: () => Promise<void>, successMessage: string) => {
      setGradeSettingsBusy(true);
      try {
        await fn();
        await state.refresh();
        sonnerToast.success(successMessage);
      } catch (error) {
        sonnerToast.error(error instanceof Error ? error.message : "操作失败");
      } finally {
        setGradeSettingsBusy(false);
      }
    },
    [state],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="教育维度看板"
        description="年级、学段与学科关系的可视化维护入口。"
      />
      <LeftTreeRightTableLayout
        leftTitle="教育维度看板"
        left={
          <EduStageTreeBoard
            loading={state.initialLoading}
            stageTreeByGrade={state.stageTreeByGrade}
            stageTreeBySubject={state.stageTreeBySubject}
            selectedLevelId={state.selectedLevelId}
            sortingStage={state.sortingStage}
            canManage={canManageTree}
            onSelectLevel={state.setSelectedLevelId}
            onReorderStageTree={state.onReorderStages}
            onPersistLevelSubjectOrder={state.onReorderTreeSubjectsByLevel}
            onPersistLevelGradeOrder={state.onReorderTreeGradesByLevel}
            hideZeroCountNodes
            onSelectSubjectContext={state.setEduStageTreeListContext}
          />
        }
        right={
          <Card className="border-border shadow-none">
            <CardContent className="space-y-4 p-4">
              <EduGradeSettingsPanel
                levels={state.snapshot.levels}
                grades={state.snapshot.grades.map((g) => ({
                  id: g.gradeId,
                  name: g.gradeName,
                  code: g.gradeId,
                  status: ynToLineActive(g.status),
                }))}
                levelGradeEnabledMap={new Map(
                  state.snapshot.levels.map((lv) => [
                    lv.levelId,
                    new Set(
                      state.snapshot.levelGrades
                        .filter((row) => row.levelId === lv.levelId && row.lineActive === 1)
                        .map((row) => row.gradeId),
                    ),
                  ]),
                )}
                busy={gradeSettingsBusy}
                onApplyScheme={(payload) =>
                  runGradeAction(
                    () => eduDimensionsApi.applySchoolSystem(payload),
                    `已应用 ${payload.scheme === "custom" ? "自定义" : payload.scheme} 学制`,
                  )
                }
                onSaveMatrixChanges={(rows) =>
                  runGradeAction(
                    async () => {
                      for (let r = 0; r < rows.length; r++) {
                        const row = rows[r];
                        if (!row) continue;
                        await eduDimensionsApi.patchGrade(row.id, row);
                        const levels = [...state.snapshot.levels];
                        for (let i = 0; i < levels.length; i++) {
                          const levelId = levels[i]?.levelId;
                          if (!levelId) continue;
                          await eduDimensionsApi.patchStageGradeStatus(
                            levelId,
                            row.id,
                            levelId === row.levelId ? 1 : 0,
                          );
                        }
                      }
                    },
                    rows.length > 1 ? "已批量保存年级修改" : "已保存年级修改",
                  )
                }
                onCreateGrade={(payload) => runGradeAction(() => eduDimensionsApi.createGrade(payload), "年级已新增")}
                onUpdateGrade={(payload) =>
                  runGradeAction(
                    () => eduDimensionsApi.patchGrade(payload.id, payload),
                    "年级已更新",
                  )
                }
                onDeleteGrade={(gradeId) => runGradeAction(() => eduDimensionsApi.deleteGrade(gradeId), "年级已删除")}
              />
              {showSubjectLinkPanel ? (
                <SubjectLinkExistingPanel
                  subjects={linkableSubjectsForLevel}
                  busy={state.sortingSubject}
                  onLink={state.linkExistingSubjectsToLevel}
                />
              ) : null}
              <EduSubjectBoard
                loading={state.initialLoading}
                levelName={levelName}
                rows={state.subjectRows}
                query={state.subjectQuery}
                sortingSubject={state.sortingSubject}
                selectedLinkKey={state.selectedLinkKey}
                gradeEditorModel={state.drawerModel}
                levelGrades={stageAvailableGrades}
                savingGrades={state.savingDrawer}
                allSubjects={state.snapshot.subjects.map((item) => ({
                  id: item.subjectId,
                  name: item.subjectName,
                  code: item.subjectId,
                }))}
                onQueryChange={state.setSubjectQuery}
                onOpenGradesEditor={state.openGradeDrawer}
                onCloseGradesEditor={state.closeGradeEditor}
                onGradeModelChange={state.setDrawerModel}
                onSaveGrades={state.saveDrawerGrades}
                onAddSubject={(payload) =>
                  runGradeAction(() => state.addSubjectToLevel(payload), "学科已新增")
                }
                onToggleStatus={state.onToggleSubjectStatus}
                onReorder={state.onReorderSubjects}
              />
            </CardContent>
          </Card>
        }
      />
    </div>
  );
}
