/**
 * data_org_type 读写（控制台组织类型管理）
 */
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";

import { resolveVarchar32PrimaryKey } from "../ids/identifiable-varchar32.ts";
import { getMysqlPool } from "../mysql/mysql-client.ts";

export type OrgTypeRow = {
  typeId: string;
  typeName: string;
  comments: string | null;
  status: "y" | "n" | null;
  sortOrder: number | null;
};

export type CreateOrgTypeInput = {
  /** 可选：显式主键；缺省由 `typeName` 生成。 */
  typeId?: string;
  typeName: string;
  comments?: string | null;
  status?: "y" | "n";
  sortOrder?: number;
};

export type PatchOrgTypeInput = {
  typeName?: string;
  comments?: string | null;
  status?: "y" | "n";
  sortOrder?: number;
};

function mapRow(r: RowDataPacket): OrgTypeRow {
  const so = r.sort_order ?? r.sortOrder;
  return {
    typeId: String(r.type_id ?? r.typeId),
    typeName: String(r.type_name ?? r.typeName ?? ""),
    comments: r.comments == null ? null : String(r.comments),
    status: r.status == null ? null : (String(r.status).toLowerCase() === "n" ? "n" : "y"),
    sortOrder: so == null ? null : Number(so),
  };
}

export async function listOrgTypes(includeInactive: boolean): Promise<OrgTypeRow[]> {
  const pool = getMysqlPool();
  const where = includeInactive ? "" : "WHERE COALESCE(status, 'y') = 'y'";
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT type_id AS typeId, type_name AS typeName, comments, status, sort_order AS sortOrder
     FROM data_org_type ${where}
     ORDER BY sort_order ASC, type_id ASC`,
  );
  return rows.map(mapRow);
}

export async function getOrgTypeById(typeId: string): Promise<OrgTypeRow | null> {
  const pool = getMysqlPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT type_id AS typeId, type_name AS typeName, comments, status, sort_order AS sortOrder
     FROM data_org_type WHERE type_id = ? LIMIT 1`,
    [typeId],
  );
  if (rows.length === 0) return null;
  return mapRow(rows[0]!);
}

export async function createOrgType(input: CreateOrgTypeInput): Promise<OrgTypeRow> {
  const pool = getMysqlPool();
  const typeId = await resolveVarchar32PrimaryKey(pool, {
    table: "data_org_type",
    column: "type_id",
    label: input.typeName,
    explicit: input.typeId,
  });
  const status = input.status ?? "y";
  const sortOrder = input.sortOrder ?? 0;
  await pool.query<ResultSetHeader>(
    `INSERT INTO data_org_type (type_id, type_name, comments, status, sort_order)
     VALUES (?, ?, ?, ?, ?)`,
    [typeId, input.typeName, input.comments ?? null, status, sortOrder],
  );
  const row = await getOrgTypeById(typeId);
  if (!row) throw new Error("ORG_TYPE_CREATE_FAILED");
  return row;
}

export async function updateOrgType(typeId: string, input: PatchOrgTypeInput): Promise<OrgTypeRow> {
  const pool = getMysqlPool();
  const current = await getOrgTypeById(typeId);
  if (!current) throw new Error("ORG_TYPE_NOT_FOUND");

  const sets: string[] = [];
  const params: unknown[] = [];
  if (input.typeName !== undefined) {
    sets.push("type_name = ?");
    params.push(input.typeName);
  }
  if (input.comments !== undefined) {
    sets.push("comments = ?");
    params.push(input.comments);
  }
  if (input.status !== undefined) {
    sets.push("status = ?");
    params.push(input.status);
  }
  if (input.sortOrder !== undefined) {
    sets.push("sort_order = ?");
    params.push(input.sortOrder);
  }
  if (sets.length === 0) return current;

  params.push(typeId);
  await pool.query<ResultSetHeader>(
    `UPDATE data_org_type SET ${sets.join(", ")} WHERE type_id = ?`,
    params,
  );
  const row = await getOrgTypeById(typeId);
  if (!row) throw new Error("ORG_TYPE_NOT_FOUND");
  return row;
}

export async function deleteOrgType(typeId: string): Promise<void> {
  const pool = getMysqlPool();
  const current = await getOrgTypeById(typeId);
  if (!current) throw new Error("ORG_TYPE_NOT_FOUND");

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS c FROM sys_org WHERE org_type_id = ? AND is_deleted = 0`,
    [typeId],
  );
  const c = Number(rows[0]?.c ?? 0);
  if (c > 0) throw new Error("ORG_TYPE_IN_USE");

  await pool.query<ResultSetHeader>(`DELETE FROM data_org_type WHERE type_id = ?`, [typeId]);
}
