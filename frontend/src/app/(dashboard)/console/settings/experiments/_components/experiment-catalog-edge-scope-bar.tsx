"use client";

import { Button } from "@bs-lab/ui";

export type ExperimentCatalogEdgeScope = "pending" | "all";

type Props = {
  edgeTab: ExperimentCatalogEdgeScope;
  setEdgeTab: (t: ExperimentCatalogEdgeScope) => void;
  className?: string;
};

/** 映射边列表：待审 / 全部（教材映射与实验材料 Tab 共用） */
export function ExperimentCatalogEdgeScopeBar(props: Props) {
  return (
    <div className={`flex flex-wrap items-center gap-2 ${props.className ?? ""}`}>
      <Button
        type="button"
        size="sm"
        variant={props.edgeTab === "pending" ? "default" : "outline"}
        onClick={() => props.setEdgeTab("pending")}
      >
        待审边
      </Button>
      <Button
        type="button"
        size="sm"
        variant={props.edgeTab === "all" ? "default" : "outline"}
        onClick={() => props.setEdgeTab("all")}
      >
        全部边
      </Button>
    </div>
  );
}
