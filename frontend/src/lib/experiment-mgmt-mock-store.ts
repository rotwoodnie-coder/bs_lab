"use client";

import * as React from "react";

import type { EditorPeerMandatory, EditorPeerRow } from "@/app/(dashboard)/teacher/experiment-editor/utils/editor-peer-row-types";

const listeners = new Set<() => void>();
let notifyScheduled = false;

function flushListeners() {
  notifyScheduled = false;
  listeners.forEach((fn) => fn());
}

function notifyListeners() {
  if (notifyScheduled) return;
  notifyScheduled = true;
  if (typeof queueMicrotask === "function") {
    queueMicrotask(flushListeners);
    return;
  }
  setTimeout(flushListeners, 0);
}

export function subscribeExperimentMgmtMock(listener: () => void) {
  listeners.add(listener);
  return () => {
    void listeners.delete(listener);
  };
}

export type ExperimentMgmtRow = EditorPeerRow;
export type ExperimentMandatory = EditorPeerMandatory;

/**
 * 旧「Mock 管理台账」已废弃：全站真实性要求下不再从浏览器存储/Mock 数据回填业务列表。
 * 该模块仅保留订阅 API 以避免历史页面直接崩溃；真实数据请改用 V2 接口拉取。
 */
export function readExperimentMgmtRows(): ExperimentMgmtRow[] {
  return [];
}

export function writeExperimentMgmtRows(_rows: ExperimentMgmtRow[]) {
  notifyListeners();
}

export function incrementExperimentMgmtCopyCount(_experimentId: string, _delta = 1) {
  notifyListeners();
}

export function incrementExperimentMgmtTaskCount(_experimentId: string, _delta = 1) {
  notifyListeners();
}

export type GradeStandardGrade =
  | "一年级"
  | "二年级"
  | "三年级"
  | "四年级"
  | "五年级";
export type GradeStandardSemester = "上学期" | "下学期";
export type GradeStandardAiStrategy = "基础引导" | "启发引导" | "自主探究";
export type GradeStandardScopeKey = `${GradeStandardGrade}-${GradeStandardSemester}`;

export type GradeStandardExperiment = {
  experiment_id: string;
  experiment_title: string;
  subject_label: string;
  curriculum_refs: string[];
  difficulty_level: "low" | "medium" | "high";
  is_mandatory: boolean;
  ai_strategy: GradeStandardAiStrategy;
  suggested_periods: number;
};

export type GradeStandard = {
  scope: GradeStandardScopeKey;
  items: GradeStandardExperiment[];
  updated_at: string;
};

export type GradeStandardStore = Record<GradeStandardScopeKey, GradeStandard>;

const GRADE_STANDARD_GRADES: GradeStandardGrade[] = [
  "一年级",
  "二年级",
  "三年级",
  "四年级",
  "五年级",
];
const GRADE_STANDARD_SEMESTERS: GradeStandardSemester[] = ["上学期", "下学期"];
const DEFAULT_AI_STRATEGY: GradeStandardAiStrategy = "基础引导";
const DEFAULT_SUGGESTED_PERIODS = 2;

function deriveDifficultyLevel(row: ExperimentMgmtRow): GradeStandardExperiment["difficulty_level"] {
  if ((row.copyCount ?? 0) >= 8 || row.tags.includes("课标重点")) return "high";
  if ((row.copyCount ?? 0) >= 3 || row.tags.includes("数字化")) return "medium";
  return "low";
}

function mandatoryToBool(mandatory: ExperimentMandatory): boolean {
  return mandatory === "mandatory";
}

function boolToMandatory(value: boolean): ExperimentMandatory {
  return value ? "mandatory" : "optional";
}

