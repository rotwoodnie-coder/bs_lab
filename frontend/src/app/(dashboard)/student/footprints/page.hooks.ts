"use client";

import * as React from "react";
import { useSessionActor } from "@/hooks/use-session-actor";
import {
  fetchStudentFootprints,
  type StudentFootprintItem,
  type FootprintStatusType,
} from "@/lib/v2/v2-student-footprints-api";

export function useFootprints() {
  const { actor, hydrated } = useSessionActor();
  const [items, setItems] = React.useState<StudentFootprintItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    void fetchStudentFootprints(actor)
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

  return { items, loading, error, hydrated };
}

export function statusLabelZh(status: FootprintStatusType): string {
  const map: Record<FootprintStatusType, string> = {
    completed: "已完成",
    pending_review: "待评价",
    in_progress: "进行中",
  };
  return map[status];
}

export function statusBadgeVariant(
  status: FootprintStatusType,
): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "completed":
      return "default";
    case "pending_review":
      return "secondary";
    case "in_progress":
      return "outline";
  }
}
