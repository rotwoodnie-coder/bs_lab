import { NextRequest } from "next/server";

import { withErrorHandling } from "../../_lib";
import { assertCoursebookExists, getChapterById, insertChapter, mapChapterRow } from "../_lib";
import { normalizeChapterStatusColumn, stringifyCommentsPayload } from "../textbook-ref-baseline-meta";

export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const body = (await request.json()) as Record<string, unknown>;
    const status = normalizeChapterStatusColumn(body.status ?? "y");
    const sort_order = Number(body.sort_order);
    if (!Number.isFinite(sort_order)) throw new Error("sort_order 无效");
    const comments = stringifyCommentsPayload(body.comments);

    const unit_name = body.unit_name != null ? String(body.unit_name).trim() : "";
    if (unit_name !== "") {
      const chapter_id = String(body.chapter_id ?? "").trim();
      if (!chapter_id) throw new Error("节须提供 chapter_id");
      const parent = await getChapterById(chapter_id);
      if (!parent || parent.level !== 1) throw new Error("所属章无效");
      const textbookId = parent.textbook_id;
      if (!(await assertCoursebookExists(textbookId))) throw new Error("教材不存在");
      const id = await insertChapter({
        chapter_id,
        unit_name,
        sort_order,
        status,
        comments,
      });
      const created = await getChapterById(id);
      if (!created) throw new Error("创建失败");
      return { chapter: mapChapterRow(created) };
    }

    const chapter_name = String(body.chapter_name ?? "").trim();
    if (!chapter_name) throw new Error("chapter_name 不能为空");
    const coursebook_id = String(body.coursebook_id ?? "").trim();
    if (!coursebook_id) throw new Error("章须提供 coursebook_id");
    if (!(await assertCoursebookExists(coursebook_id))) throw new Error("教材不存在");
    const id = await insertChapter({
      coursebook_id,
      chapter_name,
      sort_order,
      status,
      comments,
    });
    const created = await getChapterById(id);
    if (!created) throw new Error("创建失败");
    return { chapter: mapChapterRow(created) };
  });
}
