"use client";

import * as React from "react";
import { create } from "zustand";
import type { MediaTask, MediaStatus } from "./types";

type MediaStoreState = {
  tabId: string;
  tasksByHash: Record<string, MediaTask>;
  tasksByUploadKey: Record<string, string>;
  registerTask: (task: MediaTask) => void;
  updateTask: (fileHash: string, patch: Partial<MediaTask>) => void;
  setStatus: (fileHash: string, status: MediaStatus) => void;
  removeTask: (fileHash: string) => void;
  restoreTasks: (tasks: MediaTask[]) => void;
};

function newId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export const useMediaStore = create<MediaStoreState>((set, get) => ({
  tabId: newId("tab"),
  tasksByHash: {},
  tasksByUploadKey: {},
  registerTask: (task) =>
    set((state) => ({
      tasksByHash: { ...state.tasksByHash, [task.fileHash]: task },
      tasksByUploadKey: { ...state.tasksByUploadKey, [task.uploadKey]: task.fileHash },
    })),
  updateTask: (fileHash, patch) =>
    set((state) => {
      const current = state.tasksByHash[fileHash];
      if (!current) return state;
      const next = { ...current, ...patch, updatedAt: Date.now() };
      return { tasksByHash: { ...state.tasksByHash, [fileHash]: next } };
    }),
  setStatus: (fileHash, status) => get().updateTask(fileHash, { status }),
  removeTask: (fileHash) =>
    set((state) => {
      const current = state.tasksByHash[fileHash];
      if (!current) return state;
      const nextHash = { ...state.tasksByHash };
      delete nextHash[fileHash];
      const nextUpload = { ...state.tasksByUploadKey };
      delete nextUpload[current.uploadKey];
      return { tasksByHash: nextHash, tasksByUploadKey: nextUpload };
    }),
  restoreTasks: (tasks) =>
    set(() => ({
      tasksByHash: Object.fromEntries(tasks.map((t) => [t.fileHash, t])),
      tasksByUploadKey: Object.fromEntries(tasks.map((t) => [t.uploadKey, t.fileHash])),
    })),
}));

export function useMediaStoreSync() {
  React.useEffect(() => {
    if (typeof window === "undefined" || !("BroadcastChannel" in window)) return;
    const channel = new BroadcastChannel("bslab-media-gms");
    const unsub = useMediaStore.subscribe((state) => {
      channel.postMessage({ type: "MEDIA_STORE_SYNC", tabId: state.tabId, tasks: Object.values(state.tasksByHash) });
    });
    channel.onmessage = (event) => {
      const msg = event.data as { type?: string; tasks?: MediaTask[]; tabId?: string };
      if (msg.type !== "MEDIA_STORE_SYNC" || msg.tabId === useMediaStore.getState().tabId) return;
      if (Array.isArray(msg.tasks)) useMediaStore.getState().restoreTasks(msg.tasks);
    };
    return () => {
      unsub();
      channel.close();
    };
  }, []);
}
