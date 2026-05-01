"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { sonnerToast, type RichMediaEmbed } from "@bs-lab/ui";

import type { CoreApiActor } from "@/lib/core-api-shared";
import type { V2DictGradeItem, V2DictItem, V2ExpMsgDetail } from "@/lib/v2/v2-exp-api";
import { fetchV2ExpDetail } from "@/lib/v2/v2-exp-api";
import { V2ApiServiceError } from "@/lib/v2/apiService";
import type { EducationPhase, SubjectDiscipline } from "@/types/subject";

import type { ExperimentScientistStoryDraft, PhaseKey } from "../types";
import { buildEditorHydrationFromV2Detail } from "../utils/build-editor-hydration-from-v2-detail";

export function useEditorAiOutlinePrefill(
  prefillAiOutline: boolean,
  expId: string | null,
  _setSummary: (v: string) => void,
  _setTeachingContextContent: (v: string) => void,
  _setScienceStory: (v: string) => void,
  _setCurriculum: (v: string) => void,
) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  React.useEffect(() => {
    if (expId) return;
    if (!prefillAiOutline) return;
    const next = new URLSearchParams(searchParams.toString());
    if (!next.has("prefillAiOutline")) return;
    next.delete("prefillAiOutline");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    sonnerToast.message("未使用浏览器存储载入大纲", {
      description: "AI 预填请通过课标/服务端入口下发；可手动粘贴到表单。",
    });
  }, [expId, pathname, prefillAiOutline, router, searchParams]);
}

