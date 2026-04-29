/**
 * OrgSchoolGradeClassPanel 状态管理 Hook
 */
"use client";

import * as React from "react";
import { sonnerToast } from "@bs-lab/ui";

import type { DictOption } from "@/lib/v2/v2-dict-adapter";
import type { V2SysOrgItem } from "@/lib/v2/v2-sys-api";

import type { OrgTypeUiMode } from "../org-type-ui-mode";
import {
  countClassLikeChildrenForGrade,
  DEFAULT_CLASS_COUNT,
  gradeNumberFromId,
  groupRowsByStage,
  isClassNode,
  pickClassOrgTypeId,
  pickGradeOrgTypeId,
  sortGrades,
  type GradeOptionWithLevel,
  type Row,
  type StageKey,
  STAGE_RANGES,
} from "../org-school-structure-utils";
import {
  calculateStructureDiff,
  type DiffPhase,
  type StructureDiffResult,
} from "../org-structure-diff";

export interface UseSchoolGradeClassPanelProps {
  school: V2SysOrgItem;
  childOrgs: V2SysOrgItem[];
  gradeRows: GradeOptionWithLevel[];
  levelOptions: DictOption[];
  orgTypeOptions: DictOption[];
  orgTypeLabels: Record<string, string>;
  gradeLabels: Record<string, string>;
  isSuperAdmin: boolean;
  submitting: boolean;
  orgTypeMode: OrgTypeUiMode;
  onApply: (diff: StructureDiffResult) => Promise<void>;
  onClear: () => Promise<void>;
}

export type OrgSchoolGradeClassPanelProps = UseSchoolGradeClassPanelProps;

export interface UseSchoolGradeClassPanelReturn {
  rows: Row[];
  setRows: React.Dispatch<React.SetStateAction<Row[]>>;
  dirty: boolean;
  setDirty: React.Dispatch<React.SetStateAction<boolean>>;
  clearOpen: boolean;
  setClearOpen: (v: boolean) => void;
  saveClearOpen: boolean;
  setSaveClearOpen: (v: boolean) => void;
  pendingClear: boolean;
  pendingDiff: StructureDiffResult | null;
  confirmOpen: boolean;
  setConfirmOpen: (v: boolean) => void;
  setPendingDiff: (v: StructureDiffResult | null) => void;
  setPendingClear: (v: boolean) => void;
  sectionRefs: React.MutableRefObject<Record<StageKey, HTMLTableRowElement | null>>;
  groupedRows: ReturnType<typeof groupRowsByStage>;
  totalClasses: number;
  classTypeId: string | null;
  gradeTypeId: string | null;
  gradeInfoById: Map<string, GradeOptionWithLevel>;
  phase: DiffPhase;
  stageTargets: (stage: StageKey, source?: Row[]) => Row[];
  stageHeaderState: (stage: StageKey) => { value: string; placeholder: string };
  stageAggregate: (stage: StageKey) => boolean | "indeterminate";
  applyStageClassCount: (stage: StageKey, n: number) => void;
  toggleStage: (stage: StageKey, nextChecked: boolean) => void;
  applyAllGrades: () => void;
  clearAllGrades: () => void;
  handleSave: () => Promise<void>;
  executeSave: (diff: StructureDiffResult) => Promise<void>;
  handleConfirmDelete: () => void;
  gradeHasStudentsMap: Record<string, boolean>;
}

