import type { TreeItem } from "@bs-lab/ui";

import type { V2SysOrgItem } from "@/lib/v2/v2-sys-api";

export type OrgTreeNodeData = {
  orgId: string;
  orgTypeId: string | null;
  orgTypeName?: string | null;
};

export type OrgTreeItem = TreeItem<OrgTreeNodeData>;

export function mapV2OrgTreeToItems(nodes: V2SysOrgItem[]): OrgTreeItem[] {
  return nodes.map((n) => mapOne(n));
}

function mapOne(n: V2SysOrgItem): OrgTreeItem {
  const kids = n.children?.length ? mapV2OrgTreeToItems(n.children) : undefined;
  return {
    id: n.orgId,
    label: n.orgName,
    orgId: n.orgId,
    orgTypeId: n.orgTypeId,
    orgTypeName: undefined,
    ...(kids?.length ? { children: kids } : {}),
  };
}

/** 与学段树一致：根层展开，自第二层起有子节点的默认折叠 */
export function collectOrgTreeDefaultCollapsed(items: OrgTreeItem[]): Set<string> {
  const next = new Set<string>();
  const walk = (list: OrgTreeItem[], d: number) => {
    for (const item of list) {
      const children = item.children ?? [];
      if (d >= 1 && children.length > 0) next.add(item.id);
      if (children.length > 0) walk(children as OrgTreeItem[], d + 1);
    }
  };
  walk(items, 0);
  return next;
}
