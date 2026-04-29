import { NextRequest } from "next/server";

import { withErrorHandling } from "../../../../_lib";
import { assertCoursebookExists, listChaptersByBook, mapChapterRow } from "../../../_lib";

export async function GET(_request: NextRequest, context: { params: Promise<{ bookId: string }> }) {
  return withErrorHandling(async () => {
    const { bookId: bookIdStr } = await context.params;
    const bookId = (bookIdStr ?? "").trim();
    if (!bookId) throw new Error("教材 id 无效");
    if (!(await assertCoursebookExists(bookId))) throw new Error("教材不存在");
    const rows = await listChaptersByBook(bookId);
    return { chapters: rows.map(mapChapterRow) };
  });
}
