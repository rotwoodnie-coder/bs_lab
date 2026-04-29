/**
 * 年级班级架构增量 Diff 算法（无副作用纯函数）
 *
 * 核心原则：有数必留、无名不删、拓扑有序
 *
 * - initialization 阶段（totalStudents === 0）：允许全量增删
 * - maintenance 阶段（totalStudents > 0）：
 *   - 普通管理员：禁止任何删除/缩减操作
 *   - 超级管理员：可执行删除，但需逐班级检查学生数据
 *     - 有学生的班级/年级保护阻止删除
 *     - 剩余空班级按规则删除
 *     - 确认时需输入"确认删除"口令
 */

import type { V2SysOrgItem } from "@/lib/v2/v2-sys-api";
import type { GradeOptionWithLevel } from "./org-school-structure-utils";

// ─── 类型导出 ────────────────────────────────────────────

export type DiffPhase = "initialization" | "maintenance";
export type BlockedReason = "school_admin_blocked" | "has_students" | null;

export interface ConfirmItem {
  action: "delete_class" | "delete_grade" | "reduce_class_count";
  orgName: string;
  gradeName: string;
  hasStudents: boolean;
}

export interface StructureDiffInput {
  rows: Array<{ gradeId: string; offered: boolean; classCount: number }>;
  childOrgs: V2SysOrgItem[];
  orgTypeLabels: Record<string, string>;
  gradeLabels: Record<string, string>;
  gradeInfoById: Map<string, GradeOptionWithLevel>;
  classTypeId: string;
  gradeTypeId: string;
  phase: DiffPhase;
  isSuperAdmin: boolean;
}

export interface StructureDiffResult {
  grades: Array<{ gradeId: string; gradeName: string }>;
  gradeCreates: Array<{
    orgName: string;
    gradeId: string;
    orgTypeId: string;
    parentOrgId: string | null;
    status: "y";
    sortOrder: number;
  }>;
  gradeParentMoves: Array<{ orgId: string; parentOrgId: string }>;
  classCreates: Array<{ orgName: string; gradeId: string; orgTypeId: string }>;
  deletes: Array<{ orgId: string }>;
  confirmItems: ConfirmItem[];
  blocked: boolean;
  blockedReason: BlockedReason;
}

// ─── 辅助判断 ────────────────────────────────────────────

function isGradeNode(n: V2SysOrgItem, gradeTypeId: string): boolean {
  return Boolean(n.gradeId) && n.orgTypeId === gradeTypeId;
}

function isClassNode(n: V2SysOrgItem, classTypeId: string): boolean {
  return Boolean(n.gradeId) && n.orgTypeId === classTypeId;
}

/**
 * 获取节点的学生数量。
 * 数据来自后端 `/v2/sys-org/tree` 返回的 studentCount 字段。
 * 当统计未加载或无学生时返回 0。
 */
function getStudentCount(org: V2SysOrgItem): number {
  return typeof org.studentCount === "number" && Number.isFinite(org.studentCount)
    ? Math.max(0, org.studentCount)
    : 0;
}

function hasStudents(org: V2SysOrgItem): boolean {
  return getStudentCount(org) > 0;
}

// ─── 核心 Diff 函数 ──────────────────────────────────────

