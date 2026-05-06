"use client";

/**
 * 重导出 Zustand store，保持调用方兼容性
 */
export {
  useEditorStore,
  type EditorStoreState,
  type EditorStoreActions,
} from "../stores/editor-store";

export type { SaveStatus, PublishStatus } from "../stores/editor-store";
