"use client";

import * as React from "react";
import { Button, Collapsible, CollapsibleContent, CollapsibleTrigger } from "@bs-lab/ui";
import { ChevronDown } from "@bs-lab/ui/icons";

import { cn } from "@/lib/utils";

import { TeacherMediaReviewTools } from "./TeacherMediaReviewTools";

export function TeacherMediaReviewToolsCollapsible() {
  const [open, setOpen] = React.useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="rounded-lg border border-border">
      <div className="flex items-center justify-between gap-2 p-3">
        <div className="min-w-0 space-y-0.5">
          <div className="text-sm font-medium text-foreground">资源审核与版本</div>
          <p className="text-xs text-muted-foreground">文件访问与版本治理联调工具，可按需展开。</p>
        </div>
        <CollapsibleTrigger asChild>
          <Button type="button" variant="outline" size="sm" className="shrink-0 gap-1">
            <span>{open ? "收起" : "展开"}</span>
            <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
          </Button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent className="border-t border-border px-3 pb-3">
        <TeacherMediaReviewTools omitIntro />
      </CollapsibleContent>
    </Collapsible>
  );
}
