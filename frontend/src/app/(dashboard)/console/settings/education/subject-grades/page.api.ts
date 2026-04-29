"use client";

import { eduDimensionFetchUrl } from "@/lib/edu-dimension-v2-api";

import type { LevelSubjectSummary, SchoolDimensionSnapshot } from "./page.types";

export type SchoolSystemScheme = "543" | "633" | "custom";
export type SchoolSystemStageGradeCodes = Record<"STAGE_PRIMARY" | "STAGE_JUNIOR" | "STAGE_SENIOR", string[]>;

export type SchoolSystemPayload = {
  scheme: SchoolSystemScheme;
  stage_grade_codes?: SchoolSystemStageGradeCodes;
};

export type SchoolSystemPreview = {
  scheme: SchoolSystemScheme;
  summary: {
    enableCount: number;
    disableCount: number;
    unchangedCount: number;
  };
  stages: Array<{
    stageCode: string;
    stageName: string;
    willEnable: string[];
    willDisable: string[];
    unchanged: string[];
  }>;
};

type JsonResponse<T> = {
  success?: boolean;
  data?: T;
  error?: { message?: string };
};

function asStr(v: unknown, fallback = ""): string {
  return v == null || v === "" ? fallback : String(v);
}

export function normalizeSchoolDimensionSnapshot(
  raw: Partial<SchoolDimensionSnapshot> & Record<string, unknown> | null | undefined,
): SchoolDimensionSnapshot {
  const data = raw ?? {};
  const levelsRaw = (data.levels ?? data.stages) as unknown[] | undefined;
  const subjectsRaw = data.subjects as unknown[] | undefined;
  const gradesRaw = data.grades as unknown[] | undefined;
  const lsRaw = (data.levelSubjects ?? data.stageSubjects) as unknown[] | undefined;
  const lgRaw = (data.levelGrades ?? data.stageGrades) as unknown[] | undefined;
  const mxRaw = (data.gradeSubjectMatrix ?? data.stageSubjectGrades) as unknown[] | undefined;

  return {
    levels: (levelsRaw ?? []).map((row) => {
      const r = row as Record<string, unknown>;
      return {
        levelId: asStr(r.levelId ?? r.id),
        levelName: asStr(r.levelName ?? r.name),
        comments: r.comments == null ? null : asStr(r.comments),
        status: asStr(r.status, "y").toLowerCase() === "n" ? "n" : "y",
        sortOrder: Number(r.sortOrder ?? 0),
        iconPath: r.iconPath == null ? null : asStr(r.iconPath),
      };
    }),
    subjects: (subjectsRaw ?? []).map((row) => {
      const r = row as Record<string, unknown>;
      return {
        subjectId: asStr(r.subjectId ?? r.id),
        subjectName: asStr(r.subjectName ?? r.name),
        comments: r.comments == null ? null : asStr(r.comments),
        status: asStr(r.status, "y").toLowerCase() === "n" ? "n" : "y",
        sortOrder: Number(r.sortOrder ?? 0),
        iconPath: r.iconPath == null ? null : asStr(r.iconPath),
      };
    }),
    grades: (gradesRaw ?? []).map((row) => {
      const r = row as Record<string, unknown>;
      return {
        gradeId: asStr(r.gradeId ?? r.id),
        gradeName: asStr(r.gradeName ?? r.name),
        schoolLevelId:
          r.schoolLevelId == null || String(r.schoolLevelId).trim() === "" ? null : asStr(r.schoolLevelId),
        comments: r.comments == null ? null : asStr(r.comments),
        status: asStr(r.status, "y").toLowerCase() === "n" ? "n" : "y",
        sortOrder: Number(r.sortOrder ?? 0),
      };
    }),
    levelSubjects: (lsRaw ?? []).map((row) => {
      const r = row as Record<string, unknown>;
      return {
        linkKey: asStr(r.linkKey ?? r.id),
        levelId: asStr(r.levelId ?? r.stageId),
        subjectId: asStr(r.subjectId),
        sortOrder: Number(r.sortOrder ?? 0),
        lineActive: (Number(r.lineActive ?? r.status ?? 1) === 0 ? 0 : 1) as 0 | 1,
      };
    }),
    levelGrades: (lgRaw ?? []).map((row) => {
      const r = row as Record<string, unknown>;
      return {
        linkKey: asStr(r.linkKey ?? r.id),
        levelId: asStr(r.levelId ?? r.stageId),
        gradeId: asStr(r.gradeId),
        sortOrder: Number(r.sortOrder ?? 0),
        lineActive: (Number(r.lineActive ?? r.status ?? 1) === 0 ? 0 : 1) as 0 | 1,
      };
    }),
    gradeSubjectMatrix: (mxRaw ?? []).map((row) => {
      const r = row as Record<string, unknown>;
      return {
        seqId: asStr(r.seqId ?? r.id),
        levelId: asStr(r.levelId ?? r.stageId),
        subjectId: asStr(r.subjectId),
        gradeId: asStr(r.gradeId),
        sortOrder: Number(r.sortOrder ?? 0),
        lineActive: (Number(r.lineActive ?? r.status ?? 1) === 0 ? 0 : 1) as 0 | 1,
      };
    }),
  };
}

