"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { sonnerToast } from "@bs-lab/ui";

import { useSessionActor } from "@/hooks/use-session-actor";
import {
  fetchParentTasks,
  fetchMyBindings,
  postCreateSession,
  type ParentTaskItem,
  type MyBindingRow,
} from "@/lib/v2/v2-parent-task-api";

export function useParentTasksPage() {
  const { hydrated, actor } = useSessionActor();
  const router = useRouter();

  const [tasks, setTasks] = React.useState<ParentTaskItem[]>([]);
  const [bindings, setBindings] = React.useState<MyBindingRow[]>([]);
  const [loading, setLoading] = React.useState(true);

  const loadData = React.useCallback(async () => {
    if (!hydrated) return;
    setLoading(true);
    try {
      const [fetchedTasks, fetchedBindings] = await Promise.all([
        fetchParentTasks(actor),
        fetchMyBindings(actor),
      ]);
      setTasks(fetchedTasks);
      setBindings(fetchedBindings.filter((b) => b.auditStatus === "Y"));
    } catch (err) {
      console.error("[parent-tasks] loadData error", err);
    } finally {
      setLoading(false);
    }
  }, [hydrated, actor]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

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

  const startFromTask = React.useCallback(
    async (task: ParentTaskItem) => {
      try {
        const res = await postCreateSession(actor, {
          studentUserId: task.studentUserId,
          expId: task.expId,
          workId: task.workId,
          taskId: task.seqId,
        });
        router.push(`/parent/sessions/${res.session.sessionId}`);
      } catch (err) {
        sonnerToast.error("无法开始任务", {
          description: err instanceof Error ? err.message : "请求失败",
        });
      }
    },
    [actor, router],
  );

  return {
    hydrated,
    loading,
    tasks,
    bindings,
    firstBinding,
    firstBindingDisplay,
    refresh,
    startFromTask,
  };
}
