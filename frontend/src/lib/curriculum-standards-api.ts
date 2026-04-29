"use client";

import type { CurriculumStandardsStore } from "@/types/curriculum-standard";
import type { ApiActor } from "@/lib/new-core-api";
import {
  createStandardRow,
  deleteStandardRow,
  readCurriculumStandardsStore,
  resetCurriculumStandardsToCatalogSeed,
  updateStandardRow,
  updateSubject,
  writeCurriculumStandardsStore,
} from "@/lib/curriculum-standards-storage";
import type { CurriculumStandardRow, CurriculumSubject } from "@/types/curriculum-standard";
import { PRIMARY_SCIENCE_SEED_ROW_COUNT } from "@/data/experiment-teaching-catalog.seed";

function shouldRecoverPrimaryScienceSeed(store: CurriculumStandardsStore): boolean {
  const subject = store.subjects.find((s) => s.name.trim() === "小学科学");
  if (!subject) return true;
  const primaryRows = store.rows.filter((r) => r.subjectId === subject.id && (r.phase ?? "").trim() === "小学");
  return primaryRows.length < PRIMARY_SCIENCE_SEED_ROW_COUNT;
}

export async function fetchCurriculumStandards(_actor: ApiActor): Promise<CurriculumStandardsStore> {
  const local = readCurriculumStandardsStore();
  if (shouldRecoverPrimaryScienceSeed(local)) {
    return resetCurriculumStandardsToCatalogSeed();
  }
  return local;
}

type RowCreateInput = Omit<CurriculumStandardRow, "id" | "updatedAt">;
type RowPatchInput = Partial<RowCreateInput>;

export async function createCurriculumStandardRowApi(
  _actor: ApiActor,
  input: RowCreateInput,
): Promise<CurriculumStandardRow> {
  const store = readCurriculumStandardsStore();
  const nextStore = createStandardRow(store, input);
  writeCurriculumStandardsStore(nextStore);
  const created = nextStore.rows[nextStore.rows.length - 1];
  if (!created) throw new Error("本地创建失败");
  return created;
}

export async function updateCurriculumStandardRowApi(
  _actor: ApiActor,
  id: string,
  patch: RowPatchInput,
): Promise<CurriculumStandardRow> {
  const store = readCurriculumStandardsStore();
  const before = store.rows.find((r) => r.id === id);
  if (!before) throw new Error("本地条目不存在");
  const merged = { ...before, ...patch } as unknown as Omit<CurriculumStandardRow, "id" | "updatedAt">;
  const nextStore = updateStandardRow(store, id, merged);
  writeCurriculumStandardsStore(nextStore);
  const updated = nextStore.rows.find((r) => r.id === id);
  if (!updated) throw new Error("本地更新失败");
  return updated;
}

export async function deleteCurriculumStandardRowApi(_actor: ApiActor, id: string): Promise<{ id: string }> {
  const store = readCurriculumStandardsStore();
  const existed = store.rows.some((r) => r.id === id);
  const nextStore = deleteStandardRow(store, id);
  writeCurriculumStandardsStore(nextStore);
  if (!existed) throw new Error("本地条目不存在");
  return { id };
}

export async function updateCurriculumSubjectApi(
  _actor: ApiActor,
  id: string,
  patch: Partial<Pick<CurriculumSubject, "name" | "description">>,
): Promise<CurriculumSubject> {
  const store = readCurriculumStandardsStore();
  const before = store.subjects.find((s) => s.id === id);
  if (!before) throw new Error("本地学科不存在");
  const nextStore = updateSubject(store, id, {
    name: patch.name ?? before.name,
    description: patch.description ?? before.description,
  });
  writeCurriculumStandardsStore(nextStore);
  const updated = nextStore.subjects.find((s) => s.id === id);
  if (!updated) throw new Error("本地学科更新失败");
  return updated;
}
