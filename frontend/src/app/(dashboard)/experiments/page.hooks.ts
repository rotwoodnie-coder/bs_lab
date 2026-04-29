"use client";

import * as React from "react";
import type { CoreApiActor } from "@/lib/core-api-shared";
import {
  fetchStudentTasks,
  type StudentTaskItem,
  type StudentTaskStatus,
} from "@/lib/v2/v2-student-task-api";

export type FilterStatus = "all" | StudentTaskStatus;

export function useExperimentList(actor: CoreApiActor) {
  const [items, setItems] = React.useState<StudentTaskItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [filter, setFilter] = React.useState<FilterStatus>("all");

  React.useEffect(() => {
    if (!actor.userId) return;
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
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [actor]);

  const filtered = React.useMemo(() => {
    if (filter === "all") return items;
    return items.filter((item) => item.status === filter);
  }, [filter, items]);

  return { items: filtered, allItems: items, loading, error, filter, setFilter };
}
