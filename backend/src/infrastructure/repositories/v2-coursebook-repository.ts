/**
 * V2 教材仓库
 * 对应表：data_coursebook / data_coursebook_chapter / data_coursebook_unit
 */
import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import { resolveVarchar32PrimaryKey } from "../ids/identifiable-varchar32.ts";
import { getMysqlPool } from "../mysql/mysql-client.ts";

export interface CoursebookRecord {
  coursebookId: string;
  coursebookName: string;
  coursebookVersion: string | null;
  subjectId: string | null;
  comments: string | null;
  status: string | null;
}

export interface ChapterRecord {
  chapterId: string;
  chapterName: string;
  coursebookId: string | null;
  comments: string | null;
  status: string | null;
  sortOrder: number | null;
  units?: UnitRecord[];
}

export interface UnitRecord {
  unitId: string;
  unitName: string;
  chapterId: string | null;
  comments: string | null;
  status: string | null;
  sortOrder: number | null;
}

export interface CreateCoursebookInput {
  coursebookId?: string;
  coursebookName: string;
  coursebookVersion?: string;
  subjectId?: string | null;
  comments?: string;
  status?: string;
}

export interface UpdateCoursebookInput {
  coursebookName?: string;
  coursebookVersion?: string | null;
  subjectId?: string | null;
  comments?: string | null;
  status?: string | null;
}

export interface CreateChapterInput {
  chapterId?: string;
  chapterName: string;
  coursebookId: string;
  comments?: string;
  sortOrder?: number;
}

export interface UpdateChapterInput {
  chapterName?: string;
  comments?: string | null;
  sortOrder?: number;
  status?: string | null;
}

export interface CreateUnitInput {
  unitId?: string;
  unitName: string;
  chapterId: string;
  comments?: string;
  sortOrder?: number;
}

export interface UpdateUnitInput {
  unitName?: string;
  comments?: string | null;
  sortOrder?: number;
  status?: string | null;
}

function rowToBook(row: RowDataPacket): CoursebookRecord {
  return {
    coursebookId: String(row.coursebook_id),
    coursebookName: String(row.coursebook_name ?? ""),
    coursebookVersion: row.coursebook_version ? String(row.coursebook_version) : null,
    subjectId: row.subject_id ? String(row.subject_id) : null,
    comments: row.comments ? String(row.comments) : null,
    status: row.status ? String(row.status) : null,
  };
}

function rowToChapter(row: RowDataPacket): ChapterRecord {
  return {
    chapterId: String(row.chapter_id),
    chapterName: String(row.chapter_name ?? ""),
    coursebookId: row.coursebook_id ? String(row.coursebook_id) : null,
    comments: row.comments ? String(row.comments) : null,
    status: row.status ? String(row.status) : null,
    sortOrder: row.sort_order != null ? Number(row.sort_order) : null,
  };
}

function rowToUnit(row: RowDataPacket): UnitRecord {
  return {
    unitId: String(row.unit_id),
    unitName: String(row.unit_name ?? ""),
    chapterId: row.chapter_id ? String(row.chapter_id) : null,
    comments: row.comments ? String(row.comments) : null,
    status: row.status ? String(row.status) : null,
    sortOrder: row.sort_order != null ? Number(row.sort_order) : null,
  };
}

export async function listCoursebooks(keyword?: string): Promise<CoursebookRecord[]> {
  const pool = getMysqlPool();
  const where: string[] = ["COALESCE(status, 'y') = 'y'"];
  const params: unknown[] = [];
  if (keyword?.trim()) { where.push("coursebook_name LIKE ?"); params.push(`%${keyword.trim()}%`); }
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM data_coursebook WHERE ${where.join(" AND ")} ORDER BY coursebook_id ASC`,
    params,
  );
  return rows.map(rowToBook);
}

export interface CoursebookEnrichedRecord extends CoursebookRecord { subjectName: string | null; chapterCount: number; expCount: number; }

export async function listCoursebooksEnriched(keyword?: string): Promise<CoursebookEnrichedRecord[]> {
  const pool = getMysqlPool();
  const params: unknown[] = [];
  const whereClause = keyword?.trim() ? (params.push(`%${keyword.trim()}%`), "WHERE c.coursebook_name LIKE ?") : "";
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT c.*, s.subject_name, COUNT(DISTINCT ch.chapter_id) AS chapter_count, COUNT(DISTINCT e.exp_id) AS exp_count
     FROM data_coursebook c
     LEFT JOIN data_school_subject s ON s.subject_id = c.subject_id
     LEFT JOIN data_coursebook_chapter ch ON ch.coursebook_id = c.coursebook_id AND COALESCE(ch.status,'y') = 'y'
     LEFT JOIN exp_msg e ON e.coursebook_id = c.coursebook_id AND e.is_deleted = 0
     ${whereClause} GROUP BY c.coursebook_id ORDER BY c.coursebook_id ASC`,
    params,
  );
  return rows.map((row) => ({ ...rowToBook(row), subjectName: row.subject_name ? String(row.subject_name) : null, chapterCount: Number(row.chapter_count ?? 0), expCount: Number(row.exp_count ?? 0) }));
}

