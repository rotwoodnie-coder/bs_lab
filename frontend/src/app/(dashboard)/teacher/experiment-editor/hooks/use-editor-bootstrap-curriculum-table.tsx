"use client";

import * as React from "react";
import { Badge, DataTableColumnHeader } from "@bs-lab/ui";
import type { ColumnDef } from "@bs-lab/ui/react-table";
import { getCoreRowModel, getPaginationRowModel, useReactTable } from "@bs-lab/ui/react-table";

import { EDITOR_PEER_MANDATORY_LABEL, type EditorPeerRow } from "../utils/editor-peer-row-types";
import { subjectPathFromLabels } from "@/lib/subject-taxonomy";
import type { EducationPhase } from "@/types/subject";
import type { SubjectDiscipline } from "@/types/subject";

import type { CurriculumEditorTableRow } from "../types";

type Args = {
  experimentRows: EditorPeerRow[];
  /** 实验列表筛选：空数组表示该维度不限 */
  listFilterPhases: EducationPhase[];
  listFilterDisciplines: SubjectDiscipline[];
  listFilterGradeCodes: string[];
  searchKeyword: string;
  selectedStandardId: string | null;
  /** 班级上下文（后续可按班级过滤课表实验列表） */
  targetClassId?: string | null;
  setSelectedStandardId: (v: string | null) => void;
  setCurriculum: (v: string) => void;
  useCustomExperiment: boolean;
};

function rowMatchesListFilter(
  row: EditorPeerRow,
  phases: EducationPhase[],
  disciplines: SubjectDiscipline[],
  gradeCodes: string[],
): boolean {
  const gradeLabels = Array.isArray(row.gradeLabels) ? row.gradeLabels : [];
  const leaves = gradeLabels
    .map((gradeLabel) =>
      subjectPathFromLabels({
        subjectLabel: row.subjectLabel,
        gradeLabel,
      }),
    )
    .filter((leaf): leaf is NonNullable<typeof leaf> => Boolean(leaf));

  if (leaves.length === 0) {
    return phases.length === 0 && disciplines.length === 0 && gradeCodes.length === 0;
  }
  return leaves.some(
    (leaf) =>
      (phases.length === 0 || phases.includes(leaf.phase)) &&
      (disciplines.length === 0 || disciplines.includes(leaf.discipline)) &&
      (gradeCodes.length === 0 || gradeCodes.includes(leaf.gradeCode)),
  );
}

function normalizeSearchText(value: string): string {
  return value.toLowerCase().replace(/\s+/g, "");
}

function fuzzySubsequenceMatch(text: string, keyword: string): boolean {
  if (!keyword) return true;
  let textIdx = 0;
  let keyIdx = 0;
  while (textIdx < text.length && keyIdx < keyword.length) {
    if (text[textIdx] === keyword[keyIdx]) keyIdx += 1;
    textIdx += 1;
  }
  return keyIdx === keyword.length;
}

