"use client";

import * as React from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { sonnerToast } from "@bs-lab/ui";
import { UserRole } from "@/types/auth";
import { useAuth, authRoleToUserRole } from "@/hooks/use-auth";
import { canManageExperimentShelfWorkflow } from "@/lib/rbac/management-access";
import type { CoreApiActor } from "@/lib/core-api-shared";
import {
  fetchV2ExpList,
  fetchV2SchoolSubjects,
  fetchV2SchoolLevels,
  fetchV2SchoolGrades,
  fetchV2DifficultyTypes,
  deleteV2Exp,
  publishCourseTask,
  type V2ExpMsgItem,
  type V2ExpMsgQuery,
  type V2DictItem,
  type V2DictGradeItem,
} from "@/lib/v2/v2-exp-api";
import { useExperimentVisibilityFilter } from "./experiment-visibility-filter.hooks";
import { toDictOptions } from "@/lib/v2/v2-dict-adapter";
import type { SubjectPath, SubjectSelection } from "@/lib/subject-taxonomy";
import {
  labelsForSubjectLeaf,
  readSubjectSelectionFromSearchParams,
  writeSubjectSelectionToSearchParams,
} from "@/lib/subject-taxonomy";

export type ExpStatusFilter = "t" | "y" | "n" | "all";
export type ExpView = "list" | "cards";

export type ExperimentPublishStatus = "draft" | "published" | "partial" | "unknown";
export type ExperimentPublishInfo = {
  publishStatus: ExperimentPublishStatus;
  targetClassName?: string;
  targetClassId?: string;
  publishedAt?: string;
  isExpired?: boolean;
};
export type ExperimentManageRow = V2ExpMsgItem & { publishInfo: ExperimentPublishInfo };

export interface UseExperimentManageReturn {
  actor: CoreApiActor;
  canShelf: boolean;
  items: ExperimentManageRow[];
  total: number;
  draftTotal: number;
  loading: boolean;
  subjects: V2DictItem[];
  schoolLevels: V2DictItem[];
  grades: V2DictGradeItem[];
  difficulties: V2DictItem[];
  q: string;
  setQ: (v: string) => void;
  statusFilter: ExpStatusFilter;
  setStatusFilter: (v: ExpStatusFilter) => void;
  selectedSubject: SubjectSelection | null;
  setSelectedSubject: (v: SubjectSelection | null) => void;
  page: number;
  pageSize: number;
  setPage: (n: number) => void;
  view: ExpView;
  setView: (v: ExpView) => void;
  refresh: () => void;
  assignTarget: ExperimentManageRow | null;
  assignDialogOpen: boolean;
  assignPending: boolean;
  openAssignDialog: (row: ExperimentManageRow) => void;
  setAssignDialogOpen: (open: boolean) => void;
  confirmAssign: (payload: { targetClassId: string; deadline?: string | null; requirement?: string | null }) => Promise<void>;
  setAssignTarget: (row: ExperimentManageRow | null) => void;

  deletePending: boolean;
  deleteExperiment: (expId: string, expName?: string) => Promise<void>;
}

function resolveGradeIdFromLeaf(leaf: SubjectPath, grades: V2DictGradeItem[]): string | undefined {
  if (!grades.length) return undefined;
  const { gradeLabel } = labelsForSubjectLeaf(leaf);
  const gl = gradeLabel.trim();
  if (!gl) return undefined;
  const exact = grades.find((g) => String(g.name ?? "").trim() === gl);
  if (exact) return exact.id;
  return grades.find((g) => {
    const n = String(g.name ?? "").trim();
    return n.includes(gl) || gl.includes(n);
  })?.id;
}

