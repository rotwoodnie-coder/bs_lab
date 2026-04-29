"use client";

import * as React from "react";
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@bs-lab/ui";

import type { CatalogCore } from "@/lib/experiment-catalog-api";

import type { SchoolDimensionSnapshot } from "../../education/subject-grades/page.types";
import { formatCatalogGradeRange } from "../catalog-grade-range-display";

export function formatCatalogPathAggregate(row: CatalogCore, snap: SchoolDimensionSnapshot | null): string {
  const stage = row.stageName?.trim() || "—";
  const subj = row.subjectName?.trim() || "—";
  const grades = formatCatalogGradeRange(row, snap);
  return `${stage} / ${subj} / ${grades}`;
}

type VideoLampProps = {
  row: CatalogCore;
  canManage: boolean;
  onUnboundClick: (row: CatalogCore) => void;
  onBoundClick: (row: CatalogCore) => void;
};

export function CatalogOfficialVideoLamp(props: VideoLampProps) {
  const { row } = props;
  const id = row.officialVideoRegistryId;
  const reachable = row.officialVideoReachable;

  const goFix = (e: React.MouseEvent) => {
    e.stopPropagation();
    props.onUnboundClick(row);
  };

  if (!id) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="inline-flex size-8 items-center justify-center rounded-md border border-border bg-muted/40 text-xs font-medium text-muted-foreground hover:bg-muted"
            onClick={goFix}
          >
            缺
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-xs">
          未绑定官方视频；点击前往编辑并定位到视频字段。
        </TooltipContent>
      </Tooltip>
    );
  }

  if (reachable === false) {
    return (
      <div className="flex max-w-[11rem] flex-col items-start gap-1 sm:max-w-none sm:flex-row sm:items-center sm:gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="inline-flex size-8 shrink-0 items-center justify-center rounded-md border border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/15"
              onClick={goFix}
            >
              !
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs text-xs">
            {props.canManage
              ? "已填写登记 id，但媒体库中找不到对应记录（引用失效）。可点击下方「前往编辑修正」打开详情并定位到官方视频。"
              : "已填写登记 id，但媒体库中找不到对应记录（引用失效）。请联系具备管理权限的用户修正绑定。"}
          </TooltipContent>
        </Tooltip>
        {props.canManage ? (
          <Button type="button" variant="link" className="h-auto min-h-0 p-0 text-xs font-normal" onClick={goFix}>
            前往编辑修正
          </Button>
        ) : null}
      </div>
    );
  }

  const title = row.officialVideoTitle?.trim() || "已绑定官方视频";
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="inline-flex size-8 items-center justify-center rounded-md border border-primary/30 bg-primary/10 text-primary hover:bg-primary/15"
          onClick={(e) => {
            e.stopPropagation();
            props.onBoundClick(row);
          }}
        >
          视
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs text-xs">
        {title}
      </TooltipContent>
    </Tooltip>
  );
}

export function CatalogOfficialVideoPreviewDialog(props: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  row: CatalogCore | null;
}) {
  const r = props.row;
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="sm:max-w-md" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>官方视频</DialogTitle>
        </DialogHeader>
        {r ? (
          <div className="space-y-2 text-sm text-foreground">
            <p>
              <span className="text-muted-foreground">标题：</span>
              {r.officialVideoTitle?.trim() || "—"}
            </p>
            <p className="text-xs text-muted-foreground">
              流媒体预览依赖媒体服务地址；当前在列表中仅做快速确认，完整播放请在媒体库或实验详情中查看。
            </p>
          </div>
        ) : null}
        <div className="flex justify-end">
          <Button type="button" variant="outline" onClick={() => props.onOpenChange(false)}>
            关闭
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function MandatoryBadge({ value }: { value: number }) {
  if (value === 1) {
    return (
      <Badge variant="destructive" className="font-normal">
        必做
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="font-normal text-muted-foreground">
      选做
    </Badge>
  );
}
