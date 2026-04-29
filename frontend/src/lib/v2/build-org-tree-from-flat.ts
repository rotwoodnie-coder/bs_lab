import type { V2SysOrgItem } from "@/lib/v2/v2-sys-api";

function levelSortRank(org: V2SysOrgItem): number {
  const name = org.orgName.trim();
  if (/小学/.test(name)) return 1;
  if (/初中/.test(name)) return 2;
  if (/高中/.test(name)) return 3;
  return 4;
}

function classSortRank(name: string): number {
  const m = name.match(/(\d+)班$/);
  return m ? Number.parseInt(m[1]!, 10) || Number.MAX_SAFE_INTEGER : Number.MAX_SAFE_INTEGER;
}

function gradeSortRankById(gradeId: string | null): number {
  if (!gradeId) return Number.MAX_SAFE_INTEGER;
  const m = String(gradeId).match(/(\d{1,2})$/);
  if (!m) return Number.MAX_SAFE_INTEGER;
  const n = Number.parseInt(m[1]!, 10);
  return Number.isFinite(n) ? n : Number.MAX_SAFE_INTEGER;
}

/**
 * `/v2/sys-org/tree` 返回按 parent 扁平的行，在此组装为嵌套 children 供树组件使用。
 */
export function buildOrgTreeFromFlat(flat: V2SysOrgItem[]): V2SysOrgItem[] {
  const idSet = new Set(flat.map((r) => r.orgId));
  const nodes = new Map<string, V2SysOrgItem>();
  for (const row of flat) {
    nodes.set(row.orgId, { ...row, children: [] });
  }

  const roots: V2SysOrgItem[] = [];
  for (const row of flat) {
    const node = nodes.get(row.orgId)!;
    const parentId = row.parentOrgId && idSet.has(row.parentOrgId) ? row.parentOrgId : null;
    if (parentId === null) {
      roots.push(node);
    } else {
      const parent = nodes.get(parentId);
      if (parent) {
        parent.children = parent.children ?? [];
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    }
  }

  const sortLevel = (list: V2SysOrgItem[], parent?: V2SysOrgItem) => {
    list.sort((a, b) => {
      if (parent && /年级/.test(parent.orgName)) {
        const ra = classSortRank(a.orgName);
        const rb = classSortRank(b.orgName);
        if (ra !== rb) return ra - rb;
      }
      if (
        parent &&
        (parent.orgName.trim() === "小学" ||
          parent.orgName.trim() === "初中" ||
          parent.orgName.trim() === "高中" ||
          /学校/.test(parent.orgName))
      ) {
        const ga = gradeSortRankById(a.gradeId ?? null);
        const gb = gradeSortRankById(b.gradeId ?? null);
        if (ga !== gb) return ga - gb;
      }
      const pa = levelSortRank(a);
      const pb = levelSortRank(b);
      if (pa !== pb) return pa - pb;
      const so = (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
      if (so !== 0) return so;
      return a.orgName.localeCompare(b.orgName, "zh-CN");
    });
    for (const n of list) {
      if (n.children?.length) sortLevel(n.children, n);
    }
  };
  sortLevel(roots);
  return roots;
}
