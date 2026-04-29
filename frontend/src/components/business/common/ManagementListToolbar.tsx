"use client";

import * as React from "react";
import { ToggleGroup, ToggleGroupItem } from "@bs-lab/ui";
import { LayoutGrid, Table2 } from "@bs-lab/ui/icons";
import { cn } from "@/lib/utils";

export function ManagementListToolbar(props: {
  left: React.ReactNode;
  right: React.ReactNode;
  view: "list" | "cards";
  onViewChange: (v: "list" | "cards") => void;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between gap-2 sm:gap-4", props.className)}>
      <div className="flex min-w-0 flex-1 items-center gap-2">{props.left}</div>
      <div className="flex shrink-0 items-center gap-2">
        <ToggleGroup
          type="single"
          value={props.view}
          onValueChange={(v) => {
            if (v === "list" || v === "cards") props.onViewChange(v);
          }}
          variant="outline"
          size="sm"
          aria-label="列表展示方式"
          className="shrink-0"
        >
          <ToggleGroupItem value="list" aria-label="表格列表" className="h-9 w-9">
            <Table2 className="size-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="cards" aria-label="卡片列表" className="h-9 w-9">
            <LayoutGrid className="size-4" />
          </ToggleGroupItem>
        </ToggleGroup>
        {props.right}
      </div>
    </div>
  );
}