export async function getCoursebookTree(coursebookId: string): Promise<(ChapterRecord & { units: UnitRecord[] })[]> {
  const pool = getMysqlPool();
  const [chapters] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM data_coursebook_chapter WHERE coursebook_id = ? AND COALESCE(status,'y')='y'
     ORDER BY sort_order ASC`,
    [coursebookId],
  );
  const result: (ChapterRecord & { units: UnitRecord[] })[] = [];
  for (const ch of chapters as RowDataPacket[]) {
    const [units] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM data_coursebook_unit WHERE chapter_id = ? AND COALESCE(status,'y')='y'
       ORDER BY sort_order ASC`,
      [ch.chapter_id],
    );
    result.push({ ...rowToChapter(ch), units: (units as RowDataPacket[]).map(rowToUnit) });
  }
  return result;
}

export async function createCoursebook(input: CreateCoursebookInput): Promise<CoursebookRecord> {
  const pool = getMysqlPool();
  const label = `${input.coursebookName}${input.coursebookVersion ? `_${input.coursebookVersion}` : ""}`;
  const id = await resolveVarchar32PrimaryKey(pool, {
    table: "data_coursebook",
    column: "coursebook_id",
    label,
    explicit: input.coursebookId,
  });
  await pool.query<ResultSetHeader>(
    `INSERT INTO data_coursebook (coursebook_id, coursebook_name, coursebook_version, subject_id, comments, status)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, input.coursebookName, input.coursebookVersion ?? null, input.subjectId ?? null, input.comments ?? null, input.status ?? "y"],
  );
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM data_coursebook WHERE coursebook_id = ?`, [id],
  );
  return rowToBook(rows[0]!);
}

export async function createChapter(input: CreateChapterInput): Promise<ChapterRecord> {
  const pool = getMysqlPool();
  const id = await resolveVarchar32PrimaryKey(pool, {
    table: "data_coursebook_chapter",
    column: "chapter_id",
    label: `${input.chapterName}_${input.coursebookId}`,
    explicit: input.chapterId,
  });
  await pool.query<ResultSetHeader>(
    `INSERT INTO data_coursebook_chapter (chapter_id, chapter_name, coursebook_id, comments, status, sort_order)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, input.chapterName, input.coursebookId, input.comments ?? null, "y", input.sortOrder ?? 0],
  );
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM data_coursebook_chapter WHERE chapter_id = ?`, [id],
  );
  return rowToChapter(rows[0]!);
}

export async function createUnit(input: CreateUnitInput): Promise<UnitRecord> {
  const pool = getMysqlPool();
  const id = await resolveVarchar32PrimaryKey(pool, {
    table: "data_coursebook_unit",
    column: "unit_id",
    label: `${input.unitName}_${input.chapterId}`,
    explicit: input.unitId,
  });
  await pool.query<ResultSetHeader>(
    `INSERT INTO data_coursebook_unit (unit_id, unit_name, chapter_id, comments, status, sort_order)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, input.unitName, input.chapterId, input.comments ?? null, "y", input.sortOrder ?? 0],
  );
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM data_coursebook_unit WHERE unit_id = ?`, [id],
  );
  return rowToUnit(rows[0]!);
}

