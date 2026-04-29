"use client";

import * as React from "react";
import { sonnerToast } from "@bs-lab/ui";

import { UserRole } from "@/types/auth";
import { authRoleToUserRole, useAuth } from "@/hooks/use-auth";
import type { CoreApiActor } from "@/lib/core-api-shared";
import { fetchV2SchoolLevels } from "@/lib/v2/v2-sys-api";
import { toDictOptions, toGradeOption, type DictOption } from "@/lib/v2/v2-dict-adapter";
import { V2_ORG_TYPE_IDS } from "@/lib/v2/v2-org-type-constants";
import {
  createV2SysOrg,
  deleteV2SysOrg,
  fetchV2OrgTypes,
  fetchV2SchoolGrades,
  fetchV2SysOrgTree,
  patchV2SysOrg,
  type CreateV2SysOrgInput,
  type UpdateV2SysOrgInput,
  type V2SysOrgItem,
} from "@/lib/v2/v2-sys-api";

import { buildOrgPath, buildOrgTreeFromFlat, findOrgInTree, flattenOrgDescendants } from "./org-tree-utils";
import { pickClassOrgTypeId, pickGradeOrgTypeId } from "./org-school-structure-utils";
function gradeNumberFromId(gradeId: string): number | null {
  const m = String(gradeId).match(/(\d{1,2})$/);
  if (!m) return null;
  const n = Number.parseInt(m[1]!, 10);
  return Number.isFinite(n) ? n : null;
}

type StageKey = "primary" | "junior" | "senior";
function stageKeyFromGradeId(gradeId: string): StageKey | null {
  const n = gradeNumberFromId(gradeId);
  if (n == null) return null;
  if (n >= 1 && n <= 5) return "primary";
  if (n >= 6 && n <= 9) return "junior";
  if (n >= 10 && n <= 12) return "senior";
  return null;
}
import type { GradeOptionWithLevel } from "./org-school-structure-utils";

function toLabelMap(opts: DictOption[]): Record<string, string> {
  return Object.fromEntries(opts.map((o) => [o.id, o.name]));
}

function stripChildren(n: V2SysOrgItem): Record<string, unknown> {
  const { children, ...rest } = n;
  return {
    ...rest,
    children: (children ?? []).map((c) => stripChildren(c)),
  };
}

import type { StructureDiffResult } from "./org-structure-diff";

export interface UseOrganizationsReturn {
  actor: CoreApiActor;
  orgTree: V2SysOrgItem[];
  loading: boolean;
  selectedId: string | null;
  setSelectedId: (id: string) => void;
  selectedOrg: V2SysOrgItem | undefined;
  selectedPath: V2SysOrgItem[];
  childOrgs: V2SysOrgItem[];
  descendantOrgs: V2SysOrgItem[];
  refresh: (opts?: { selectOrgId?: string | null }) => Promise<void>;
  orgTypeOptions: DictOption[];
  gradeOptions: GradeOptionWithLevel[];
  levelOptions: DictOption[];
  orgTypeLabels: Record<string, string>;
  gradeLabels: Record<string, string>;
  isSuperAdmin: boolean;
  applySchoolGradeClassStructure: (
    schoolOrgId: string,
    diff: StructureDiffResult,
  ) => Promise<void>;
  clearSchoolGradeClassStructure: (schoolOrgId: string) => Promise<void>;
  exportSubtreeJson: () => void;
  createOpen: boolean;
  setCreateOpen: (v: boolean) => void;
  submitting: boolean;
  handleCreate: (input: CreateV2SysOrgInput) => Promise<void>;
  handlePatch: (orgId: string, input: UpdateV2SysOrgInput) => Promise<void>;
  handleDeleteOrg: () => Promise<void>;
  deleteBusy: boolean;
}

