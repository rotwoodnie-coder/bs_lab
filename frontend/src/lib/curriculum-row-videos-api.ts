"use client";

import type { ApiActor } from "@/lib/new-core-api";

export type CurriculumRowVideo = {
  id: string;
  orgId: string;
  rowId: string;
  title: string;
  sourceType: "upload";
  sourceUrl: string;
  sortIndex: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  createdByName: string;
  updatedBy: string;
  updatedByName: string;
  deletedAt: string | null;
};

let inMemoryRows: CurriculumRowVideo[] = [];

function nowIso(): string {
  return new Date().toISOString();
}

function newId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function readLocalStore(): CurriculumRowVideo[] {
  return inMemoryRows
    .map((row) => row as CurriculumRowVideo & { sourceType?: string })
    .filter((v) => v && v.sourceType === "upload" && !v.deletedAt);
}

function writeLocalStore(rows: CurriculumRowVideo[]): void {
  inMemoryRows = [...rows];
}

function normalizeVideoList(rows: CurriculumRowVideo[]): CurriculumRowVideo[] {
  return rows.filter((v) => v.sourceType === "upload");
}

export async function listCurriculumRowVideos(actor: ApiActor, rowId: string): Promise<CurriculumRowVideo[]> {
  return normalizeVideoList(
    readLocalStore()
      .filter((v) => v.orgId === actor.orgId && v.rowId === rowId && v.deletedAt === null)
      .sort((a, b) => a.sortIndex - b.sortIndex),
  );
}

export async function createCurriculumRowVideoApi(
  actor: ApiActor,
  rowId: string,
  input: { title?: string; sourceUrl: string },
): Promise<CurriculumRowVideo> {
  const all = readLocalStore();
  const siblings = all.filter((v) => v.orgId === actor.orgId && v.rowId === rowId && v.deletedAt === null);
  const created: CurriculumRowVideo = {
    id: newId("row-video"),
    orgId: actor.orgId,
    rowId,
    title: (input.title ?? "").trim() || "未命名视频",
    sourceType: "upload",
    sourceUrl: input.sourceUrl.trim(),
    sortIndex: siblings.length,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    createdBy: actor.userId,
    createdByName: actor.userName,
    updatedBy: actor.userId,
    updatedByName: actor.userName,
    deletedAt: null,
  };
  writeLocalStore([...all, created]);
  return created;
}

export async function updateCurriculumRowVideoApi(
  actor: ApiActor,
  rowId: string,
  videoId: string,
  patch: { title?: string; sourceUrl?: string },
): Promise<CurriculumRowVideo> {
  const all = readLocalStore();
  const idx = all.findIndex((v) => v.orgId === actor.orgId && v.rowId === rowId && v.id === videoId && v.deletedAt === null);
  if (idx < 0) throw new Error("视频不存在");
  const current = all[idx]!;
  const next: CurriculumRowVideo = { ...current };
  if (typeof patch.title === "string") next.title = patch.title.trim() || "未命名视频";
  if (typeof patch.sourceUrl === "string") next.sourceUrl = patch.sourceUrl.trim();
  next.updatedAt = nowIso();
  next.updatedBy = actor.userId;
  next.updatedByName = actor.userName;
  all[idx] = next;
  writeLocalStore(all);
  return next;
}

export async function deleteCurriculumRowVideoApi(
  actor: ApiActor,
  rowId: string,
  videoId: string,
): Promise<{ id: string }> {
  const all = readLocalStore();
  const idx = all.findIndex((v) => v.orgId === actor.orgId && v.rowId === rowId && v.id === videoId && v.deletedAt === null);
  if (idx < 0) throw new Error("视频不存在");
  all[idx] = {
    ...all[idx]!,
    deletedAt: nowIso(),
    updatedAt: nowIso(),
    updatedBy: actor.userId,
    updatedByName: actor.userName,
  };
  writeLocalStore(all);
  return { id: videoId };
}

export async function reorderCurriculumRowVideosApi(
  actor: ApiActor,
  rowId: string,
  idsInOrder: string[],
): Promise<CurriculumRowVideo[]> {
  const all = readLocalStore();
  const rows = all.filter((v) => v.orgId === actor.orgId && v.rowId === rowId && v.deletedAt === null);
  const rowMap = new Map(rows.map((r) => [r.id, r]));
  if (idsInOrder.length !== rows.length || idsInOrder.some((id) => !rowMap.has(id))) {
    throw new Error("排序数据不完整");
  }
  const t = nowIso();
  for (let i = 0; i < idsInOrder.length; i += 1) {
    const id = idsInOrder[i]!;
    const item = rowMap.get(id)!;
    item.sortIndex = i;
    item.updatedAt = t;
    item.updatedBy = actor.userId;
    item.updatedByName = actor.userName;
  }
  writeLocalStore(all);
  return rows.sort((a, b) => a.sortIndex - b.sortIndex);
}
