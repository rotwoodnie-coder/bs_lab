"use client";

import type { ApiActor } from "@/lib/new-core-api";
import { callNewCoreApi, getExperimentCatalogTenantId } from "@/lib/new-core-api";

const eduTextbookCatalogHeaders = (): Record<string, string> => ({
  "x-tenant-id": getExperimentCatalogTenantId(),
  "x-app-id": "console",
});

type V2CoursebookRow = { coursebookId: string; coursebookName: string; coursebookVersion: string | null; subjectId: string | null; comments: string | null; status: string | null };
export type CoursebookTreeChapter = { chapterId: string; chapterName: string; coursebookId: string | null; comments: string | null; status: string | null; sortOrder: number | null; units: Array<{ unitId: string; unitName: string; chapterId: string | null; comments: string | null; status: string | null; sortOrder: number | null }> };
type V2CoursebookTreeChapter = CoursebookTreeChapter;
export type EduTextbookListItem = { id: string; title: string; subjectId: string; subjectName: string | null; coursebookVersion: string | null; status: number };
function mapV2CoursebookToListItem(row: V2CoursebookRow): EduTextbookListItem { return { id: row.coursebookId, title: row.coursebookName, subjectId: row.subjectId ?? "", subjectName: null, coursebookVersion: row.coursebookVersion, status: row.status === "n" ? 0 : 1 }; }
export async function fetchEduTextbooks(actor: ApiActor): Promise<EduTextbookListItem[]> { const rows = await callNewCoreApi<V2CoursebookRow[]>(actor, "/v2/coursebook", "GET", undefined, eduTextbookCatalogHeaders()); return rows.map(mapV2CoursebookToListItem); }
export async function fetchEduTextbookTree(actor: ApiActor, textbookId: string): Promise<V2CoursebookTreeChapter[]> { return callNewCoreApi<V2CoursebookTreeChapter[]>(actor, `/v2/coursebook/${encodeURIComponent(textbookId)}/tree`, "GET", undefined, eduTextbookCatalogHeaders()); }
export async function createEduTextbookApi(actor: ApiActor, body: { coursebook_name: string; coursebook_version?: string; subject_id?: string; comments?: string; status?: "y" | "n" }): Promise<{ newId: string; title: string }> { const created = await callNewCoreApi<V2CoursebookRow>(actor, "/v2/coursebook", "POST", body as Record<string, unknown>, eduTextbookCatalogHeaders()); return { newId: created.coursebookId, title: created.coursebookName }; }
export async function updateEduTextbookApi(actor: ApiActor, textbookId: string, body: { coursebook_name?: string; coursebook_version?: string | null; subject_id?: string | null; comments?: string | null; status?: string | null }): Promise<{ newId: string; title: string }> { const created = await callNewCoreApi<V2CoursebookRow>(actor, `/v2/coursebook/${encodeURIComponent(textbookId)}`, "PATCH", body as Record<string, unknown>, eduTextbookCatalogHeaders()); return { newId: created.coursebookId, title: created.coursebookName }; }
export async function deleteEduTextbookApi(actor: ApiActor, textbookId: string): Promise<void> { await callNewCoreApi<{ deleted: boolean }>(actor, `/v2/coursebook/${encodeURIComponent(textbookId)}`, "DELETE", undefined, eduTextbookCatalogHeaders()); }
export async function createEduTextbookChapterApi(actor: ApiActor, body: { chapter_name: string; coursebook_id: string; comments?: string; sort_order?: number }): Promise<unknown> { return callNewCoreApi(actor, "/v2/coursebook/chapter", "POST", body as Record<string, unknown>, eduTextbookCatalogHeaders()); }
export async function updateEduTextbookChapterApi(actor: ApiActor, chapterId: string, body: { chapter_name?: string; comments?: string | null; sort_order?: number; status?: string | null }): Promise<unknown> { return callNewCoreApi(actor, `/v2/coursebook/chapter/${encodeURIComponent(chapterId)}`, "PATCH", body as Record<string, unknown>, eduTextbookCatalogHeaders()); }
export async function deleteEduTextbookChapterApi(actor: ApiActor, chapterId: string): Promise<void> { await callNewCoreApi(actor, `/v2/coursebook/chapter/${encodeURIComponent(chapterId)}`, "DELETE", undefined, eduTextbookCatalogHeaders()); }
export async function createEduTextbookUnitApi(actor: ApiActor, body: { unit_name: string; chapter_id: string; comments?: string; sort_order?: number }): Promise<unknown> { return callNewCoreApi(actor, "/v2/coursebook/unit", "POST", body as Record<string, unknown>, eduTextbookCatalogHeaders()); }
export async function updateEduTextbookUnitApi(actor: ApiActor, unitId: string, body: { unit_name?: string; comments?: string | null; sort_order?: number; status?: string | null }): Promise<unknown> { return callNewCoreApi(actor, `/v2/coursebook/unit/${encodeURIComponent(unitId)}`, "PATCH", body as Record<string, unknown>, eduTextbookCatalogHeaders()); }
export async function deleteEduTextbookUnitApi(actor: ApiActor, unitId: string): Promise<void> { await callNewCoreApi(actor, `/v2/coursebook/unit/${encodeURIComponent(unitId)}`, "DELETE", undefined, eduTextbookCatalogHeaders()); }
export async function duplicateEduTextbookApi(actor: ApiActor, textbookId: string): Promise<{ newId: string; title: string }> { const rows = await callNewCoreApi<V2CoursebookRow[]>(actor, "/v2/coursebook", "GET", undefined, eduTextbookCatalogHeaders()); const src = rows.find((r) => r.coursebookId === textbookId); if (!src) throw new Error("未找到该教材"); const created = await callNewCoreApi<V2CoursebookRow>(actor, "/v2/coursebook", "POST", { coursebook_name: `${src.coursebookName}（副本）`, coursebook_version: src.coursebookVersion ?? undefined, comments: src.comments ?? undefined, status: "y" } as Record<string, unknown>, eduTextbookCatalogHeaders()); return { newId: created.coursebookId, title: created.coursebookName }; }

