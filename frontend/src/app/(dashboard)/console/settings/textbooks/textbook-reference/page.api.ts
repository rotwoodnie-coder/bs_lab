import type { TextbookRefBook, TextbookRefChapter } from "./page.types";

async function parseJson<T>(res: Response): Promise<T> {
  const data = (await res.json()) as { message?: string } & T;
  if (!res.ok) throw new Error(typeof data.message === "string" ? data.message : "请求失败");
  return data as T;
}

/** POST/PATCH 体须与目标表列名及 comments 内 JSON 键（snake_case）一致；此处由 UI 参数映射为规范 payload。 */
function chapterCommentsFromUi(description: string | null, imageRegistryId: string | null): Record<string, unknown> | null {
  const _ch: Record<string, unknown> = {};
  if (description && description.trim()) _ch.description = description.trim();
  if (imageRegistryId?.trim()) {
    const n = Number(imageRegistryId.trim());
    if (Number.isFinite(n) && n > 0) _ch.image_registry_id = n;
  }
  if (Object.keys(_ch).length === 0) return null;
  return { _ch };
}

export async function fetchBooks(subjectId: string, gradeId?: string): Promise<TextbookRefBook[]> {
  const q = new URLSearchParams({ subjectId });
  if (gradeId) q.set("gradeId", gradeId);
  const res = await fetch(`/api/edu/textbook-ref/books?${q.toString()}`, {
    cache: "no-store",
  });
  const data = await parseJson<{ books: TextbookRefBook[] }>(res);
  return data.books ?? [];
}

export async function createBook(body: {
  subjectId: string;
  gradeId?: string | null;
  title: string;
  coursebookVersion?: string | null;
  coverRegistryId?: string | null;
  status?: 0 | 1;
}): Promise<string> {
  const coverRaw = body.coverRegistryId;
  const cover_registry_id =
    coverRaw == null || coverRaw === ""
      ? null
      : (() => {
          const n = Number(coverRaw);
          if (!Number.isFinite(n) || n <= 0) throw new Error("封面登记 id 无效");
          return n;
        })();
  const verRaw = body.coursebookVersion;
  const coursebook_version =
    verRaw == null || String(verRaw).trim() === "" ? null : String(verRaw).trim();
  const payload = {
    coursebook_name: body.title.trim(),
    coursebook_version,
    status: body.status === 0 ? "n" : "y",
    comments: {
      _ref: {
        subject_id: body.subjectId,
        grade_id: body.gradeId ?? null,
        cover_registry_id,
      },
    },
  };
  const res = await fetch("/api/edu/textbook-ref/books", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await parseJson<{ id: string }>(res);
  return data.id;
}

export async function patchBook(
  bookId: string,
  body: {
    title?: string;
    coursebookVersion?: string | null;
    gradeId?: string | null;
    coverRegistryId?: string | null;
    status?: 0 | 1;
    sortOrder?: number;
  },
): Promise<TextbookRefBook> {
  const payload: Record<string, unknown> = {};
  if (body.title !== undefined) payload.coursebook_name = body.title.trim();
  if (body.coursebookVersion !== undefined) {
    payload.coursebook_version =
      body.coursebookVersion == null || String(body.coursebookVersion).trim() === ""
        ? null
        : String(body.coursebookVersion).trim();
  }
  if (body.status !== undefined) payload.status = body.status === 0 ? "n" : "y";
  const ref: Record<string, unknown> = {};
  if (body.gradeId !== undefined) ref.grade_id = body.gradeId;
  if (body.coverRegistryId !== undefined) {
    if (body.coverRegistryId == null || body.coverRegistryId === "") ref.cover_registry_id = null;
    else {
      const n = Number(body.coverRegistryId);
      if (!Number.isFinite(n) || n <= 0) throw new Error("封面登记 id 无效");
      ref.cover_registry_id = n;
    }
  }
  if (body.sortOrder !== undefined) {
    if (!Number.isFinite(body.sortOrder)) throw new Error("排序值无效");
    ref.sort_order = body.sortOrder;
  }
  if (Object.keys(ref).length > 0) payload.comments = { _ref: ref };
  const res = await fetch(`/api/edu/textbook-ref/books/${encodeURIComponent(bookId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await parseJson<{ book: TextbookRefBook }>(res);
  return data.book;
}

export async function fetchChapters(bookId: string): Promise<TextbookRefChapter[]> {
  const res = await fetch(`/api/edu/textbook-ref/books/${encodeURIComponent(bookId)}/chapters`, {
    cache: "no-store",
  });
  const data = await parseJson<{ chapters: TextbookRefChapter[] }>(res);
  return data.chapters ?? [];
}

export async function createChapter(body: {
  textbookId: string;
  parentId?: string | null;
  level: 1 | 2;
  title: string;
  sortOrder?: number;
  description?: string | null;
  imageRegistryId?: string | null;
}): Promise<TextbookRefChapter> {
  const sort_order = typeof body.sortOrder === "number" && Number.isFinite(body.sortOrder) ? body.sortOrder : 0;
  const comments = chapterCommentsFromUi(body.description ?? null, body.imageRegistryId ?? null);
  const base = { sort_order, status: "y", ...(comments ? { comments } : {}) };
  const payload =
    body.level === 2
      ? {
          chapter_id: String(body.parentId ?? "").trim(),
          unit_name: body.title.trim(),
          ...base,
        }
      : {
          coursebook_id: body.textbookId,
          chapter_name: body.title.trim(),
          ...base,
        };
  const res = await fetch("/api/edu/textbook-ref/chapters", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await parseJson<{ chapter: TextbookRefChapter }>(res);
  return data.chapter;
}

export async function patchChapter(
  chapterId: string,
  body: {
    level: 1 | 2;
    title?: string;
    description?: string | null;
    imageRegistryId?: string | null;
    sortOrder?: number;
  },
): Promise<TextbookRefChapter> {
  const payload: Record<string, unknown> = {};
  if (body.title !== undefined) {
    if (body.level === 1) payload.chapter_name = body.title.trim();
    else payload.unit_name = body.title.trim();
  }
  if (body.sortOrder !== undefined) {
    if (!Number.isFinite(body.sortOrder)) throw new Error("排序值无效");
    payload.sort_order = body.sortOrder;
  }
  const ch: Record<string, unknown> = {};
  if (body.description !== undefined) {
    const d = body.description == null ? null : String(body.description).trim();
    ch.description = d && d.length > 0 ? d : null;
  }
  if (body.imageRegistryId !== undefined) {
    if (body.imageRegistryId == null || body.imageRegistryId === "") ch.image_registry_id = null;
    else {
      const n = Number(body.imageRegistryId);
      if (!Number.isFinite(n) || n <= 0) throw new Error("配图登记 id 无效");
      ch.image_registry_id = n;
    }
  }
  if (Object.keys(ch).length > 0) payload.comments = { _ch: ch };
  const res = await fetch(`/api/edu/textbook-ref/chapters/${encodeURIComponent(chapterId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await parseJson<{ chapter: TextbookRefChapter }>(res);
  return data.chapter;
}

export async function deleteChapter(chapterId: string): Promise<void> {
  const res = await fetch(`/api/edu/textbook-ref/chapters/${encodeURIComponent(chapterId)}`, {
    method: "DELETE",
  });
  await parseJson<{ ok: boolean }>(res);
}
