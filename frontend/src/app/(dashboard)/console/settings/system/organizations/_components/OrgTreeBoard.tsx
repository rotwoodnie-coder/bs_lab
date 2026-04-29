"use client";

import * as React from "react";
import { Badge, TreeView } from "@bs-lab/ui";
import { Building2, GraduationCap, Landmark } from "@bs-lab/ui/icons";

import type { V2SysOrgItem } from "@/lib/v2/v2-sys-api";

import {
  collectOrgTreeDefaultCollapsed,
  mapV2OrgTreeToItems,
  type OrgTreeNodeData,
} from "../org-tree-items";
import { orgTypeBadgeVariant, orgTypeIconName, orgTypeShortLabel } from "../org-tree-labels";

export function OrgTreeBoard(props: {
  loading: boolean;
  orgTree: V2SysOrgItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  orgTypeLabels: Record<string, string>;
}) {
  const sourceItems = React.useMemo(() => mapV2OrgTreeToItems(props.orgTree), [props.orgTree]);
  const [collapsedIds, setCollapsedIds] = React.useState<Set<string>>(() => new Set());

  React.useEffect(() => {
    setCollapsedIds(collectOrgTreeDefaultCollapsed(sourceItems));
  }, [sourceItems]);

  return (
    <div className="space-y-3">
      {props.loading ? (
        <div className="py-8 text-center text-sm text-muted-foreground">加载中…</div>
      ) : sourceItems.length === 0 ? (
        <div className="py-8 text-center text-sm text-muted-foreground">暂无组织数据</div>
      ) : (
        <TreeView<OrgTreeNodeData>
          items={sourceItems}
          selectedId={props.selectedId}
          onSelect={(id) => props.onSelect(String(id))}
          editMode={false}
          collapsedIds={collapsedIds}
          onCollapsedIdsChange={setCollapsedIds}
          indentPx={12}
          renderIcon={(item) => {
            const icon = orgTypeIconName(item.orgTypeId);
            if (icon === "district") return <Landmark className="size-4 text-primary" />;
            if (icon === "school") return <GraduationCap className="size-4 text-primary" />;
            if (icon === "class") return <Building2 className="size-4 text-primary" />;
            return <Building2 className="size-4 text-muted-foreground" />;
          }}
          renderLabel={(item) => (
            <span
              role="button"
              tabIndex={0}
              className="min-w-0 flex-1 truncate text-left text-sm text-foreground outline-none"
              onClick={(e) => {
                e.stopPropagation();
                props.onSelect(String(item.orgId));
              }}
              onKeyDown={(e) => {
                if (e.key !== "Enter" && e.key !== " ") return;
                e.preventDefault();
                e.stopPropagation();
                props.onSelect(String(item.orgId));
              }}
            >
              {item.label}
            </span>
          )}
          renderTrailing={(item) => (
            <Badge
              variant={orgTypeBadgeVariant(item.orgTypeId)}
              className="shrink-0 px-1.5 text-[10px] leading-none"
            >
              {orgTypeShortLabel(props.orgTypeLabels, item.orgTypeId)}
            </Badge>
          )}
          className="rounded-md border border-border bg-card p-1"
        />
      )}
    </div>
  );
}
