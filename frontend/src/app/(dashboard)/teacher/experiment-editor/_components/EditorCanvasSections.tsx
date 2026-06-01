"use client";

import * as React from "react";
import { Button, Tabs, TabsContent, TabsList, TabsTrigger } from "@bs-lab/ui";

import { EditorBasicSection } from "./sections/EditorBasicSection";
import { EditorMaterialsSection } from "./sections/EditorMaterialsSection";
import { EditorStepsSection } from "./sections/EditorStepsSection";
import { EditorTailSections } from "./sections/EditorTailSections";
import { EditorTeachingContextSection } from "./sections/EditorTeachingContextSection";
import { EditorExperimentReferencePanel } from "./sections/EditorExperimentReferencePanel";
import { EditorScientistStoryPanel } from "./sections/EditorScientistStoryPanel";

import { useMediaActor } from "@/lib/media-platform/use-media-actor";

import type { useEditorActions } from "../hooks/use-editor-actions";
import type { useEditorBootstrap } from "../hooks/use-editor-bootstrap";
import type { PhaseKey } from "../types";

type Vm = ReturnType<typeof useEditorBootstrap>;
type Actions = ReturnType<typeof useEditorActions>;
type MainTabKey =
  | "basic"
  | "materials"
  | "steps"
  | "result"
  | "safety"
  | "teachingContext";

const MAIN_TABS: { key: MainTabKey; label: string }[] = [
  { key: "basic", label: "基础信息" },
  { key: "materials", label: "实验材料" },
  { key: "steps", label: "实验步骤" },
  { key: "result", label: "实验结果" },
  { key: "safety", label: "安全提示" },
  { key: "teachingContext", label: "教学与参考" },
];

function isMainTabKey(value: string): value is MainTabKey {
  return MAIN_TABS.some((item) => item.key === value);
}

function anchorToTabKey(anchorId: string): MainTabKey {
  if (isMainTabKey(anchorId)) return anchorId;
  return "basic";
}

function tabKeyToAnchor(tabKey: MainTabKey): string {
  return tabKey;
}

