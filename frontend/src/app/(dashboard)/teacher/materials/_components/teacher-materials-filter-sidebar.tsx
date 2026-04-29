"use client";

import * as React from "react";
import { Button, Collapsible, CollapsibleContent, CollapsibleTrigger } from "@bs-lab/ui";
import {
  AudioLines,
  ChevronDown,
  FileText,
  FileType,
  Image,
  LayoutGrid,
  Presentation,
  Table,
  Video,
} from "@bs-lab/ui/icons";

import { cn } from "@/lib/utils";

import type { KindFilterId } from "../_lib/material-filters";
import { TEACHER_MATERIALS_KIND_FILTER } from "../_lib/teacher-materials-ui.config";

const KIND_FILTER_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  all: LayoutGrid,
  audio: AudioLines,
  word: FileText,
  ppt: Presentation,
  pdf: FileType,
  image: Image,
  video: Video,
  spreadsheet: Table,
};

function iconByKindCode(code: string): React.ComponentType<{ className?: string }> {
  const k = code.toLowerCase();
  const direct = KIND_FILTER_ICONS[k];
  if (direct) return direct;
  if (k.includes("video")) return Video;
  if (k.includes("audio") || k.includes("sound") || k.includes("music")) return AudioLines;
  if (k.includes("image") || k.includes("photo")) return Image;
  if (k.includes("pdf")) return FileType;
  if (k.includes("ppt")) return Presentation;
  if (k.includes("xls") || k.includes("excel") || k.includes("sheet")) return Table;
  if (k.includes("doc") || k.includes("word")) return FileText;
  return FileText;
}

function FilterColumn(props: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="text-xs font-medium text-muted-foreground">{props.label}</div>
      <div className="flex flex-col gap-1.5">{props.children}</div>
    </div>
  );
}

export function TeacherMaterialsFilterSidebar(props: {
  kindFilter: KindFilterId;
  kindOptions?: { id: string; label: string }[];
  onKindChange: (id: KindFilterId) => void;
  className?: string;
}) {
  const kindOptions = props.kindOptions?.length
    ? props.kindOptions
    : TEACHER_MATERIALS_KIND_FILTER.map((item) => ({ id: item.id, label: item.label }));
  return (
    <div className={cn("space-y-5", props.className)}>
      <FilterColumn label="类型">
        {kindOptions.map((f) => {
          const Icon = iconByKindCode(f.id);
          return (
            <Button
              key={f.id}
              type="button"
              size="sm"
              variant={props.kindFilter === f.id ? "default" : "outline"}
              className="w-full justify-start gap-2"
              onClick={() => props.onKindChange(f.id)}
            >
              <Icon className="size-4 shrink-0 opacity-90" aria-hidden />
              {f.label}
            </Button>
          );
        })}
      </FilterColumn>
    </div>
  );
}

/** 小屏：顶部折叠筛选；大屏：左侧栏（由父级 `hidden md:block` 控制显示） */
export function TeacherMaterialsFiltersSection(props: {
  kindFilter: KindFilterId;
  kindOptions?: { id: string; label: string }[];
  onKindChange: (id: KindFilterId) => void;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Collapsible open={open} onOpenChange={setOpen} className="rounded-lg border border-border md:hidden">
        <CollapsibleTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            className="flex h-auto w-full items-center justify-between gap-2 rounded-lg px-3 py-3 text-left font-normal"
          >
            <span className="text-sm font-medium text-foreground">筛选条件</span>
            <ChevronDown
              className={cn("size-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")}
            />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="border-t border-border px-3 pb-3">
          <TeacherMaterialsFilterSidebar
            kindFilter={props.kindFilter}
            kindOptions={props.kindOptions}
            onKindChange={props.onKindChange}
            className="pt-3"
          />
        </CollapsibleContent>
      </Collapsible>

      <aside className="hidden w-56 shrink-0 md:block">
        <div className="rounded-lg border border-border p-4">
          <TeacherMaterialsFilterSidebar
            kindFilter={props.kindFilter}
            kindOptions={props.kindOptions}
            onKindChange={props.onKindChange}
          />
        </div>
      </aside>
    </>
  );
}