export function useEditorBootstrapCurriculumTable(p: Args) {
  const normalizedSearch = p.searchKeyword.trim().toLowerCase();
  const searchTokens = React.useMemo(
    () =>
      normalizedSearch
        .split(/\s+/)
        .map((item) => item.trim())
        .filter(Boolean),
    [normalizedSearch],
  );
  const hasSearchKeyword = searchTokens.length > 0;
  const curriculumTableRows = React.useMemo<CurriculumEditorTableRow[]>(() => {
    return p.experimentRows
      .filter((row) =>
        rowMatchesListFilter(row, p.listFilterPhases, p.listFilterDisciplines, p.listFilterGradeCodes),
      )
      .filter((row) => {
        if (!searchTokens.length) return true;
        const haystack = [
          row.title ?? "",
          row.id ?? "",
          row.subjectLabel ?? "",
          row.authorName ?? "",
          ...(Array.isArray(row.gradeLabels) ? row.gradeLabels : []),
        ]
          .join(" ")
          .toLowerCase();
        const compactHaystack = normalizeSearchText(haystack);
        return searchTokens.every((token) => {
          const compactToken = normalizeSearchText(token);
          if (!compactToken) return true;
          return (
            haystack.includes(token) ||
            compactHaystack.includes(compactToken) ||
            fuzzySubsequenceMatch(compactHaystack, compactToken)
          );
        });
      })
      .map((row) => {
        const rowPaths = (Array.isArray(row.gradeLabels) ? row.gradeLabels : [])
          .map((gradeLabel) =>
            subjectPathFromLabels({
              subjectLabel: row.subjectLabel,
              gradeLabel,
            }),
          )
          .filter((leaf): leaf is NonNullable<typeof leaf> => Boolean(leaf));
        const rawSubject = String(row.subjectLabel ?? "").trim();
        const parts = rawSubject
          .split("·")
          .map((item) => item.trim())
          .filter(Boolean);
        const rowPhase = parts[0] ?? "—";
        const rowDiscipline = parts[1] ?? parts[0] ?? "—";
        return {
          id: row.id,
          title: row.title || "—",
          phaseLabel: rowPhase,
          disciplineLabel: rowDiscipline,
          phase: rowPaths[0]?.phase ?? null,
          discipline: rowPaths[0]?.discipline ?? null,
          gradeCodes: [...new Set(rowPaths.map((leaf) => leaf.gradeCode))],
          recommendedGrades: Array.isArray(row.gradeLabels) ? row.gradeLabels.join("、") : "",
          mandatory: row.mandatory,
          curriculumRefText: `${rowPhase} / ${rowDiscipline}`,
          sourceType: row.sourceType ?? 'library',
          libraryId: row.libraryId,
          publishStatus: row.publishStatus,
        };
      })
      .sort((a, b) => a.title.localeCompare(b.title, "zh-CN"));
  }, [p.experimentRows, p.listFilterDisciplines, p.listFilterGradeCodes, p.listFilterPhases, searchTokens]);

  const sel = p.selectedStandardId;
  const curriculumColumns = React.useMemo<ColumnDef<CurriculumEditorTableRow>[]>(
    () => [
      {
        accessorKey: "title",
        meta: { label: "实验名称" },
        header: ({ column }) => <DataTableColumnHeader column={column} title="实验名称" />,
        cell: ({ row }) => (
          <div
            className={
              row.original.id === sel
                ? "flex items-center gap-2 rounded-md bg-status-success/12 px-2 py-1"
                : "flex items-center gap-2"
            }
          >
            <span className="max-w-[220px] truncate text-foreground">{row.original.title}</span>
            {row.original.id === sel ? (
              <Badge variant="success" className="h-5 px-1.5 text-[10px]">
                已选择
              </Badge>
            ) : null}
          </div>
        ),
      },
      {
        id: "phaseDiscipline",
        accessorFn: (row) => `${row.phaseLabel} / ${row.disciplineLabel}`,
        meta: { label: "学段 / 学科" },
        header: ({ column }) => <DataTableColumnHeader column={column} title="学段 / 学科" />,
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.phaseLabel} / {row.original.disciplineLabel}</span>
        ),
      },
      {
        accessorKey: "recommendedGrades",
        meta: { label: "推荐年级" },
        header: ({ column }) => <DataTableColumnHeader column={column} title="推荐年级" />,
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.recommendedGrades || "—"}</span>
        ),
      },
      {
        accessorKey: "mandatory",
        meta: { label: "必做/选做" },
        header: ({ column }) => <DataTableColumnHeader column={column} title="必做/选做" />,
        cell: ({ row }) => (
          <Badge variant="outline" className="font-normal">
            {EDITOR_PEER_MANDATORY_LABEL[row.original.mandatory]}
          </Badge>
        ),
      },
    ],
    [sel],
  );

  const curriculumTable = useReactTable({
    data: curriculumTableRows,
    columns: curriculumColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getRowId: (r) => r.id,
    initialState: { pagination: { pageSize: 8 } },
  });

  return { curriculumTableRows, curriculumTable };
}