export function useSchoolGradeClassPanel({
  school,
  childOrgs,
  gradeRows,
  levelOptions,
  orgTypeOptions,
  orgTypeLabels,
  gradeLabels,
  isSuperAdmin,
  submitting,
  orgTypeMode,
  onApply,
  onClear,
}: UseSchoolGradeClassPanelProps): UseSchoolGradeClassPanelReturn {
  const [rows, setRows] = React.useState<Row[]>([]);
  const [dirty, setDirty] = React.useState(false);
  const [clearOpen, setClearOpen] = React.useState(false);
  const [saveClearOpen, setSaveClearOpen] = React.useState(false);
  const [pendingClear, setPendingClear] = React.useState(false);
  const [pendingDiff, setPendingDiff] = React.useState<StructureDiffResult | null>(null);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const sectionRefs = React.useRef<Record<StageKey, HTMLTableRowElement | null>>({
    primary: null,
    junior: null,
    senior: null,
  });

  const classTypeId = React.useMemo(() => pickClassOrgTypeId(orgTypeOptions), [orgTypeOptions]);
  const gradeTypeId = React.useMemo(() => pickGradeOrgTypeId(orgTypeOptions), [orgTypeOptions]);
  const gradeInfoById = React.useMemo(() => new Map(gradeRows.map((g) => [g.id, g])), [gradeRows]);

  // 初始化 / 运维阶段判定
  const phase = React.useMemo<DiffPhase>(() => {
    const totalStudents = childOrgs
      .filter((c) => isClassNode(c, classTypeId ?? ""))
      .reduce((sum, c) => {
        const v = c.studentCount;
        return sum + (typeof v === "number" && Number.isFinite(v) ? Math.max(0, v) : 0);
      }, 0);
    return totalStudents > 0 ? "maintenance" : "initialization";
  }, [childOrgs, classTypeId]);

  // 年级下有学生的映射
  const gradeHasStudentsMap = React.useMemo(() => {
    const map: Record<string, boolean> = {};
    for (const r of gradeRows) {
      const existingClasses = childOrgs.filter(
        (c) => isClassNode(c, classTypeId ?? "") && c.gradeId === r.id,
      );
      map[r.id] = existingClasses.some((c) => {
        return typeof c.studentCount === "number" && c.studentCount > 0;
      });
    }
    return map;
  }, [gradeRows, childOrgs, classTypeId]);

  // 初始化 rows
  React.useEffect(() => {
    const sg = new Set(school.schoolGradeIds ?? []);
    const gtId = gradeTypeId;
    const offeredByExistingGradeNode = new Set<string>();
    if (gtId) {
      for (const n of childOrgs) {
        if (n.gradeId && n.orgTypeId === gtId) offeredByExistingGradeNode.add(n.gradeId);
      }
    }
    setRows(
      sortGrades(gradeRows).map((g) => {
        const offered = sg.has(g.id) || offeredByExistingGradeNode.has(g.id);
        return {
          gradeId: g.id,
          offered,
          classCount: countClassLikeChildrenForGrade(childOrgs, g.id, orgTypeLabels),
        };
      }),
    );
    setDirty(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [school.orgId, school.schoolGradeIds, childOrgs, gradeRows, orgTypeLabels, orgTypeOptions]);

  const groupedRows = React.useMemo(
    () => groupRowsByStage(rows, gradeInfoById, gradeLabels, levelOptions),
    [gradeInfoById, gradeLabels, levelOptions, rows],
  );

  const totalClasses = React.useMemo(
    () => rows.reduce((s, r) => s + (r.offered ? r.classCount : 0), 0),
    [rows],
  );

  const stageTargets = React.useCallback(
    (stage: StageKey, source: Row[] = rows) => {
      const { from, to } = STAGE_RANGES[stage];
      return source.filter((r) => {
        const n = gradeNumberFromId(r.gradeId);
        return n != null && n >= from && n <= to;
      });
    },
    [rows],
  );

  const stageHeaderState = React.useCallback(
    (stage: StageKey): { value: string; placeholder: string } => {
      const targets = stageTargets(stage);
      const offered = targets.filter((t) => t.offered);
      if (offered.length === 0) return { value: "", placeholder: "0" };
      const uniq = new Set(offered.map((t) => t.classCount));
      if (uniq.size === 1) return { value: String(offered[0]!.classCount), placeholder: "0" };
      return { value: "", placeholder: "—" };
    },
    [stageTargets],
  );

  const applyStageClassCount = React.useCallback(
    (stage: StageKey, n: number) => {
      if (orgTypeMode !== "school") return;
      const { from, to } = STAGE_RANGES[stage];
      setRows((prev) =>
        prev.map((r) => {
          const num = gradeNumberFromId(r.gradeId);
          if (num == null || num < from || num > to) return r;
          return n <= 0 ? { ...r, offered: false, classCount: 0 } : { ...r, offered: true, classCount: n };
        }),
      );
      setDirty(true);
    },
    [orgTypeMode],
  );

  const stageAggregate = React.useCallback(
    (stage: StageKey): boolean | "indeterminate" => {
      const targets = stageTargets(stage);
      if (targets.length === 0) return false;
      const onCount = targets.filter((t) => t.offered).length;
      if (onCount === 0) return false;
      if (onCount === targets.length) return true;
      return "indeterminate";
    },
    [stageTargets],
  );

  const toggleStage = React.useCallback(
    (stage: StageKey, nextChecked: boolean) => {
      if (orgTypeMode !== "school") return;
      const { from, to } = STAGE_RANGES[stage];
      setRows((prev) =>
        prev.map((r) => {
          const num = gradeNumberFromId(r.gradeId);
          if (num == null || num < from || num > to) return r;
          return nextChecked
            ? { ...r, offered: true, classCount: r.classCount > 0 ? r.classCount : DEFAULT_CLASS_COUNT }
            : { ...r, offered: false, classCount: 0 };
        }),
      );
      setDirty(true);
    },
    [orgTypeMode],
  );

  const applyAllGrades = React.useCallback(() => {
    if (orgTypeMode === "school") {
      setRows((p) => p.map((r) => ({ ...r, offered: true, classCount: r.classCount > 0 ? r.classCount : DEFAULT_CLASS_COUNT })));
      setDirty(true);
    }
  }, [orgTypeMode]);

  const clearAllGrades = React.useCallback(() => {
    if (orgTypeMode !== "school") return;
    setRows((p) => p.map((r) => ({ ...r, offered: false, classCount: 0 })));
    setPendingClear(true);
    setDirty(true);
  }, [orgTypeMode]);

  const executeSave = React.useCallback(
    async (diff: StructureDiffResult) => {
      try {
        await onApply(diff);
        setPendingDiff(null);
        setDirty(false);
      } catch {
        // sonnerToast in hook
      }
    },
    [onApply],
  );

  const handleConfirmDelete = React.useCallback(() => {
    if (!pendingDiff) return;
    setConfirmOpen(false);
    void executeSave(pendingDiff);
  }, [pendingDiff, executeSave]);

  const handleSave = React.useCallback(async () => {
    if (orgTypeMode !== "school") {
      sonnerToast.error("当前组织类型不是学校类", {
        description: "请先切换为学校类组织类型，再保存年级与班级架构。",
      });
      return;
    }
    if (!classTypeId) {
      sonnerToast.error("未找到班级类组织类型", {
        description: "请在「组织类型」中维护名称含「班级」的类型。",
      });
      return;
    }
    if (!gradeTypeId) {
      sonnerToast.error("未找到年级类组织类型", {
        description: "请在「组织类型」中维护名称含「年级」的类型。",
      });
      return;
    }

    if (pendingClear) {
      setSaveClearOpen(true);
      return;
    }

    const diff = calculateStructureDiff({
      rows,
      childOrgs,
      orgTypeLabels,
      gradeLabels,
      gradeInfoById,
      classTypeId,
      gradeTypeId,
      phase,
      isSuperAdmin,
    });

    if (diff.blocked) {
      if (diff.blockedReason === "school_admin_blocked") {
        sonnerToast.error("检测到历史数据，操作被阻止", {
          description: "当前角色为普通管理员，无法执行删除或缩减班级操作。请联系系统超级管理员处理。",
        });
      } else {
        sonnerToast.error("保存被阻止", {
          description: "部分班级/年级仍存在学生数据，无法删除。请先迁移学生后再操作。",
        });
      }
      return;
    }

    if (diff.confirmItems.length > 0) {
      setPendingDiff(diff);
      setConfirmOpen(true);
      return;
    }

    await executeSave(diff);
  }, [
    orgTypeMode,
    classTypeId,
    gradeTypeId,
    pendingClear,
    rows,
    childOrgs,
    orgTypeLabels,
    gradeLabels,
    gradeInfoById,
    phase,
    isSuperAdmin,
    executeSave,
  ]);

  return {
    rows,
    setRows,
    dirty,
    setDirty,
    clearOpen,
    setClearOpen,
    saveClearOpen,
    setSaveClearOpen,
    pendingClear,
    pendingDiff,
    confirmOpen,
    setConfirmOpen,
    setPendingDiff,
    setPendingClear,
    sectionRefs,
    groupedRows,
    totalClasses,
    classTypeId,
    gradeTypeId,
    gradeInfoById,
    phase,
    stageTargets,
    stageHeaderState,
    stageAggregate,
    applyStageClassCount,
    toggleStage,
    applyAllGrades,
    clearAllGrades,
    handleSave,
    executeSave,
    handleConfirmDelete,
    gradeHasStudentsMap,
  };
}
