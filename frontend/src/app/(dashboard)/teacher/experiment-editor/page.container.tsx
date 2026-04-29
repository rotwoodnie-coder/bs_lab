"use client";

import * as React from "react";
import { ExperimentEditorShell } from "./_components/ExperimentEditorShell";
import { useEditorActions } from "./hooks/use-editor-actions";
import { useEditorAutosave } from "./hooks/use-editor-autosave";
import { useEditorBootstrap } from "./hooks/use-editor-bootstrap";

export default function TeacherExperimentEditorContainer() {
  const vm = useEditorBootstrap();
  const actions = useEditorActions({
    expId: vm.expId,
    forkFrom: vm.forkFrom,
    row: vm.row,
    isTeacher: vm.isTeacher,
    isResearcher: vm.isResearcher,
    completionPct: vm.completionPct,
    phase: vm.phase,
    discipline: vm.disciplineLabel,
    selectedGradeCodes: vm.selectedGradeCodes,
    gradeOptions: vm.gradeOptions,
    expName: vm.expName,
    chooseType: vm.chooseType,
    subjectId: vm.subjectId,
    schoolLevelId: vm.schoolLevelId,
    gradeId: vm.gradeId,
    summary: vm.summary,
    creatorName: vm.creatorName,
    actorId: vm.user.userId,
    actorName: vm.user.userName,
    orgId: vm.user.orgId,
    curriculum: vm.curriculum,
    teachingContextContent: vm.teachingContextContent,
    teachingContextEmbeds: vm.teachingContextEmbeds,
    coursebookId: vm.coursebookId,
    unitId: vm.unitId,
    principle: vm.principle,
    principleImage: vm.principleImage,
    principleVideo: vm.principleVideo,
    principleEmbeds: vm.principleEmbeds,
    safetyNotes: vm.safetyNotes,
    safetyEmbeds: vm.safetyEmbeds,
    dangerNotes: vm.dangerNotes,
    dangerEmbeds: vm.dangerEmbeds,
    durationMin: vm.durationMin,
    simulatorUrl: vm.simulatorUrl,
    difficultyId: vm.difficultyId,
    mainVideoId: vm.mainVideoId,
    mainVideoUrl: vm.mainVideoUrl,
    mainVideoEmbeds: vm.mainVideoEmbeds,
    teachingRefTextbookVersion: vm.teachingRefTextbookVersion,
    teachingRefUnit: vm.teachingRefUnit,
    teachingRefLessonPeriod: vm.teachingRefLessonPeriod,
    referenceCitations: vm.referenceCitations,
    referenceRichText: vm.referenceRichText,
    referenceRichEmbeds: vm.referenceRichEmbeds,
    scientistStories: vm.scientistStories,
    materials: vm.step.materials,
    steps: vm.step.steps,
    resultEntries: vm.resultEntries,
    v2Actor: vm.v2Actor,
    v2Subjects: vm.v2Subjects,
    v2Grades: vm.v2Grades,
    refreshV2PeerList: vm.refreshV2PeerList,
  });
  const autosave = useEditorAutosave({
    enabled: !vm.isResearcher && vm.isOwner,
    onSaveDraft: actions.saveDraft,
    data: {
      expId: vm.expId,
      phase: vm.phase,
      discipline: vm.discipline,
      selectedGradeCodes: vm.selectedGradeCodes,
      expName: vm.expName,
      chooseType: vm.chooseType,
      subjectId: vm.subjectId,
      schoolLevelId: vm.schoolLevelId,
      gradeId: vm.gradeId,
      summary: vm.summary,
      durationMin: vm.durationMin,
      difficulty: vm.difficulty,
      simulatorUrl: vm.simulatorUrl,
      difficultyId: vm.difficultyId,
      mainVideoUrl: vm.mainVideoUrl,
      mainVideoEmbeds: vm.mainVideoEmbeds,
      curriculum: vm.curriculum,
      teachingContextContent: vm.teachingContextContent,
      teachingContextEmbeds: vm.teachingContextEmbeds,
      coursebookId: vm.coursebookId,
      unitId: vm.unitId,
      teachingRefTextbookVersion: vm.teachingRefTextbookVersion,
      teachingRefUnit: vm.teachingRefUnit,
      teachingRefLessonPeriod: vm.teachingRefLessonPeriod,
      principle: vm.principle,
      principleImage: vm.principleImage,
      principleVideo: vm.principleVideo,
      principleEmbeds: vm.principleEmbeds,
      materials: vm.step.materials,
      steps: vm.step.steps,
      resultEntries: vm.resultEntries,
      safetyNotes: vm.safetyNotes,
      safetyEmbeds: vm.safetyEmbeds,
      dangerNotes: vm.dangerNotes,
      dangerEmbeds: vm.dangerEmbeds,
      referenceCitations: vm.referenceCitations,
      referenceVideo: vm.referenceVideo,
      referenceRichText: vm.referenceRichText,
      referenceRichEmbeds: vm.referenceRichEmbeds,
      scientistStories: vm.scientistStories,
    },
  });

  const hasPendingChangesRef = React.useRef(autosave.hasPendingChanges);
  React.useEffect(() => {
    hasPendingChangesRef.current = autosave.hasPendingChanges;
  }, [autosave.hasPendingChanges]);

  React.useEffect(() => {
    const handleUnload = () => {
      if (hasPendingChangesRef.current) {
        actions.saveDraft({ silent: true });
      }
    };
    window.addEventListener("beforeunload", handleUnload);
    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      if (hasPendingChangesRef.current) {
        actions.saveDraft({ silent: true });
      }
    };
  }, [actions.saveDraft]);

  return <ExperimentEditorShell vm={vm} actions={actions} autosave={autosave} />;
}
