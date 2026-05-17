"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { sonnerToast } from "@bs-lab/ui";
import type { RichMediaEmbed } from "@bs-lab/ui";

import { useDemoRole } from "@/components/layout/demo-role-context";
import { useAuth } from "@/hooks/use-auth";
import { SUBJECT_CASCADE } from "@/data/subject-tree";
import { readCurriculumStandardsStoreCatalogSeedOnly } from "@/lib/curriculum-standards-storage";
import { canEditMaterialsAndStepContent, isSuperUserRole } from "@/lib/rbac/management-access";
import { fetchV2ExpDetail, fetchV2ExpLibraryById, type V2ExpMsgDetail } from "@/lib/v2/v2-exp-api";
import { V2ApiServiceError } from "@/lib/v2/apiService";
import type { CurriculumStandardsStore } from "@/types/curriculum-standard";
import type { EducationPhase, SubjectDiscipline } from "@/types/subject";
import { applyAutofillToForm } from "@/lib/experiment-autofill";
import { resolveExpTaxonomyIds } from "../utils/resolve-exp-taxonomy-ids";

import { useEditorStore } from "./use-editor-store";
import { EDITOR_ANCHORS, getRolePermissions, phaseLabelOf } from "./editor-bootstrap-utils";
import { useEditorAiOutlinePrefill } from "./use-editor-bootstrap-hydrate";
import { useEditorBootstrapChecklist } from "./use-editor-bootstrap-checklist";
import { useEditorBootstrapCurriculumTable } from "./use-editor-bootstrap-curriculum-table";
import { useEditorBootstrapFlags } from "./use-editor-bootstrap-flags";
import { useEditorBootstrapPhaseSync } from "./use-editor-bootstrap-phase-sync";
import { useEditorBootstrapRuntime } from "./use-editor-bootstrap-runtime";
import { useEditorBootstrapStandardPrefill } from "./use-editor-bootstrap-standard-prefill";
import { useEditorV2PeerData } from "./use-editor-v2-peer-data";
import type { PhaseKey } from "../types";
import { buildEditorHydrationFromV2Library } from "../utils/build-editor-hydration-from-v2-library";
import { buildEditorHydrationFromV2Detail } from "../utils/build-editor-hydration-from-v2-detail";
import { editorPeerRowFromV2ExpMsgItem } from "../utils/editor-peer-row-types";

