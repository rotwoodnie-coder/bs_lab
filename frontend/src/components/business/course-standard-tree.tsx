"use client";

import * as React from "react";
import {
  Badge,
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@bs-lab/ui";
import { BookOpen, ChevronDown, ChevronRight, GraduationCap, School } from "@bs-lab/ui/icons";

import { PHASE_ROOTS, rowMatchesPhaseGradeSelection } from "@/lib/curriculum-grade-filter";
import { lucideIconForTreeIconKey } from "@/lib/tree/discipline-tree-icons";
import { cn } from "@/lib/utils";
import type { CurriculumStandardRow, CurriculumSubject } from "@/types/curriculum-standard";

type Phase = (typeof PHASE_ROOTS)[number];
type CanonicalSubject = "science" | "physics" | "chemistry" | "biology";

const CANONICAL_SUBJECTS: { key: CanonicalSubject; label: string; phases: readonly Phase[] }[] = [
  { key: "science", label: "科学", phases: ["小学"] },
  { key: "physics", label: "物理", phases: ["初中", "高中"] },
  { key: "chemistry", label: "化学", phases: ["初中", "高中"] },
  { key: "biology", label: "生物", phases: ["初中", "高中"] },
];

const PHASE_GRADE_DEFS: Record<Phase, readonly { label: string; filterGrade: string }[]> = {
  小学: [
    { label: "1年级", filterGrade: "一年级" },
    { label: "2年级", filterGrade: "二年级" },
    { label: "3年级", filterGrade: "三年级" },
    { label: "4年级", filterGrade: "四年级" },
    { label: "5年级", filterGrade: "五年级" },
  ],
  初中: [
    { label: "6年级", filterGrade: "六年级" },
    { label: "7年级", filterGrade: "七年级" },
    { label: "8年级", filterGrade: "八年级" },
    { label: "9年级", filterGrade: "九年级" },
  ],
  高中: [
    { label: "10年级", filterGrade: "十年级" },
    { label: "11年级", filterGrade: "十一年级" },
    { label: "12年级", filterGrade: "十二年级" },
  ],
};

export type CourseStandardTreeFilter =
  | null
  | {
      subject?: CanonicalSubject;
      phase?: Phase;
      gradeLabel?: string;
      gradeFilterValue?: string;
    };

type NodeIcon = "book" | "school" | "graduation" | CanonicalSubject;

type TreeNode = {
  id: string;
  label: string;
  depth: number;
  icon?: NodeIcon;
  count: number;
  attention: boolean;
  filter: CourseStandardTreeFilter;
  children?: TreeNode[];
};

export type CourseStandardTreeMode = "subject" | "grade";
function canonicalSubjectFromRow(row: CurriculumStandardRow): CanonicalSubject | null {
  const hit = row.subjectId.match(/catalog-subj-(\d+)/);
  if (hit) {
    const num = Number.parseInt(hit[1]!, 10);
    if (num === 0) return "science";
    if (num === 7 || num === 13) return "physics";
    if (num === 4 || num === 10) return "chemistry";
    if (num === 5 || num === 11) return "biology";
  }
  return null;
}

function phaseIcon(phase: Phase): NodeIcon {
  if (phase === "小学") return "book";
  if (phase === "初中") return "school";
  return "graduation";
}

function subjectIcon(subject: CanonicalSubject): NodeIcon {
  return subject;
}

function rowMatchesFilter(row: CurriculumStandardRow, filter: CourseStandardTreeFilter): boolean {
  if (!filter) return true;
  const subjectKey = canonicalSubjectFromRow(row);
  if (!subjectKey) return false;
  if (filter.subject && subjectKey !== filter.subject) return false;
  if (filter.phase) {
    return rowMatchesPhaseGradeSelection(row, { phase: filter.phase, grade: filter.gradeFilterValue });
  }
  return !filter.gradeFilterValue;
}

function metricsFor(rows: CurriculumStandardRow[], filter: CourseStandardTreeFilter) {
  const matched = rows.filter((r) => rowMatchesFilter(r, filter));
  return {
    count: matched.length,
    attention: matched.some((r) => r.publishStatus === "draft"),
  };
}

function buildSubjectTree(rows: CurriculumStandardRow[]): TreeNode[] {
  return CANONICAL_SUBJECTS.map((s) => {
    const subjectFilter: CourseStandardTreeFilter = { subject: s.key };
    const gradeNodes = s.phases.flatMap((phase) =>
      PHASE_GRADE_DEFS[phase].map((grade) => {
        const leafFilter: CourseStandardTreeFilter = {
          subject: s.key,
          phase,
          gradeLabel: grade.label,
          gradeFilterValue: grade.filterGrade,
        };
        const m = metricsFor(rows, leafFilter);
        return {
          id: `subject:${s.key}:grade:${grade.label}`,
          label: grade.label,
          depth: 1,
          icon: phaseIcon(phase),
          count: m.count,
          attention: m.attention,
          filter: leafFilter,
        } satisfies TreeNode;
      }),
    );
    const m = metricsFor(rows, subjectFilter);
    return {
      id: `subject:${s.key}`,
      label: s.label,
      depth: 0,
      icon: subjectIcon(s.key),
      count: m.count,
      attention: m.attention,
      filter: subjectFilter,
      children: gradeNodes,
    } satisfies TreeNode;
  });
}

function buildGradeTree(rows: CurriculumStandardRow[]): TreeNode[] {
  return PHASE_ROOTS.map((phase) => {
    const phaseFilter: CourseStandardTreeFilter = { phase };
    const subjectNodes = CANONICAL_SUBJECTS.filter((s) => s.phases.includes(phase)).map((s) => {
      const subjectFilter: CourseStandardTreeFilter = { phase, subject: s.key };
      const m = metricsFor(rows, subjectFilter);
      return {
        id: `phase:${phase}:subject:${s.key}`,
        label: s.label,
        depth: 1,
        icon: subjectIcon(s.key),
        count: m.count,
        attention: m.attention,
        filter: subjectFilter,
      } satisfies TreeNode;
    });

    const m = metricsFor(rows, phaseFilter);
    return {
      id: `phase:${phase}`,
      label: phase,
      depth: 0,
      icon: phaseIcon(phase),
      count: m.count,
      attention: m.attention,
      filter: phaseFilter,
      children: subjectNodes,
    } satisfies TreeNode;
  });
}

function collectExpandForSearch(nodes: TreeNode[], q: string): Set<string> {
  const expanded = new Set<string>();
  const t = q.trim().toLowerCase();
  if (!t) return expanded;
  const dfs = (node: TreeNode): boolean => {
    const selfHit = node.label.toLowerCase().includes(t);
    const childHit = (node.children ?? []).some((ch) => dfs(ch));
    const hit = selfHit || childHit;
    if (hit && node.children && node.children.length > 0) expanded.add(node.id);
    return hit;
  };
  for (const n of nodes) dfs(n);
  return expanded;
}

function isSelected(filter: CourseStandardTreeFilter, selected: CourseStandardTreeFilter): boolean {
  if (!filter && !selected) return true;
  if (!filter || !selected) return false;
  return (
    filter.subject === selected.subject &&
    filter.phase === selected.phase &&
    filter.gradeLabel === selected.gradeLabel &&
    filter.gradeFilterValue === selected.gradeFilterValue
  );
}

export function CourseStandardTree(props: {
  rows: CurriculumStandardRow[];
  subjects: CurriculumSubject[];
  mode: CourseStandardTreeMode;
  value: CourseStandardTreeFilter;
  onChange: (next: CourseStandardTreeFilter) => void;
  searchText: string;
  minimal?: boolean;
}) {
  const { rows, value, onChange, searchText, mode, minimal } = props;
  const [manualOpen, setManualOpen] = React.useState<Record<string, boolean>>({});
  const nodes = React.useMemo(() => (mode === "subject" ? buildSubjectTree(rows) : buildGradeTree(rows)), [mode, rows]);
  const forceOpen = React.useMemo(() => collectExpandForSearch(nodes, searchText), [nodes, searchText]);
  const query = searchText.trim().toLowerCase();

  const renderNode = (node: TreeNode): React.ReactNode => {
    const hasChildren = (node.children?.length ?? 0) > 0;
    const rowHit = query ? node.label.toLowerCase().includes(query) : true;
    const childAny = query ? (node.children ?? []).some((ch) => String(renderNode(ch)).length > 0) : true;
    if (!rowHit && !childAny) return null;
    const open = forceOpen.has(node.id) || manualOpen[node.id] || false;
    const selected = isSelected(node.filter, value);
    const disciplineIco =
      node.icon === "science" || node.icon === "physics" || node.icon === "chemistry" || node.icon === "biology"
        ? lucideIconForTreeIconKey(`discipline.${node.icon}`)
        : null;
    const Icon =
      disciplineIco ??
      (node.icon === "book"
        ? BookOpen
        : node.icon === "school"
          ? School
          : node.icon === "graduation"
            ? GraduationCap
            : null);
    const indent = `${node.depth * 14}px`;
    return (
      <Collapsible key={node.id} open={open} onOpenChange={(v) => setManualOpen((p) => ({ ...p, [node.id]: v }))}>
        <div className="relative">
          {node.depth > 0 ? (
            <span className="absolute bottom-0 left-0 top-0 w-px bg-border/80" style={{ marginLeft: `${node.depth * 14 - 8}px` }} />
          ) : null}
          <div
            className={cn(
              "group my-0.5 flex items-center gap-1 rounded-md px-1 py-0.5 transition-colors",
              selected ? "bg-accent/70 shadow-xs" : "hover:bg-muted/50 hover:shadow-xs",
            )}
            style={{ paddingLeft: indent }}
          >
            {hasChildren ? (
              <CollapsibleTrigger asChild>
                <Button type="button" size="icon" variant="ghost" className="size-6 shrink-0">
                  {open ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
                </Button>
              </CollapsibleTrigger>
            ) : (
              <span className="inline-block size-6 shrink-0" />
            )}
            <Button
              type="button"
              variant="ghost"
              className="h-7 min-w-0 flex-1 justify-start px-2 text-left"
              onClick={() => onChange(node.filter)}
            >
              {Icon ? <Icon className="mr-1.5 size-3.5 shrink-0 opacity-70" /> : null}
              <span className="truncate text-sm">{node.label}</span>
            </Button>
            {node.attention ? <span className="mr-1 size-2 shrink-0 rounded-full bg-destructive" /> : null}
            <Badge variant="outline" className="mr-1 h-5 min-w-7 px-1.5 text-[11px] tabular-nums">
              {node.count}
            </Badge>
          </div>
        </div>
        {hasChildren ? (
          <CollapsibleContent>
            <div>{node.children!.map((ch) => renderNode(ch))}</div>
          </CollapsibleContent>
        ) : null}
      </Collapsible>
    );
  };

  return (
    <div className="space-y-3">
      <div className={minimal ? "p-0" : "rounded-md border border-border p-2"}>{nodes.map((n) => renderNode(n))}</div>
    </div>
  );
}

export function rowMatchesCourseStandardTreeFilter(row: CurriculumStandardRow, filter: CourseStandardTreeFilter): boolean {
  return rowMatchesFilter(row, filter);
}