export function useOrganizations(): UseOrganizationsReturn {
  const { user } = useAuth();
  const role = authRoleToUserRole(user.role);
  const isSuperAdmin = React.useMemo(() => role === UserRole.SUPER_ADMIN, [role]);
  const actor = React.useMemo<CoreApiActor>(
    () => ({ role, orgId: user.orgId, userId: user.userId, userName: user.userName, tenantId: user.tenantId, appId: user.appId }),
    [role, user.orgId, user.userId, user.userName, user.tenantId, user.appId],
  );

  const [orgTree, setOrgTree] = React.useState<V2SysOrgItem[]>([]);
  const [orgTypeOptions, setOrgTypeOptions] = React.useState<DictOption[]>([]);
  const [gradeOptions, setGradeOptions] = React.useState<GradeOptionWithLevel[]>([]);
  const [levelOptions, setLevelOptions] = React.useState<DictOption[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [deleteBusy, setDeleteBusy] = React.useState(false);

  const orgTypeLabels = React.useMemo(() => toLabelMap(orgTypeOptions), [orgTypeOptions]);
  const gradeLabels = React.useMemo(() => toLabelMap(gradeOptions), [gradeOptions]);

  const refresh = React.useCallback(async (opts?: { selectOrgId?: string | null }) => {
    setLoading(true);
    try {
      const [flat, types, grades, levels] = await Promise.all([
        fetchV2SysOrgTree(actor),
        fetchV2OrgTypes(actor),
        fetchV2SchoolGrades(actor),
        fetchV2SchoolLevels(actor),
      ]);
      setOrgTypeOptions(toDictOptions(types));
      setGradeOptions(grades.map((g) => toGradeOption(g)));
      setLevelOptions(toDictOptions(levels));
      const tree = buildOrgTreeFromFlat(flat);
      setOrgTree(tree);
      setSelectedId((prev) => {
        const prefer = opts?.selectOrgId;
        if (prefer) return prefer;
        if (prev && findOrgInTree(tree, prev)) return prev;
        return tree[0]?.orgId ?? null;
      });
    } catch (err: unknown) {
      sonnerToast.error("组织数据加载失败", {
        description: err instanceof Error ? err.message : "未知错误",
      });
    } finally {
      setLoading(false);
    }
  }, [actor]);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  const selectedOrg = selectedId ? findOrgInTree(orgTree, selectedId) : undefined;
  const selectedPath = selectedId ? buildOrgPath(orgTree, selectedId) : [];
  const childOrgs = selectedOrg?.children ?? [];
  const descendantOrgs = React.useMemo(() => flattenOrgDescendants(selectedOrg), [selectedOrg]);

  const exportSubtreeJson = React.useCallback(() => {
    if (!selectedId) return;
    const root = findOrgInTree(orgTree, selectedId);
    if (!root) {
      sonnerToast.error("未找到选中节点");
      return;
    }
    const doc = {
      exportedAt: new Date().toISOString(),
      anchorOrgId: root.orgId,
      sys_org_subtree: stripChildren(root),
    };
    const blob = new Blob([JSON.stringify(doc, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sys-org-subtree-${root.orgId}.json`;
    a.click();
    URL.revokeObjectURL(url);
    sonnerToast.success("已导出当前子树 JSON");
  }, [orgTree, selectedId]);

  const handleCreate = React.useCallback(
    async (input: CreateV2SysOrgInput) => {
      setSubmitting(true);
      try {
        const created = await createV2SysOrg(actor, {
          ...input,
          parentOrgId: selectedId ?? undefined,
        });
        sonnerToast.success("组织节点已创建", { description: created.orgName });
        setCreateOpen(false);
        await refresh();
        setSelectedId(created.orgId);
      } catch (err: unknown) {
        sonnerToast.error("创建失败", {
          description: err instanceof Error ? err.message : "未知错误",
        });
      } finally {
        setSubmitting(false);
      }
    },
    [actor, selectedId, refresh],
  );

  const handlePatch = React.useCallback(
    async (orgId: string, input: UpdateV2SysOrgInput) => {
      setSubmitting(true);
      try {
        await patchV2SysOrg(actor, orgId, input);
        sonnerToast.success("组织信息已保存");
        await refresh();
        setSelectedId(orgId);
      } catch (err: unknown) {
        sonnerToast.error("保存失败", {
          description: err instanceof Error ? err.message : "未知错误",
        });
      } finally {
        setSubmitting(false);
      }
    },
    [actor, refresh],
  );

  const applySchoolGradeClassStructure = React.useCallback(
    async (
      schoolOrgId: string,
      diff: StructureDiffResult,
    ) => {
      setSubmitting(true);
      try {
        const tree = findOrgInTree(orgTree, schoolOrgId);
        if (!tree) throw new Error("学校节点不存在");

        const gradeInfoById = new Map(gradeOptions.map((g) => [g.id, g]));
        const gradeTypeIds = new Set<string>(orgTypeOptions.filter((o) => o.id === V2_ORG_TYPE_IDS.grade || /年级|grade/i.test(o.name)).map((o) => o.id));
        const classTypeIds = new Set<string>(orgTypeOptions.filter((o) => o.id === V2_ORG_TYPE_IDS.class || /班级|class|行政班/i.test(o.name)).map((o) => o.id));
        const resolvedClassTypeId = pickClassOrgTypeId(orgTypeOptions) ?? [...classTypeIds][0] ?? null;
        if (!resolvedClassTypeId) throw new Error("未找到班级类组织类型");

        const stageKeys = new Set<StageKey>();
        for (const g of diff.grades) {
          const k = stageKeyFromGradeId(g.gradeId);
          if (k) stageKeys.add(k);
        }
        const multiLevel = stageKeys.size > 1;

        const descendants = flattenOrgDescendants(tree);
        const resolvedGradeTypeId =
          pickGradeOrgTypeId(orgTypeOptions)
          ?? [...gradeTypeIds][0]
          ?? descendants.find((n) => n.gradeId && n.orgTypeId && n.orgTypeId !== resolvedClassTypeId)?.orgTypeId
          ?? null;
        if (!resolvedGradeTypeId) throw new Error("未找到年级类组织类型（请在组织类型中维护“年级”类型，或先创建任一年级节点以便系统推断）");

        const isGradeNode = (n: V2SysOrgItem) =>
          Boolean(n.gradeId) && (n.orgTypeId === resolvedGradeTypeId || n.orgTypeId === V2_ORG_TYPE_IDS.grade || gradeTypeIds.has(n.orgTypeId ?? ""));
        const isClassNode = (n: V2SysOrgItem) =>
          Boolean(n.gradeId) && (n.orgTypeId === resolvedClassTypeId || n.orgTypeId === V2_ORG_TYPE_IDS.class || classTypeIds.has(n.orgTypeId ?? ""));

        // ── 阶段 1：拓扑删除（先班级后年级） ──────────
        const deleteFailed: string[] = [];
        const deleteIds = new Set(diff.deletes.map((d) => d.orgId));
        // 分离班级和年级：班级在前
        const classDeleteIds = diff.deletes.filter((d) => {
          const n = descendants.find((c) => c.orgId === d.orgId);
          return n && isClassNode(n, resolvedClassTypeId);
        });
        const gradeDeleteIds = diff.deletes.filter((d) => {
          const n = descendants.find((c) => c.orgId === d.orgId);
          return n && isGradeNode(n, resolvedGradeTypeId);
        });
        const orderedDeletes = [...classDeleteIds, ...gradeDeleteIds];
        for (const row of orderedDeletes) {
          try {
            await deleteV2SysOrg(actor, row.orgId);
          } catch (e) {
            deleteFailed.push(row.orgId);
          }
        }

        // ── 阶段 2：学段节点编排 ──────────────────────
        const stageNodeByLevelKey = new Map<StageKey, V2SysOrgItem>();
        const existingStageByKey = new Map<StageKey, V2SysOrgItem>();
        for (const k of ["primary", "junior", "senior"] as const) {
          const stageName = k === "primary" ? "小学" : k === "junior" ? "初中" : "高中";
          const hit = (tree.children ?? []).find((c) => c.orgName.trim() === stageName);
          if (hit) existingStageByKey.set(k, hit);
        }
        if (multiLevel) {
          for (const k of ["primary", "junior", "senior"] as const) {
            if (!stageKeys.has(k)) continue;
            const stageName = k === "primary" ? "小学" : k === "junior" ? "初中" : "高中";
            const hit = existingStageByKey.get(k);
            if (hit) {
              stageNodeByLevelKey.set(k, hit);
              continue;
            }
            const createdStage = await createV2SysOrg(actor, {
              orgName: stageName,
              orgTypeId: V2_ORG_TYPE_IDS.level,
              parentOrgId: schoolOrgId,
              status: "y",
              sortOrder: k === "primary" ? 10 : k === "junior" ? 20 : 30,
            });
            stageNodeByLevelKey.set(k, createdStage);
          }
        }

        // ── 阶段 3：创建新年级 ────────────────────────
        // 先建立现有年级索引
        const gradeNodesByGradeId = new Map<string, V2SysOrgItem[]>();
        for (const child of descendants) {
          if (!isGradeNode(child)) continue;
          const gid = String(child.gradeId);
          const arr = gradeNodesByGradeId.get(gid) ?? [];
          arr.push(child);
          gradeNodesByGradeId.set(gid, arr);
        }

        const gradeNodeMap = new Map<string, V2SysOrgItem>();
        for (const g of diff.grades) {
          const key = stageKeyFromGradeId(g.gradeId);
          const wantParentOrgId =
            key
              ? (multiLevel ? (stageNodeByLevelKey.get(key)?.orgId ?? schoolOrgId) : (existingStageByKey.get(key)?.orgId ?? schoolOrgId))
              : schoolOrgId;

          const existingList = gradeNodesByGradeId.get(g.gradeId) ?? [];
          // gradeCreates 中标记需要新建
          const needsCreate = diff.gradeCreates.some((gc) => gc.gradeId === g.gradeId);

          if (existingList.length > 0) {
            // 已有年级节点 → 仅处理层级迁移（parentOrgId 变化）
            const primary = existingList[0]!;
            if (primary.parentOrgId !== wantParentOrgId) {
              await patchV2SysOrg(actor, primary.orgId, { parentOrgId: wantParentOrgId });
            }
            gradeNodeMap.set(g.gradeId, { ...primary, parentOrgId: wantParentOrgId });
          } else if (needsCreate) {
            const gc = diff.gradeCreates.find((x) => x.gradeId === g.gradeId)!;
            const info = gradeInfoById.get(g.gradeId);
            const createdGrade = await createV2SysOrg(actor, {
              orgName: g.gradeName,
              gradeId: g.gradeId,
              orgTypeId: resolvedGradeTypeId,
              parentOrgId: wantParentOrgId,
              status: "y",
              sortOrder: info?.sortOrder ?? 0,
            });
            gradeNodeMap.set(g.gradeId, createdGrade);
          }
        }

        // ── 阶段 4：创建新班级 ────────────────────────
        for (const row of diff.classCreates) {
          const parentGrade = gradeNodeMap.get(row.gradeId);
          if (!parentGrade) continue;
          const existingSameName = descendants.some(
            (c) => isClassNode(c, resolvedClassTypeId) && c.parentOrgId === parentGrade.orgId && c.orgName === row.orgName,
          );
          if (existingSameName) continue;
          await createV2SysOrg(actor, {
            orgName: row.orgName,
            gradeId: row.gradeId,
            orgTypeId: row.orgTypeId ?? resolvedClassTypeId,
            parentOrgId: parentGrade.orgId,
            status: "y",
            sortOrder: 0,
          });
        }

        // ── 阶段 5：同步 schoolGradeIds ───────────────
        await patchV2SysOrg(actor, schoolOrgId, { schoolGradeIds: diff.grades.map((g) => g.gradeId) });

        // ── 结果反馈 ──────────────────────────────────
        const deletedCount = orderedDeletes.length - deleteFailed.length;
        sonnerToast.success("年级与班级架构已保存", {
          description:
            diff.grades.length > 0 || diff.classCreates.length > 0 || diff.deletes.length > 0
              ? `已同步 ${diff.grades.length} 个年级、新增 ${diff.classCreates.length} 个班级并删除 ${deletedCount} 个节点`
              : "已同步班级架构",
        });
        if (deleteFailed.length > 0) {
          sonnerToast.error("部分节点删除失败", {
            description: `共 ${deleteFailed.length} 个节点可能仍被引用，请在组织树中定位后处理。`,
          });
        }
        await refresh();
        setSelectedId(schoolOrgId);
      } catch (err: unknown) {
        sonnerToast.error("保存年级与班级失败", {
          description: err instanceof Error ? err.message : "未知错误",
        });
        throw err;
      } finally {
        setSubmitting(false);
      }
    },
    [actor, orgTree, gradeOptions, orgTypeOptions, refresh],
  );

  const clearSchoolGradeClassStructure = React.useCallback(
    async (schoolOrgId: string) => {
      setSubmitting(true);
      try {
        const tree = findOrgInTree(orgTree, schoolOrgId);
        if (!tree) throw new Error("学校节点不存在");
        const gradeTypeIds = new Set<string>(orgTypeOptions.filter((o) => /年级|grade/i.test(o.name)).map((o) => o.id));
        const stageNames = new Set(["小学", "初中", "高中"]);

        // 先清空学校开设年级
        await patchV2SysOrg(actor, schoolOrgId, { schoolGradeIds: [] });

        const descendants = flattenOrgDescendants(tree);
        const gradeNodes = descendants.filter((n) => Boolean(n.gradeId) && gradeTypeIds.has(n.orgTypeId ?? ""));

        // 删除顺序：年级（会带走其子树：班级） -> 空学段
        for (const g of gradeNodes) {
          await deleteV2SysOrg(actor, g.orgId);
        }
        // 只删除“变成空壳”的学段节点，避免误删学校下其他业务节点
        const stageNodes = (tree.children ?? []).filter((c) => stageNames.has(c.orgName.trim()));
        for (const s of stageNodes) {
          const stillHasChildren = (s.children ?? []).some((c) => !(c.gradeId && gradeTypeIds.has(c.orgTypeId ?? "")));
          if (!stillHasChildren) await deleteV2SysOrg(actor, s.orgId);
        }

        sonnerToast.success("已清空年级与班级架构");
        await refresh({ selectOrgId: schoolOrgId });
        setSelectedId(schoolOrgId);
      } catch (err: unknown) {
        sonnerToast.error("清空失败", { description: err instanceof Error ? err.message : "未知错误" });
        throw err;
      } finally {
        setSubmitting(false);
      }
    },
    [actor, orgTree, orgTypeOptions, refresh],
  );

  const handleDeleteOrg = React.useCallback(async () => {
    if (!selectedId) return;
    const target = findOrgInTree(orgTree, selectedId);
    const nextSelect = target?.parentOrgId ?? null;
    setDeleteBusy(true);
    try {
      await deleteV2SysOrg(actor, selectedId);
      sonnerToast.success("已物理删除该组织及其下级");
      await refresh({ selectOrgId: nextSelect });
    } catch (err: unknown) {
      sonnerToast.error("删除失败", {
        description: err instanceof Error ? err.message : "未知错误",
      });
      throw err;
    } finally {
      setDeleteBusy(false);
    }
  }, [actor, orgTree, refresh, selectedId]);

  return {
    actor,
    orgTree,
    loading,
    selectedId,
    setSelectedId,
    selectedOrg,
    selectedPath,
    childOrgs,
    descendantOrgs,
    refresh,
    orgTypeOptions,
    gradeOptions,
    levelOptions,
    orgTypeLabels,
    gradeLabels,
    isSuperAdmin,
    applySchoolGradeClassStructure,
    clearSchoolGradeClassStructure,
    exportSubtreeJson,
    createOpen,
    setCreateOpen,
    submitting,
    handleCreate,
    handlePatch,
    handleDeleteOrg,
    deleteBusy,
  };
}
