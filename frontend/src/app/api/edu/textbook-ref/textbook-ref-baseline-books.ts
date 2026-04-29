import { randomUUID } from "node:crypto";
import type { ResultSetHeader } from "mysql2";

import { getDbPool } from "@/lib/server/mysql";

import {
  buildCoursebookComments,
  mergeCoursebookRef,
  parseCoursebookRef,
  statusDbToApi,
} from "./textbook-ref-baseline-meta";
import type { CoursebookRefMeta } from "./textbook-ref-baseline-meta";
import type { TextbookRefBookRow } from "./textbook-ref-types";

export type BaselineCoursebookRow = {
  coursebook_id: string;
  coursebook_name: string;
  coursebook_version: string | null;
  comments: string | null;
  status: string | null;
};

function newId32(): string {
  return randomUUID().replace(/-/g, "");
}

function enabledStatusSql(): string {
  return `(COALESCE(LOWER(TRIM(status)), 'y') <> 'n')`;
}

export function coursebookRowToBookRow(r: BaselineCoursebookRow): TextbookRefBookRow {
  const ref = parseCoursebookRef(r.comments);
  const placeholder = "1970-01-01T00:00:00.000Z";
  return {
    id: r.coursebook_id,
    subject_id: ref?.subject_id ?? "",
    grade_id: ref?.grade_id ?? null,
    title: r.coursebook_name,
    coursebook_version: r.coursebook_version ?? null,
    cover_registry_id: ref?.cover_registry_id ?? null,
    status: statusDbToApi(r.status),
    sort_order: ref?.sort_order ?? 0,
    created_at: placeholder,
    updated_at: placeholder,
  };
}

export async function listBooksForRef(subjectId: string, gradeFilter?: string | null): Promise<TextbookRefBookRow[]> {
  const pool = getDbPool();
  /** 按表 `data_coursebook` 全量拉取启用行，在应用层用 `comments._ref` 与左侧学科树关联（避免 SQL 侧 JSON_VALID 误伤非 JSON 或兼容差异）。 */
  const [rows] = await pool.query(
    `SELECT coursebook_id, coursebook_name, coursebook_version, comments, status
     FROM data_coursebook
     WHERE ${enabledStatusSql()}
     ORDER BY coursebook_id ASC`,
  );
  const raw = rows as BaselineCoursebookRow[];
  const bySubject = raw.filter((r) => parseCoursebookRef(r.comments)?.subject_id === subjectId);
  const useGrade = gradeFilter != null && String(gradeFilter).trim() !== "";
  const filtered = useGrade
    ? bySubject.filter((r) => {
        const ref = parseCoursebookRef(r.comments);
        if (!ref) return false;
        const g = ref.grade_id;
        return g == null || g === "" || g === gradeFilter;
      })
    : bySubject;
  const sorted = filtered.sort((a, b) => {
    const sa = parseCoursebookRef(a.comments)?.sort_order ?? 0;
    const sb = parseCoursebookRef(b.comments)?.sort_order ?? 0;
    if (sa !== sb) return sa - sb;
    return a.coursebook_id.localeCompare(b.coursebook_id);
  });
  return sorted.map((r) => coursebookRowToBookRow(r));
}

export async function getRefBookById(coursebookId: string): Promise<TextbookRefBookRow | null> {
  const pool = getDbPool();
  const [rows] = await pool.query(
    `SELECT coursebook_id, coursebook_name, coursebook_version, comments, status
     FROM data_coursebook WHERE coursebook_id = ? LIMIT 1`,
    [coursebookId],
  );
  const r = (rows as BaselineCoursebookRow[])[0];
  if (!r) return null;
  return coursebookRowToBookRow(r);
}

export async function assertCoursebookExists(coursebookId: string): Promise<boolean> {
  const pool = getDbPool();
  const [rows] = await pool.query(`SELECT 1 AS ok FROM data_coursebook WHERE coursebook_id = ? LIMIT 1`, [
    coursebookId,
  ]);
  return Array.isArray(rows) && (rows as { ok: number }[]).length > 0;
}

export async function insertBook(input: {
  coursebook_name: string;
  coursebook_version: string | null;
  status: "y" | "n";
  ref: CoursebookRefMeta;
}): Promise<string> {
  const pool = getDbPool();
  const id = newId32();
  const comments = buildCoursebookComments(input.ref);
  await pool.query<ResultSetHeader>(
    `INSERT INTO data_coursebook (coursebook_id, coursebook_name, coursebook_version, comments, status)
     VALUES (?, ?, ?, ?, ?)`,
    [id, input.coursebook_name, input.coursebook_version, comments, input.status],
  );
  return id;
}

export async function updateBook(
  coursebookId: string,
  patch: {
    coursebook_name?: string;
    coursebook_version?: string | null;
    status?: "y" | "n";
    comments?: { _ref?: Partial<CoursebookRefMeta> };
  },
): Promise<void> {
  const pool = getDbPool();
  const [rows] = await pool.query(
    `SELECT coursebook_id, coursebook_name, coursebook_version, comments, status
     FROM data_coursebook WHERE coursebook_id = ? LIMIT 1`,
    [coursebookId],
  );
  const r = (rows as BaselineCoursebookRow[])[0];
  if (!r) return;
  let coursebook_name = r.coursebook_name;
  let coursebook_version = r.coursebook_version;
  let comments = r.comments;
  let status = r.status;
  if (patch.coursebook_name !== undefined) coursebook_name = patch.coursebook_name;
  if (patch.coursebook_version !== undefined) coursebook_version = patch.coursebook_version;
  if (patch.status !== undefined) status = patch.status;
  if (patch.comments?._ref != null) {
    if (!parseCoursebookRef(r.comments)) {
      throw new Error("该教材行缺少控制台教材参考元数据（comments._ref），无法在此合并子字段");
    }
    comments = mergeCoursebookRef(r.comments, patch.comments._ref);
  }
  await pool.query(
    `UPDATE data_coursebook SET coursebook_name = ?, coursebook_version = ?, comments = ?, status = ? WHERE coursebook_id = ?`,
    [coursebook_name, coursebook_version, comments, status, coursebookId],
  );
}

export async function nextBookSortOrder(subjectId: string): Promise<number> {
  const list = await listBooksForRef(subjectId, null);
  let max = 0;
  for (const row of list) {
    const so = row.sort_order ?? 0;
    if (so > max) max = so;
  }
  return max + 10;
}