export function EditorCanvasSections(props: { vm: Vm; actions: Actions }) {
  const { vm, actions } = props;
  const mediaActor = useMediaActor();
  const { canvas, step } = vm;
  const activeTab = anchorToTabKey(canvas.activeAnchorId);
  const mainVideoEmbeds = React.useMemo(
    () =>
      vm.mainVideoEmbeds.filter((e): e is { id: string; kind: "video"; src: string; caption?: string } => e.kind === "video"),
    [vm.mainVideoEmbeds],
  );

  const changeTab = React.useCallback(
    (value: string) => {
      if (!isMainTabKey(value)) return;
      canvas.onNavigateAnchor(tabKeyToAnchor(value));
    },
    [canvas],
  );

  const tailCommon = React.useMemo(
    () => ({
      fieldDisabled: vm.fieldDisabled,
      mediaActor,
      userId: vm.user.userId,
      securities: vm.v2Securities,
      resultEntries: vm.resultEntries,
      addResultEntry: vm.addResultEntry,
      removeResultEntry: vm.removeResultEntry,
      updateResultEntryTitle: (id: string, value: string) => vm.updateResultEntry(id, "title", value),
      updateResultRichContent: vm.updateResultRichContent,
      reorderResultEntry: vm.reorderResultEntry,
      safetyNotes: vm.safetyNotes,
      safetyEmbeds: vm.safetyEmbeds,
      onSafetyRichChange: (next: import("@bs-lab/ui").RichMediaValue) => {
        vm.setSafetyNotes(next.text);
        vm.setSafetyEmbeds(next.embeds);
      },
      dangerNotes: vm.dangerNotes,
      dangerEmbeds: vm.dangerEmbeds,
      onDangerRichChange: (next: import("@bs-lab/ui").RichMediaValue) => {
        vm.setDangerNotes(next.text);
        vm.setDangerEmbeds(next.embeds);
      },
      safetyDrafts: vm.securityDrafts,
      onToggleSafetyTag: vm.toggleSecurity,
      referenceCitations: vm.referenceCitations,
      addReferenceCitation: vm.addReferenceCitation,
      removeReferenceCitation: vm.removeReferenceCitation,
      updateReferenceCitation: vm.updateReferenceCitation,
      referenceVideo: vm.referenceVideo,
      setReferenceVideo: vm.setReferenceVideo,
      referenceVideos: vm.referenceVideos,
      addReferenceVideo: vm.addReferenceVideo,
      removeReferenceVideo: vm.removeReferenceVideo,
      setReferenceVideos: vm.setReferenceVideos,
      referenceRichText: vm.referenceRichText,
      referenceRichEmbeds: vm.referenceRichEmbeds,
      onReferenceRichChange: (next: import("@bs-lab/ui").RichMediaValue) => {
        vm.setReferenceRichText(next.text);
        vm.setReferenceRichEmbeds(next.embeds);
      },
      scientistStories: vm.scientistStories,
      addScientistStory: vm.addScientistStory,
      removeScientistStory: vm.removeScientistStory,
      updateScientistStory: vm.updateScientistStory,
    }),
    [mediaActor, vm],
  );

  const withTabFooter = React.useCallback(
    (tabKey: MainTabKey, content: React.ReactNode) => {
      const idx = MAIN_TABS.findIndex((t) => t.key === tabKey);
      const nextKey = idx >= 0 ? MAIN_TABS[idx + 1]?.key : undefined;
      return (
        <div className="space-y-4">
          {content}
          {actions.canShowNavSave ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-[28px] bg-white px-5 py-3 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <span className="text-xs text-slate-500">完成当前模块后，可继续编辑下一模块</span>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="ghost" size="sm" className="rounded-lg text-slate-600" onClick={() => actions.saveDraft()}>
                  保存草稿
                </Button>
                {nextKey ? (
                  <Button type="button" size="sm" className="gap-1.5 rounded-lg bg-[#008080] text-white hover:bg-[#006666]" onClick={() => changeTab(nextKey)}>
                    下一步
                  </Button>
                ) : null}
                {tabKey === "teachingContext" && actions.canShowNavSubmit ? (
                  <Button type="button" size="sm" className="gap-1.5 rounded-lg bg-[#008080] text-white hover:bg-[#006666]" onClick={() => actions.publish()}>
                    提交审核
                  </Button>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      );
    },
    [actions, changeTab],
  );

  const tailCommonNoMedia = React.useMemo(
    () => ({
      fieldDisabled: vm.fieldDisabled,
      mediaActor,
      userId: vm.user.userId,
      referenceCitations: vm.referenceCitations,
      addReferenceCitation: vm.addReferenceCitation,
      removeReferenceCitation: vm.removeReferenceCitation,
      updateReferenceCitation: vm.updateReferenceCitation,
      referenceVideo: vm.referenceVideo,
      setReferenceVideo: vm.setReferenceVideo,
      referenceVideos: vm.referenceVideos,
      addReferenceVideo: vm.addReferenceVideo,
      removeReferenceVideo: vm.removeReferenceVideo,
      setReferenceVideos: vm.setReferenceVideos,
      referenceRichText: vm.referenceRichText,
      referenceRichEmbeds: vm.referenceRichEmbeds,
      onReferenceRichChange: (next: import("@bs-lab/ui").RichMediaValue) => {
        vm.setReferenceRichText(next.text);
        vm.setReferenceRichEmbeds(next.embeds);
      },
      scientistStories: vm.scientistStories,
      addScientistStory: vm.addScientistStory,
      removeScientistStory: vm.removeScientistStory,
      updateScientistStory: vm.updateScientistStory,
    }),
    [mediaActor, vm],
  );

  return (
    <Tabs
      value={activeTab}
      onValueChange={changeTab}
      className="flex h-full min-h-0 flex-col gap-4"
    >
      <div className="shrink-0 rounded-[28px] border-0 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] px-1 py-1 xl:sticky xl:top-0 xl:z-20">
        <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto bg-transparent p-0">
          {MAIN_TABS.map((tab) => (
            <TabsTrigger
              key={tab.key}
              value={tab.key}
              className="shrink-0 rounded-lg border border-transparent bg-transparent px-3 py-2 text-xs font-medium text-muted-foreground
                transition-colors hover:bg-accent hover:text-foreground
                data-[state=active]:border-border data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      {vm.showRejectBanner && vm.row?.rejectReason ? (
        <div
          role="status"
          className="shrink-0 rounded-[28px] border border-l-4 border-l-status-warning bg-status-warning/10 px-4 py-3 text-sm shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
        >
          <p className="font-medium text-foreground">驳回说明</p>
          <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{vm.row.rejectReason}</p>
        </div>
      ) : null}
      <div className="min-h-0 flex-1 overflow-y-auto px-0.5">
        <TabsContent value="basic" className="mt-0 pb-4">
          {withTabFooter(
            "basic",
            <EditorBasicSection
              expandedSectionId="basic"
              onNavigateAnchor={changeTab}
              fieldDisabled={vm.fieldDisabled}
              mediaActor={mediaActor}
              creatorName={vm.creatorName}
              expName={vm.expName}
              setExpName={vm.setExpName}
              debugExperimentRawText={vm.debugExperimentRawText}
              principle={vm.principle}
              setPrinciple={vm.setPrinciple}
              principleImage={vm.principleImage}
              setPrincipleImage={vm.setPrincipleImage}
              principleVideo={vm.principleVideo}
              setPrincipleVideo={vm.setPrincipleVideo}
              principleEmbeds={vm.principleEmbeds}
              setPrincipleEmbeds={vm.setPrincipleEmbeds}
              summary={vm.summary}
              setSummary={vm.setSummary}
              subjectId={vm.subjectId}
              setSubjectId={vm.setSubjectId}
              schoolLevelId={vm.schoolLevelId}
              setSchoolLevelId={vm.setSchoolLevelId}
              gradeId={vm.gradeId}
              setGradeId={vm.setGradeId}
              simulatorUrl={vm.simulatorUrl}
              setSimulatorUrl={vm.setSimulatorUrl}
              difficultyId={vm.difficultyId}
              onDifficultyIdChange={vm.setDifficultyId}
              difficultyOptions={vm.v2Difficulties?.map((d: { id: string; name: string }) => ({ id: d.id, name: d.name })) ?? []}
              difficultyLoading={vm.v2Loading}
              chooseType={vm.chooseType}
              setChooseType={vm.setChooseType}
              subjectOptions={vm.v2Subjects}
              gradeDictOptions={vm.v2Grades}
              schoolLevelOptions={vm.v2Levels}
              selectedGradeCodes={vm.selectedGradeCodes}
              setSelectedGradeCodes={vm.setSelectedGradeCodes}
              gradeOptions={vm.gradeOptions}
              disciplineLabel={vm.disciplineLabel}
              expTaskType={vm.expTaskType}
              onExpTaskTypeChange={vm.setExpTaskType}
              expTaskTypeDisabled={vm.expTaskTypeDisabled}
              mainVideoUrl={vm.mainVideoUrl}
              setMainVideoUrl={vm.setMainVideoUrl}
              mainVideoEmbeds={mainVideoEmbeds}
              setMainVideoEmbeds={vm.setMainVideoEmbeds as unknown as (next: Array<{ id: string; kind: "video"; src: string; caption?: string }>) => void}
              onMainVideoIdChange={vm.setMainVideoId}
              userId={vm.user.userId}
              expId={vm.expId}
              // 关联实验
              pickerTable={vm.curriculumTable}
              pickerRowsLength={vm.curriculumTableRows.length}
              pickerSelectedStandardId={vm.selectedStandardId}
              pickerSelectedStandardRow={vm.selectedStandardRow}
              pickerLinkedName={vm.linkedStandardName}
              pickerUseCustomExp={vm.useCustomExperiment}
              pickerListFilterPhases={vm.listFilterPhases}
              onPickerSetListFilterPhases={vm.setListFilterPhases}
              pickerListFilterDisciplines={vm.listFilterDisciplines}
              onPickerSetListFilterDisciplines={vm.setListFilterDisciplines}
              pickerListFilterGradeCodes={vm.listFilterGradeCodes}
              onPickerSetListFilterGradeCodes={vm.setListFilterGradeCodes}
              pickerListDisciplineOptions={vm.listDisciplineOptions}
              pickerListGradeOptions={vm.listGradeOptions}
              pickerListFilterPhaseLabels={vm.listFilterPhaseLabels}
              pickerListFilterDisciplineSummary={vm.listFilterDisciplineSummary}
              pickerListFilterGradeSummary={vm.listFilterGradeSummary}
              pickerSearchKeyword={vm.experimentSearchKeyword}
              onPickerSearch={vm.setExperimentSearchKeyword}
              onPickerSetSelectedStandardId={vm.setSelectedStandardId}
              onPickerSetUseCustomExp={vm.setUseCustomExperiment}
              onPickerSetCurriculum={vm.setCurriculum}
              onPickerConfirm={vm.confirmLinkedExperiment}
              onPickerSetPhase={vm.setPhase}
              onPickerSetDiscipline={vm.setDiscipline}
              onPickerSetSelectedGradeCodes={vm.setSelectedGradeCodes}
              onAutoFillBasic={() => vm.autoFillFromLinkedExperiment("mergeIfEmpty")}
              onAutoFillAll={() => vm.autoFillFromLinkedExperiment("replace")}
            />,
          )}
        </TabsContent>
        <TabsContent value="materials" className="mt-0 pb-4">
          {withTabFooter(
            "materials",
            <EditorMaterialsSection
              materialsStepsDisabled={vm.materialsStepsDisabled}
              materials={step.materials}
              appendMaterials={step.appendMaterials}
              removeMaterial={step.removeMaterial}
              updateMaterial={step.updateMaterial}
            />,
          )}
        </TabsContent>
        <TabsContent value="steps" className="mt-0 pb-4">
          {withTabFooter(
            "steps",
            <EditorStepsSection
              materialsStepsDisabled={vm.materialsStepsDisabled}
              mediaActor={mediaActor}
              steps={step.steps}
              addStep={step.addStep}
              removeStep={step.removeStep}
              updateStep={step.updateStep}
              updateStepRichContent={step.updateStepRichContent}
              reorderStep={step.reorderStep}
            />,
          )}
        </TabsContent>
        <TabsContent value="result" className="mt-0 pb-4">
          {withTabFooter("result", <EditorTailSections {...tailCommon} visibleSections={["result"]} />)}
        </TabsContent>
        <TabsContent value="safety" className="mt-0 pb-4">
          {withTabFooter("safety", <EditorTailSections {...tailCommon} visibleSections={["safety"]} />)}
        </TabsContent>
        <TabsContent value="teachingContext" className="mt-0 pb-4">
          {withTabFooter(
            "teachingContext",
            <div className="grid gap-4">
              <EditorTeachingContextSection
                fieldDisabled={vm.fieldDisabled}
                mediaActor={mediaActor}
                phase={vm.phase}
                setPhase={vm.setPhase}
                discipline={vm.discipline}
                setDiscipline={vm.setDiscipline}
                selectedGradeCodes={vm.selectedGradeCodes}
                setSelectedGradeCodes={vm.setSelectedGradeCodes}
                teachingContextContent={vm.teachingContextContent}
                teachingContextEmbeds={vm.teachingContextEmbeds}
                onTeachingContextRichChange={vm.setTeachingContextRich}
                coursebookId={vm.coursebookId}
                setCoursebookId={vm.setCoursebookId}
                unitId={vm.unitId}
                setUnitId={vm.setUnitId}
              />
              <EditorExperimentReferencePanel {...tailCommonNoMedia} />
              <EditorScientistStoryPanel {...tailCommonNoMedia} />
            </div>,
          )}
        </TabsContent>
      </div>
    </Tabs>
  );
}
