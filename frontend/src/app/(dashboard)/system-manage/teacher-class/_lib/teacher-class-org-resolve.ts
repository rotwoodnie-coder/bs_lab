/**
 * 从 sys_org 树解析「学校全称」与「直属部门/教研组」展示文案
 */
import { V2_ORG_TYPE_IDS } from "@/lib/v2/v2-org-type-constants";
import type { V2SysOrgItem, V2SysUserItem } from "@/lib/v2/v2-sys-api";

export function buildOrgByIdMap(nodes: V2SysOrgItem[]): Map<string, V2SysOrgItem> {
  const m = new Map<string, V2SysOrgItem>();
  const walk = (items: V2SysOrgItem[]) => {
    for (const n of items) {
      m.set(n.orgId, n);
      if (n.children?.length) walk(n.children);
    }
  };
  walk(nodes);
  return m;
}

/**
 * 从任意 org 节点沿 parent 链向上找到**顶层**学校节点名称。
 * 兼容 班级→年级→学部(Org_School)→学校(Org_School) 以及
 * 班级→年级→校区(Org_School_Campus)→学校(Org_School) 的多级结构。
 */
export function resolveSchoolNameFromTree(
  classTree: V2SysOrgItem[],
  startOrgId: string | null | undefined,
): string | null {
  if (!startOrgId?.trim()) return null;
  const topSchool = resolveTopSchoolNode(classTree, startOrgId.trim());
  return topSchool?.orgName ?? null;
}

/**
 * 从任意 org 节点沿 parent 链向上解析**顶层**学校节点 orgId
 * （用于弹窗默认锁定本校）。
 */
export function resolveSchoolOrgIdFromTree(
  classTree: V2SysOrgItem[],
  startOrgId: string | null | undefined,
): string | null {
  if (!startOrgId?.trim()) return null;
  const topSchool = resolveTopSchoolNode(classTree, startOrgId.trim());
  return topSchool?.orgId ?? null;
}

const schoolLikeOrgIds = [V2_ORG_TYPE_IDS.school, V2_ORG_TYPE_IDS.campus];

function isSchoolLikeNode(org: V2SysOrgItem | undefined): boolean {
  return org != null && schoolLikeOrgIds.includes(org.orgTypeId as typeof V2_ORG_TYPE_IDS[keyof typeof V2_ORG_TYPE_IDS]);
}

/**
 * 从任意节点沿 parent 链向上找到最顶层的学校节点。
 * 遇到 Org_School 或 Org_School_Campus 时不立即返回，检查其父级是否也是学校/校区，
 * 如果是则继续向上爬，直到找到顶层节点。
 */
function resolveTopSchoolNode(
  classTree: V2SysOrgItem[],
  startOrgId: string,
): V2SysOrgItem | null {
  const byId = buildOrgByIdMap(classTree);
  let cur: V2SysOrgItem | undefined = byId.get(startOrgId);
  while (cur) {
    if (isSchoolLikeNode(cur)) {
      const pid = cur.parentOrgId?.trim();
      if (!pid) return cur;
      const parent = byId.get(pid);
      if (parent && isSchoolLikeNode(parent)) {
        cur = parent;
        continue;
      }
      return cur;
    }
    const pid = cur.parentOrgId?.trim();
    cur = pid ? byId.get(pid) : undefined;
  }
  return null;
}

/**
 * 教师直属部门/教研组：若 user_org 不是学校类型，则展示该节点名称；
 * 否则无二级部门展示（API 的 orgName 若与学校名不同可作兜底）
 */
export function resolveDeptDisplayName(
  teacher: Pick<V2SysUserItem, "userOrgId" | "orgName">,
  classTree: V2SysOrgItem[],
  schoolDisplayName: string | null,
): string | null {
  const byId = buildOrgByIdMap(classTree);
  const uid = teacher.userOrgId?.trim();
  if (uid) {
    const node = byId.get(uid);
    if (node && node.orgTypeId !== V2_ORG_TYPE_IDS.school) return node.orgName;
    if (node?.orgTypeId === V2_ORG_TYPE_IDS.school) return null;
  }
  const on = teacher.orgName?.trim();
  if (on && schoolDisplayName && on !== schoolDisplayName) return on;
  if (on && !schoolDisplayName) return on;
  return null;
}

/** 表格「学校」列：优先从教师 org 向上解析学校，再退回校级上下文 */
export function resolveTeacherSchoolColumn(
  teacher: Pick<V2SysUserItem, "userOrgId" | "orgName">,
  classTree: V2SysOrgItem[],
  contextSchoolOrgId: string | null,
  contextSchoolDisplayName: string | null,
): string | null {
  return (
    resolveSchoolNameFromTree(classTree, teacher.userOrgId)
    ?? contextSchoolDisplayName
    ?? resolveSchoolNameFromTree(classTree, contextSchoolOrgId)
    ?? null
  );
}
