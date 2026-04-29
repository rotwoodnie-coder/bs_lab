"use client";

import * as React from "react";
import { useSessionActor } from "@/hooks/use-session-actor";
import {
  fetchV2ExpList,
  fetchV2SchoolSubjects,
  fetchV2SchoolLevels,
  type V2ExpMsgItem,
  type V2DictItem,
} from "@/lib/v2/v2-exp-api";
import type { ResourceItem, ResourceKind } from "@/types/resource";

const SUBJECT_NAMES: Record<string, string> = {
  physics: "物理",
  chemistry: "化学",
  biology: "生物",
  science: "科学",
};

const LEVEL_NAMES: Record<string, string> = {
  primary: "小学",
  middle: "初中",
  high: "高中",
};

const KIND_VARIANTS = [
  "from-rose-100 to-amber-50 dark:from-rose-950/40 dark:to-amber-950/30",
  "from-sky-100 to-indigo-50 dark:from-sky-950/40 dark:to-indigo-950/30",
  "from-emerald-100 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/30",
  "from-violet-100 to-fuchsia-50 dark:from-violet-950/40 dark:to-fuchsia-950/30",
  "from-orange-100 to-yellow-50 dark:from-orange-950/40 dark:to-yellow-950/30",
] as const;

function expToResourceItem(
  exp: V2ExpMsgItem,
  subjects: V2DictItem[],
  levels: V2DictItem[],
  index: number,
): ResourceItem {
  const subjectName =
    subjects.find((s) => s.id === exp.subjectId)?.name ?? SUBJECT_NAMES[exp.subjectId ?? ""] ?? "通用";
  const levelName =
    levels.find((l) => l.id === exp.schoolLevelId)?.name ?? LEVEL_NAMES[exp.schoolLevelId ?? ""] ?? "通用";
  return {
    id: exp.expId,
    title: exp.expName,
    kind: "video" as ResourceKind,
    stage: levelName,
    subject: subjectName,
    fileBadge: subjectName,
    downloads: exp.likeNum ?? 0,
    views: exp.evaluateNum ?? 0,
    coverClassName: KIND_VARIANTS[index % KIND_VARIANTS.length],
  };
}

export function useResourceList() {
  const { actor, hydrated } = useSessionActor();
  const [items, setItems] = React.useState<ResourceItem[]>([]);
  const [subjects, setSubjects] = React.useState<V2DictItem[]>([]);
  const [levels, setLevels] = React.useState<V2DictItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;
    setLoading(true);
    void Promise.all([
      fetchV2ExpList(actor, { pageSize: 50 }),
      fetchV2SchoolSubjects(actor),
      fetchV2SchoolLevels(actor),
    ])
      .then(([page, subj, lvls]) => {
        if (cancelled) return;
        setSubjects(subj);
        setLevels(lvls);
        setItems(page.items.map((exp, i) => expToResourceItem(exp, subj, lvls, i)));
      })
      .catch(() => {
        if (cancelled) return;
        setItems([]);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [actor, hydrated]);

  return { items, subjects, levels, loading };
}