export function useEditorExperimentHydration(
  expId: string | null,
  actor: CoreApiActor | null,
  grades: V2DictGradeItem[],
  subjects: V2DictItem[],
  userName: string,
  setExpName: (v: string) => void,
  setChooseType: (v: "y" | "n" | null) => void,
  setExpTaskType: (v: "hw" | "tk" | "self" | null) => void,
  setSubjectId: (v: string | null) => void,
  setSchoolLevelId: (v: string | null) => void,
  setGradeId: (v: string | null) => void,
  setPhase: (v: PhaseKey) => void,
  setDiscipline: (v: SubjectDiscipline) => void,
  setSelectedGradeCodes: React.Dispatch<React.SetStateAction<string[]>>,
  setListFilterPhases: React.Dispatch<React.SetStateAction<EducationPhase[]>>,
  setListFilterDisciplines: React.Dispatch<React.SetStateAction<SubjectDiscipline[]>>,
  setListFilterGradeCodes: React.Dispatch<React.SetStateAction<string[]>>,
  setSummary: (v: string) => void,
  setDurationMin: (v: string) => void,
  setSimulatorUrl: (v: string) => void,
  setDifficultyId: (v: string) => void,
  setMainVideoUrl: (v: string) => void,
  setMainVideoId: (v: string | null) => void,
  setCurriculum: (v: string) => void,
  setTeachingContextContent: (v: string) => void,
  setTeachingContextEmbeds: React.Dispatch<React.SetStateAction<RichMediaEmbed[]>>,
  setPrinciple: (v: string) => void,
  setPrincipleEmbeds: React.Dispatch<React.SetStateAction<RichMediaEmbed[]>>,
  setSafetyNotes: (v: string) => void,
  setSafetyEmbeds: React.Dispatch<React.SetStateAction<RichMediaEmbed[]>>,
  setDangerNotes: (v: string) => void,
  setDangerEmbeds: React.Dispatch<React.SetStateAction<RichMediaEmbed[]>>,
  setScientistStories: React.Dispatch<React.SetStateAction<ExperimentScientistStoryDraft[]>>,
  setResultEntries: (v: import("../types").ExperimentResultEntryDraft[]) => void,
  setCreatorName: (v: string) => void,
  setMaterials: (v: import("../types").ExperimentMaterialDraft[]) => void,
  setSteps: (v: import("../types").ExperimentStepDraft[]) => void,
  setCoursebookId: (v: string) => void,
  setUnitId: (v: string) => void,
  setReferenceCitations: (v: import("../types").ExperimentReferenceCitationDraft[]) => void,
  setReferenceRichText: (v: string) => void,
  setReferenceRichEmbeds: React.Dispatch<React.SetStateAction<RichMediaEmbed[]>>,
): { v2Detail: V2ExpMsgDetail | null; loadError: null | "not_found" | "error" } {
  const fetchSeq = React.useRef(0);
  const [v2Detail, setV2Detail] = React.useState<V2ExpMsgDetail | null>(null);
  const [loadError, setLoadError] = React.useState<null | "not_found" | "error">(null);

  const gradesRef = React.useRef(grades);
  const subjectsRef = React.useRef(subjects);
  React.useEffect(() => {
    gradesRef.current = grades;
    subjectsRef.current = subjects;
  }, [grades, subjects]);

  React.useEffect(() => {
    if (!expId || !actor?.userId) {
      setV2Detail(null);
      setLoadError(null);
      return;
    }
    const seq = ++fetchSeq.current;
    let cancelled = false;
    setV2Detail(null);
    setLoadError(null);
    void (async () => {
      try {
        const detail = await fetchV2ExpDetail(actor, expId);
        if (cancelled || seq !== fetchSeq.current) return;
        setV2Detail(detail);
        setLoadError(null);
      } catch (err) {
        if (cancelled || seq !== fetchSeq.current) return;
        setV2Detail(null);
        const http = V2ApiServiceError.getHttpStatus(err);
        if (http === 404) {
          setLoadError("not_found");
          return;
        }
        setLoadError("error");
        sonnerToast.error("实验详情加载失败", {
          description: V2ApiServiceError.getBusinessMessage(err),
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [actor, expId]);

  React.useEffect(() => {
    if (!expId || !v2Detail || v2Detail.expId !== expId) return;
    const g = gradesRef.current;
    const s = subjectsRef.current;
    if (g.length === 0 || s.length === 0) return;
    const p = buildEditorHydrationFromV2Detail(v2Detail, { grades: g, subjects: s, userName });
    setExpName(p.expName);
    setChooseType(p.chooseType);
    setExpTaskType(p.expTaskType);
    setSubjectId(p.subjectId);
    setSchoolLevelId(p.schoolLevelId);
    setGradeId(p.gradeId);
    setPhase(p.phase);
    setDiscipline(p.discipline);
    setSelectedGradeCodes(p.selectedGradeCodes.length ? p.selectedGradeCodes : ["S10"]);
    setListFilterPhases([p.phase]);
    setListFilterDisciplines([p.discipline]);
    setListFilterGradeCodes(p.selectedGradeCodes.length ? p.selectedGradeCodes : ["S10"]);
    setSummary(p.summary);
    setDurationMin(p.durationMin);
    setSimulatorUrl(p.simulatorUrl);
    setDifficultyId(p.difficultyId);
    setMainVideoUrl(p.mainVideoUrl);
    setMainVideoId(p.mainVideoId);
    setCurriculum(p.curriculum);
    setTeachingContextContent(p.teachingContextContent);
    setTeachingContextEmbeds(p.teachingContextEmbeds);
    setPrinciple(p.principle);
    setPrincipleEmbeds(p.principleEmbeds);
    setSafetyNotes(p.safetyNotes);
    setSafetyEmbeds(p.safetyEmbeds);
    setDangerNotes(p.dangerNotes);
    setDangerEmbeds(p.dangerEmbeds);
    setScientistStories(p.scientistStories);
    setReferenceCitations(p.referenceCitations);
    setReferenceRichText(p.referenceRichText);
    setReferenceRichEmbeds(p.referenceRichEmbeds);
    setMaterials(p.materials);
    setSteps(p.steps);
    setResultEntries(p.resultEntries);
    setCreatorName(p.creatorName);
    setCoursebookId(p.coursebookId);
    setUnitId(p.unitId);
  }, [
    expId,
    grades.length,
    subjects.length,
    userName,
    v2Detail,
    setChooseType,
    setExpTaskType,
    setCreatorName,
    setCurriculum,
    setDangerNotes,
    setDiscipline,
    setExpName,
    setGradeId,
    setListFilterDisciplines,
    setListFilterGradeCodes,
    setListFilterPhases,
    setDurationMin,
    setSimulatorUrl,
    setDifficultyId,
    setMainVideoUrl,
    setMainVideoId,
    setMaterials,
    setPhase,
    setPrinciple,
    setPrincipleEmbeds,
    setReferenceCitations,
    setSchoolLevelId,
    setResultEntries,
    setSafetyNotes,
    setSelectedGradeCodes,
    setSubjectId,
    setSteps,
    setSummary,
    setTeachingContextContent,
    setTeachingContextEmbeds,
    setCoursebookId,
    setUnitId,
    setSafetyEmbeds,
    setDangerEmbeds,
    setScientistStories,
    setReferenceRichText,
    setReferenceRichEmbeds,
  ]);

  return { v2Detail, loadError };
}
