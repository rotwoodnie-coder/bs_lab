"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import type { RichMediaEmbed, RichMediaValue } from "@bs-lab/ui";
import { sonnerToast } from "@bs-lab/ui";

import { useDemoRole } from "@/components/layout/demo-role-context";
import { useAuth } from "@/hooks/use-auth";
import { SUBJECT_CASCADE } from "@/data/subject-tree";
import { readCurriculumStandardsStoreCatalogSeedOnly } from "@/lib/curriculum-standards-storage";
import { canEditMaterialsAndStepContent, isSuperUserRole } from "@/lib/rbac/management-access";
import { fetchV2ExpLibraryById } from "@/lib/v2/v2-exp-api";
import type { CurriculumStandardsStore } from "@/types/curriculum-standard";
import type { EducationPhase, SubjectDiscipline } from "@/types/subject";

import { useEditorEngine } from "./use-editor-engine";
import { useEditorStore } from "./use-editor-store";
import { EDITOR_ANCHORS, getRolePermissions, phaseLabelOf } from "./editor-bootstrap-utils";
import { useEditorAiOutlinePrefill, useEditorExperimentHydration } from "./use-editor-bootstrap-hydrate";
import { useEditorBootstrapChecklist } from "./use-editor-bootstrap-checklist";
import { useEditorBootstrapCurriculumTable } from "./use-editor-bootstrap-curriculum-table";
import { useEditorBootstrapFlags } from "./use-editor-bootstrap-flags";
import { useEditorBootstrapPhaseSync } from "./use-editor-bootstrap-phase-sync";
import { useEditorBootstrapRuntime } from "./use-editor-bootstrap-runtime";
import { useEditorBootstrapStandardPrefill } from "./use-editor-bootstrap-standard-prefill";
import { useEditorV2PeerData } from "./use-editor-v2-peer-data";
import { useEditorAuxiliaryReference } from "./use-editor-auxiliary-reference";
import { useResultEntriesManagement } from "./use-result-entries-management";
import type { PhaseKey } from "../types";
import { buildEditorHydrationFromV2Library } from "../utils/build-editor-hydration-from-v2-library";
import { editorPeerRowFromV2ExpMsgItem } from "../utils/editor-peer-row-types";