export type CoursebookEnriched = V2CoursebookRow & { subjectName: string | null; chapterCount: number; expCount: number };
export async function fetchCoursebooksEnriched(actor: ApiActor, keyword?: string): Promise<CoursebookEnriched[]> {
  const qs = keyword?.trim() ? `?keyword=${encodeURIComponent(keyword.trim())}` : "";
  return callNewCoreApi<CoursebookEnriched[]>(actor, `/v2/coursebook/enriched${qs}`, "GET", undefined, eduTextbookCatalogHeaders());
}

export type ExpMsgRow = { expId: string; expName: string; status: string | null; unitId: string | null; coursebookId: string | null; subjectName?: string | null; unitName?: string | null; chapterName?: string | null };
type ExpListPage = { items: ExpMsgRow[]; total: number; page: number; pageSize: number };
const expApiHeaders = (): Record<string, string> => ({ "x-tenant-id": getExperimentCatalogTenantId(), "x-app-id": "console" });

/** 获取挂载到指定章节（chapter_id）的实验列表 */
export async function fetchExpsByChapter(actor: ApiActor, chapterId: string): Promise<ExpMsgRow[]> {
  // 后端校验：pageSize ≤ 100
  const res = await callNewCoreApi<ExpListPage>(actor, `/v2/exp?chapterId=${encodeURIComponent(chapterId)}&pageSize=100`, "GET", undefined, expApiHeaders());
  return res.items;
}

/** 搜索全局实验库（status=y，支持关键字分页） */
export async function fetchAllPublishedExps(actor: ApiActor, keyword?: string, page = 1): Promise<ExpListPage> {
  const qs = new URLSearchParams({ status: "y", pageSize: "50", page: String(page) });
  if (keyword?.trim()) qs.set("keyword", keyword.trim());
  return callNewCoreApi<ExpListPage>(actor, `/v2/exp?${qs.toString()}`, "GET", undefined, expApiHeaders());
}

/** 将实验挂载到小节（unitId=null 时解除绑定） */
export async function bindExpToUnitApi(actor: ApiActor, expId: string, unitId: string | null, coursebookId: string | null): Promise<void> {
  await callNewCoreApi(actor, `/v2/exp/${encodeURIComponent(expId)}/binding`, "PATCH", { unit_id: unitId, coursebook_id: coursebookId } as Record<string, unknown>, expApiHeaders());
}
