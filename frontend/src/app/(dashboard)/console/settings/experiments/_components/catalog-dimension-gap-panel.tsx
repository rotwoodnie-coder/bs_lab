"use client";

import * as React from "react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@bs-lab/ui";
import { ChevronDown } from "@bs-lab/ui/icons";

import type { CatalogCore, CatalogDimensionGapsPayload } from "@/lib/experiment-catalog-api";

function gapIssueSummary(row: CatalogCore): string {
  const parts: string[] = [];
  if (!row.stageName?.trim()) parts.push("学段未解析");
  if (!row.subjectName?.trim()) parts.push("学科未解析");
  if (!row.categoryName?.trim()) parts.push("实验类型未解析");
  return parts.length ? parts.join("、") : "教学维度未关联";
}

export function CatalogDimensionGapPanel(props: {
  dimensionGaps: CatalogDimensionGapsPayload | null;
  gapLoading: boolean;
  canManage: boolean;
  onOpenRow: (row: CatalogCore) => void;
  onDeleteRow: (row: CatalogCore) => void;
}) {
  const n = props.dimensionGaps?.unlinked.length ?? 0;
  const [open, setOpen] = React.useState(() => n > 0);

  React.useEffect(() => {
    if (n > 0) setOpen(true);
  }, [n]);

  if (!props.gapLoading && !props.dimensionGaps) {
    return null;
  }

  const bare = props.dimensionGaps?.bareTableCount ?? 0;
  const linked = props.dimensionGaps?.linkedCatalogCount ?? 0;
  const rows = props.dimensionGaps?.unlinked ?? [];

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="border-t border-border px-2 pb-3 pt-2 sm:px-2 lg:px-2">
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center justify-between gap-2 rounded-md border border-border bg-muted/30 px-3 py-2 text-left text-sm font-medium text-foreground hover:bg-muted/50"
        >
          <span>未关联教学维度的实验</span>
          <ChevronDown className={`size-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 space-y-2">
        {props.gapLoading ? (
          <p className="text-xs text-muted-foreground">加载未关联数据…</p>
        ) : (
          <>
            <Alert className="border-amber-500/40 bg-amber-500/10">
              <AlertTitle>主表与目录列表对照</AlertTitle>
              <AlertDescription className="text-xs leading-relaxed">
                主表共 <span className="font-medium text-foreground">{bare}</span> 条；其中{" "}
                <span className="font-medium text-foreground">{linked}</span> 条已关联学段、学科和实验类型并出现在上方主表格中。
                {n > 0 ? (
                  <>
                    {" "}
                    另有 <span className="font-medium text-foreground">{n}</span> 条因外键指向缺失而未出现在主表格中，可在下方修正或删除。
                  </>
                ) : (
                  <> 当前无未关联记录。</>
                )}
              </AlertDescription>
            </Alert>
            {n > 0 ? (
              <div className="max-h-[min(40vh,24rem)] overflow-auto rounded-md border border-border">
                <table className="w-full min-w-0 text-left text-sm">
                  <thead className="sticky top-0 z-[1] border-b border-border bg-muted/80 backdrop-blur-sm">
                    <tr>
                      <th className="px-2 py-2 font-medium text-muted-foreground">序号</th>
                      <th className="px-2 py-2 font-medium text-muted-foreground">实验名称</th>
                      <th className="px-2 py-2 font-medium text-muted-foreground">问题</th>
                      <th className="px-2 py-2 text-right font-medium text-muted-foreground">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, idx) => (
                      <tr key={row.id} className="border-b border-border/80 last:border-0">
                        <td className="px-2 py-2 tabular-nums text-muted-foreground">{idx + 1}</td>
                        <td className="max-w-[10rem] truncate px-2 py-2 font-medium text-foreground">{row.displayName}</td>
                        <td className="px-2 py-2 text-xs text-muted-foreground">{gapIssueSummary(row)}</td>
                        <td className="whitespace-nowrap px-2 py-2 text-right">
                          <Button type="button" variant="ghost" size="sm" className="h-8" onClick={() => props.onOpenRow(row)}>
                            查看
                          </Button>
                          {props.canManage ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 text-destructive hover:text-destructive"
                              onClick={() => props.onDeleteRow(row)}
                            >
                              删除
                            </Button>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
