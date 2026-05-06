"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ExperimentEditorShell } from "./_components/ExperimentEditorShell";
import { useEditorBootstrap } from "./hooks/use-editor-bootstrap";
import { useEditorActions } from "./hooks/use-editor-actions";
import { useEditorAutosave } from "./hooks/use-editor-autosave";
import { useEditorStore } from "./hooks/use-editor-store";

export default function TeacherExperimentEditorContainer() {
  const router = useRouter();
  const vm = useEditorBootstrap();
  const actions = useEditorActions();
  // 从 store 读取 expId（新建实验后由 saveDraft 更新）
  const storeExpId = useEditorStore((s) => s.expId);
  const vmExpId = vm.expId;
  const autosave = useEditorAutosave({
    enabled: !vm.isResearcher && vm.isOwner,
  });

  const hasPendingChangesRef = React.useRef(autosave.hasPendingChanges);
  React.useEffect(() => {
    hasPendingChangesRef.current = autosave.hasPendingChanges;
  }, [autosave.hasPendingChanges]);

  // 新建实验后 URL 同步
  React.useEffect(() => {
    if (!storeExpId) return;
    if (storeExpId === vmExpId) return;
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (url.searchParams.get("id") !== storeExpId) {
        url.searchParams.set("id", storeExpId);
        router.replace(`${url.pathname}?${url.searchParams.toString()}`, { scroll: false });
      }
    }
  }, [storeExpId, vmExpId, router]);

  React.useEffect(() => {
    const handleUnload = () => {
      if (hasPendingChangesRef.current) {
        actions.saveDraft({ silent: true });
      }
    };
    window.addEventListener("beforeunload", handleUnload);
    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      if (hasPendingChangesRef.current) {
        actions.saveDraft({ silent: true });
      }
    };
  }, [actions.saveDraft]);

  return <ExperimentEditorShell vm={vm} actions={actions} autosave={autosave} />;
}