function buildInitialGradeStandardStore(rows: ExperimentMgmtRow[]): GradeStandardStore {
  const baseItems: GradeStandardExperiment[] = rows.map((row) => ({
    experiment_id: row.id,
    experiment_title: row.title,
    subject_label: row.subjectLabel,
    curriculum_refs: [row.curriculumRefShort, ...row.tags].filter(Boolean),
    difficulty_level: deriveDifficultyLevel(row),
    is_mandatory: mandatoryToBool(row.mandatory),
    ai_strategy: DEFAULT_AI_STRATEGY,
    suggested_periods: DEFAULT_SUGGESTED_PERIODS,
  }));

  const now = new Date().toISOString();
  const store: Partial<GradeStandardStore> = {};
  for (const grade of GRADE_STANDARD_GRADES) {
    for (const semester of GRADE_STANDARD_SEMESTERS) {
      const scope = `${grade}-${semester}` as GradeStandardScopeKey;
      store[scope] = {
        scope,
        items: baseItems.map((item) => ({ ...item })),
        updated_at: now,
      };
    }
  }
  return store as GradeStandardStore;
}

function normalizeGradeStandardStore(store: GradeStandardStore, rows: ExperimentMgmtRow[]): GradeStandardStore {
  const base = buildInitialGradeStandardStore(rows);
  const now = new Date().toISOString();
  const normalized: Partial<GradeStandardStore> = {};

  for (const scope of Object.keys(base) as GradeStandardScopeKey[]) {
    const fallback = base[scope];
    const incoming = store[scope];
    if (!incoming) {
      normalized[scope] = fallback;
      continue;
    }
    const mapById = new Map(incoming.items.map((item) => [item.experiment_id, item]));
    normalized[scope] = {
      scope,
      updated_at: incoming.updated_at || now,
      items: fallback.items.map((item) => {
        const current = mapById.get(item.experiment_id);
        if (!current) return item;
        return {
          ...item,
          subject_label: typeof current.subject_label === "string" ? current.subject_label : item.subject_label,
          curriculum_refs: Array.isArray(current.curriculum_refs)
            ? current.curriculum_refs.filter((ref): ref is string => typeof ref === "string" && ref.length > 0)
            : item.curriculum_refs,
          difficulty_level:
            current.difficulty_level === "low" ||
            current.difficulty_level === "medium" ||
            current.difficulty_level === "high"
              ? current.difficulty_level
              : item.difficulty_level,
          is_mandatory: Boolean(current.is_mandatory),
          ai_strategy:
            current.ai_strategy === "基础引导" ||
            current.ai_strategy === "启发引导" ||
            current.ai_strategy === "自主探究"
              ? current.ai_strategy
              : item.ai_strategy,
          suggested_periods: Number.isFinite(current.suggested_periods)
            ? Math.max(1, Math.trunc(current.suggested_periods))
            : item.suggested_periods,
        };
      }),
    };
  }

  return normalized as GradeStandardStore;
}

export function readGradeStandardStore(): GradeStandardStore {
  const rows = readExperimentMgmtRows();
  return buildInitialGradeStandardStore(rows);
}

export function writeGradeStandardStore(store: GradeStandardStore) {
  const normalized = normalizeGradeStandardStore(store, readExperimentMgmtRows());
  void normalized;
  notifyListeners();
}

export function updateGradeStandardExperiment(
  scope: GradeStandardScopeKey,
  experimentId: string,
  patch: Partial<Pick<GradeStandardExperiment, "is_mandatory" | "ai_strategy" | "suggested_periods">>,
) {
  const standardStore = readGradeStandardStore();
  const current = standardStore[scope];
  if (!current) return;

  const nextItems = current.items.map((item) =>
    item.experiment_id === experimentId
      ? {
          ...item,
          ...patch,
        }
      : item,
  );

  const nextStore: GradeStandardStore = {
    ...standardStore,
    [scope]: {
      ...current,
      items: nextItems,
      updated_at: new Date().toISOString(),
    },
  };

  if (typeof patch.is_mandatory === "boolean") {
    const rows = readExperimentMgmtRows();
    writeExperimentMgmtRows(
      rows.map((row) =>
        row.id === experimentId ? { ...row, mandatory: boolToMandatory(patch.is_mandatory as boolean) } : row,
      ),
    );
  }

  writeGradeStandardStore(nextStore);
}

