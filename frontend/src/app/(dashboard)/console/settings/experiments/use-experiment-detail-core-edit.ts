"use client";

import * as React from "react";

import { sonnerToast } from "@bs-lab/ui";

import type { CatalogCategory, CatalogCore } from "@/lib/experiment-catalog-api";
import {
  fetchV2ExpLibraryById,
  patchV2ExpLibrary,
  type V2ChooseType,
  type V2ExpStatus,
} from "@/lib/v2/v2-exp-api";
import { UserRole } from "@/types/auth";

import type { SchoolDimensionSnapshot } from "../education/subject-grades/page.types";
import { reconcileCatalogGradeIds } from "./catalog-eligible-grades";
import { buildExpCatalogListActor } from "./v2-exp-library-catalog-adapter";

export function useExperimentDetailCoreEdit(opts: {
  core: CatalogCore | null;
  role: UserRole;
  orgId: string;
  snapshot: SchoolDimensionSnapshot | null;
  categories: CatalogCategory[];
  onAfterSave: () => Promise<void>;
  /** 标准试验库（无官方视频区）：备注与 t/y/n 发布状态以 `/v2/exp-library` 单条详情为准。 */
  v2ExpLibraryEdit?: boolean;
}) {
  const { core, role, orgId, snapshot, categories, onAfterSave, v2ExpLibraryEdit = false } = opts;

  const [name, setName] = React.useState("");
  const [stage, setStage] = React.useState("");
  const [subject, setSubject] = React.useState("");
  const [gradeIds, setGradeIds] = React.useState<string[]>([]);
  const [mandatory, setMandatory] = React.useState("1");
  const [cat, setCat] = React.useState("");
  const [video, setVideo] = React.useState("");
  const [status, setStatus] = React.useState("1");
  const [libraryStatus, setLibraryStatus] = React.useState<V2ExpStatus>("y");
  const [comments, setComments] = React.useState("");

  const baselineRef = React.useRef({ stage: "", subject: "" });
  const gradeMemoryRef = React.useRef<Map<string, string[]>>(new Map());
  const proceedGuardRef = React.useRef(false);
  const [guardOpen, setGuardOpen] = React.useState(false);
  const videoFieldRef = React.useRef<HTMLDivElement | null>(null);
  const stageRef = React.useRef("");
  const subjectRef = React.useRef("");
  const gradeIdsRef = React.useRef<string[]>([]);

  const pairKey = React.useCallback((stageId: string, subjectId: string) => `${stageId}::${subjectId}`, []);

  const restoreGradesForPair = React.useCallback(
    (targetStage: string, targetSubject: string, fallbackSource: string[]) => {
      if (!snapshot || !targetStage || !targetSubject) return fallbackSource;
      const key = pairKey(targetStage, targetSubject);
      const memorized = gradeMemoryRef.current.get(key) ?? fallbackSource;
      return reconcileCatalogGradeIds(snapshot, memorized, targetStage, targetSubject);
    },
    [pairKey, snapshot],
  );

  React.useEffect(() => {
    if (!core) return;
    setName(core.displayName);
    setStage(core.stageId);
    setSubject(core.subjectId);
    setGradeIds(core.gradeIds?.length ? [...core.gradeIds] : []);
    setMandatory(String(core.isMandatory));
    setCat(core.expCategoryId);
    setVideo(core.officialVideoRegistryId ?? "");
    if (!v2ExpLibraryEdit) {
      setStatus(String(core.status ?? 1));
    }
    gradeMemoryRef.current = new Map();
    gradeMemoryRef.current.set(pairKey(core.stageId, core.subjectId), core.gradeIds?.length ? [...core.gradeIds] : []);
    baselineRef.current = { stage: core.stageId, subject: core.subjectId };
    proceedGuardRef.current = false;
  }, [core?.id, core?.updatedAt, pairKey, v2ExpLibraryEdit]);

  React.useEffect(() => {
    if (!v2ExpLibraryEdit || !core?.id) return;
    const actor = buildExpCatalogListActor(role, orgId);
    let cancelled = false;
    void fetchV2ExpLibraryById(actor, core.id)
      .then((row) => {
        if (cancelled) return;
        const st = row.status;
        setLibraryStatus(st === "y" || st === "n" || st === "t" ? st : "t");
        setComments(row.comments ?? "");
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [core?.id, core?.updatedAt, role, orgId, v2ExpLibraryEdit]);

  React.useEffect(() => {
    stageRef.current = stage;
  }, [stage]);

  React.useEffect(() => {
    subjectRef.current = subject;
  }, [subject]);

  React.useEffect(() => {
    gradeIdsRef.current = gradeIds;
    if (!stage || !subject) return;
    gradeMemoryRef.current.set(pairKey(stage, subject), [...gradeIds]);
  }, [gradeIds, pairKey, stage, subject]);

  const setStageWithMemory = React.useCallback(
    (nextStage: string) => {
      const prevStage = stageRef.current;
      const prevSubject = subjectRef.current;
      const prevGrades = gradeIdsRef.current;
      if (prevStage && prevSubject) {
        gradeMemoryRef.current.set(pairKey(prevStage, prevSubject), [...prevGrades]);
      }
      setStage(nextStage);
      const restored = restoreGradesForPair(nextStage, prevSubject, prevGrades);
      setGradeIds(restored);
    },
    [pairKey, restoreGradesForPair],
  );

  const setSubjectWithMemory = React.useCallback(
    (nextSubject: string) => {
      const prevStage = stageRef.current;
      const prevSubject = subjectRef.current;
      const prevGrades = gradeIdsRef.current;
      if (prevStage && prevSubject) {
        gradeMemoryRef.current.set(pairKey(prevStage, prevSubject), [...prevGrades]);
      }
      setSubject(nextSubject);
      const restored = restoreGradesForPair(prevStage, nextSubject, prevGrades);
      setGradeIds(restored);
    },
    [pairKey, restoreGradesForPair],
  );

  const setGradeIdsWithMemory = React.useCallback((next: string[]) => {
    setGradeIds(next);
    const currentStage = stageRef.current;
    const currentSubject = subjectRef.current;
    if (!currentStage || !currentSubject) return;
    gradeMemoryRef.current.set(pairKey(currentStage, currentSubject), [...next]);
  }, [pairKey]);

  const doSave = React.useCallback(async () => {
    if (!core) return;
    if (gradeIds.length === 0) {
      sonnerToast.error("请至少选择一个适用年级");
      return;
    }
    const actor = buildExpCatalogListActor(role, orgId);
    const chooseType: V2ChooseType = Number(mandatory) === 1 ? "y" : "n";
    const body = v2ExpLibraryEdit
      ? {
          libExpName: name.trim(),
          subjectId: subject.trim() || null,
          schoolLevelId: stage.trim() || null,
          gradeIds,
          chooseType,
          status: libraryStatus,
          comments: comments.trim() || null,
        }
      : {
          libExpName: name.trim(),
          subjectId: subject.trim() || null,
          schoolLevelId: stage.trim() || null,
          gradeIds,
          chooseType,
          status: (Number(status) === 1 ? "y" : "n") as V2ExpStatus,
        };
    await patchV2ExpLibrary(actor, core.id, body);
    sonnerToast.success("已保存修改");
    proceedGuardRef.current = false;
    await onAfterSave();
  }, [
    core,
    role,
    orgId,
    name,
    stage,
    subject,
    gradeIds,
    mandatory,
    status,
    onAfterSave,
    v2ExpLibraryEdit,
    libraryStatus,
    comments,
  ]);

  const save = React.useCallback(async () => {
    try {
      const base = baselineRef.current;
      const changed = stage !== base.stage || subject !== base.subject;
      if (changed && !proceedGuardRef.current) {
        setGuardOpen(true);
        return;
      }
      await doSave();
    } catch (e) {
      sonnerToast.error(e instanceof Error ? e.message : "保存失败");
    }
  }, [stage, subject, doSave]);

  const confirmGuard = React.useCallback(() => {
    proceedGuardRef.current = true;
    setGuardOpen(false);
    void save();
  }, [save]);

  const cancelGuard = React.useCallback(() => {
    proceedGuardRef.current = false;
    setGuardOpen(false);
  }, []);

  return {
    name,
    setName,
    stage,
    setStage: setStageWithMemory,
    subject,
    setSubject: setSubjectWithMemory,
    gradeIds,
    setGradeIds: setGradeIdsWithMemory,
    mandatory,
    setMandatory,
    cat,
    setCat,
    video,
    setVideo,
    status,
    setStatus,
    libraryStatus,
    setLibraryStatus,
    comments,
    setComments,
    videoFieldRef,
    guardOpen,
    confirmGuard,
    cancelGuard,
    save,
    categories,
    snapshot,
  };
}
