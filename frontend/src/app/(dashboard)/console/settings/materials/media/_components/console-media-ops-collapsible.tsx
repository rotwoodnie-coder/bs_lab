"use client";

import * as React from "react";
import { Button, Collapsible, CollapsibleContent, CollapsibleTrigger } from "@bs-lab/ui";
import { ChevronDown } from "@bs-lab/ui/icons";

import type { ApiActor } from "@/lib/new-core-api";

import { ConsoleMediaOpsPanel } from "./console-media-ops-panel";
import { ConsoleMediaReferenceTools } from "./console-media-reference-tools";

type Props = {
  actor: ApiActor;
  onCompleted: () => Promise<void>;
};

/** 联调、引用占位等：默认折叠，不占主列表首屏（management-pages-ui） */
export function ConsoleMediaOpsCollapsible({ actor, onCompleted }: Props) {
  const [open, setOpen] = React.useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="rounded-lg border border-border">
      <div className="flex items-center justify-between gap-2 px-3 py-2">
        <div className="text-sm font-medium text-foreground">联调与引用（可选）</div>
        <CollapsibleTrigger asChild>
          <Button type="button" variant="ghost" size="sm" className="gap-1">
            {open ? "收起" : "展开"}
            <ChevronDown className={`size-4 transition-transform ${open ? "rotate-180" : ""}`} />
          </Button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent className="border-t border-border px-3 pb-3 pt-2 space-y-4">
        <ConsoleMediaOpsPanel actor={actor} onCompleted={onCompleted} />
        <ConsoleMediaReferenceTools actor={actor} onCompleted={onCompleted} />
      </CollapsibleContent>
    </Collapsible>
  );
}
