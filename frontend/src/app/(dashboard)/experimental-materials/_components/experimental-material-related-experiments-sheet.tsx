"use client";

import Link from "next/link";
import { Button, Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@bs-lab/ui";

import type { ExperimentalMaterialRelatedExperiment } from "../page.types";

function refSourceLabel(source: ExperimentalMaterialRelatedExperiment["refSource"]): string {
  return source === "standard_edge" ? "标准目录" : "实验引用";
}

export function ExperimentalMaterialRelatedExperimentsSheet(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: ExperimentalMaterialRelatedExperiment[];
}) {
  return (
    <Sheet open={props.open} onOpenChange={props.onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>相关实验</SheetTitle>
          <SheetDescription>
            下列实验在目录或工作流中引用了本材料。修改材料名称或删除前，请确认不会影响实验说明的连贯性。
          </SheetDescription>
        </SheetHeader>
        <div className="mt-4 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
          {props.items.length === 0 ? (
            <p className="text-sm text-muted-foreground">当前未发现引用记录。</p>
          ) : (
            props.items.map((row) => (
              <div key={`${row.refSource}-${row.experimentId}`} className="rounded-md border border-border px-3 py-2">
                <div className="text-sm font-medium text-foreground">
                  {row.displayName || row.standardCode || `实验标识 ${row.experimentId}`}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>{refSourceLabel(row.refSource)}</span>
                  {row.standardCode ? <span>编码 {row.standardCode}</span> : null}
                  <span>ID {row.experimentId}</span>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="mt-4 border-t border-border pt-3">
          <Button type="button" variant="outline" className="w-full" asChild>
            <Link href="/console/settings/experiments">打开标准实验目录</Link>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