export async function updateChapter(chapterId: string, input: UpdateChapterInput): Promise<ChapterRecord> {
  const pool = getMysqlPool();
  const sets: string[] = [];
  const params: unknown[] = [];
  if (input.chapterName !== undefined) { sets.push("chapter_name = ?"); params.push(input.chapterName); }
  if (input.comments !== undefined) { sets.push("comments = ?"); params.push(input.comments); }
  if (input.sortOrder !== undefined) { sets.push("sort_order = ?"); params.push(input.sortOrder); }
  if (input.status !== undefined) { sets.push("status = ?"); params.push(input.status); }
  if (sets.length > 0) {
    await pool.query<ResultSetHeader>(`UPDATE data_coursebook_chapter SET ${sets.join(", ")} WHERE chapter_id = ?`, [...params, chapterId]);
  }
  const [rows] = await pool.query<RowDataPacket[]>(`SELECT * FROM data_coursebook_chapter WHERE chapter_id = ?`, [chapterId]);
  if (!rows[0]) throw new Error("NOT_FOUND");
  return rowToChapter(rows[0]);
}

export async function deleteChapter(chapterId: string): Promise<void> {
  const pool = getMysqlPool();
  await pool.query<ResultSetHeader>(`UPDATE data_coursebook_chapter SET status = 'n' WHERE chapter_id = ?`, [chapterId]);
  await pool.query<ResultSetHeader>(`UPDATE data_coursebook_unit SET status = 'n' WHERE chapter_id = ?`, [chapterId]);
}

export async function updateUnit(unitId: string, input: UpdateUnitInput): Promise<UnitRecord> {
  const pool = getMysqlPool();
  const sets: string[] = [];
  const params: unknown[] = [];
  if (input.unitName !== undefined) { sets.push("unit_name = ?"); params.push(input.unitName); }
  if (input.comments !== undefined) { sets.push("comments = ?"); params.push(input.comments); }
  if (input.sortOrder !== undefined) { sets.push("sort_order = ?"); params.push(input.sortOrder); }
  if (input.status !== undefined) { sets.push("status = ?"); params.push(input.status); }
  if (sets.length > 0) {
    await pool.query<ResultSetHeader>(`UPDATE data_coursebook_unit SET ${sets.join(", ")} WHERE unit_id = ?`, [...params, unitId]);
  }
  const [rows] = await pool.query<RowDataPacket[]>(`SELECT * FROM data_coursebook_unit WHERE unit_id = ?`, [unitId]);
  if (!rows[0]) throw new Error("NOT_FOUND");
  return rowToUnit(rows[0]);
}

export async function deleteUnit(unitId: string): Promise<void> {
  const pool = getMysqlPool();
  await pool.query<ResultSetHeader>(`UPDATE data_coursebook_unit SET status = 'n' WHERE unit_id = ?`, [unitId]);
}

export async function updateCoursebook(coursebookId: string, input: UpdateCoursebookInput): Promise<CoursebookRecord> {
  const pool = getMysqlPool();
  const sets: string[] = [];
  const params: unknown[] = [];
  if (input.coursebookName !== undefined) { sets.push("coursebook_name = ?"); params.push(input.coursebookName); }
  if (input.coursebookVersion !== undefined) { sets.push("coursebook_version = ?"); params.push(input.coursebookVersion); }
  if (input.subjectId !== undefined) { sets.push("subject_id = ?"); params.push(input.subjectId); }
  if (input.comments !== undefined) { sets.push("comments = ?"); params.push(input.comments); }
  if (input.status !== undefined) { sets.push("status = ?"); params.push(input.status); }
  if (sets.length > 0) {
    await pool.query<ResultSetHeader>(
      `UPDATE data_coursebook SET ${sets.join(", ")} WHERE coursebook_id = ?`,
      [...params, coursebookId],
    );
  }
  const [rows] = await pool.query<RowDataPacket[]>(`SELECT * FROM data_coursebook WHERE coursebook_id = ?`, [coursebookId]);
  if (!rows[0]) throw new Error("NOT_FOUND");
  return rowToBook(rows[0]);
}

export async function deleteCoursebook(coursebookId: string): Promise<void> {
  const pool = getMysqlPool();
  await pool.query<ResultSetHeader>(`UPDATE data_coursebook SET status = 'n' WHERE coursebook_id = ?`, [coursebookId]);
}