async function requestJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  const json = (await res.json()) as JsonResponse<T> & Record<string, unknown>;
  if (json.success === false) {
    throw new Error(json.error?.message ?? "请求失败");
  }
  if (Object.prototype.hasOwnProperty.call(json, "data")) {
    return json.data as T;
  }
  return json as T;
}

async function requestVoid(input: RequestInfo | URL, init?: RequestInit): Promise<void> {
  const res = await fetch(input, init);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
}

async function fetchSnapshotApi(): Promise<SchoolDimensionSnapshot> {
  const data = await requestJson<Partial<SchoolDimensionSnapshot> & Record<string, unknown>>(
    eduDimensionFetchUrl("/dimensions"),
    { cache: "no-store" },
  );
  return normalizeSchoolDimensionSnapshot(data ?? {});
}

async function patchStageSortApi(levelIdsInOrder: string[]): Promise<void> {
  await requestVoid(eduDimensionFetchUrl("/stages/sort"), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ level_ids_in_order: levelIdsInOrder }),
  });
}

async function patchStageSubjectSortApi(_levelId: string, relationIdsInOrder: string[]): Promise<void> {
  await requestVoid(eduDimensionFetchUrl("/stage-subjects/sort"), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ relation_ids_in_order: relationIdsInOrder }),
  });
}

async function putStageSubjectGradesApi(levelId: string, subjectId: string, gradeIds: string[]): Promise<void> {
  await requestVoid(eduDimensionFetchUrl(`/stage-subject-grades/${encodeURIComponent(subjectId)}`), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ level_id: levelId, grade_ids: gradeIds }),
  });
}

async function patchStageSubjectStatusApi(linkKey: string, lineActive: 0 | 1): Promise<void> {
  await requestVoid(eduDimensionFetchUrl(`/stage-subjects/${encodeURIComponent(linkKey)}/status`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ active_status: lineActive }),
  });
}

async function createGradeApi(payload: { grade_name: string; grade_id: string }): Promise<void> {
  await requestVoid(eduDimensionFetchUrl("/grades"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

async function patchGradeApi(
  gradeId: string,
  payload: { grade_name: string; grade_id: string; active_status: 0 | 1 },
): Promise<void> {
  await requestVoid(eduDimensionFetchUrl(`/grades/${encodeURIComponent(gradeId)}`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

async function deleteGradeApi(gradeId: string): Promise<void> {
  await requestVoid(eduDimensionFetchUrl(`/grades/${encodeURIComponent(gradeId)}`), { method: "DELETE" });
}

async function patchStageGradeStatusApi(levelId: string, gradeId: string, activeStatus: 0 | 1): Promise<void> {
  await requestVoid(eduDimensionFetchUrl(`/stage-grades/${encodeURIComponent(gradeId)}/status`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ level_id: levelId, active_status: activeStatus }),
  });
}

async function patchStageGradeSortApi(levelId: string, gradeIdsInOrder: string[]): Promise<void> {
  await requestVoid(eduDimensionFetchUrl("/stage-grades/sort"), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ level_id: levelId, grade_ids_in_order: gradeIdsInOrder }),
  });
}

async function createStageSubjectApi(payload: { level_id: string; subject_id: string }): Promise<void> {
  await requestVoid(eduDimensionFetchUrl("/stage-subjects"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

async function linkSubjectsToLevelApi(levelId: string, subjectIds: string[]): Promise<void> {
  const lid = levelId.trim();
  for (let i = 0; i < subjectIds.length; i++) {
    const sid = subjectIds[i]?.trim();
    if (!sid) continue;
    await createStageSubjectApi({ level_id: lid, subject_id: sid });
  }
}

async function createSubjectApi(payload: { subject_name: string; subject_id: string }): Promise<{ id: string }> {
  return requestJson<{ id: string }>(eduDimensionFetchUrl("/subjects"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

async function previewSchoolSystemApi(payload: SchoolSystemPayload): Promise<SchoolSystemPreview> {
  return requestJson<SchoolSystemPreview>(eduDimensionFetchUrl("/stage-grades/scheme"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

async function applySchoolSystemApi(payload: SchoolSystemPayload): Promise<void> {
  await requestVoid(eduDimensionFetchUrl("/stage-grades/scheme"), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export const eduDimensionsApi = {
  fetchSnapshot: fetchSnapshotApi,
  patchStageSort: patchStageSortApi,
  patchStageSubjectSort: patchStageSubjectSortApi,
  putStageSubjectGrades: putStageSubjectGradesApi,
  patchStageSubjectStatus: patchStageSubjectStatusApi,
  createGrade: createGradeApi,
  patchGrade: patchGradeApi,
  deleteGrade: deleteGradeApi,
  patchStageGradeStatus: patchStageGradeStatusApi,
  patchStageGradeSort: patchStageGradeSortApi,
  createStageSubject: createStageSubjectApi,
  linkSubjectsToLevel: linkSubjectsToLevelApi,
  createSubject: createSubjectApi,
  previewSchoolSystem: previewSchoolSystemApi,
  applySchoolSystem: applySchoolSystemApi,
};

export function patchLocalRelationStatus(
  levelSubjects: LevelSubjectSummary[],
  linkKey: string,
  lineActive: 0 | 1,
): LevelSubjectSummary[] {
  return levelSubjects.map((item) => (item.linkKey === linkKey ? { ...item, lineActive } : item));
}