export function calculateStructureDiff(input: StructureDiffInput): StructureDiffResult {
  const { rows, childOrgs, gradeLabels, gradeInfoById, classTypeId, gradeTypeId, phase, isSuperAdmin } = input;

  const grades: StructureDiffResult["grades"] = [];
  const gradeCreates: StructureDiffResult["gradeCreates"] = [];
  const gradeParentMoves: StructureDiffResult["gradeParentMoves"] = [];
  const classCreates: StructureDiffResult["classCreates"] = [];
  const deletes: StructureDiffResult["deletes"] = [];
  const confirmItems: ConfirmItem[] = [];

  // ── 阶段 0：权限门禁 ──────────────────────────────────
  // 运维阶段 + 非超级管理员 → 检查是否有销毁意向
  let hasDestructiveIntent = false;
  for (const r of rows) {
    if (!r.offered) {
      const existingNodes = childOrgs.filter(
        (n) => isGradeNode(n, gradeTypeId) && n.gradeId === r.gradeId,
      );
      if (existingNodes.length > 0) {
        hasDestructiveIntent = true;
        break;
      }
    }
    if (r.offered && r.classCount >= 0) {
      const existingClasses = childOrgs.filter(
        (c) => isClassNode(c, classTypeId) && c.gradeId === r.gradeId,
      );
      if (r.classCount < existingClasses.length) {
        hasDestructiveIntent = true;
        break;
      }
    }
  }

  if (phase === "maintenance" && !isSuperAdmin && hasDestructiveIntent) {
    return {
      grades: [],
      gradeCreates: [],
      gradeParentMoves: [],
      classCreates: [],
      deletes: [],
      confirmItems: [],
      blocked: true,
      blockedReason: "school_admin_blocked",
    };
  }

  // ── 阶段 1：逐年级计算 diff ──────────────────────────

  for (const r of rows) {
    const gradeName = gradeLabels[r.gradeId] ?? "未命名年级";
    const info = gradeInfoById.get(r.gradeId);
    const existingGradeNodes = childOrgs.filter(
      (n) => isGradeNode(n, gradeTypeId) && n.gradeId === r.gradeId,
    );
    const primaryGrade = existingGradeNodes[0] ?? null;

    if (r.offered) {
      // ── 年级开设 ──
      grades.push({ gradeId: r.gradeId, gradeName });

      // 年级节点不存在 → 标记创建（parentOrgId 由 orchestrator 填充）
      if (!primaryGrade) {
        gradeCreates.push({
          orgName: gradeName,
          gradeId: r.gradeId,
          orgTypeId: gradeTypeId,
          parentOrgId: null,
          status: "y",
          sortOrder: info?.sortOrder ?? 0,
        });
        continue;
      }

      // 年级层级迁移检测：if grade exists and has a different parent than expected
      // (parent resolution logic kept in orchestrator / applySchoolGradeClassStructure)

      // ── 班级 diff ──
      const existingClasses = childOrgs
        .filter((c) => isClassNode(c, classTypeId) && c.parentOrgId === primaryGrade.orgId)
        .sort(
          (a, b) =>
            (a.sortOrder ?? 0) - (b.sortOrder ?? 0) ||
            a.orgName.localeCompare(b.orgName, "zh-CN"),
        );

      // 减少班数 → 逆序检查，遇有学生则阻止
      if (r.classCount < existingClasses.length) {
        const toRemove = existingClasses.slice(r.classCount).reverse();
        for (const cls of toRemove) {
          const hs = hasStudents(cls);
          confirmItems.push({
            action: "delete_class",
            orgName: cls.orgName,
            gradeName,
            hasStudents: hs,
          });
          if (hs) continue;
          deletes.push({ orgId: cls.orgId });
        }
      }

      // 班数不变或增加 → 完整保留现有班级，仅创建差额
      // （保护自定义名称：不执行任何改名）
      if (r.classCount > existingClasses.length) {
        const usedNames = new Set(existingClasses.map((c) => c.orgName));
        for (let i = existingClasses.length; i < r.classCount; i++) {
          let name = `${gradeName}${i + 1}班`;
          let attempt = i + 1;
          while (usedNames.has(name)) {
            attempt += 1;
            name = `${gradeName}${attempt}班`;
          }
          usedNames.add(name);
          classCreates.push({
            orgName: name,
            gradeId: r.gradeId,
            orgTypeId: classTypeId,
          });
        }
      }
    } else {
      // ── 年级下线（offered = false） ──
      for (const gradeNode of existingGradeNodes) {
        const classes = childOrgs.filter(
          (c) => isClassNode(c, classTypeId) && c.parentOrgId === gradeNode.orgId,
        );

        let anyBlockedByStudents = false;
        for (const cls of classes) {
          const hs = hasStudents(cls);
          confirmItems.push({
            action: "delete_class",
            orgName: cls.orgName,
            gradeName,
            hasStudents: hs,
          });
          if (hs) {
            anyBlockedByStudents = true;
            continue;
          }
          deletes.push({ orgId: cls.orgId });
        }

        // 全部班级无学生 → 年级本身也可以删除
        if (!anyBlockedByStudents) {
          confirmItems.push({
            action: "delete_grade",
            orgName: gradeNode.orgName,
            gradeName,
            hasStudents: false,
          });
          deletes.push({ orgId: gradeNode.orgId });
        }
      }
    }
  }

  const hasStudentBlock = confirmItems.some((c) => c.hasStudents);

  return {
    grades,
    gradeCreates,
    gradeParentMoves,
    classCreates,
    deletes,
    confirmItems,
    blocked: hasStudentBlock,
    blockedReason: hasStudentBlock ? "has_students" : null,
  };
}