function toPublishInfo(item: V2ExpMsgItem): ExperimentPublishInfo {
  const taskInfo = item.taskInfo ?? null;
  if (!taskInfo) return { publishStatus: "draft" };

  const targetClassName = taskInfo.targetClassName ?? undefined;
  const publishedAt = taskInfo.publishedAt ?? undefined;
  const deadline = taskInfo.deadline ?? undefined;
  const isExpired = Boolean(deadline && !Number.isNaN(Date.parse(deadline)) && Date.now() > Date.parse(deadline));

  const targetClassId = taskInfo.targetClassId ?? undefined;

  if (taskInfo.status === "published") {
    return {
      publishStatus: "published",
      targetClassId,
      targetClassName,
      publishedAt,
      isExpired,
    };
  }

  if (taskInfo.status === "partial") {
    return {
      publishStatus: "partial",
      targetClassId,
      targetClassName,
      publishedAt,
      isExpired,
    };
  }

  return { publishStatus: "unknown", targetClassId, targetClassName, publishedAt, isExpired };
}

export function useExperimentManage(): UseExperimentManageReturn {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const actor = React.useMemo<CoreApiActor>(
    () => ({ role: user.role, orgId: user.orgId, userId: user.userId, userName: user.userName, tenantId: user.tenantId, appId: user.appId }),
    [user.orgId, user.userId, user.userName, user.role, user.tenantId, user.appId],
  );
  const canShelf = canManageExperimentShelfWorkflow(user);
  const currentRole = authRoleToUserRole(user.role);

  const [q, setQ] = React.useState(searchParams.get("q") ?? "");
  const [debouncedQ, setDebouncedQ] = React.useState(q);
  React.useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQ(q), 350);
    return () => window.clearTimeout(t);
  }, [q]);

  const [statusFilter, setStatusFilter] = React.useState<ExpStatusFilter>("all");
  const [view, setView] = React.useState<ExpView>("list");
  const [page, setPage] = React.useState(1);
  const pageSize = 20;

  const selectedSubject = React.useMemo<SubjectSelection | null>(
    () => readSubjectSelectionFromSearchParams(searchParams),
    [searchParams],
  );
  const setSelectedSubject = React.useCallback(
    (next: SubjectSelection | null) => {
      const nextParams = writeSubjectSelectionToSearchParams(searchParams, next);
      const qs = nextParams.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  const [subjects, setSubjects] = React.useState<V2DictItem[]>([]);
  const [schoolLevels, setSchoolLevels] = React.useState<V2DictItem[]>([]);
  const [grades, setGrades] = React.useState<V2DictGradeItem[]>([]);
  const [difficulties, setDifficulties] = React.useState<V2DictItem[]>([]);
  // 使用 ref 避免 grades 异步加载后导致 buildQuery/refresh 标识变化引发级联重刷
  const gradesRef = React.useRef(grades);
  gradesRef.current = grades;
  React.useEffect(() => {
    void fetchV2SchoolSubjects(actor).then((rows) => setSubjects(toDictOptions(rows))).catch(() => {});
    void fetchV2SchoolLevels(actor).then((rows) => setSchoolLevels(toDictOptions(rows))).catch(() => {});
    void fetchV2SchoolGrades(actor).then((rows) => setGrades(rows)).catch(() => {});
    void fetchV2DifficultyTypes(actor).then((rows) => setDifficulties(toDictOptions(rows))).catch(() => {});
  }, [actor]);

  const [items, setItems] = React.useState<ExperimentManageRow[]>([]);
  const [total, setTotal] = React.useState(0);
  const [draftTotal, setDraftTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [assignTarget, setAssignTarget] = React.useState<ExperimentManageRow | null>(null);
  const [assignDialogOpen, setAssignDialogOpen] = React.useState(false);
  const [assignPending, setAssignPending] = React.useState(false);
  const [deletePending, setDeletePending] = React.useState(false);

  const { filterVisibleExperiments } = useExperimentVisibilityFilter(
    actor, currentRole, user.teachingResearchGroups, user.userId,
  );

  const filterRef = React.useRef(filterVisibleExperiments);
  filterRef.current = filterVisibleExperiments;

  const buildQuery = React.useCallback((): V2ExpMsgQuery => {
    const query: V2ExpMsgQuery = { page, pageSize, keyword: debouncedQ.trim() || undefined };
    if (statusFilter !== "all") query.status = statusFilter;
    if (selectedSubject?.kind === "discipline" && selectedSubject.nodeId) {
      query.subjectId = selectedSubject.nodeId;
    } else if (selectedSubject?.kind === "leaf" && selectedSubject.leaf?.nodeId) {
      query.subjectId = selectedSubject.leaf.nodeId;
      // 通过 ref 读 grades，避免 grades 异步加载引起 buildQuery 标识变化
      const gid = resolveGradeIdFromLeaf(selectedSubject.leaf, gradesRef.current);
      if (gid) query.gradeId = gid;
    }
    return query;
  }, [page, pageSize, debouncedQ, statusFilter, selectedSubject]); // 移除 grades 依赖

  const refresh = React.useCallback(() => {
    setLoading(true);
    const q = buildQuery();
    Promise.all([fetchV2ExpList(actor, q), fetchV2ExpList(actor, { status: "t", page: 1, pageSize: 1 })])
      .then(([result, draftResult]) => {
        const fullItems = result.items.map((item) => ({ ...item, publishInfo: toPublishInfo(item) }));
        const filtered = filterRef.current(fullItems);
        setItems(filtered);
        // 使用服务端返回的 total（查询条件由服务端处理），而非 filtered.length
        setTotal(result.total);
        setDraftTotal(draftResult.total);
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : "加载失败";
        sonnerToast.error("实验列表加载失败", { description: msg });
      })
      .finally(() => setLoading(false));
  }, [actor, buildQuery]); // 移除了 filterVisibleExperiments 依赖 —— 通过 ref 读取最新值

  const openAssignDialog = React.useCallback((row: ExperimentManageRow) => {
    setAssignTarget(row);
    setAssignDialogOpen(true);
  }, []);

  const confirmAssign = React.useCallback(
    async (payload: { targetClassId: string; deadline?: string | null; requirement?: string | null }) => {
      if (!assignTarget) return;
      setAssignPending(true);
      try {
        await publishCourseTask(actor, {
          draftId: assignTarget.expId,
          targetClassId: payload.targetClassId,
          deadline: payload.deadline ?? null,
          requirement: payload.requirement ?? null,
        });
        await refresh();
        setAssignDialogOpen(false);
        setAssignTarget(null);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "布置作业失败";
        sonnerToast.error("布置作业失败", { description: msg });
        throw err;
      } finally {
        setAssignPending(false);
      }
    },
    [actor, assignTarget, refresh],
  );

  const deleteExperiment = React.useCallback(
    async (expId: string, expName?: string) => {
      if (deletePending) return;
      setDeletePending(true);
      try {
        await deleteV2Exp(actor, expId);
        await refresh();
        sonnerToast.success("删除成功", { description: expName ? `已删除「${expName}」` : undefined });
      } catch (err: unknown) {
        sonnerToast.error("删除失败", { description: err instanceof Error ? err.message : "请求失败" });
        throw err;
      } finally {
        setDeletePending(false);
      }
    },
    [actor, deletePending, refresh],
  );

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  React.useEffect(() => {
    setPage(1);
  }, [debouncedQ, statusFilter, selectedSubject]);

  return {
    actor,
    canShelf,
    items,
    total,
    draftTotal,
    loading,
    subjects,
    schoolLevels,
    grades,
    difficulties,
    q,
    setQ,
    statusFilter,
    setStatusFilter,
    selectedSubject,
    setSelectedSubject,
    page,
    pageSize,
    setPage,
    view,
    setView,
    refresh,
    assignTarget,
    assignDialogOpen,
    assignPending,
    openAssignDialog,
    setAssignDialogOpen,
    confirmAssign,
    setAssignTarget,
    deletePending,
    deleteExperiment,
  };
}
