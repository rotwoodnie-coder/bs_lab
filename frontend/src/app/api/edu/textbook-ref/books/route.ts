import { NextRequest } from "next/server";

import { withErrorHandling } from "../../_lib";
import { insertBook, listBooksForRef, mapBookRow, nextBookSortOrder } from "../_lib";
import { normalizeCoursebookStatusColumn } from "../textbook-ref-baseline-meta";
import { resolveRefGradeIdFromClient, resolveRefSubjectIdFromClient } from "../textbook-ref-id-resolve";

export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    const subjectIdRaw = request.nextUrl.searchParams.get("subjectId");
    if (subjectIdRaw == null || subjectIdRaw.trim() === "") throw new Error("缺少有效的 subjectId");
    const subjectId = await resolveRefSubjectIdFromClient(subjectIdRaw);
    const gradeRaw = request.nextUrl.searchParams.get("gradeId");
    const gradeFilter =
      gradeRaw != null && gradeRaw !== "" ? await resolveRefGradeIdFromClient(gradeRaw) : null;
    const rows = await listBooksForRef(subjectId, gradeFilter);
    return { books: rows.map(mapBookRow) };
  });
}

export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const body = (await request.json()) as {
      coursebook_name?: unknown;
      coursebook_version?: unknown;
      status?: unknown;
      comments?: unknown;
    };
    const coursebook_name = String(body.coursebook_name ?? "").trim();
    if (!coursebook_name) throw new Error("coursebook_name 不能为空");
    const coursebook_version =
      body.coursebook_version == null || body.coursebook_version === ""
        ? null
        : String(body.coursebook_version);
    const status = normalizeCoursebookStatusColumn(body.status ?? "y");
    const comments = body.comments;
    if (comments == null || typeof comments !== "object" || Array.isArray(comments)) {
      throw new Error("缺少 comments 对象（须含 _ref.subject_id 等，键名与持久化 JSON 一致）");
    }
    const refObj = (comments as { _ref?: unknown })._ref;
    if (refObj == null || typeof refObj !== "object" || Array.isArray(refObj)) {
      throw new Error("comments._ref 须为对象");
    }
    const r = refObj as Record<string, unknown>;
    const subject_id = await resolveRefSubjectIdFromClient(r.subject_id);
    const gradeRaw = r.grade_id;
    const grade_id =
      gradeRaw != null && gradeRaw !== "" ? await resolveRefGradeIdFromClient(gradeRaw) : null;
    const cr = r.cover_registry_id;
    let cover_registry_id: number | null = null;
    if (cr != null && cr !== "") {
      const n = Number(cr);
      if (!Number.isFinite(n) || n <= 0) throw new Error("cover_registry_id 无效");
      cover_registry_id = n;
    }
    const soRaw = r.sort_order;
    const sort_order =
      typeof soRaw === "number" && Number.isFinite(soRaw)
        ? soRaw
        : typeof soRaw === "string" && soRaw.trim() !== ""
          ? Number(soRaw)
          : await nextBookSortOrder(subject_id);
    if (!Number.isFinite(sort_order)) throw new Error("sort_order 无效");
    const id = await insertBook({
      coursebook_name,
      coursebook_version,
      status,
      ref: {
        subject_id,
        grade_id,
        cover_registry_id,
        sort_order,
      },
    });
    return { id };
  });
}
