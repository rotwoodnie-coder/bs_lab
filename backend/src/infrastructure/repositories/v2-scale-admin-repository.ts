/**
 * 积分称号规则 scale_title 管理、积分流水 scale_log 管理台查询。
 */
import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import { allocateUniqueMysqlVarchar32Id } from "../ids/identifiable-varchar32.ts";
import { getMysqlPool } from "../mysql/mysql-client.ts";
import type { ScaleLogRecord, ScaleTitleRecord } from "../../domain/v2-social/v2-social-types.ts";

function nowStr(): string {
  return new Date().toISOString().replace("T", " ").slice(0, 19);
}

function mapTitleRow(r: RowDataPacket): ScaleTitleRecord {
  return {
    seqId: String(r.seq_id),
    roleId: String(r.role_id),
    titleName: String(r.title_name),
    icon: r.icon != null ? String(r.icon) : null,
    scoreNum: Number(r.score_num ?? 0),
  };
}

function mapLogRow(r: RowDataPacket): ScaleLogRecord {
  return {
    seqId: String(r.seq_id),
    userId: String(r.user_id),
    scaleSource: r.scale_source != null ? String(r.scale_source) : null,
    scaleNum: Number(r.scale_num ?? 0),
    createTime: r.create_time != null ? String(r.create_time) : null,
  };
}

async function assertRoleExists(roleId: string): Promise<void> {
  const pool = getMysqlPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT role_id FROM data_role WHERE role_id = ? LIMIT 1`,
    [roleId],
  );
  if (rows.length === 0) throw new Error("role_id 不存在于 data_role");
}

export async function listScaleTitles(roleId?: string): Promise<ScaleTitleRecord[]> {
  const pool = getMysqlPool();
  const where = roleId?.trim() ? "WHERE role_id = ?" : "";
  const params = roleId?.trim() ? [roleId.trim()] : [];
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT seq_id, role_id, title_name, icon, score_num FROM scale_title ${where}
     ORDER BY role_id ASC, score_num ASC, seq_id ASC`,
    params,
  );
  return (rows as RowDataPacket[]).map(mapTitleRow);
}

export type CreateScaleTitleRowInput = {
  role_id: string;
  title_name: string;
  icon?: string | null;
  score_num: number;
};

export async function createScaleTitleRow(input: CreateScaleTitleRowInput): Promise<ScaleTitleRecord> {
  await assertRoleExists(input.role_id);
  const pool = getMysqlPool();
  const seqId = await allocateUniqueMysqlVarchar32Id(pool, {
    table: "scale_title",
    column: "seq_id",
    label: `scale_title_${input.role_id}_${input.score_num}`,
  });
  const icon = input.icon === undefined ? null : input.icon;
  await pool.query<ResultSetHeader>(
    `INSERT INTO scale_title (seq_id, role_id, title_name, icon, score_num)
     VALUES (?, ?, ?, ?, ?)`,
    [seqId, input.role_id, input.title_name, icon, input.score_num],
  );
  const [rows] = await pool.query<RowDataPacket[]>(`SELECT * FROM scale_title WHERE seq_id = ?`, [seqId]);
  return mapTitleRow(rows[0] as RowDataPacket);
}

export type PatchScaleTitleRowInput = Partial<{
  role_id: string;
  title_name: string;
  icon: string | null;
  score_num: number;
}>;

export async function patchScaleTitleRow(
  seqId: string,
  patch: PatchScaleTitleRowInput,
): Promise<ScaleTitleRecord | null> {
  if (patch.role_id !== undefined) await assertRoleExists(patch.role_id);
  const pool = getMysqlPool();
  const sets: string[] = [];
  const vals: unknown[] = [];
  if (patch.role_id !== undefined) {
    sets.push("role_id = ?");
    vals.push(patch.role_id);
  }
  if (patch.title_name !== undefined) {
    sets.push("title_name = ?");
    vals.push(patch.title_name);
  }
  if (patch.icon !== undefined) {
    sets.push("icon = ?");
    vals.push(patch.icon);
  }
  if (patch.score_num !== undefined) {
    sets.push("score_num = ?");
    vals.push(patch.score_num);
  }
  if (sets.length === 0) return getScaleTitleBySeqId(seqId);
  vals.push(seqId);
  await pool.query<ResultSetHeader>(
    `UPDATE scale_title SET ${sets.join(", ")} WHERE seq_id = ?`,
    vals,
  );
  return getScaleTitleBySeqId(seqId);
}

async function getScaleTitleBySeqId(seqId: string): Promise<ScaleTitleRecord | null> {
  const pool = getMysqlPool();
  const [rows] = await pool.query<RowDataPacket[]>(`SELECT * FROM scale_title WHERE seq_id = ? LIMIT 1`, [seqId]);
  if (rows.length === 0) return null;
  return mapTitleRow(rows[0] as RowDataPacket);
}

export async function deleteScaleTitleRow(seqId: string): Promise<boolean> {
  const pool = getMysqlPool();
  const [res] = await pool.query<ResultSetHeader>(`DELETE FROM scale_title WHERE seq_id = ?`, [seqId]);
  return (res as ResultSetHeader).affectedRows > 0;
}

export type AdminScaleLogQuery = {
  page: number;
  pageSize: number;
  user_id?: string;
  scale_source?: string;
};

export async function listScaleLogsAdmin(q: AdminScaleLogQuery): Promise<{ items: ScaleLogRecord[]; total: number }> {
  const pool = getMysqlPool();
  const page = Math.max(1, q.page);
  const pageSize = Math.min(100, Math.max(1, q.pageSize));
  const offset = (page - 1) * pageSize;
  const where: string[] = ["1=1"];
  const params: unknown[] = [];
  const uid = q.user_id?.trim();
  if (uid) {
    where.push("user_id = ?");
    params.push(uid);
  }
  const src = q.scale_source?.trim();
  if (src) {
    where.push("scale_source LIKE ?");
    params.push(`%${src}%`);
  }
  const w = where.join(" AND ");
  const [countRows] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS c FROM scale_log WHERE ${w}`,
    params,
  );
  const total = Number((countRows[0] as RowDataPacket)?.c ?? 0);
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT seq_id, user_id, scale_source, scale_num, create_time FROM scale_log
     WHERE ${w} ORDER BY create_time DESC LIMIT ? OFFSET ?`,
    [...params, pageSize, offset],
  );
  return { items: (rows as RowDataPacket[]).map(mapLogRow), total };
}