export function useEditorBootstrap() {
  const searchParams = useSearchParams();
  const forkFrom = searchParams.get("forkFrom");
  const prefillAiOutline = searchParams.get("prefillAiOutline") === "1";
  const { role } = useDemoRole();
  const { user } = useAuth();
  // 权限门禁以真实登录用户为准；DemoRole 仅用于上下文（例如材料库 Actor）。
  const superUser = isSuperUserRole(user.role);
  const { isTeacher, isResearcher, contentEditable } = getRolePermissions(user);
  const materialsStepsEditable = canEditMaterialsAndStepContent(user);

  const expId = searchParams.get("id");
  const targetClassId = searchParams.get("classId") ?? searchParams.get("targetClassId");
  const deadline = searchParams.get("deadline");
  const requirement = searchParams.get("requirement") ?? "";
  const isAutoPublish = Boolean(targetClassId && searchParams.get("auto") === "1");
  const intervention = searchParams.get("intervention") === "1";
  const editorStore = useEditorStore();
  const editorEngine = useEditorEngine({
    anchors: [...EDITOR_ANCHORS],
    initialMaterials: [
      {
        id: "m1",
        nameLab: "铁架台",
        quantity: "1",
        materialType: "器材",
        nameHomeSubstitute: "",
        hazardFlags: [],
        safetyReminder: "",
        notes: "",
        thumbnailUrl: "",
      },
    ],
    initialSteps: [
      {
        id: "s1",
        title: "搭建装置",
        content: "固定悬点并确认摆球稳定。",
        contentEmbeds: [],
        expectedResult: "",
      },
    ],
  });
  const { step, canvas } = editorEngine;

  const [phase, setPhase] = React.useState<PhaseKey>("senior");
  const [discipline, setDiscipline] = React.useState<SubjectDiscipline>("physics");
  const [selectedGradeCodes, setSelectedGradeCodes] = React.useState<string[]>(["S10"]);
  const [experimentSearchKeyword, setExperimentSearchKeyword] = React.useState("");
  const [listFilterPhases, setListFilterPhases] = React.useState<EducationPhase[]>(["senior"]);
  const [listFilterDisciplines, setListFilterDisciplines] = React.useState<SubjectDiscipline[]>(["physics"]);
  const [listFilterGradeCodes, setListFilterGradeCodes] = React.useState<string[]>(["S10"]);
  const v2Peer = useEditorV2PeerData({
    keyword: experimentSearchKeyword,
    listPhases: listFilterPhases,
    listDisciplines: listFilterDisciplines,
    listGradeCodes: listFilterGradeCodes,
    page: 1,
    pageSize: experimentSearchKeyword.trim() ? 100 : 50,
  });
  const [selectedStandardId, setSelectedStandardId] = React.useState<string | null>(null);
  const [useCustomExperiment, setUseCustomExperiment] = React.useState(false);
  const [curriculumStore, setCurriculumStore] = React.useState<CurriculumStandardsStore | null>(null);

  const [summary, setSummary] = React.useState("");
  const [durationMin, setDurationMin] = React.useState("45");
  const [simulatorUrl, setSimulatorUrl] = React.useState("");
  const [difficultyId, setDifficultyId] = React.useState("");
  // 校验：确保 difficultyId 存在于当前学段的 difficultyOptions 中
  const setDifficultyIdSafe = React.useCallback(
    (v: string) => {
      // 如果为空串或不是有效 UUID，重置为空
      if (!v.trim() || !/^[a-f0-9-]{32,36}$/i.test(v.trim())) {
        setDifficultyId("");
        return;
      }
      setDifficultyId(v.trim());
    },
    [],
  );
  const [expName, setExpName] = React.useState("校本拓展 · 单摆与计时");
  const [chooseType, setChooseType] = React.useState<"y" | "n" | null>("y");
  const [expTaskType, setExpTaskType] = React.useState<"hw" | "tk" | "self" | null>(null);
  const [subjectId, setSubjectId] = React.useState<string | null>(null);
  const [schoolLevelId, setSchoolLevelId] = React.useState<string | null>(null);
  const [gradeId, setGradeId] = React.useState<string | null>(null);
  const [mainVideoId, setMainVideoId] = React.useState<string | null>(null);
  const [mainVideoUrl, setMainVideoUrl] = React.useState("");
  const [mainVideoPoster, setMainVideoPoster] = React.useState("");
  const [mainVideoEmbeds, setMainVideoEmbeds] = React.useState<RichMediaEmbed[]>([]);
  const [curriculum, setCurriculum] = React.useState("");
  const [creatorName, setCreatorName] = React.useState("");
  const [teachingContextContent, setTeachingContextContent] = React.useState("");
  const [teachingContextEmbeds, setTeachingContextEmbeds] = React.useState<RichMediaEmbed[]>([]);
  const [coursebookId, setCoursebookId] = React.useState("");
  const [unitId, setUnitId] = React.useState("");
  const setTeachingContextRich = React.useCallback((next: RichMediaValue) => {
    setTeachingContextContent(next.text);
    setTeachingContextEmbeds(next.embeds);
  }, []);
  const [principle, setPrinciple] = React.useState("");
  const [principleImage, setPrincipleImage] = React.useState("");
  const [principleVideo, setPrincipleVideo] = React.useState("");
  const [principleEmbeds, setPrincipleEmbeds] = React.useState<RichMediaEmbed[]>([]);
  const {
    resultEntries,
    setResultEntries,
    addResultEntry,
    removeResultEntry,
    updateResultEntry,
    updateResultRichContent,
    reorderResultEntry,
  } = useResultEntriesManagement();
  const [safetyNotes, setSafetyNotes] = React.useState("");
  const [safetyEmbeds, setSafetyEmbeds] = React.useState<RichMediaEmbed[]>([]);
  const [dangerNotes, setDangerNotes] = React.useState("");
  const [dangerEmbeds, setDangerEmbeds] = React.useState<RichMediaEmbed[]>([]);
  const auxiliaryReference = useEditorAuxiliaryReference();

  const [rejectOpen, setRejectOpen] = React.useState(false);
  const [rejectDraft, setRejectDraft] = React.useState("");
  const { rtSafety, setRtSafety, rtMaterial, setRtMaterial, saveRuntimeConfig } = useEditorBootstrapRuntime(
    intervention,
    expId,
  );

  React.useEffect(() => setCreatorName(user.userName), [user.userName]);
  React.useEffect(() => setCurriculumStore(readCurriculumStandardsStoreCatalogSeedOnly()), []);

  const phaseOpt = React.useMemo(() => SUBJECT_CASCADE.find((x) => x.phase === phase), [phase]);
  const phaseDisciplines = React.useMemo(() => phaseOpt?.disciplines ?? [], [phaseOpt]);
  const disciplineOptions = React.useMemo(
    () => phaseDisciplines.map((d) => ({ id: d.discipline, label: d.label })),
    [phaseDisciplines],
  );
  const gradeOptions = React.useMemo(() => {
    // 跨学段、学科对应的所有年级（不与选段绑定）
    if (!discipline) return [];
    const gradesMap = new Map<string, string>();
    for (const phase of SUBJECT_CASCADE) {
      const disc = phase.disciplines.find((d) => d.discipline === discipline);
      if (disc?.grades) {
        for (const g of disc.grades) {
          if (!gradesMap.has(g.code)) gradesMap.set(g.code, g.label);
        }
      }
    }
    return [...gradesMap.entries()].map(([code, label]) => ({ code, label }));
  }, [discipline]);

  useEditorBootstrapPhaseSync(phaseDisciplines, gradeOptions, setDiscipline, setSelectedGradeCodes);

  const disciplineLabel = React.useMemo(
    () => disciplineOptions.find((x) => x.id === discipline)?.label ?? discipline,
    [discipline, disciplineOptions],
  );
  const selectedGradeLabels = React.useMemo(() => {
    const map = new Map(gradeOptions.map((g) => [g.code, g.label] as const));
    return selectedGradeCodes.map((code) => map.get(code) ?? code);
  }, [gradeOptions, selectedGradeCodes]);

  const listDisciplineOptions = React.useMemo(() => {
    const phs = listFilterPhases.length ? listFilterPhases : SUBJECT_CASCADE.map((p) => p.phase);
    const map = new Map<SubjectDiscipline, string>();
    for (const ph of SUBJECT_CASCADE.filter((p) => phs.includes(p.phase))) {
      for (const d of ph.disciplines) {
        if (!map.has(d.discipline)) map.set(d.discipline, d.label);
      }
    }
    return [...map.entries()].map(([id, label]) => ({ id, label }));
  }, [listFilterPhases]);

  const listGradeOptions = React.useMemo(() => {
    const phs = listFilterPhases.length ? listFilterPhases : SUBJECT_CASCADE.map((p) => p.phase);
    const discSet = listFilterDisciplines.length > 0 ? new Set(listFilterDisciplines) : null;
    const map = new Map<string, string>();
    for (const ph of SUBJECT_CASCADE.filter((p) => phs.includes(p.phase))) {
      for (const d of ph.disciplines) {
        if (discSet && !discSet.has(d.discipline)) continue;
        for (const g of d.grades) {
          if (!map.has(g.code)) map.set(g.code, g.label);
        }
      }
    }
    return [...map.entries()].map(([code, label]) => ({ code, label }));
  }, [listFilterDisciplines, listFilterPhases]);

  React.useEffect(() => {
    const allowed = new Set(listDisciplineOptions.map((o) => o.id));
    setListFilterDisciplines((prev) => {
      const next = prev.filter((d) => allowed.has(d));
      if (next.length === prev.length && next.every((d, i) => d === prev[i])) return prev;
      return next;
    });
  }, [listDisciplineOptions]);

  React.useEffect(() => {
    const allowed = new Set(listGradeOptions.map((g) => g.code));
    setListFilterGradeCodes((prev) => {
      const next = prev.filter((c) => allowed.has(c));
      if (next.length === prev.length && next.every((c, i) => c === prev[i])) return prev;
      return next;
    });
  }, [listGradeOptions]);

  const listFilterPhaseLabels = React.useMemo(
    () =>
      listFilterPhases.length === 0
        ? "不限学段"
        : listFilterPhases.map((ph) => SUBJECT_CASCADE.find((x) => x.phase === ph)?.label ?? ph).join("、"),
    [listFilterPhases],
  );
  const listFilterDisciplineSummary = React.useMemo(() => {
    if (listFilterDisciplines.length === 0) return "全部学科";
    return listFilterDisciplines.map((d) => listDisciplineOptions.find((o) => o.id === d)?.label ?? d).join("、");
  }, [listDisciplineOptions, listFilterDisciplines]);
  const listFilterGradeSummary = React.useMemo(() => {
    if (listFilterGradeCodes.length === 0) return "全部年级";
    const m = new Map(listGradeOptions.map((g) => [g.code, g.label] as const));
    return listFilterGradeCodes.map((c) => m.get(c) ?? c).join("、");
  }, [listFilterGradeCodes, listGradeOptions]);

  const rowsInOrg = v2Peer.peerRows;

  const { curriculumTableRows, curriculumTable } = useEditorBootstrapCurriculumTable({
    experimentRows: rowsInOrg,
    listFilterPhases,
    listFilterDisciplines,
    listFilterGradeCodes,
    searchKeyword: experimentSearchKeyword,
    selectedStandardId,
    targetClassId,
    setSelectedStandardId,
    setCurriculum,
    useCustomExperiment,
  });

  useEditorBootstrapStandardPrefill({ searchParams, setCurriculum, setSelectedStandardId, setUseCustomExperiment });

  const { materials, steps, setMaterials, setSteps } = step;

  const attachExperimentFromList = React.useCallback(
    async (pickedLibExpId: string) => {
      if (!pickedLibExpId?.trim()) return;
      if (!v2Peer.actor.userId) {
        sonnerToast.error("未登录", { description: "请先登录后再选择关联实验。" });
        return;
      }
      if (v2Peer.grades.length === 0 || v2Peer.subjects.length === 0) {
        sonnerToast.message("正在加载字典…", { description: "请稍后再试。" });
        return;
      }
      try {
        const lib = await fetchV2ExpLibraryById(v2Peer.actor, pickedLibExpId.trim());
        const p = buildEditorHydrationFromV2Library(lib, {
          grades: v2Peer.grades,
          subjects: v2Peer.subjects,
          userName: user.userName,
        });

        // 选中并切回“实验列表”模式
        setUseCustomExperiment(false);
        setSelectedStandardId(pickedLibExpId.trim());

        // 同步表单核心字段（允许后续二次修改，以修改后的保存）
        setPhase(p.phase);
        setDiscipline(p.discipline);
        setSelectedGradeCodes(p.selectedGradeCodes.length ? p.selectedGradeCodes : ["S10"]);

        // 同步“列表筛选”三维，避免左侧筛选与当前关联实验不一致
        setListFilterPhases([p.phase]);
        setListFilterDisciplines([p.discipline]);
        setListFilterGradeCodes(p.selectedGradeCodes.length ? p.selectedGradeCodes : ["S10"]);

        // 基本信息与媒体
        setExpName(p.expName);
        setSummary(p.summary);
        setDurationMin(p.durationMin);
        setMainVideoId(p.mainVideoId);
        setMainVideoUrl(p.mainVideoUrl);
        setMainVideoEmbeds(p.mainVideoUrl ? [{ id: `picked-main-video-${pickedLibExpId}`, kind: "video", src: p.mainVideoUrl }] : []);

        // 参与度（必做/选做）
        setChooseType(p.chooseType);
        setSubjectId(p.subjectId);
        setSchoolLevelId(p.schoolLevelId);
        setGradeId(p.gradeId);

        // 其余区块（整包带入）
        setCurriculum(p.curriculum);
        setTeachingContextContent(p.teachingContextContent);
        setTeachingContextEmbeds(p.teachingContextEmbeds);

        setPrinciple(p.principle);
        setPrincipleEmbeds(p.principleEmbeds);

        setSafetyNotes(p.safetyNotes);
        setSafetyEmbeds(p.safetyEmbeds);
        setDangerNotes(p.dangerNotes);
        setDangerEmbeds(p.dangerEmbeds);

        auxiliaryReference.setScientistStories(p.scientistStories);

        auxiliaryReference.setReferenceCitations(p.referenceCitations);
        auxiliaryReference.setReferenceRichText(p.referenceRichText);
        auxiliaryReference.setReferenceRichEmbeds(p.referenceRichEmbeds);

        setMaterials(p.materials);
        setSteps(p.steps);
        setResultEntries(p.resultEntries);
        setCreatorName(p.creatorName);

        sonnerToast.success("已关联标准试验库并带入可用字段", { description: pickedLibExpId.trim() });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "加载失败";
        sonnerToast.error("关联失败", { description: msg });
      }
    },
    [
      auxiliaryReference,
      setCreatorName,
      setDangerEmbeds,
      setDangerNotes,
      setDiscipline,
      setListFilterDisciplines,
      setListFilterGradeCodes,
      setListFilterPhases,
      setMainVideoEmbeds,
      setMainVideoUrl,
      setMaterials,
      setPhase,
      setPrinciple,
      setPrincipleEmbeds,
      setSafetyEmbeds,
      setSafetyNotes,
      setSelectedGradeCodes,
      setSelectedStandardId,
      setSteps,
      setSummary,
      setTeachingContextContent,
      setTeachingContextEmbeds,
      setUseCustomExperiment,
      setCurriculum,
      setDurationMin,
      setResultEntries,
      user.userName,
      v2Peer.actor,
      v2Peer.grades,
      v2Peer.subjects,
    ],
  );
  const { completionPct, anchorsWithStatus } = useEditorBootstrapChecklist({
    subjectId,
    chooseType,
    expName,
    phase,
    discipline,
    creatorName,
    selectedGradeCodes,
    curriculum,
    teachingContextContent,
    teachingContextEmbeds,
    principle,
    principleImage,
    principleVideo,
    principleEmbeds,
    materials,
    steps,
    resultEntries,
    safetyNotes,
    safetyEmbeds,
    dangerNotes,
    dangerEmbeds,
    referenceCitations: auxiliaryReference.referenceCitations,
    referenceVideo: auxiliaryReference.referenceVideo,
    scienceStory: auxiliaryReference.scientistStories[0]?.storyComments ?? "",
    scienceStoryEmbeds: [],
    scientistName: auxiliaryReference.scientistStories[0]?.scientistName ?? "",
    summary,
    durationMin,
  });

  useEditorAiOutlinePrefill(
    prefillAiOutline,
    expId,
    setSummary,
    setTeachingContextContent,
    (v) => {
      auxiliaryReference.setScientistStories((prev) => {
        if (prev.length === 0) return [{ id: "sci-ai-1", scientistName: "", storyName: "", storyComments: v }];
        return prev.map((s, idx) => (idx === 0 ? { ...s, storyComments: v } : s));
      });
    },
    setCurriculum,
  );
  const { v2Detail: hydratedV2Detail, loadError: expDetailLoadError } = useEditorExperimentHydration(
    expId,
    v2Peer.actor.userId ? v2Peer.actor : null,
    v2Peer.grades,
    v2Peer.subjects,
    user.userName,
    setExpName,
    setChooseType,
    setExpTaskType,
    setSubjectId,
    setSchoolLevelId,
    setGradeId,
    setPhase,
    setDiscipline,
    setSelectedGradeCodes,
    setListFilterPhases,
    setListFilterDisciplines,
    setListFilterGradeCodes,
    setSummary,
    setDurationMin,
    setSimulatorUrl,
    setDifficultyId,
    setMainVideoUrl,
    setMainVideoId,
    setCurriculum,
    setTeachingContextContent,
    setTeachingContextEmbeds,
    setPrinciple,
    setPrincipleEmbeds,
    setSafetyNotes,
    setSafetyEmbeds,
    setDangerNotes,
    setDangerEmbeds,
    auxiliaryReference.setScientistStories,
    setResultEntries,
    setCreatorName,
    setMaterials,
    setSteps,
    setCoursebookId,
    setUnitId,
    auxiliaryReference.setReferenceCitations,
    auxiliaryReference.setReferenceRichText,
    auxiliaryReference.setReferenceRichEmbeds,
  );
  React.useEffect(() => {
    setPrincipleEmbeds((prev) => {
      if (prev.length > 0) return prev;
      const seeded: RichMediaEmbed[] = [];
      if (principleImage) seeded.push({ id: "legacy-principle-image", kind: "image", src: principleImage });
      if (principleVideo) seeded.push({ id: "legacy-principle-video", kind: "video", src: principleVideo });
      return seeded;
    });
  }, [principleImage, principleVideo]);
  React.useEffect(() => {
    setMainVideoEmbeds((prev) => {
      if (prev.length > 0) return prev;
      if (!mainVideoUrl) return prev;
      return [{ id: mainVideoId ?? "legacy-main-video", kind: "video", src: mainVideoUrl }];
    });
  }, [mainVideoId, mainVideoUrl]);

  const row = React.useMemo(() => {
    if (!expId) return undefined;
    if (expDetailLoadError === "not_found") return undefined;
    if (hydratedV2Detail && hydratedV2Detail.expId === expId) {
      return editorPeerRowFromV2ExpMsgItem(hydratedV2Detail, {
        subjects: v2Peer.subjects,
        grades: v2Peer.grades,
      });
    }
    return v2Peer.peerRows.find((r) => r.id === expId);
  }, [expDetailLoadError, expId, hydratedV2Detail, v2Peer.grades, v2Peer.peerRows, v2Peer.subjects]);

  const isOwner = React.useMemo(() => {
    if (!expId) return true;
    const ownerId = (hydratedV2Detail?.createUserId ?? "").trim();
    const actorId = (user.userId ?? "").trim();
    if (!ownerId || !actorId) return true;
    return ownerId === actorId;
  }, [expId, hydratedV2Detail?.createUserId, user.userId]);

  // 超级管理员允许跨作者编辑；研究员角色默认只读，但不应影响超级管理员。
  const fieldDisabled = !contentEditable || (!superUser && isResearcher) || (!superUser && !isOwner && Boolean(expId));
  const materialsStepsDisabled = !materialsStepsEditable;
  // 如果该实验已被布置为作业（taskInfo 非空），禁止修改任务类型
  const expTaskTypeDisabled = Boolean(hydratedV2Detail?.taskInfo?.targetClassId);
  const {
    workflowLabel,
    lifecycleLabel,
    showResearcherReviewBar,
    showResearcherTakedown,
    showRejectBanner,
    showResearcherNoopHint,
  } = useEditorBootstrapFlags(expId, row, isTeacher, isResearcher);

  return {
    expId,
    forkFrom,
    intervention,
    user,
    expDetailLoadError,
    row,
    isOwner,
    superUser,
    expName,
    chooseType,
    expTaskType,
    subjectId,
    schoolLevelId,
    gradeId,
    phase,
    discipline,
    selectedGradeCodes,
    experimentSearchKeyword,
    selectedStandardId,
    useCustomExperiment,
    curriculumStore,
    summary,
    durationMin,
    simulatorUrl,
    difficultyId,
    mainVideoId,
    mainVideoPoster,
    mainVideoUrl,
    mainVideoEmbeds,
    curriculum,
    creatorName,
    teachingContextContent,
    teachingContextEmbeds,
    coursebookId,
    unitId,
    principle,
    principleImage,
    principleVideo,
    principleEmbeds,
    resultEntries,
    safetyNotes,
    safetyEmbeds,
    dangerNotes,
    dangerEmbeds,
    referenceCitations: auxiliaryReference.referenceCitations,
    referenceVideo: auxiliaryReference.referenceVideo,
    referenceRichText: auxiliaryReference.referenceRichText,
    referenceRichEmbeds: auxiliaryReference.referenceRichEmbeds,
    scientistStories: auxiliaryReference.scientistStories,
    step,
    canvas,
    completionPct,
    isTeacher,
    isResearcher,
    contentEditable,
    materialsStepsEditable,
    disciplineOptions,
    gradeOptions,
    disciplineLabel,
    phaseLabel: phaseLabelOf(phase),
    selectedGradeLabels,
    listFilterPhases,
    listFilterDisciplines,
    listFilterGradeCodes,
    listDisciplineOptions,
    listGradeOptions,
    listFilterPhaseLabels,
    listFilterDisciplineSummary,
    listFilterGradeSummary,
    curriculumTableRows,
    curriculumTable,
    anchorsWithStatus,
    fieldDisabled,
    materialsStepsDisabled,
    expTaskTypeDisabled,
    workflowLabel,
    lifecycleLabel,
    showResearcherReviewBar,
    showResearcherTakedown,
    showResearcherNoopHint,
    showRejectBanner,
    rejectOpen,
    setRejectOpen,
    rejectDraft,
    setRejectDraft,
    rtSafety,
    setRtSafety,
    rtMaterial,
    setRtMaterial,
    saveRuntimeConfig,
    setPhase,
    setDiscipline,
    setSelectedGradeCodes,
    setListFilterPhases,
    setListFilterDisciplines,
    setListFilterGradeCodes,
    setExperimentSearchKeyword,
    setSelectedStandardId,
    setUseCustomExperiment,
    setSummary,
    setDurationMin,
    setSimulatorUrl,
    setDifficultyId: setDifficultyIdSafe,
    setExpName,
    setChooseType,
    setExpTaskType,
    setSubjectId,
    setSchoolLevelId,
    setGradeId,
    setMainVideoId,
    setMainVideoPoster,
    setMainVideoUrl,
    setMainVideoEmbeds,
    setCurriculum,
    setTeachingContextRich,
    setTeachingContextContent,
    setTeachingContextEmbeds,
    setCoursebookId,
    setUnitId,
    setPrinciple,
    setPrincipleImage,
    setPrincipleVideo,
    setPrincipleEmbeds,
    setResultEntries,
    addResultEntry,
    removeResultEntry,
    updateResultEntry,
    updateResultRichContent,
    reorderResultEntry,
    setSafetyNotes,
    setSafetyEmbeds,
    setDangerNotes,
    setDangerEmbeds,
    setReferenceCitations: auxiliaryReference.setReferenceCitations,
    setReferenceVideo: auxiliaryReference.setReferenceVideo,
    setReferenceRichText: auxiliaryReference.setReferenceRichText,
    setReferenceRichEmbeds: auxiliaryReference.setReferenceRichEmbeds,
    addReferenceCitation: auxiliaryReference.addReferenceCitation,
    removeReferenceCitation: auxiliaryReference.removeReferenceCitation,
    updateReferenceCitation: auxiliaryReference.updateReferenceCitation,
    setScientistStories: auxiliaryReference.setScientistStories,
    addScientistStory: auxiliaryReference.addScientistStory,
    removeScientistStory: auxiliaryReference.removeScientistStory,
    updateScientistStory: auxiliaryReference.updateScientistStory,
    attachExperimentFromList,
    targetClassId,
    v2Actor: v2Peer.actor,
    v2Subjects: v2Peer.subjects,
    v2Grades: v2Peer.grades,
    v2Difficulties: v2Peer.difficulties,
    v2Securities: v2Peer.securities,
    v2Loading: v2Peer.loading,
    refreshV2PeerList: v2Peer.refresh,
  };
}
