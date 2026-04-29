"use client";

import * as React from "react";
import { Label, TreeView, type TreeItem, type TreeItemId } from "@bs-lab/ui";
import { Building2, GraduationCap, Landmark } from "@bs-lab/ui/icons";

import { fetchParentSchoolTree, type SchoolTreeNode } from "@/lib/v2/v2-parent-binding-api";
import type { CoreApiActor } from "@/lib/core-api-shared";
import { V2_ORG_TYPE_IDS } from "@/lib/v2/v2-org-type-constants";

type SchoolTreeItemData = { orgId: string; orgTypeId: string | null };

type SchoolTreeItem = TreeItem<SchoolTreeItemData>;

function buildTree(flat: SchoolTreeNode[]): SchoolTreeItem[] {
  const byParent = new Map<string | null, SchoolTreeNode[]>();
  for (const n of flat) {
    const pid = n.parentOrgId;
    const arr = byParent.get(pid) ?? [];
    arr.push(n);
    byParent.set(pid, arr);
  }

  const sortByName = (list: SchoolTreeNode[]) =>
    [...list].sort((a, b) => a.orgName.localeCompare(b.orgName, "zh-CN"));

  const build = (parentId: string | null): SchoolTreeItem[] =>
    sortByName(byParent.get(parentId) ?? []).map((n) => ({
      id: n.orgId as TreeItemId,
      label: n.orgName,
      orgId: n.orgId,
      orgTypeId: n.orgTypeId,
      children: build(n.orgId),
    }));

  return build(null);
}

function schoolTypeIcon(orgTypeId: string | null) {
  if (!orgTypeId) return <Building2 className="size-4 text-muted-foreground" />;
  if (orgTypeId === V2_ORG_TYPE_IDS.manage) return <Landmark className="size-4 text-primary" />;
  if (orgTypeId === V2_ORG_TYPE_IDS.school || orgTypeId === V2_ORG_TYPE_IDS.campus)
    return <GraduationCap className="size-4 text-primary" />;
  return <Building2 className="size-4 text-muted-foreground" />;
}

const selectableIds = new Set([V2_ORG_TYPE_IDS.school, V2_ORG_TYPE_IDS.campus]);

interface Props {
  actor: CoreApiActor;
  value: string;
  onChange: (orgId: string) => void;
}

export function FamilySchoolTreeSelect({ actor, value, onChange }: Props) {
  const [loading, setLoading] = React.useState(true);
  const [tree, setTree] = React.useState<SchoolTreeItem[]>([]);
  const [collapsedIds, setCollapsedIds] = React.useState<Set<TreeItemId>>(() => new Set());

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const flat = await fetchParentSchoolTree(actor);
        if (cancelled) return;
        const built = buildTree(flat);
        setTree(built);
        const collapsed = new Set<TreeItemId>();
        const walk = (items: SchoolTreeItem[], depth: number) => {
          for (const n of items) {
            if (depth >= 1 && n.children && n.children.length > 0) collapsed.add(n.id);
            if (n.children && n.children.length > 0) walk(n.children, depth + 1);
          }
        };
        walk(built, 0);
        setCollapsedIds(collapsed);
      } catch {
        /* sonner error handled by parent page */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [actor]);

  const isSelectable = (item: SchoolTreeItem) => selectableIds.has(item.orgTypeId ?? "");

  const handleSelect = (id: TreeItemId) => {
    const item = findItem(tree, id);
    if (item && isSelectable(item)) onChange(String(item.orgId));
  };

  return (
    <div className="space-y-2">
      <Label>学校</Label>
      {loading ? (
        <div className="rounded-md border border-border bg-card px-3 py-6 text-center text-sm text-muted-foreground">
          加载中…
        </div>
      ) : tree.length === 0 ? (
        <div className="rounded-md border border-border bg-card px-3 py-6 text-center text-sm text-muted-foreground">
          暂无学校数据
        </div>
      ) : (
        <div className="max-h-60 overflow-y-auto rounded-md border border-border bg-card p-1">
          <TreeView<SchoolTreeItemData>
            items={tree}
            selectedId={value as TreeItemId}
            onSelect={handleSelect}
            editMode={false}
            collapsedIds={collapsedIds}
            onCollapsedIdsChange={setCollapsedIds}
            indentPx={12}
            renderIcon={(item) => schoolTypeIcon(item.orgTypeId)}
            renderLabel={(item) => (
              <span className={`min-w-0 flex-1 truncate text-left text-sm outline-none ${
                isSelectable(item) ? "text-foreground" : "text-muted-foreground"
              }`}>
                {item.label}
              </span>
            )}
          />
        </div>
      )}
    </div>
  );
}

function findItem(tree: SchoolTreeItem[], id: TreeItemId): SchoolTreeItem | undefined {
  for (const n of tree) {
    if (n.id === id) return n;
    if (n.children && n.children.length > 0) {
      const hit = findItem(n.children, id);
      if (hit) return hit;
    }
  }
  return undefined;
}
