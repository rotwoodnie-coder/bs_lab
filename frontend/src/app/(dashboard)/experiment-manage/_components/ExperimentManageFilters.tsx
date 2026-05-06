"use client";

import * as React from "react";
import {
  Button, Card, CardContent, CardDescription, CardHeader, CardTitle,
  Collapsible, CollapsibleContent, CollapsibleTrigger,
  Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@bs-lab/ui";
import { cn } from "@/lib/utils";
import type { ExpStatusFilter } from "../page.hooks";
import { EXP_MSG_STATUS_OPTIONS } from "@/lib/v2/exp-display-mapping";

const STATUS_OPTIONS: { value: ExpStatusFilter; label: string }[] =
  EXP_MSG_STATUS_OPTIONS as { value: ExpStatusFilter; label: string }[];

export type ExperimentManageFiltersProps = {
  q: string;
  onQChange: (next: string) => void;
  statusFilter: ExpStatusFilter;
  onStatusFilterChange: (next: ExpStatusFilter) => void;
  pendingCount: number;
  canShelf: boolean;
};

export function ExperimentManageFilters(props: ExperimentManageFiltersProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className="border-border shadow-xs">
        <CardHeader className="space-y-0 pb-0">
          <CollapsibleTrigger asChild>
            <button
              type="button"
              aria-expanded={open}
              aria-label={open ? "收起筛选" : "展开筛选"}
              className="flex w-full items-start justify-between gap-3 rounded-md py-1 text-left outline-none ring-offset-background transition-colors hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="min-w-0 space-y-1">
                <CardTitle className="text-base">筛选条件</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  {open ? (
                    <>
                      草稿共 <span className="font-medium text-foreground">{props.pendingCount}</span> 条
                      {!props.canShelf ? <span className="mt-1 block italic">当前身份无流程治理权限，状态列只读。</span> : null}
                    </>
                  ) : (
                    <>
                      草稿 <span className="font-medium text-foreground">{props.pendingCount}</span> 条 · 点击展开关键词与状态筛选
                    </>
                  )}
                </CardDescription>
              </div>
              <span
                className={cn(
                  "mt-1 inline-flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-transform duration-200",
                  open && "rotate-180",
                )}
                aria-hidden
              >
                ▼
              </span>
            </button>
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="flex flex-col gap-3 pt-4 sm:flex-row sm:flex-wrap sm:items-end">
            <div className="grid min-w-0 flex-1 gap-2 sm:max-w-xs">
              <span className="text-xs font-medium text-muted-foreground">关键词</span>
              <Input
                value={props.q}
                onChange={(e) => props.onQChange(e.target.value)}
                placeholder="搜索实验名称"
                aria-label="筛选关键词"
              />
            </div>
            <div className="grid min-w-0 gap-2 sm:w-44">
              <span className="text-xs font-medium text-muted-foreground">状态</span>
              <Select
                value={props.statusFilter}
                onValueChange={(v) => props.onStatusFilterChange(v as ExpStatusFilter)}
              >
                <SelectTrigger aria-label="按状态筛选">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              type="button" variant="outline" className="sm:mb-0.5"
              onClick={() => { props.onStatusFilterChange("all"); props.onQChange(""); }}
            >
              清除筛选
            </Button>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