export function runAiSmartScheduleForScope(scope: GradeStandardScopeKey) {
  const standardStore = readGradeStandardStore();
  const current = standardStore[scope];
  if (!current) return;

  const nextItems = current.items.map((item) => {
    if (item.is_mandatory) {
      if (item.difficulty_level === "high") {
        return { ...item, ai_strategy: "基础引导" as GradeStandardAiStrategy, suggested_periods: 4 };
      }
      if (item.difficulty_level === "medium") {
        return { ...item, ai_strategy: "启发引导" as GradeStandardAiStrategy, suggested_periods: 3 };
      }
      return { ...item, ai_strategy: "启发引导" as GradeStandardAiStrategy, suggested_periods: 2 };
    }
    if (item.difficulty_level === "high") {
      return { ...item, ai_strategy: "启发引导" as GradeStandardAiStrategy, suggested_periods: 3 };
    }
    if (item.difficulty_level === "medium") {
      return { ...item, ai_strategy: "自主探究" as GradeStandardAiStrategy, suggested_periods: 2 };
    }
    return { ...item, ai_strategy: "自主探究" as GradeStandardAiStrategy, suggested_periods: 1 };
  });

  writeGradeStandardStore({
    ...standardStore,
    [scope]: {
      ...current,
      items: nextItems,
      updated_at: new Date().toISOString(),
    },
  });
}

/** 清空本地层，恢复为种子数据 */
export function resetExperimentMgmtMockSeed() {
  notifyListeners();
}

/** 跨页面共享的实验管理状态：仅内存态。 */
export function useExperimentMgmtRows() {
  const [rows, setRows] = React.useState<ExperimentMgmtRow[]>(() => readExperimentMgmtRows());

  React.useEffect(() => {
    setRows(readExperimentMgmtRows());
    return subscribeExperimentMgmtMock(() => {
      setRows(readExperimentMgmtRows());
    });
  }, []);

  const setRowsPersist = React.useCallback(
    (next: ExperimentMgmtRow[] | ((prev: ExperimentMgmtRow[]) => ExperimentMgmtRow[])) => {
      const prevRows = readExperimentMgmtRows();
      const resolved = typeof next === "function" ? next(prevRows) : next;
      writeExperimentMgmtRows(resolved);
      setRows(resolved);
    },
    [],
  );

  const updateRow = React.useCallback(
    (id: string, patch: Partial<ExperimentMgmtRow>) => {
      setRowsPersist((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    },
    [setRowsPersist],
  );

  return { rows, setRows: setRowsPersist, updateRow, resetToSeed: resetExperimentMgmtMockSeed };
}

export function useGradeStandardStore() {
  const [standards, setStandards] = React.useState<GradeStandardStore>(() => readGradeStandardStore());

  React.useEffect(() => {
    setStandards(readGradeStandardStore());
    return subscribeExperimentMgmtMock(() => {
      setStandards(readGradeStandardStore());
    });
  }, []);

  const updateExperiment = React.useCallback(
    (
      scope: GradeStandardScopeKey,
      experimentId: string,
      patch: Partial<Pick<GradeStandardExperiment, "is_mandatory" | "ai_strategy" | "suggested_periods">>,
    ) => {
      updateGradeStandardExperiment(scope, experimentId, patch);
      setStandards(readGradeStandardStore());
    },
    [],
  );

  const runAiSmartSchedule = React.useCallback((scope: GradeStandardScopeKey) => {
    runAiSmartScheduleForScope(scope);
    setStandards(readGradeStandardStore());
  }, []);

  return { standards, updateExperiment, runAiSmartSchedule };
}
