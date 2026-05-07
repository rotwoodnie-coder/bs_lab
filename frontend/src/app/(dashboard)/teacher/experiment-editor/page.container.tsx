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
  const store = useEditorStore();

  React.useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;

    const win = window as unknown as {
      store?: typeof useEditorStore & {
        __debugSetStatePatched?: boolean;
      };
    };

    win.store = useEditorStore;

    const timer = window.setTimeout(() => {
      const currentStore = (window as unknown as { store?: typeof useEditorStore }).store;
      if (!currentStore || currentStore.__debugSetStatePatched) return;
      if (typeof currentStore.setState !== "function" || typeof currentStore.getState !== "function") {
        console.warn("store monitor skipped: invalid store object", currentStore);
        return;
      }
      const origSetState = currentStore.setState;
      if (typeof origSetState !== "function") {
        console.warn("store monitor skipped: setState missing", currentStore);
        return;
      }
      currentStore.__debugSetStatePatched = true;
      let count = 0;
      currentStore.setState = ((partial: Parameters<typeof origSetState>[0], replace?: boolean) => {
        count += 1;
        const prev = currentStore.getState();
        const next = typeof partial === "function" ? partial(prev) : partial;
        const changedKeys = Object.keys(next as Record<string, unknown>).filter(
          (key) => (next as Record<string, unknown>)[key] !== (prev as Record<string, unknown>)[key],
        );
        if (changedKeys.length === 0) {
          console.warn(`[store:${count}] no actual changes`, next);
        } else {
          console.groupCollapsed(`[store:${count}] changed keys: ${changedKeys.join(", ")}`);
          console.log("next:", next);
          console.trace("call stack");
          console.groupEnd();
        }
        if (count > 30) {
          console.error("store update loop suspected, stopping after 30 calls");
          throw new Error("Infinite loop detected");
        }
        return origSetState(partial, replace);
      }) as typeof currentStore.setState;
      console.log("✅ store monitor armed");
    }, 100);

    return () => {
      window.clearTimeout(timer);
      if (win.store) {
        delete win.store.__debugSetStatePatched;
        delete (window as unknown as { store?: unknown }).store;
      }
    };
  }, []);
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
    };
  }, [actions.saveDraft]);

  return <ExperimentEditorShell vm={vm} actions={actions} autosave={autosave} />;
}
