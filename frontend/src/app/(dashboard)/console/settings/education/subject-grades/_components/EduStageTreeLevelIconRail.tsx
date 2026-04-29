"use client";

import * as React from "react";
import { Button } from "@bs-lab/ui";

import { buildStageTreeDisplayCountMap } from "@/lib/edu-dimension-stage-tree-display";

import { EduStageLevelIcon } from "../_lib/edu-stage-tree-node-icons";
import type { SchoolLevelTreeNode } from "../page.types";

export function EduStageTreeLevelIconRail(props: {
  stageTreeByGrade: SchoolLevelTreeNode[];
  selectedLevelId: string;
  onSelectLevel: (levelId: string) => void;
}) {
  const roots = React.useMemo(
    () => props.stageTreeByGrade.filter((n) => n.nodeType === "level"),
    [props.stageTreeByGrade],
  );
  const countById = React.useMemo(() => buildStageTreeDisplayCountMap(props.stageTreeByGrade), [props.stageTreeByGrade]);

  return (
    <div className="flex flex-col items-center gap-1.5 py-1">
      {roots.map((node) => {
        const active = String(props.selectedLevelId) === String(node.levelId);
        const cnt = countById.get(node.id);
        const tip = cnt != null ? `${node.label}（${cnt}）` : node.label;
        return (
          <Button
            key={node.id}
            type="button"
            size="icon"
            variant={active ? "secondary" : "ghost"}
            className={`size-10 shrink-0 rounded-lg ${active ? "ring-2 ring-primary/30" : ""}`}
            title={tip}
            aria-label={tip}
            onClick={() => props.onSelectLevel(String(node.levelId))}
          >
            <EduStageLevelIcon label={node.label} levelIconPath={node.levelIconPath} />
          </Button>
        );
      })}
    </div>
  );
}
