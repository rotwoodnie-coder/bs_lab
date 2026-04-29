"use client";

import * as React from "react";

import { useSessionActor } from "@/hooks/use-session-actor";
import {
  fetchParentSessions,
  type ParentSessionListItem,
} from "@/lib/v2/v2-parent-session-api";
import { fetchMyBindings, type MyBindingRow } from "@/lib/v2/v2-parent-task-api";

export function useParentLabPage() {
  const { hydrated, actor } = useSessionActor();
  const [, bump] = React.useReducer((n) => n + 1, 0);

  const [sessions, setSessions] = React.useState<ParentSessionListItem[]>([]);
  const [bindings, setBindings] = React.useState<MyBindingRow[]>([]);
  const [loading, setLoading] = React.useState(true);

  const loadData = React.useCallback(async () => {
    if (!hydrated) return;
    setLoading(true);
    try {
      const [sessionsResult, bindingsResult] = await Promise.allSettled([
        fetchParentSessions(actor),
        fetchMyBindings(actor),
      ]);

      if (sessionsResult.status === "fulfilled") {
        setSessions(sessionsResult.value);
      } else {
        console.warn("[parent-lab] sessions load failed", sessionsResult.reason);
        setSessions([]);
      }

      if (bindingsResult.status === "fulfilled") {
        setBindings(bindingsResult.value.filter((b) => b.auditStatus === "Y"));
      } else {
        console.warn("[parent-lab] bindings load failed", bindingsResult.reason);
        setBindings([]);
      }
    } catch (err) {
      console.error("[parent-lab] loadData error", err);
    } finally {
      setLoading(false);
    }
  }, [hydrated, actor]);

  React.useEffect(() => {
    loadData();
  }, [loadData, bump]);

  const refresh = React.useCallback(() => {
    loadData();
  }, [loadData]);

  const firstBinding = bindings[0] ?? null;
  const firstBindingDisplay = firstBinding
    ? {
        studentUserId: firstBinding.studentUserId,
        displayName: firstBinding.studentUserName ?? "已绑定孩子",
        gradeLabel: [firstBinding.gradeOrgName, firstBinding.schoolOrgName]
          .filter(Boolean)
          .join(" · "),
      }
    : null;

  return {
    hydrated,
    loading,
    sessions,
    firstBinding,
    firstBindingDisplay,
    refresh,
  };
}
