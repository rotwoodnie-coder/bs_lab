import { randomUUID } from "node:crypto";
import type { ResultSetHeader } from "mysql2";

import { getDbPool } from "@/lib/server/mysql";

import {
  mergeChapterComments,
  parseChapterSide,
  stringifyCommentsPayload,
} from "./textbook-ref-baseline-meta";
import type { ChapterSideMeta } from "./textbook-ref-baseline-meta";
import type { TextbookRefChapterRow } from "./textbook-ref-types";

function newId32(): string {
  return randomUUID().replace(/-/g, "");
}

const placeholder = "1970-01-01T00:00:00.000Z";

function chapterDbToView(
  r: {
    chapter_id: string;
    chapter_name: string;
    coursebook_id: string | null;
    comments: string | null;
    status: string | null;
    sort_order: number | null;
  },
  textbookId: string,
): TextbookRefChapterRow {
  const side = parseChapterSide(r.comments);
  return {
    id: r.chapter_id,
    textbook_id: textbookId,
    parent_id: null,
    level: 1,
    sort_order: r.sort_order ?? 0,
    title: r.chapter_name,
    description: side.description ?? null,
    image_registry_id: side.image_registry_id ?? null,
    row_version: side.row_version ?? 1,
    created_at: placeholder,
    updated_at: placeholder,
  };
}

function unitDbToView(
  u: {
    unit_id: string;
    unit_name: string;
    chapter_id: string | null;
    comments: string | null;
    status: string | null;
    sort_order: number | null;
  },
  textbookId: string,
  parentChapterId: string,
): TextbookRefChapterRow {
  const side = parseChapterSide(u.comments);
  return {
    id: u.unit_id,
    textbook_id: textbookId,
    parent_id: parentChapterId,
    level: 2,
    sort_order: u.sort_order ?? 0,
    title: u.unit_name,
    description: side.description ?? null,
    image_registry_id: side.image_registry_id ?? null,
    row_version: side.row_version ?? 1,
    created_at: placeholder,
    updated_at: placeholder,
  };
}

export async function listChaptersByBook(coursebookId: string): Promise<TextbookRefChapterRow[]> {
  const pool = getDbPool();
  const [chRows] = await pool.query(
    `SELECT chapter_id, chapter_name, coursebook_id, comments, status, sort_order
     FROM data_coursebook_chapter
     WHERE coursebook_id = ? AND (COALESCE(LOWER(TRIM(status)), 'y') <> 'n')
     ORDER BY sort_order ASC, chapter_id ASC`,
    [coursebookId],
  );
  const chapters = chRows as {
    chapter_id: string;
    chapter_name: string;
    coursebook_id: string | null;
    comments: string | null;
    status: string | null;
    sort_order: number | null;
  }[];
  const out: TextbookRefChapterRow[] = [];
  for (const ch of chapters) {
    const tid = ch.coursebook_id ?? coursebookId;
    out.push(chapterDbToView(ch, tid));
    const [uRows] = await pool.query(
      `SELECT unit_id, unit_name, chapter_id, comments, status, sort_order
       FROM data_coursebook_unit
       WHERE chapter_id = ? AND (COALESCE(LOWER(TRIM(status)), 'y') <> 'n')
       ORDER BY sort_order ASC, unit_id ASC`,
      [ch.chapter_id],
    );
    const units = uRows as {
      unit_id: string;
      unit_name: string;
      chapter_id: string | null;
      comments: string | null;
      status: string | null;
      sort_order: number | null;
    }[];
    for (const u of units) {
      out.push(unitDbToView(u, tid, ch.chapter_id));
    }
  }
  return out;
}

export async function getChapterById(id: string): Promise<TextbookRefChapterRow | null> {
  const pool = getDbPool();
  const [chRows] = await pool.query(
    `SELECT chapter_id, chapter_name, coursebook_id, comments, status, sort_order
     FROM data_coursebook_chapter WHERE chapter_id = ? LIMIT 1`,
    [id],
  );
  type ChRow = {
    chapter_id: string;
    chapter_name: string;
    coursebook_id: string | null;
    comments: string | null;
    status: string | null;
    sort_order: number | null;
  };
  const ch = (chRows as ChRow[])[0];
  if (ch) {
    const tid = ch.coursebook_id ?? "";
    return chapterDbToView(ch, tid);
  }
  type UnitJoinRow = {
    unit_id: string;
    unit_name: string;
    chapter_id: string | null;
    comments: string | null;
    status: string | null;
    sort_order: number | null;
    coursebook_id: string;
  };
  const [uRows] = await pool.query(
    `SELECT u.unit_id, u.unit_name, u.chapter_id, u.comments, u.status, u.sort_order, c.coursebook_id
     FROM data_coursebook_unit u
     INNER JOIN data_coursebook_chapter c ON c.chapter_id = u.chapter_id
     WHERE u.unit_id = ? LIMIT 1`,
    [id],
  );
  const u = (uRows as UnitJoinRow[])[0];
  if (!u || !u.chapter_id) return null;
  return unitDbToView(u, u.coursebook_id, u.chapter_id);
}

type InsertChapterRow = {
  coursebook_id: string;
  chapter_name: string;
  sort_order: number;
  status: "y" | "n";
  comments: string | null;
};

