"use client";

import * as React from "react";
import { useSessionActor } from "@/hooks/use-session-actor";
import {
  fetchStudentTasks,
  type StudentTaskItem,
} from "@/lib/v2/v2-student-task-api";

export type ChallengeFilter = "all" | "pending" | "submitted" | "marked";

export function useChallengeList() {
  const { actor, hydrated } = useSessionActor();
  const [items, setItems] = React.useState<StudentTaskItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [filter, setFilter] = React.useState<ChallengeFilter>("all");

  React.useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    void fetchStudentTasks(actor)
      .then((data) => {
        if (cancelled) return;
        setItems(data);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setError(err.message ?? "加载失败");
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

  const filtered = React.useMemo(() => {
    if (filter === "all") return items;
    return items.filter((item) => item.status === filter);
  }, [filter, items]);

  const stats = React.useMemo(
    () => ({
      total: items.length,
      pending: items.filter((i) => i.status === "pending").length,
      submitted: items.filter((i) => i.status === "submitted").length,
      marked: items.filter((i) => i.status === "marked").length,
    }),
    [items],
  );

  return { items: filtered, allItems: items, loading, hydrated, filter, setFilter, stats, error };
}
