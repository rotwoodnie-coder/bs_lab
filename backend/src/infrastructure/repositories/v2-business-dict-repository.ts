/**
 * 业务字典管理：独立后端业务域。
 *
 * 说明：
 * - 复用通用的表结构读取与 CRUD 实现
 * - 但通过独立白名单与独立路由对外暴露
 * - 后续可在此扩展更细粒度的业务域权限、审计与字段策略
 */
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { allocateUniqueMysqlVarchar32Id } from "../ids/identifiable-varchar32.ts";
import { getMysqlPool } from "../mysql/mysql-client.ts";

export const BUSINESS_DICT_TABLES = [
  "data_material_type",
  "data_material_prop",
  "data_material_security",
  "data_exp_difficulty",
  "data_pref_title",
  "data_difficulty_type",
  "data_question_type",
  "data_question_capacity",
  "scale_title",
] as const;

export type BusinessDictTable = (typeof BUSINESS_DICT_TABLES)[number];

export type BusinessDictColumnMeta = {
  name: string;
  dataType: string;
  nullable: boolean;
  columnKey: string;
};

function assertTable(table: string): asserts table is BusinessDictTable {
  if (!(BUSINESS_DICT_TABLES as readonly string[]).includes(table)) {
    throw new Error("TABLE_NOT_ALLOWED");
  }
}

export async function businessDictListColumns(table: BusinessDictTable): Promise<BusinessDictColumnMeta[]> {
  assertTable(table);
  const pool = getMysqlPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT COLUMN_NAME AS name, DATA_TYPE AS dataType, IS_NULLABLE AS nullable, COLUMN_KEY AS columnKey
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?
     ORDER BY ORDINAL_POSITION`,
    [table],
  );
  return (rows as { name: string; dataType: string; nullable: string; columnKey: string }[]).map((r) => ({
    name: r.name,
    dataType: r.dataType,
    nullable: r.nullable === "YES",
    columnKey: r.columnKey,
  }));
}

export function businessDictPickPrimaryKey(columns: BusinessDictColumnMeta[]): string {
  const pks = columns.filter((c) => c.columnKey === "PRI").map((c) => c.name);
  if (pks.length !== 1) throw new Error("COMPOSITE_PK_UNSUPPORTED");
  return pks[0]!;
}

function hasColumn(columns: BusinessDictColumnMeta[], name: string): boolean {
  return columns.some((c) => c.name === name);
}

function pickDictLabelFromInsertRow(row: Record<string, unknown>, columns: BusinessDictColumnMeta[]): string {
  for (const c of columns) {
    if (!/_name$/i.test(c.name)) continue;
    const v = row[c.name];
    if (v != null && String(v).trim() !== "") return String(v).trim();
  }
  return "";
}

function filterRowBody(
  columns: BusinessDictColumnMeta[],
  body: Record<string, unknown>,
  pk: string,
  forInsert: boolean,
): Record<string, unknown> {
  const allowed = new Set(columns.map((c) => c.name));
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body)) {
    if (!allowed.has(k)) continue;
    if (forInsert && k === pk && (v === undefined || v === null || v === "")) continue;
    if (!forInsert && k === pk) continue;
    out[k] = v;
  }
  return out;
}

export async function businessDictListRows(
  table: BusinessDictTable,
  includeInactive: boolean,
  columns: BusinessDictColumnMeta[],
): Promise<Record<string, unknown>[]> {
  assertTable(table);
  const pool = getMysqlPool();
  const hasStatus = hasColumn(columns, "status");
  const hasSort = hasColumn(columns, "sort_order");
  const pk = businessDictPickPrimaryKey(columns);
  const where = includeInactive || !hasStatus ? "" : " WHERE COALESCE(status, 'y') = 'y' ";
  const order = hasSort ? ` ORDER BY sort_order ASC, \`${pk}\` ASC ` : ` ORDER BY \`${pk}\` ASC `;
  const [rows] = await pool.query<RowDataPacket[]>(`SELECT * FROM \`${table}\`${where}${order} LIMIT 500`);
  return rows as Record<string, unknown>[];
}

export async function businessDictInsert(
  table: BusinessDictTable,
  columns: BusinessDictColumnMeta[],
  body: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  assertTable(table);
  const pk = businessDictPickPrimaryKey(columns);
  const row = filterRowBody(columns, body, pk, true);
  const pool = getMysqlPool();
  if (row[pk] === undefined || row[pk] === null || row[pk] === "") {
    const label = pickDictLabelFromInsertRow(row as Record<string, unknown>, columns);
    row[pk] = await allocateUniqueMysqlVarchar32Id(pool, {
      table,
      column: pk,
      label: label || table,
    });
  }
  const keys = Object.keys(row);
  if (keys.length === 0) throw new Error("EMPTY_ROW");
  const placeholders = keys.map(() => "?").join(", ");
  const vals = keys.map((k) => row[k]);
  await pool.query(`INSERT INTO \`${table}\` (\`${keys.join("`,`")}\`) VALUES (${placeholders})`, vals);
  const [found] = await pool.query<RowDataPacket[]>(`SELECT * FROM \`${table}\` WHERE \`${pk}\` = ? LIMIT 1`, [row[pk]]);
  return (found[0] ?? row) as Record<string, unknown>;
}

export async function businessDictUpdate(
  table: BusinessDictTable,
  columns: BusinessDictColumnMeta[],
  pkValue: string,
  body: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  assertTable(table);
  const pk = businessDictPickPrimaryKey(columns);
  const row = filterRowBody(columns, body, pk, false);
  const keys = Object.keys(row);
  if (keys.length === 0) throw new Error("EMPTY_PATCH");
  const setSql = keys.map((k) => `\`${k}\` = ?`).join(", ");
  const vals = [...keys.map((k) => row[k]), pkValue];
  const pool = getMysqlPool();
  const [res] = await pool.query<ResultSetHeader>(`UPDATE \`${table}\` SET ${setSql} WHERE \`${pk}\` = ?`, vals);
  if (res.affectedRows === 0) throw new Error("ROW_NOT_FOUND");
  const [found] = await pool.query<RowDataPacket[]>(`SELECT * FROM \`${table}\` WHERE \`${pk}\` = ? LIMIT 1`, [pkValue]);
  return found[0] as Record<string, unknown>;
}

export async function businessDictDelete(
  table: BusinessDictTable,
  columns: BusinessDictColumnMeta[],
  pkValue: string,
): Promise<{ mode: "soft" | "hard" }> {
  assertTable(table);
  const pk = businessDictPickPrimaryKey(columns);
  const pool = getMysqlPool();
  if (hasColumn(columns, "status")) {
    const [res] = await pool.query<ResultSetHeader>(
      `UPDATE \`${table}\` SET status = 'n' WHERE \`${pk}\` = ?`,
      [pkValue],
    );
    if (res.affectedRows === 0) throw new Error("ROW_NOT_FOUND");
    return { mode: "soft" };
  }
  const [res] = await pool.query<ResultSetHeader>(`DELETE FROM \`${table}\` WHERE \`${pk}\` = ?`, [pkValue]);
  if (res.affectedRows === 0) throw new Error("ROW_NOT_FOUND");
  return { mode: "hard" };
}
