/**
 * 教师授课 / 选班用到的 **sys_org 子树遍历**（仅前端树逻辑，表结构见 `database/migrations/bs_exp_data.sql`）。
 * 类型取值与 `V2_ORG_TYPE_IDS` 须与运行库 `data_org_type` 一致；说明见 `docs/platform/sys-org-tree-teacher-class.md`。
 *
 * 注意：组织树结构可能为 Org_School（学部/真正学校）→ Org_School_Grade → Org_School_Class，
 * 也可能是 Org_School（真正学校）→ Org_School（学部）→ Org_School_Grade → Org_School_Class，
 * 因此所有遍历需要递归搜索。
 */
import { V2_ORG_TYPE_IDS } from "@/lib/v2/v2-org-type-constants";
import type { V2SysOrgItem } from "@/lib/v2/v2-sys-api";

export type OrgLite = { orgId: string; orgName: string };

export function findOrgNode(nodes: V2SysOrgItem[], orgId: string): V2SysOrgItem | null {
  for (const n of nodes) {
    if (n.orgId === orgId) return n;
    if (n.children?.length) {
      const hit = findOrgNode(n.children, orgId);
      if (hit) return hit;
    }
  }
  return null;
}

/** 构建 orgId → V2SysOrgItem 映射 */
export function buildOrgMap(nodes: V2SysOrgItem[]): Map<string, V2SysOrgItem> {
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

/** 在子树中递归收集全部指定类型的节点（从 root 本身开始搜索） */
function collectByType(root: V2SysOrgItem, typeId: string): OrgLite[] {
  const out: OrgLite[] = [];
  const walk = (items: V2SysOrgItem[]) => {
    for (const n of items) {
      if (n.orgTypeId === typeId) out.push({ orgId: n.orgId, orgName: n.orgName });
      if (n.children?.length) walk(n.children);
    }
  };
  walk(root.children ?? []);
  return out;
}

const schoolLikeOrgTypeIds = new Set<string>([V2_ORG_TYPE_IDS.school, V2_ORG_TYPE_IDS.campus]);

/**
 * 列出组织树中**顶层学校**节点。
 * 兼容 学校(顶层) → 学部(Org_School) → 年级 → 班级 以及
 * 学校 → 校区(Org_School_Campus) → 年级 → 班级 的多级结构，
 * 只返回父级不是学校/校区的学校节点，中间层不重复列出。
 */
export function listSchools(classTree: V2SysOrgItem[]): OrgLite[] {
  const orgMap = buildOrgMap(classTree);
  const allSchools: OrgLite[] = [];
  const walk = (items: V2SysOrgItem[]) => {
    for (const n of items) {
      if (schoolLikeOrgTypeIds.has(n.orgTypeId ?? "")) {
        // 只保留父级不是学校/校区的顶层节点
        const pid = n.parentOrgId?.trim();
        const parent = pid ? orgMap.get(pid) : undefined;
        if (!parent || !schoolLikeOrgTypeIds.has(parent.orgTypeId ?? "")) {
          allSchools.push({ orgId: n.orgId, orgName: n.orgName });
        }
      }
      if (n.children?.length) walk(n.children);
    }
  };
  walk(classTree);
  return allSchools;
}

/** 学校搜索下拉分组标题：取树中直接父级名称（如区县、集团） */
export function schoolComboboxGroupLabel(classTree: V2SysOrgItem[], schoolOrgId: string): string {
  const node = findOrgNode(classTree, schoolOrgId);
  if (!node?.parentOrgId) return "学校";
  const parent = findOrgNode(classTree, node.parentOrgId);
  const name = parent?.orgName?.trim();
  return name && name.length > 0 ? name : "上级组织";
}

/**
 * 在学校节点子树内递归查找所有年级节点。
 * 兼容 学校 → 学部（也是 Org_School）→ 年级 的多级嵌套结构，
 * 即跨 Org_School 层级继续往下搜 Org_School_Grade。
 */
export function gradesUnderSchool(schoolNode: V2SysOrgItem): OrgLite[] {
  const out: OrgLite[] = [];
  const walk = (items: V2SysOrgItem[]) => {
    for (const n of items) {
      if (n.orgTypeId === V2_ORG_TYPE_IDS.grade) {
        out.push({ orgId: n.orgId, orgName: n.orgName });
      }
      // 继续递归搜索所有子节点（不因遇到 Org_School 而停止）
      if (n.children?.length) walk(n.children);
    }
  };
  walk(schoolNode.children ?? []);
  return out;
}

/** 在某年级节点子树内递归查找所有班级节点 */
export function classesUnderGrade(gradeNode: V2SysOrgItem): OrgLite[] {
  return collectByType(gradeNode, V2_ORG_TYPE_IDS.class);
}

/**
 * 某校下指定年级的全部班级（递归搜索，兼容学校→学部→年级→班级的多级结构）。
 */
export function classesUnderSchoolGrade(schoolNode: V2SysOrgItem, gradeOrgId: string): OrgLite[] {
  // 递归搜索整个 schoolNode 子树找到该年级节点
  const gradeNode = findOrgNode(schoolNode.children ?? [], gradeOrgId);
  if (!gradeNode) return [];
  return classesUnderGrade(gradeNode);
}

/** 按年级多选过滤递归查询班级 */
export function classesUnderSchoolFiltered(
  schoolNode: V2SysOrgItem,
  gradeFilter: Set<string> | null,
): OrgLite[] {
  const grades = gradesUnderSchool(schoolNode);
  const out: OrgLite[] = [];
  for (const g of grades) {
    if (gradeFilter && gradeFilter.size > 0 && !gradeFilter.has(g.orgId)) continue;
    out.push(...classesUnderSchoolGrade(schoolNode, g.orgId));
  }
  return out;
}
