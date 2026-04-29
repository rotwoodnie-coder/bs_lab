import { NextRequest } from "next/server";

import { withErrorHandling } from "../../../_lib";
import { getRefBookById, mapBookRow, updateBook } from "../../_lib";
import type { CoursebookRefMeta } from "../../textbook-ref-baseline-meta";
import { normalizeCoursebookStatusColumn } from "../../textbook-ref-baseline-meta";
import { resolveRefGradeIdFromClient } from "../../textbook-ref-id-resolve";

export async function PATCH(request: NextRequest, context: { params: Promise<{ bookId: string }> }) {
  return withErrorHandling(async () => {
    const { bookId: bookIdStr } = await context.params;
    const bookId = (bookIdStr ?? "").trim();
    if (!bookId) throw new Error("教材 id 无效");
    const body = (await request.json()) as {
      coursebook_name?: unknown;
      coursebook_version?: unknown;
      status?: unknown;
      comments?: unknown;
    };
    if (!(await getRefBookById(bookId))) throw new Error("教材不存在");
    const patch: Parameters<typeof updateBook>[1] = {};
    if (body.coursebook_name !== undefined) {
      const t = String(body.coursebook_name).trim();
      if (!t) throw new Error("coursebook_name 不能为空");
      patch.coursebook_name = t;
    }
    if (body.coursebook_version !== undefined) {
      patch.coursebook_version =
        body.coursebook_version == null || body.coursebook_version === ""
          ? null
          : String(body.coursebook_version);
    }
    if (body.status !== undefined) {
      patch.status = normalizeCoursebookStatusColumn(body.status);
    }
    if (body.comments !== undefined) {
      if (typeof body.comments !== "object" || body.comments === null || Array.isArray(body.comments)) {
        throw new Error("comments 须为对象");
      }
      const c = body.comments as { _ref?: Record<string, unknown> };
      if (c._ref == null || typeof c._ref !== "object" || Array.isArray(c._ref)) {
        throw new Error("comments._ref 须为对象");
      }
      const src = c._ref;
      const partial: Partial<CoursebookRefMeta> = {};
      if (src.grade_id !== undefined) {
        const g = src.grade_id;
        partial.grade_id = g == null || g === "" ? null : await resolveRefGradeIdFromClient(g);
      }
      if (src.cover_registry_id !== undefined) {
        const cr = src.cover_registry_id;
        if (cr == null || cr === "") partial.cover_registry_id = null;
        else {
          const n = Number(cr);
          if (!Number.isFinite(n) || n <= 0) throw new Error("cover_registry_id 无效");
          partial.cover_registry_id = n;
        }
      }
      if (src.sort_order !== undefined) {
        const so = src.sort_order;
        const n = Number(so);
        if (!Number.isFinite(n)) throw new Error("sort_order 无效");
        partial.sort_order = n;
      }
      if (Object.keys(partial).length === 0) throw new Error("comments._ref 须至少包含 grade_id、cover_registry_id、sort_order 之一");
      patch.comments = { _ref: partial };
    }
    await updateBook(bookId, patch);
    const next = await getRefBookById(bookId);
    if (!next) throw new Error("教材不存在");
    return { book: mapBookRow(next) };
  });
}
