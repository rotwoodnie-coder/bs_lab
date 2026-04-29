"use client";

import { Badge, Button } from "@bs-lab/ui";

import { cn } from "@/lib/utils";

import type { TextbookRefChapter } from "../page.types";

export function TextbookRefChapterRows(props: {
  chapters: TextbookRefChapter[];
  onEdit: (c: TextbookRefChapter) => void;
  onDelete: (c: TextbookRefChapter) => void;
}) {
  if (props.chapters.length === 0) {
    return <p className="text-sm text-muted-foreground">暂无章节，请新增章。</p>;
  }
  return (
    <ul className="space-y-2">
      {props.chapters.map((c) => (
        <li
          key={c.id}
          className={cn(
            "flex flex-wrap items-center justify-between gap-2 rounded-md border border-border px-3 py-2",
            c.level === 2 && "ml-6 border-dashed",
          )}
        >
          <div className="min-w-0 flex-1 space-y-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="font-normal">
                {c.level === 1 ? "章" : "节"}
              </Badge>
              <span className="text-sm font-medium text-foreground">{c.title}</span>
            </div>
            {c.description ? <p className="line-clamp-2 text-xs text-muted-foreground">{c.description}</p> : null}
          </div>
          <div className="flex shrink-0 gap-1">
            <Button type="button" variant="ghost" size="sm" className="h-8 px-2" onClick={() => props.onEdit(c)}>
              编辑
            </Button>
            <Button type="button" variant="ghost" size="sm" className="h-8 px-2" onClick={() => props.onDelete(c)}>
              删除
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
