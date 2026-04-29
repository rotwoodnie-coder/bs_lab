"use client";

import { Badge, Tooltip, TooltipContent, TooltipTrigger } from "@bs-lab/ui";

// ─── 状态指示灯 ───────────────────────────────────────────

export function StatusIndicator({ active }: { active: boolean }) {
  return active ? (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-primary">
      <span className="size-1.5 rounded-full bg-primary" />
      已排课
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/8 px-2 py-0.5 text-xs font-medium text-destructive">
      <span className="size-1.5 rounded-full bg-destructive/70" />
      待配置
    </span>
  );
}

// ─── 带班总数徽章 ─────────────────────────────────────────

export function CountBadge({ count }: { count: number }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums ${
      count > 0 ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
    }`}>
      {count}
    </span>
  );
}

// ─── 教研组徽章 ───────────────────────────────────────────

export function DeptBadge({ name }: { name: string }) {
  return (
    <Badge
      variant="secondary"
      className="rounded-full border-0 bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
    >
      {name}
    </Badge>
  );
}

// ─── 学科徽章组（V0 式浅绿胶囊，与主题 primary 对齐）────────

export function SubjectBadges({
  ids,
  subjectNameById,
}: {
  ids: string[];
  subjectNameById: Record<string, string>;
}) {
  if (ids.length === 0) {
    return <em className="not-italic text-xs text-muted-foreground/60">未分配</em>;
  }
  return (
    <div className="flex flex-wrap gap-1">
      {ids.map((id) => (
        <Badge
          key={id}
          variant="secondary"
          className="rounded-full border-0 bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary"
        >
          {subjectNameById[id] ?? id}
        </Badge>
      ))}
    </div>
  );
}

// ─── 班级徽章组（带 Tooltip 省略） ──────────────────────────

export function ClassBadges({
  ids,
  classNameById,
  max = 4,
}: {
  ids: string[];
  classNameById: Record<string, string>;
  max?: number;
}) {
  if (ids.length === 0) {
    return <em className="not-italic text-xs text-muted-foreground/60">未分配</em>;
  }
  const shown = ids.slice(0, max);
  const hidden = ids.slice(max);
  return (
    <div className="flex flex-wrap gap-1">
      {shown.map((id) => (
        <Badge
          key={id}
          variant="secondary"
          className="rounded-full border-0 bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary"
        >
          {classNameById[id] ?? id}
        </Badge>
      ))}
      {hidden.length > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="secondary"
              className="cursor-pointer rounded-full border border-border/60 bg-muted/50 px-2 py-0.5 text-[11px] font-medium text-muted-foreground hover:bg-muted"
            >
              +{hidden.length}
            </Badge>
          </TooltipTrigger>
          <TooltipContent className="max-w-[280px]">
            <div className="flex flex-wrap gap-1 p-1">
              {hidden.map((id) => (
                <span
                  key={id}
                  className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary"
                >
                  {classNameById[id] ?? id}
                </span>
              ))}
            </div>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
