import type { TeacherMaterialKind } from "@/lib/teacher-materials-api";

import { TEACHER_MATERIALS_DEFAULT_CREATE_KIND } from "./teacher-materials-ui.config";

export type UploadState = { status: "pending" | "uploading" | "success" | "failed"; progress: number; message?: string };
export type RecoveredUploadEntry = {
  key: string;
  name: string;
  size: number;
  type: string;
  lastModified: number;
  state: UploadState;
};
export type PersistedUploadSnapshot = {
  version: 2;
  title: string;
  kind: TeacherMaterialKind;
  experimentId: string | null;
  linkedExperimentTitle: string | null;
  entries: RecoveredUploadEntry[];
  updatedAt: number;
};

export function readUploadSnapshot(storageKey: string): PersistedUploadSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(storageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (parsed?.version === 2 && Array.isArray(parsed.entries)) {
      return parsed as unknown as PersistedUploadSnapshot;
    }
    if (parsed?.version === 1 && Array.isArray(parsed.entries)) {
      return {
        version: 2,
        title: String(parsed.title ?? ""),
        kind: (parsed.kind as TeacherMaterialKind) ?? TEACHER_MATERIALS_DEFAULT_CREATE_KIND,
        experimentId: (parsed.experimentId as string | null) ?? null,
        linkedExperimentTitle: (parsed.linkedExperimentTitle as string | null) ?? null,
        entries: parsed.entries as RecoveredUploadEntry[],
        updatedAt: typeof parsed.updatedAt === "number" ? parsed.updatedAt : Date.now(),
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function writeUploadSnapshot(storageKey: string, snapshot: PersistedUploadSnapshot) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(storageKey, JSON.stringify(snapshot));
  } catch {
    /* ignore */
  }
}

export function clearUploadSnapshot(storageKey: string) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(storageKey);
  } catch {
    /* ignore */
  }
}