export function useEditorBootstrap() {
  const searchParams = useSearchParams();
  const forkFrom = searchParams.get("forkFrom");
  const prefillAiOutline = searchParams.get("prefillAiOutline") === "1";
  const { role } = useDemoRole();
  const { user } = useAuth();
  const superUser = isSuperUserRole(user.role);
  const { isTeacher, isResearcher, contentEditable } = getRolePermissions(user);
  const materialsStepsEditable = canEditMaterialsAndStepContent(user);

  const expId = searchParams.get("id");
  const targetClassId = searchParams.get("classId") ?? searchParams.get("targetClassId");
  const deadline = searchParams.get("deadline");
  const requirement = searchParams.get("requirement") ?? "";
  const isAutoPublish = Boolean(targetClassId && searchParams.get("auto") === "1");
  const intervention = searchParams.get("intervention") === "1";

  // 从 Zustand store 读取状态
  const store = useEditorStore();

  // ── UI 独立状态（不与 store 混在一起） ──
  const [experimentSearchKeyword, setExperimentSearchKeyword] = React.useState("");
  const [listFilterPhases, setListFilterPhases] = React.useState<EducationPhase[]>([]);
  const [listFilterDisciplines, setListFilterDisciplines] = React.useState<SubjectDiscipline[]>([]);
  const [listFilterGradeCodes, setListFilterGradeCodes] = React.useState<string[]>([]);

  const v2Peer = useEditorV2PeerData({
    keyword: experimentSearchKeyword,
    listPhases: listFilterPhases,
    listDisciplines: listFilterDisciplines,
    listGradeCodes: listFilterGradeCodes,
    page: 1,
    pageSize: 100,
  });

  const [linkedStandardName, setLinkedStandardName] = React.useState<string | null>(null);
  const [curriculumStore, setCurriculumStore] = React.useState<CurriculumStandardsStore | null>(null);
  const setMainVideoId = React.useCallback(
    (v: string | null) => store.setField("mainVideoId", v),
    [store],
  );
  const setMainVideoUrl = React.useCallback(
    (v: string) => store.setField("mainVideoUrl", v),
    [store],
  );
  const [mainVideoPoster, setMainVideoPoster] = React.useState("");

  React.useEffect(() => setCurriculumStore(readCurriculumStandardsStoreCatalogSeedOnly()), []);
  React.useEffect(() => {
    if (!store.selectedStandardId?.trim()) {
      setLinkedStandardName(null);
    }
  }, [store.selectedStandardId]);

  // ── Store 初始化（actor、权限、分发上下文） ──
  const initRef = React.useRef(false);
  React.useEffect(() => {
    if (!v2Peer.actor.userId) return;
    if (initRef.current) return;
    initRef.current = true;
    store.initialize({
      expId: expId ?? null,
      forkFrom: forkFrom ?? null,
      actor: v2Peer.actor,
      isOwner: !expId,
      fieldDisabled: !contentEditable || (!superUser && isResearcher),
      materialsStepsDisabled: !materialsStepsEditable,
      expTaskTypeDisabled: false,
      targetClassId: targetClassId ?? null,
      deadline: deadline ?? null,
      requirement,
    });
  }, [v2Peer.actor.userId]);

  // ── 初始 hydration ──
  React.useEffect(() => {
    if (!expId || !v2Peer.actor.userId) return;
    let cancelled = false;
    void (async () => {
      try {
        const detail = await fetchV2ExpDetail(v2Peer.actor, expId);
        if (cancelled) return;
        if (detail.status !== "y") return; // 仅已发布的实验才能用于 hydration
        store.hydrateFromDetail(detail, {
          grades: v2Peer.grades,
          subjects: v2Peer.subjects,
          userName: user.userName,
        });
        // 根据材料安全标签重建安全标识勾选状态
        store.reconcileSecurityDrafts(
          (detail as V2ExpMsgDetail & { materialSecurityIds?: string[] }).materialSecurityIds ?? [],
          v2Peer.securities,
          detail.security ?? [],
        );
      } catch {
        // 静默处理
      }
    })();
    return () => { cancelled = true; };
  }, [expId, v2Peer.actor.userId]);

  // ── 从标准库加载（forkFrom） ──
  React.useEffect(() => {
    if (!forkFrom || !v2Peer.actor.userId) return;
    let cancelled = false;
    void (async () => {
      try {
        const lib = await fetchV2ExpLibraryById(v2Peer.actor, forkFrom);
        if (cancelled) return;
        const p = buildEditorHydrationFromV2Library(lib, {
          subjects: v2Peer.subjects,
          grades: v2Peer.grades,
          userName: user.userName,
        });
        store.setField("expName", p.expName);
        store.setField("subjectId", p.subjectId);
        store.setField("schoolLevelId", p.schoolLevelId);
        store.setField("gradeId", p.gradeId);
        store.setField("chooseType", p.chooseType);
        store.setField("curriculum", p.curriculum);
        store.setField("summary", p.summary);
        store.setField("durationMin", p.durationMin);
        store.setField("difficultyId", p.difficultyId);
        store.setField("principle", p.principle);
        store.setField("principleEmbeds", p.principleEmbeds);
        store.setField("teachingContextContent", p.teachingContextContent);
        store.setField("teachingContextEmbeds", p.teachingContextEmbeds);
        store.setField("materials", p.materials);
        store.setField("steps", p.steps);
        store.setField("resultEntries", p.resultEntries);
        store.setField("referenceCitations", p.referenceCitations);
        store.setField("scientistStories", p.scientistStories);
        store.setReferenceVideos(
          p.referenceVideos.map((v, idx) => ({
            id: `refvid-${idx + 1}`,
            videoUrl: v.videoUrl,
            fileId: null,
            sortOrder: v.sortOrder ?? idx,
          })),
        );
      } catch {
        // 静默
      }
    })();
    return () => { cancelled = true; };
  }, [forkFrom, v2Peer.actor.userId]);

  const phaseOpt = React.useMemo(() => SUBJECT_CASCADE.find((x) => x.phase === store.phase), [store.phase]);
  const phaseDisciplines = React.useMemo(() => phaseOpt?.disciplines ?? [], [phaseOpt]);
  const disciplineOptions = React.useMemo(
    () => phaseDisciplines.map((d) => ({ id: d.discipline, label: d.label })),
    [phaseDisciplines],
  );
  const gradeOptions = React.useMemo(() => {
    const subjectId = store.subjectId?.trim();
    const levelId = store.schoolLevelId?.trim();
    if (!subjectId || !levelId) return [];

    // 从 gradeSubjects 中找到该学科允许的年级 ID 集合
    const gradeIds = new Set(
      v2Peer.gradeSubjects
        .filter((gs) => gs.subjectId === subjectId)
        .map((gs) => gs.gradeId),
    );

    // 过滤：年级必须属于该学段，且在该学科的允许列表中
    return v2Peer.grades.filter(
      (g) => gradeIds.has(g.id) && String(g.levelId ?? "").trim() === levelId,
    );
  }, [store.subjectId, store.schoolLevelId, v2Peer.gradeSubjects, v2Peer.grades]);

  // 为 phase sync 提供兼容的 setter 包装（Zustand setField 不支持 updater 函数）
  const setDisciplineForSync = React.useCallback(
    (updater: SubjectDiscipline | ((prev: SubjectDiscipline) => SubjectDiscipline)) => {
      if (typeof updater === "function") {
        const current = useEditorStore.getState().discipline;
        const next = updater(current);
        store.setField("discipline", next);
      } else {
        store.setField("discipline", updater);
      }
    },
    [store],
  );
  const setSelectedGradeCodesForSync = React.useCallback(
    (updater: string[] | ((prev: string[]) => string[])) => {
      if (typeof updater === "function") {
        const current = useEditorStore.getState().selectedGradeCodes;
        const next = updater(current);
        store.setField("selectedGradeCodes", next);
      } else {
        store.setField("selectedGradeCodes", updater);
      }
    },
    [store],
  );

  useEditorBootstrapPhaseSync(phaseDisciplines, gradeOptions, setDisciplineForSync, setSelectedGradeCodesForSync);

  const disciplineLabel = React.useMemo(
    () => disciplineOptions.find((x) => x.id === store.discipline)?.label ?? store.discipline,
    [store.discipline, disciplineOptions],
  );
  const selectedGradeLabels = React.useMemo(() => {
    const map = new Map(gradeOptions.map((g) => [g.id, g.name] as const));
    return store.selectedGradeCodes.map((id) => map.get(id) ?? id);
  }, [gradeOptions, store.selectedGradeCodes]);

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

  const listDisciplineSig = React.useMemo(() => listDisciplineOptions.map((o) => o.id).join("|"), [listDisciplineOptions]);
  const listGradeSig = React.useMemo(() => listGradeOptions.map((g) => g.code).join("|"), [listGradeOptions]);

  React.useEffect(() => {
    const allowed = new Set(listDisciplineOptions.map((o) => o.id));
    setListFilterDisciplines((prev) => {
      const next = prev.filter((d) => allowed.has(d));
      if (next.length === prev.length && next.every((d, i) => d === prev[i])) return prev;
      return next;
    });
  }, [listDisciplineSig]);

  React.useEffect(() => {
    const allowed = new Set(listGradeOptions.map((g) => g.code));
    setListFilterGradeCodes((prev) => {
      const next = prev.filter((c) => allowed.has(c));
      if (next.length === prev.length && next.every((c, i) => c === prev[i])) return prev;
      return next;
    });
  }, [listGradeSig]);

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
    selectedStandardId: store.selectedStandardId,
    targetClassId,
    setSelectedStandardId: (v) => store.setField("selectedStandardId", v),
    setCurriculum: (v) => store.setField("curriculum", v),
    useCustomExperiment: store.useCustomExperiment,
  });

  useEditorBootstrapStandardPrefill({
    searchParams,
    setCurriculum: (v) => store.setField("curriculum", v),
    setSelectedStandardId: (v) => store.setField("selectedStandardId", v),
    setUseCustomExperiment: (v) => store.setField("useCustomExperiment", v),
  });

  // ── 自动预填（从关联实验） ──
  const autoFillFromLinkedExperiment = React.useCallback(
    async (strategy: "replace" | "mergeIfEmpty" | "merge", expIdOverride?: string) => {
      const linkedId = (expIdOverride ?? store.selectedStandardId)?.trim();
      if (!linkedId) {
        sonnerToast.error("请先关联实验", { description: "选择一个标准实验后再自动填写。" });
        return;
      }
      if (!v2Peer.actor.userId) {
        sonnerToast.error("未登录", { description: "请先登录后再自动填写。" });
        return;
      }
      try {
        const fallback = v2Peer.peerRows.find((r) => r.id === linkedId) ?? undefined;
        let payload: import("@/types/experiment-link").ExperimentFillPayload | null = null;

        if (fallback?.sourceType === "msg" && fallback.publishStatus === "y") {
          const detail = await fetchV2ExpDetail(v2Peer.actor, linkedId);
          const hyd = buildEditorHydrationFromV2Detail(detail, {
            subjects: v2Peer.subjects,
            grades: v2Peer.grades,
            userName: user.userName,
          });
          payload = {
            expName: hyd.expName || undefined,
            subjectId: hyd.subjectId || undefined,
            schoolLevelId: hyd.schoolLevelId || undefined,
            gradeId: hyd.gradeId || undefined,
            selectedGradeCodes: hyd.selectedGradeCodes?.length ? hyd.selectedGradeCodes : undefined,
            gradeIds: hyd.gradeIds?.length ? hyd.gradeIds : undefined,
            chooseType: hyd.chooseType,
            expTaskType: hyd.expTaskType,
            difficultyId: hyd.difficultyId || undefined,
            summary: hyd.summary || undefined,
            curriculum: hyd.curriculum || undefined,
            teachingContextContent: hyd.teachingContextContent || undefined,
            principle: hyd.principle || undefined,
            safetyNotes: hyd.safetyNotes || undefined,
            dangerNotes: hyd.dangerNotes || undefined,
            durationMin: hyd.durationMin || undefined,
            simulatorUrl: hyd.simulatorUrl || undefined,
            coursebookId: hyd.coursebookId || undefined,
            unitId: hyd.unitId || undefined,
            mainVideoUrl: hyd.mainVideoUrl || undefined,
            mainVideoEmbeds: hyd.mainVideoUrl
              ? [{ id: `autofill-video-${linkedId}`, kind: "video" as const, src: hyd.mainVideoUrl }]
              : undefined,
            materials: hyd.materials,
            steps: hyd.steps,
            resultEntries: hyd.resultEntries,
            referenceCitations: hyd.referenceCitations,
            scientistStories: hyd.scientistStories,
          };
        } else {
          const libItem = await fetchV2ExpLibraryById(v2Peer.actor, linkedId);
          const p = buildEditorHydrationFromV2Library(libItem, {
            subjects: v2Peer.subjects,
            grades: v2Peer.grades,
            userName: user.userName,
          });
          payload = {
            expName: p.expName || undefined,
            subjectId: p.subjectId || undefined,
            schoolLevelId: p.schoolLevelId || undefined,
            gradeId: p.gradeId || undefined,
            selectedGradeCodes: p.selectedGradeCodes?.length ? p.selectedGradeCodes : undefined,
            gradeIds: p.gradeIds?.length ? p.gradeIds : undefined,
            chooseType: p.chooseType,
            expTaskType: p.expTaskType,
            difficultyId: p.difficultyId || undefined,
            summary: p.summary || undefined,
            curriculum: p.curriculum || undefined,
            teachingContextContent: p.teachingContextContent || undefined,
            principle: p.principle || undefined,
            safetyNotes: p.safetyNotes || undefined,
            dangerNotes: p.dangerNotes || undefined,
            durationMin: p.durationMin || undefined,
            simulatorUrl: p.simulatorUrl || undefined,
            coursebookId: p.coursebookId || undefined,
            unitId: p.unitId || undefined,
            mainVideoUrl: fallback?.coverVideoUrl ?? undefined,
            mainVideoEmbeds: fallback?.coverVideoUrl
              ? [{ id: `autofill-video-${linkedId}`, kind: "video" as const, src: fallback.coverVideoUrl }]
              : undefined,
            materials: p.materials,
            steps: p.steps,
            resultEntries: p.resultEntries,
            referenceCitations: p.referenceCitations,
            scientistStories: p.scientistStories,
          };
        }
        const current = {
          expName: store.expName,
          subjectId: store.subjectId,
          schoolLevelId: store.schoolLevelId,
          gradeId: store.gradeId,
          selectedGradeCodes: store.selectedGradeCodes,
          gradeIds: store.gradeIds,
          chooseType: store.chooseType,
          expTaskType: store.expTaskType,
          difficultyId: store.difficultyId,
          summary: store.summary,
          curriculum: store.curriculum,
          teachingContextContent: store.teachingContextContent,
          principle: store.principle,
          safetyNotes: store.safetyNotes,
          dangerNotes: store.dangerNotes,
          durationMin: store.durationMin,
          simulatorUrl: store.simulatorUrl,
          coursebookId: store.coursebookId,
          unitId: store.unitId,
          mainVideoUrl: store.mainVideoUrl,
          mainVideoEmbeds: store.mainVideoEmbeds,
          materials: store.materials,
          steps: store.steps,
          resultEntries: store.resultEntries,
          referenceCitations: store.referenceCitations,
          scientistStories: store.scientistStories,
        };
        const next = applyAutofillToForm(current as any, payload, strategy);
        if (next.expName !== undefined) store.setField("expName", next.expName);
        if (next.subjectId !== undefined) store.setField("subjectId", next.subjectId);
        if (next.schoolLevelId !== undefined) store.setField("schoolLevelId", next.schoolLevelId);
        if (next.gradeId !== undefined) store.setField("gradeId", next.gradeId);
        if (next.selectedGradeCodes !== undefined) store.setField("selectedGradeCodes", next.selectedGradeCodes);
        if (next.gradeIds !== undefined) store.setField("gradeIds", next.gradeIds);
        if (next.chooseType !== undefined) store.setField("chooseType", next.chooseType);
        if (next.expTaskType !== undefined) store.setField("expTaskType", next.expTaskType);
        if (next.difficultyId !== undefined) store.setField("difficultyId", String(next.difficultyId ?? ""));
        if (next.summary !== undefined) store.setField("summary", next.summary);
        if (next.curriculum !== undefined) store.setField("curriculum", next.curriculum ?? "");
        if (next.teachingContextContent !== undefined) store.setField("teachingContextContent", next.teachingContextContent ?? "");
        if (next.principle !== undefined) store.setField("principle", next.principle ?? "");
        if (next.safetyNotes !== undefined) store.setField("safetyNotes", next.safetyNotes ?? "");
        if (next.dangerNotes !== undefined) store.setField("dangerNotes", next.dangerNotes ?? "");
        if (next.durationMin !== undefined) store.setField("durationMin", String(next.durationMin ?? "45"));
        if (next.simulatorUrl !== undefined) store.setField("simulatorUrl", next.simulatorUrl ?? "");
        if (next.coursebookId !== undefined) store.setField("coursebookId", next.coursebookId ?? "");
        if (next.unitId !== undefined) store.setField("unitId", next.unitId ?? "");
        if (next.mainVideoUrl !== undefined) store.setField("mainVideoUrl", next.mainVideoUrl ?? "");
        if (next.mainVideoEmbeds !== undefined) store.setField("mainVideoEmbeds", next.mainVideoEmbeds as RichMediaEmbed[]);
        if (next.materials !== undefined) store.setField("materials", next.materials as typeof store.materials);
        if (next.steps !== undefined) store.setField("steps", next.steps as typeof store.steps);
        if (next.resultEntries !== undefined) store.setField("resultEntries", next.resultEntries as typeof store.resultEntries);
        if (next.referenceCitations !== undefined) store.setField("referenceCitations", next.referenceCitations as typeof store.referenceCitations);
        if (next.scientistStories !== undefined) store.setField("scientistStories", next.scientistStories as typeof store.scientistStories);
        sonnerToast.success(
          strategy === "replace"
            ? "已自动填写全部内容"
            : strategy === "merge"
              ? "已合并关联实验内容（追加+去重）"
              : "已自动填写基础信息",
          {
          description: linkedId,
        });
      } catch (err) {
        sonnerToast.error("自动填写失败", { description: err instanceof Error ? err.message : "请稍后重试" });
      }
    },
    [store, v2Peer],
  );

  const buildLinkedExperimentAnnouncement = React.useCallback(
    (input: { title: string; phase?: string; discipline?: string; gradeLabels?: string[] }) => {
      const parts = [
        input.title.trim(),
        input.phase?.trim(),
        input.discipline?.trim(),
        input.gradeLabels?.length ? input.gradeLabels.join("、") : "",
      ].filter((item) => item && item.length > 0);
      return `关联实验：${parts.join(" · ")}`;
    },
    [],
  );

  const confirmLinkedExperiment = React.useCallback(
    (meta: { expId: string; expName?: string; sourceType?: 'library' | 'msg'; publishStatus?: string | null; libraryId?: string; phase?: EducationPhase | null; discipline?: SubjectDiscipline | null; gradeCodes?: string[] }) => {
      const id = meta.expId?.trim();
      if (!id) return;
      const row = v2Peer.peerRows.find((r) => r.id === id) ?? null;
      const rowName = meta.expName?.trim() || row?.title?.trim();
      const phase = meta.phase ?? row?.phase ?? null;
      const discipline = meta.discipline ?? row?.discipline ?? null;
      const gradeCodes = meta.gradeCodes?.length ? meta.gradeCodes : row?.gradeCodes ?? [];

      store.setField("selectedStandardId", id);
      setLinkedStandardName(rowName || id);
      store.setField("useCustomExperiment", false);
      if (rowName) store.setField("expName", rowName);
      if (phase) store.setField("phase", phase);
      if (discipline) store.setField("discipline", discipline);
      store.setField("selectedGradeCodes", gradeCodes);

      const resolved = resolveExpTaxonomyIds({
        disciplineLabel: row?.disciplineLabel?.trim() || row?.subjectLabel?.trim() || discipline || "",
        selectedGradeCodes: gradeCodes,
        gradeOptions: listGradeOptions,
        subjects: v2Peer.subjects,
        grades: v2Peer.grades,
      });
      if (resolved.subject_id) store.setField("subjectId", resolved.subject_id);
      if (resolved.school_level_id) store.setField("schoolLevelId", resolved.school_level_id);
      if (resolved.grade_id) store.setField("gradeId", resolved.grade_id);

      const announcement = buildLinkedExperimentAnnouncement({
        title: rowName || id,
        phase: row?.phaseLabel ?? undefined,
        discipline: row?.disciplineLabel ?? row?.subjectLabel ?? undefined,
        gradeLabels: gradeCodes.map((code) => listGradeOptions.find((g) => g.code === code)?.label ?? code),
      });
      store.setField("curriculum", announcement);

      const hasUserEdits =
        store.steps.length > 1 ||
        store.materials.length > 1 ||
        store.resultEntries.length > 1 ||
        store.principle.trim().length > 0 ||
        store.safetyNotes.trim().length > 0 ||
        store.dangerNotes.trim().length > 0 ||
        store.summary.trim().length > 0 ||
        store.teachingContextContent.trim().length > 0;
      const strategy = hasUserEdits ? "merge" as const : ("replace" as const);

      sonnerToast.success("已关联实验", { description: rowName || id });
      autoFillFromLinkedExperiment(strategy, id);
    },
    [autoFillFromLinkedExperiment, buildLinkedExperimentAnnouncement, listGradeOptions, store, v2Peer.grades, v2Peer.peerRows, v2Peer.subjects],
  );

  // ── 完成度计算 ──
  const { completionPct, anchorsWithStatus } = useEditorBootstrapChecklist({
    subjectId: store.subjectId,
    chooseType: store.chooseType,
    expName: store.expName,
    phase: store.phase,
    discipline: store.discipline,
    creatorName: store.creatorName,
    selectedGradeCodes: store.selectedGradeCodes,
    curriculum: store.curriculum,
    teachingContextContent: store.teachingContextContent,
    teachingContextEmbeds: store.teachingContextEmbeds,
    principle: store.principle,
    principleImage: "",
    principleVideo: "",
    principleEmbeds: store.principleEmbeds,
    materials: store.materials,
    steps: store.steps,
    resultEntries: store.resultEntries,
    safetyNotes: store.safetyNotes,
    safetyEmbeds: store.safetyEmbeds,
    dangerNotes: store.dangerNotes,
    dangerEmbeds: store.dangerEmbeds,
    referenceCitations: store.referenceCitations,
    referenceVideo: "",
    referenceRichText: store.referenceRichText,
    referenceRichEmbeds: store.referenceRichEmbeds,
    scienceStory: store.scientistStories[0]?.storyComments ?? "",
    scienceStoryEmbeds: [],
    scientistName: store.scientistStories[0]?.scientistName ?? "",
    summary: store.summary,
    durationMin: store.durationMin,
  });

  // ── AI 预填 ──
  useEditorAiOutlinePrefill(
    prefillAiOutline,
    expId,
    (v) => store.setField("summary", v),
    (v) => store.setField("teachingContextContent", v),
    (v) => {
      store.setField("scientistStories", store.scientistStories.length === 0
        ? [{ id: "sci-ai-1", scientistName: "", storyName: "", storyComments: v }]
        : store.scientistStories.map((s, idx) => (idx === 0 ? { ...s, storyComments: v } : s)),
      );
    },
    (v) => store.setField("curriculum", v),
  );

  // ── 已发布实验详情加载 ──
  const [hydratedV2Detail, setHydratedV2Detail] = React.useState<import("@/lib/v2/v2-exp-api").V2ExpMsgDetail | null>(null);
  const [expDetailLoadError, setExpDetailLoadError] = React.useState<null | "not_found" | "error">(null);
  React.useEffect(() => {
    if (!expId || !v2Peer.actor.userId) return;
    let cancelled = false;
    setHydratedV2Detail(null);
    setExpDetailLoadError(null);
    void (async () => {
      try {
        const detail = await fetchV2ExpDetail(v2Peer.actor, expId);
        if (cancelled) return;
        setHydratedV2Detail(detail);
        setExpDetailLoadError(null);
      } catch (err) {
        if (cancelled) return;
        const http = V2ApiServiceError.getHttpStatus(err);
        if (http === 404) {
          setExpDetailLoadError("not_found");
          return;
        }
        setExpDetailLoadError("error");
        sonnerToast.error("实验详情加载失败", {
          description: V2ApiServiceError.getBusinessMessage(err),
        });
      }
    })();
    return () => { cancelled = true; };
  }, [expId, v2Peer.actor.userId]);

  const isOwner = React.useMemo(() => {
    if (!expId) return true;
    const ownerId = (hydratedV2Detail?.createUserId ?? "").trim();
    if (!ownerId) return true;
    return ownerId === (user.userId ?? "").trim();
  }, [expId, hydratedV2Detail?.createUserId, user.userId]);

  // 权限判断
  const fieldDisabled = !contentEditable || (!superUser && isResearcher) || (!superUser && !isOwner && Boolean(expId));
  const expTaskTypeDisabled = Boolean(hydratedV2Detail?.taskInfo?.targetClassId);

  // ── 运行时配置 ──
  const { rtSafety, setRtSafety, rtMaterial, setRtMaterial, saveRuntimeConfig } = useEditorBootstrapRuntime(intervention, expId);

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

  // ── 旗帜 ──
  const {
    workflowLabel,
    lifecycleLabel,
    showResearcherReviewBar,
    showResearcherTakedown,
    showRejectBanner,
    showResearcherNoopHint,
  } = useEditorBootstrapFlags(expId, row, isTeacher, isResearcher);

  const selectedStandardRow = React.useMemo(() => {
    const r = v2Peer.peerRows.find((r) => r.id === store.selectedStandardId) ?? null;
    if (!r) return null;
    return { ...r, phaseLabel: r.phaseLabel ?? r.subjectLabel.split("·")[0]?.trim() ?? "—" };
  }, [store.selectedStandardId, v2Peer.peerRows]);

  // 为编辑器组件兼容 React.Dispatch 形式的 setter（接受 updater 函数）
  const setPhaseDispatch = React.useCallback(
    (v: PhaseKey | ((prev: PhaseKey) => PhaseKey)) => {
      if (typeof v === "function") {
        store.setField("phase", v(store.phase));
      } else {
        store.setField("phase", v);
      }
    },
    [store],
  );
  const setDisciplineDispatch = React.useCallback(
    (v: SubjectDiscipline | ((prev: SubjectDiscipline) => SubjectDiscipline)) => {
      if (typeof v === "function") {
        store.setField("discipline", v(store.discipline));
      } else {
        store.setField("discipline", v);
      }
    },
    [store],
  );
  const setSelectedGradeCodesDispatch = React.useCallback(
    (v: string[] | ((prev: string[]) => string[])) => {
      if (typeof v === "function") {
        store.setField("selectedGradeCodes", v(store.selectedGradeCodes));
      } else {
        store.setField("selectedGradeCodes", v);
      }
    },
    [store],
  );

  return {
    expId,
    forkFrom,
    intervention,
    user,
    expDetailLoadError,
    row,
    selectedStandardRow,
    hydratedV2Detail,
    isOwner,
    superUser,
    expName: store.expName,
    chooseType: store.chooseType,
    expTaskType: store.expTaskType,
    subjectId: store.subjectId,
    schoolLevelId: store.schoolLevelId,
    gradeId: store.gradeId,
    phase: store.phase,
    discipline: store.discipline,
    selectedGradeCodes: store.selectedGradeCodes,
    experimentSearchKeyword,
    selectedStandardId: store.selectedStandardId,
    linkedStandardName,
    useCustomExperiment: store.useCustomExperiment,
    curriculumStore,
    summary: store.summary,
    durationMin: store.durationMin,
    simulatorUrl: store.simulatorUrl,
    difficultyId: store.difficultyId,
    mainVideoId: store.mainVideoId,
    mainVideoPoster,
    mainVideoUrl: store.mainVideoUrl,
    mainVideoEmbeds: store.mainVideoEmbeds,
    curriculum: store.curriculum,
    creatorName: store.creatorName,
    teachingContextContent: store.teachingContextContent,
    teachingContextEmbeds: store.teachingContextEmbeds,
    coursebookId: store.coursebookId,
    unitId: store.unitId,
    principle: store.principle,
    principleImage: "",
    principleVideo: "",
    principleEmbeds: store.principleEmbeds,
    resultEntries: store.resultEntries,
    safetyNotes: store.safetyNotes,
    safetyEmbeds: store.safetyEmbeds,
    dangerNotes: store.dangerNotes,
    dangerEmbeds: store.dangerEmbeds,
    referenceCitations: store.referenceCitations,
    referenceVideo: "",
    referenceVideos: store.referenceVideos,
    referenceRichText: store.referenceRichText,
    referenceRichEmbeds: store.referenceRichEmbeds,
    scientistStories: store.scientistStories,
    step: {
      materials: store.materials,
      steps: store.steps,
      setMaterials: (v: typeof store.materials) => store.setField("materials", v),
      setSteps: (v: typeof store.steps) => store.setField("steps", v),
      addMaterial: store.addMaterial,
      appendMaterials: store.appendMaterials,
      removeMaterial: store.removeMaterial,
      updateMaterial: store.updateMaterial,
      addStep: store.addStep,
      removeStep: store.removeStep,
      updateStep: store.updateStep,
      updateStepRichContent: store.updateStepRichContent,
      reorderStep: store.reorderStep,
      addResultEntry: store.addResultEntry,
      removeResultEntry: store.removeResultEntry,
      updateResultEntry: store.updateResultEntry,
      updateResultRichContent: store.updateResultRichContent,
      reorderResultEntry: store.reorderResultEntry,
    },
    canvas: {
      activeAnchorId: store.activeAnchorId,
      onNavigateAnchor: (id: string) => store.setField("activeAnchorId", id),
      mobileNavOpen: false,
      setMobileNavOpen: () => {},
    },
    completionPct,
    isTeacher,
    isResearcher,
    contentEditable,
    materialsStepsEditable,
    disciplineOptions,
    gradeOptions,
    disciplineLabel,
    phaseLabel: phaseLabelOf(store.phase),
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
    materialsStepsDisabled: !materialsStepsEditable,
    expTaskTypeDisabled,
    workflowLabel,
    lifecycleLabel,
    showResearcherReviewBar,
    showResearcherTakedown,
    showResearcherNoopHint,
    showRejectBanner,
    debugExperimentRawText: JSON.stringify({
      expId,
      selectedStandardId: store.selectedStandardId,
      hydratedV2Detail,
      listRow: row,
    }, null, 2),
    rejectOpen: store.rejectOpen,
    setRejectOpen: store.setRejectOpen,
    rejectDraft: store.rejectDraft,
    setRejectDraft: store.setRejectDraft,
    rtSafety,
    setRtSafety,
    rtMaterial,
    setRtMaterial,
    saveRuntimeConfig,
    setPhase: setPhaseDispatch,
    setDiscipline: setDisciplineDispatch,
    setSelectedGradeCodes: setSelectedGradeCodesDispatch,
    setListFilterPhases,
    setListFilterDisciplines,
    setListFilterGradeCodes,
    setExperimentSearchKeyword,
    setSelectedStandardId: (v: string | null) => store.setField("selectedStandardId", v),
    setLinkedStandardName,
    setUseCustomExperiment: (v: boolean) => store.setField("useCustomExperiment", v),
    setSummary: (v: string) => store.setField("summary", v),
    setDurationMin: (v: string) => store.setField("durationMin", v),
    setSimulatorUrl: (v: string) => store.setField("simulatorUrl", v),
    setDifficultyId: (v: string) => store.setField("difficultyId", v),
    setExpName: (v: string) => store.setField("expName", v),
    setChooseType: (v: "y" | "n" | null) => store.setField("chooseType", v),
    setExpTaskType: (v: "hw" | "tk" | "self" | null) => store.setField("expTaskType", v),
    setSubjectId: (v: string | null) => store.setField("subjectId", v),
    setSchoolLevelId: (v: string | null) => store.setField("schoolLevelId", v),
    setGradeId: (v: string | null) => store.setField("gradeId", v),
    setMainVideoId,
    setMainVideoPoster,
    setMainVideoUrl,
    setMainVideoEmbeds: (v: RichMediaEmbed[]) => store.setField("mainVideoEmbeds", v),
    setCurriculum: (v: string) => store.setField("curriculum", v),
    setTeachingContextRich: (next: { text: string; embeds: RichMediaEmbed[] }) => {
      store.setField("teachingContextContent", next.text);
      store.setField("teachingContextEmbeds", next.embeds);
    },
    setTeachingContextContent: (v: string) => store.setField("teachingContextContent", v),
    setTeachingContextEmbeds: (v: RichMediaEmbed[]) => store.setField("teachingContextEmbeds", v),
    setCoursebookId: (v: string) => store.setField("coursebookId", v),
    setUnitId: (v: string) => store.setField("unitId", v),
    setPrinciple: (v: string) => store.setField("principle", v),
    setPrincipleImage: () => {},
    setPrincipleVideo: () => {},
    setPrincipleEmbeds: (v: RichMediaEmbed[]) => store.setField("principleEmbeds", v),
    setResultEntries: (v: typeof store.resultEntries) => store.setField("resultEntries", v),
    addResultEntry: store.addResultEntry,
    removeResultEntry: store.removeResultEntry,
    updateResultEntry: store.updateResultEntry,
    updateResultRichContent: store.updateResultRichContent,
    reorderResultEntry: store.reorderResultEntry,
    setSafetyNotes: (v: string) => store.setField("safetyNotes", v),
    setSafetyEmbeds: (v: RichMediaEmbed[]) => store.setField("safetyEmbeds", v),
    setDangerNotes: (v: string) => store.setField("dangerNotes", v),
    setDangerEmbeds: (v: RichMediaEmbed[]) => store.setField("dangerEmbeds", v),
    setReferenceCitations: (v: typeof store.referenceCitations) => store.setField("referenceCitations", v),
    setReferenceVideo: () => {},
    setReferenceVideos: (v: typeof store.referenceVideos) => store.setField("referenceVideos", v),
    setReferenceRichText: (v: string) => store.setField("referenceRichText", v),
    setReferenceRichEmbeds: (v: RichMediaEmbed[]) => store.setField("referenceRichEmbeds", v),
    addReferenceCitation: store.addReferenceCitation,
    removeReferenceCitation: store.removeReferenceCitation,
    updateReferenceCitation: store.updateReferenceCitation,
    addReferenceVideo: store.addReferenceVideo,
    removeReferenceVideo: store.removeReferenceVideo,
    setScientistStories: (v: typeof store.scientistStories) => store.setField("scientistStories", v),
    addScientistStory: store.addScientistStory,
    removeScientistStory: store.removeScientistStory,
    updateScientistStory: store.updateScientistStory,
    securityDrafts: store.securityDrafts,
    setSecurityDrafts: store.setSecurityDrafts,
    toggleSecurity: store.toggleSecurity,
    confirmLinkedExperiment,
    autoFillFromLinkedExperiment,
    targetClassId,
    v2Actor: v2Peer.actor,
    v2Subjects: v2Peer.subjects,
    v2Grades: v2Peer.grades,
    v2Levels: v2Peer.levels,
    v2GradeSubjects: v2Peer.gradeSubjects,
    v2Difficulties: v2Peer.difficulties,
    v2Securities: v2Peer.securities,
    v2Loading: v2Peer.loading,
    refreshV2PeerList: v2Peer.refresh,
  };
}
