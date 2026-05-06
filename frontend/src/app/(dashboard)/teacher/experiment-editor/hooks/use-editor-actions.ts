"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { sonnerToast } from "@bs-lab/ui";

import { useEditorStore } from "./use-editor-store";

/**
 * 实验编辑器操作的 VM 适配层。
 * 所有实际操作委托给 Zustand store 的 actions，此 hook 仅为 page.container 兼容而存在。
 */
export function useEditorActions() {
  const router = useRouter();
  const store = useEditorStore();

  const saveDraft = React.useCallback(
    async (options?: { silent?: boolean }): Promise<boolean> => {
      const saved = await store.saveDraft(options);
      // 新建实验后更新 URL（使用 store.expId 作为函数调用即可，saveDraft 内部已 useState set）
      return saved;
    },
    [store, router],
  );

  const publish = React.useCallback(async () => {
    await store.publish();
  }, [store]);

  const approveExperiment = React.useCallback(async () => {
    await store.approveExperiment();
  }, [store]);

  const confirmReject = React.useCallback(
    async (rejectDraft: string, close: () => void) => {
      await store.confirmReject(rejectDraft, close);
    },
    [store],
  );

  const archivePublished = React.useCallback(() => {
    store.archivePublished();
  }, [store]);

  const preview = React.useCallback(() => {
    sonnerToast.message("请使用左侧「预览」进入预览页");
  }, []);

  const undo = React.useCallback(() => {
    sonnerToast.message("暂无可撤销记录");
    return null;
  }, []);

  const persistListFields = React.useCallback(() => {
    // 刷新列表由 bootstrap hook 的 refreshV2PeerList 完成
  }, []);

  return {
    canShowNavSave: true,
    canShowNavSubmit: true,
    saveDraft,
    publish,
    preview,
    undo,
    approveExperiment,
    confirmReject,
    archivePublished,
    persistListFields,
  };
}
