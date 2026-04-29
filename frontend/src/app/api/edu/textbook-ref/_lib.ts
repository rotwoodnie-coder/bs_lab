export {
  assertCoursebookExists,
  getRefBookById,
  insertBook,
  listBooksForRef,
  nextBookSortOrder,
  updateBook,
} from "./textbook-ref-baseline-books";
export {
  deleteChapter,
  getChapterById,
  insertChapter,
  listChaptersByBook,
  updateChapter,
} from "./textbook-ref-baseline-chapters";
export type { TextbookRefBookRow, TextbookRefChapterRow } from "./textbook-ref-types";

import type { TextbookRefBookRow, TextbookRefChapterRow } from "./textbook-ref-types";

function asId(n: number | string): string {
  return typeof n === "string" ? n : String(n);
}

export function mapBookRow(r: TextbookRefBookRow) {
  return {
    id: asId(r.id),
    subjectId: String(r.subject_id),
    gradeId: r.grade_id != null && r.grade_id !== undefined ? String(r.grade_id) : null,
    title: r.title,
    coursebookVersion: r.coursebook_version != null && String(r.coursebook_version).trim() !== "" ? String(r.coursebook_version) : null,
    coverRegistryId: r.cover_registry_id != null ? asId(r.cover_registry_id) : null,
    status: r.status as 0 | 1,
    sortOrder: r.sort_order,
    createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
    updatedAt: r.updated_at instanceof Date ? r.updated_at.toISOString() : String(r.updated_at),
  };
}

export function mapChapterRow(r: TextbookRefChapterRow) {
  return {
    id: asId(r.id),
    textbookId: asId(r.textbook_id),
    parentId: r.parent_id != null ? asId(r.parent_id) : null,
    level: r.level as 1 | 2,
    sortOrder: r.sort_order,
    title: r.title,
    description: r.description,
    imageRegistryId: r.image_registry_id != null ? asId(r.image_registry_id) : null,
    rowVersion: r.row_version,
    createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
    updatedAt: r.updated_at instanceof Date ? r.updated_at.toISOString() : String(r.updated_at),
  };
}
