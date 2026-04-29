import { NextRequest } from "next/server";

import { withErrorHandling } from "../../../_lib";
import { deleteChapter, getChapterById, mapChapterRow, updateChapter } from "../../_lib";
import { normalizeChapterStatusColumn } from "../../textbook-ref-baseline-meta";
import type { ChapterSideMeta } from "../../textbook-ref-baseline-meta";

export async function PATCH(request: NextRequest, context: { params: Promise<{ chapterId: string }> }) {
  return withErrorHandling(async () => {
    const { chapterId: idStr } = await context.params;
    const chapterId = (idStr ?? "").trim();
    if (!chapterId) throw new Error("章节 id 无效");
    const existing = await getChapterById(chapterId);
    if (!existing) throw new Error("章节不存在");
    const body = (await request.json()) as Record<string, unknown>;
    const patch: Parameters<typeof updateChapter>[1] = { bumpVersion: false };

    if (body.chapter_name !== undefined && existing.level !== 1) {
      throw new Error("节标题请使用 unit_name");
    }
    if (body.unit_name !== undefined && existing.level === 1) {
      throw new Error("章标题请使用 chapter_name");
    }
    if (existing.level === 1) {
      if (body.chapter_name !== undefined) {
        const t = String(body.chapter_name).trim();
        if (!t) throw new Error("chapter_name 不能为空");
        patch.chapter_name = t;
        patch.bumpVersion = true;
      }
    } else if (body.unit_name !== undefined) {
      const t = String(body.unit_name).trim();
      if (!t) throw new Error("unit_name 不能为空");
      patch.unit_name = t;
      patch.bumpVersion = true;
    }

    if (body.sort_order !== undefined) {
      const so = body.sort_order;
      const n = Number(so);
      if (!Number.isFinite(n)) throw new Error("sort_order 无效");
      patch.sort_order = n;
    }
    if (body.status !== undefined) {
      patch.status = normalizeChapterStatusColumn(body.status);
    }

    const rawComments = body.comments;
    if (rawComments !== undefined) {
      if (typeof rawComments !== "object" || rawComments === null || Array.isArray(rawComments)) {
        throw new Error("comments 须为对象");
      }
      const c = rawComments as { _ch?: Record<string, unknown> };
      if (c._ch != null && typeof c._ch === "object" && !Array.isArray(c._ch)) {
        const s = c._ch;
        const partial: Partial<ChapterSideMeta> = {};
        if (s.description !== undefined) {
          const d = s.description == null ? null : String(s.description).trim();
          partial.description = d && d.length > 0 ? d : null;
        }
        if (s.image_registry_id !== undefined) {
          const img = s.image_registry_id;
          if (img == null || img === "") partial.image_registry_id = null;
          else {
            const n = Number(img);
            if (!Number.isFinite(n) || n <= 0) throw new Error("image_registry_id 无效");
            partial.image_registry_id = n;
          }
        }
        if (Object.keys(partial).length > 0) {
          patch.comments = { _ch: partial };
          patch.bumpVersion = true;
        }
      }
    }

    await updateChapter(chapterId, patch);
    const next = await getChapterById(chapterId);
    if (!next) throw new Error("章节不存在");
    return { chapter: mapChapterRow(next) };
  });
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ chapterId: string }> }) {
  return withErrorHandling(async () => {
    const { chapterId: idStr } = await context.params;
    const chapterId = (idStr ?? "").trim();
    if (!chapterId) throw new Error("章节 id 无效");
    const existing = await getChapterById(chapterId);
    if (!existing) throw new Error("章节不存在");
    await deleteChapter(chapterId);
    return { ok: true };
  });
}