type InsertUnitRow = {
  chapter_id: string;
  unit_name: string;
  sort_order: number;
  status: "y" | "n";
  comments: string | null;
};

export async function insertChapter(input: InsertChapterRow | InsertUnitRow): Promise<string> {
  const pool = getDbPool();
  const id = newId32();
  const maybeUnit = input as InsertUnitRow;
  if ("unit_name" in input && maybeUnit.unit_name != null && String(maybeUnit.unit_name).trim() !== "") {
    const row = input as InsertUnitRow;
    await pool.query<ResultSetHeader>(
      `INSERT INTO data_coursebook_unit (unit_id, unit_name, chapter_id, comments, status, sort_order)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, String(row.unit_name).trim(), row.chapter_id, row.comments, row.status, row.sort_order],
    );
    return id;
  }
  const row = input as InsertChapterRow;
  await pool.query<ResultSetHeader>(
    `INSERT INTO data_coursebook_chapter (chapter_id, chapter_name, coursebook_id, comments, status, sort_order)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, row.chapter_name.trim(), row.coursebook_id, row.comments, row.status, row.sort_order],
  );
  return id;
}

export async function updateChapter(
  id: string,
  patch: {
    chapter_name?: string;
    unit_name?: string;
    sort_order?: number;
    status?: "y" | "n";
    comments?: { _ch?: Partial<ChapterSideMeta> };
    bumpVersion: boolean;
  },
): Promise<void> {
  const pool = getDbPool();
  const existing = await getChapterById(id);
  if (!existing) return;
  if (existing.level === 1) {
    const sets: string[] = [];
    const vals: unknown[] = [];
    if (patch.chapter_name !== undefined) {
      sets.push("chapter_name = ?");
      vals.push(patch.chapter_name);
    }
    if (patch.sort_order !== undefined) {
      sets.push("sort_order = ?");
      vals.push(patch.sort_order);
    }
    if (patch.status !== undefined) {
      sets.push("status = ?");
      vals.push(patch.status);
    }
    const [curRows] = await pool.query(`SELECT comments FROM data_coursebook_chapter WHERE chapter_id = ? LIMIT 1`, [
      id,
    ]);
    const curC = ((curRows as { comments: string | null }[])[0]?.comments ?? null) as string | null;
    const chPatch = patch.comments?._ch;
    if (chPatch != null || patch.bumpVersion) {
      const side = parseChapterSide(curC);
      const nextRv = patch.bumpVersion ? (side.row_version ?? 1) + 1 : side.row_version ?? 1;
      const merged = mergeChapterComments(curC, {
        description: chPatch?.description !== undefined ? chPatch.description : side.description ?? null,
        image_registry_id:
          chPatch?.image_registry_id !== undefined ? chPatch.image_registry_id : side.image_registry_id ?? null,
        row_version: nextRv,
      });
      sets.push("comments = ?");
      vals.push(merged);
    }
    if (sets.length === 0) return;
    vals.push(id);
    await pool.query(`UPDATE data_coursebook_chapter SET ${sets.join(", ")} WHERE chapter_id = ?`, vals);
    return;
  }
  const sets: string[] = [];
  const vals: unknown[] = [];
  if (patch.unit_name !== undefined) {
    sets.push("unit_name = ?");
    vals.push(patch.unit_name);
  }
  if (patch.sort_order !== undefined) {
    sets.push("sort_order = ?");
    vals.push(patch.sort_order);
  }
  if (patch.status !== undefined) {
    sets.push("status = ?");
    vals.push(patch.status);
  }
  const [curRows] = await pool.query(`SELECT comments FROM data_coursebook_unit WHERE unit_id = ? LIMIT 1`, [id]);
  const curC = ((curRows as { comments: string | null }[])[0]?.comments ?? null) as string | null;
  const chPatch = patch.comments?._ch;
  if (chPatch != null || patch.bumpVersion) {
    const side = parseChapterSide(curC);
    const nextRv = patch.bumpVersion ? (side.row_version ?? 1) + 1 : side.row_version ?? 1;
    const merged = mergeChapterComments(curC, {
      description: chPatch?.description !== undefined ? chPatch.description : side.description ?? null,
      image_registry_id:
        chPatch?.image_registry_id !== undefined ? chPatch.image_registry_id : side.image_registry_id ?? null,
      row_version: nextRv,
    });
    sets.push("comments = ?");
    vals.push(merged);
  }
  if (sets.length === 0) return;
  vals.push(id);
  await pool.query(`UPDATE data_coursebook_unit SET ${sets.join(", ")} WHERE unit_id = ?`, vals);
}

export async function deleteChapter(id: string): Promise<void> {
  const pool = getDbPool();
  const existing = await getChapterById(id);
  if (!existing) return;
  if (existing.level === 1) {
    await pool.query(`DELETE FROM data_coursebook_unit WHERE chapter_id = ?`, [id]);
    await pool.query(`DELETE FROM data_coursebook_chapter WHERE chapter_id = ?`, [id]);
    return;
  }
  await pool.query(`DELETE FROM data_coursebook_unit WHERE unit_id = ?`, [id]);
}
