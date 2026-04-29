"use client";

import * as React from "react";

export type SubjectPhase = "primary" | "junior" | "senior";
export type SubjectSemester = "upper" | "lower";

export type SubjectCatalogItem = {
  code: string;
  label: string;
};

export type SubjectPhaseScope = {
  phase: SubjectPhase;
  grade: number;
  semester: SubjectSemester;
};

export type SubjectPhaseConfigRecord = SubjectPhaseScope & {
  id: string;
  subjectCode: string;
  subjectLabel: string;
  enabled: boolean;
  order: number;
  updatedAt: string;
};

let inMemoryRows: SubjectPhaseConfigRecord[] | null = null;

const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((listener) => listener());
}

export function subscribeSubjectPhaseConfig(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function buildScopeKey(scope: SubjectPhaseScope): string {
  return `${scope.phase}-${scope.grade}-${scope.semester}`;
}

function isValidPhase(phase: string): phase is SubjectPhase {
  return phase === "primary" || phase === "junior" || phase === "senior";
}

function isValidSemester(semester: string): semester is SubjectSemester {
  return semester === "upper" || semester === "lower";
}

function gradeRangeByPhase(phase: SubjectPhase): readonly number[] {
  if (phase === "primary") return [1, 2, 3, 4, 5, 6];
  if (phase === "junior") return [7, 8, 9];
  return [10, 11, 12];
}

function normalizeRows(
  rows: readonly SubjectPhaseConfigRecord[],
  subjectCatalog: readonly SubjectCatalogItem[],
): SubjectPhaseConfigRecord[] {
  const now = new Date().toISOString();
  const subjectMap = new Map(subjectCatalog.map((item) => [item.code, item.label]));
  const normalized: SubjectPhaseConfigRecord[] = [];
  const known = new Set<string>();

  for (const phase of ["primary", "junior", "senior"] as const) {
    for (const grade of gradeRangeByPhase(phase)) {
      for (const semester of ["upper", "lower"] as const) {
        const scopeKey = buildScopeKey({ phase, grade, semester });
        const scopedRows = rows.filter(
          (row) => row.phase === phase && row.grade === grade && row.semester === semester,
        );
        const rowMap = new Map(scopedRows.map((row) => [row.subjectCode, row]));
        subjectCatalog.forEach((subject, index) => {
          const current = rowMap.get(subject.code);
          const id = `${scopeKey}:${subject.code}`;
          known.add(id);
          normalized.push({
            id,
            phase,
            grade,
            semester,
            subjectCode: subject.code,
            subjectLabel: subject.label,
            enabled: current?.enabled ?? true,
            order: Number.isFinite(current?.order) ? Number(current?.order) : index + 1,
            updatedAt: current?.updatedAt ?? now,
          });
        });
      }
    }
  }

  rows.forEach((row) => {
    if (!isValidPhase(row.phase) || !isValidSemester(row.semester)) return;
    if (!subjectMap.has(row.subjectCode)) return;
    const id = `${buildScopeKey(row)}:${row.subjectCode}`;
    if (known.has(id)) return;
    normalized.push({
      ...row,
      id,
      subjectLabel: subjectMap.get(row.subjectCode) ?? row.subjectLabel,
      updatedAt: row.updatedAt || now,
    });
  });

  return normalized;
}

export function readSubjectPhaseConfigRows(
  subjectCatalog: readonly SubjectCatalogItem[],
): SubjectPhaseConfigRecord[] {
  return normalizeRows(inMemoryRows ?? [], subjectCatalog);
}

export function writeSubjectPhaseConfigRows(
  rows: readonly SubjectPhaseConfigRecord[],
  subjectCatalog: readonly SubjectCatalogItem[],
) {
  const normalized = normalizeRows(rows, subjectCatalog);
  inMemoryRows = normalized;
  notifyListeners();
}

export function resetSubjectPhaseConfigSeed() {
  inMemoryRows = null;
  notifyListeners();
}

export function useSubjectPhaseConfigStore(subjectCatalog: readonly SubjectCatalogItem[]) {
  const [rows, setRows] = React.useState<SubjectPhaseConfigRecord[]>(() =>
    readSubjectPhaseConfigRows(subjectCatalog),
  );

  React.useEffect(() => {
    setRows(readSubjectPhaseConfigRows(subjectCatalog));
    return subscribeSubjectPhaseConfig(() => {
      setRows(readSubjectPhaseConfigRows(subjectCatalog));
    });
  }, [subjectCatalog]);

  const replaceRows = React.useCallback(
    (nextRows: readonly SubjectPhaseConfigRecord[]) => {
      writeSubjectPhaseConfigRows(nextRows, subjectCatalog);
      setRows(readSubjectPhaseConfigRows(subjectCatalog));
    },
    [subjectCatalog],
  );

  return { rows, replaceRows, resetToSeed: resetSubjectPhaseConfigSeed };
}
