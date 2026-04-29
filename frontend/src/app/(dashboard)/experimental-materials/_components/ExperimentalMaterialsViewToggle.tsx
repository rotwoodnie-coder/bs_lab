"use client";

import { ToggleGroup, ToggleGroupItem } from "@bs-lab/ui";
import { LayoutGrid, List } from "@bs-lab/ui/icons";

import type { ExperimentalMaterialsViewMode } from "../page.types";

export function ExperimentalMaterialsViewToggle(props: {
  view: ExperimentalMaterialsViewMode;
  onViewChange: (view: ExperimentalMaterialsViewMode) => void;
  className?: string;
}) {
  return (
    <ToggleGroup
      type="single"
      value={props.view}
      onValueChange={(v) => {
        if (v === "list" || v === "cards") props.onViewChange(v);
      }}
      variant="outline"
      size="sm"
      className={props.className}
      aria-label="列表或卡片视图"
    >
      <ToggleGroupItem value="list" aria-label="列表视图">
        <List className="size-4" aria-hidden />
      </ToggleGroupItem>
      <ToggleGroupItem value="cards" aria-label="卡片视图">
        <LayoutGrid className="size-4" aria-hidden />
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
