"use client";

import * as React from "react";
import Link from "next/link";
import { Badge } from "@bs-lab/ui";
import { ChevronDown, ChevronRight } from "@bs-lab/ui/icons";
import type { ApiActor } from "@/lib/new-core-api";
import {
  fetchEduTextbookTree,
  fetchExpsByChapter,
  type CoursebookTreeChapter,
  type ExpMsgRow,
} from "@/lib/edu-textbooks-api";
import { cn } from "@/lib/utils";

type Props = {
  actor: ApiActor;
  coursebookId: string | null;
};

function UnitRow({ unit, exps }: { unit: CoursebookTreeChapter["units"][number]; exps: ExpMsgRow[] }) {
  const unitExps = exps.filter((e) => e.unitId === unit.unitId);
  return (
    <div className="border-t border-border/30 px-4 py-2 bg-background">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">{unit.unitName}</span>
        {unitExps.length > 0 && (
          <Badge variant="outline" className="text-xs shrink-0">{unitExps.length} 个实验</Badge>
        )}
      </div>
      {unitExps.length > 0 && (
        <ul className="mt-1.5 space-y-0.5 pl-2">
          {unitExps.map((exp) => (
            <li key={exp.expId} className="flex items-center gap-1.5 text-xs text-foreground/70">
              <span className="h-1 w-1 rounded-full bg-muted-foreground/50 shrink-0" />
              {exp.expName}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ChapterRow({
  chapter, actor, isExpanded, onToggle, exps, loadingExps,
}: {
  chapter: CoursebookTreeChapter;
  actor: ApiActor;
  isExpanded: boolean;
  onToggle: (id: string) => void;
  exps: ExpMsgRow[];
  loadingExps: boolean;
}) {
  return (
    <div className="rounded-md border border-border overflow-hidden">
      <button
        type="button"
        onClick={() => onToggle(chapter.chapterId)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2.5 bg-muted/30 hover:bg-muted/60 transition-colors text-sm"
      >
        <div className="flex items-center gap-2 min-w-0">
          {isExpanded
            ? <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            : <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
          <span className="font-medium truncate">{chapter.chapterName}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Badge variant="secondary" className="text-xs">{chapter.units.length} 节</Badge>
        </div>
      </button>
      {isExpanded && (
        <div>
          {loadingExps && (
            <div className="px-4 py-2 text-xs text-muted-foreground border-t border-border/30">加载实验中…</div>
          )}
          {!loadingExps && chapter.units.length === 0 && (
            <div className="px-6 py-2 text-xs text-muted-foreground border-t border-border/30">本章暂无小节</div>
          )}
          {chapter.units.map((unit) => (
            <UnitRow key={unit.unitId} unit={unit} exps={exps} />
          ))}
        </div>
      )}
    </div>
  );
}

export function CourseStep2Tree({ actor, coursebookId }: Props) {
  const [chapters, setChapters] = React.useState<CoursebookTreeChapter[]>([]);
  const [treeLoading, setTreeLoading] = React.useState(false);
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set());
  const [expsByChapter, setExpsByChapter] = React.useState<Map<string, ExpMsgRow[]>>(new Map());
  const [loadingChapId, setLoadingChapId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!coursebookId) { setChapters([]); return; }
    setTreeLoading(true);
    setExpanded(new Set());
    setExpsByChapter(new Map());
    void fetchEduTextbookTree(actor, coursebookId)
      .then(setChapters)
      .catch(() => {})
      .finally(() => setTreeLoading(false));
  }, [actor, coursebookId]);

  const toggleChapter = React.useCallback(async (chapterId: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(chapterId)) { next.delete(chapterId); return next; }
      next.add(chapterId); return next;
    });
    if (!expsByChapter.has(chapterId)) {
      setLoadingChapId(chapterId);
      try {
        const exps = await fetchExpsByChapter(actor, chapterId);
        setExpsByChapter((prev) => new Map(prev).set(chapterId, exps));
      } catch { /* silent */ }
      finally { setLoadingChapId(null); }
    }
  }, [actor, expsByChapter]);

  if (!coursebookId) {
    return (
      <p className={cn("py-6 text-center text-sm text-muted-foreground")}>
        请先完成第一步，此处将自动展示课程章节结构。
      </p>
    );
  }

  if (treeLoading) {
    return <p className="py-6 text-center text-sm text-muted-foreground">加载章节结构中…</p>;
  }

  if (chapters.length === 0) {
    return (
      <div className="space-y-3 py-4 text-center">
        <p className="text-sm text-muted-foreground">课程暂无章节，请前往章节管理添加章节与小节。</p>
        <Link
          href={`/console/settings/textbooks/${encodeURIComponent(coursebookId)}/chapters`}
          target="_blank"
          className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-sm font-medium text-background hover:opacity-90"
        >
          前往章节管理 ↗
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="space-y-2 overflow-y-auto max-h-[280px] pr-0.5">
        {chapters.map((ch) => (
          <ChapterRow
            key={ch.chapterId}
            chapter={ch}
            actor={actor}
            isExpanded={expanded.has(ch.chapterId)}
            onToggle={(id) => void toggleChapter(id)}
            exps={expsByChapter.get(ch.chapterId) ?? []}
            loadingExps={loadingChapId === ch.chapterId}
          />
        ))}
      </div>
      <div className="flex justify-end pt-1">
        <Link
          href={`/console/settings/textbooks/${encodeURIComponent(coursebookId)}/chapters`}
          target="_blank"
          className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
        >
          在章节管理中编辑内容 ↗
        </Link>
      </div>
    </div>
  );
}
