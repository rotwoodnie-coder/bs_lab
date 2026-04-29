"use client";

import * as React from "react";
import { Button } from "@bs-lab/ui";

import type { TreeNode, TreeNodeId } from "@/types/tree";

export function GlobalTreeRootIconRail(props: {
  roots: TreeNode[];
  selectedId?: TreeNodeId | null;
  onSelectId?: (id: TreeNodeId) => void;
  renderIcon: (item: TreeNode) => React.ReactNode;
  metrics?: (nodeId: TreeNodeId) => { count?: number };
}) {
  return (
    <div className="flex flex-col items-center gap-1.5 py-1">
      {props.roots.map((node) => {
        const active = String(props.selectedId ?? "") === String(node.id);
        const cnt = props.metrics?.(String(node.id))?.count;
        const tip = cnt != null ? `${node.label}（${cnt}）` : node.label;
        return (
          <Button
            key={String(node.id)}
            type="button"
            size="icon"
            variant={active ? "secondary" : "ghost"}
            className={`size-10 shrink-0 rounded-lg ${active ? "ring-2 ring-primary/30" : ""}`}
            title={tip}
            aria-label={tip}
            onClick={() => props.onSelectId?.(String(node.id))}
          >
            <span className="flex size-9 items-center justify-center">{props.renderIcon(node)}</span>
          </Button>
        );
      })}
    </div>
  );
}
