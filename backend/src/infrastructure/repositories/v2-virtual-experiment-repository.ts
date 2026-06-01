/**
 * V2 虚拟实验 MySQL 仓库
 * 对应表：virtual_experiment（bs_exp_data）
 */
import type { Pool, RowDataPacket, ResultSetHeader } from "mysql2/promise";
import { getMysqlPool } from "../mysql/mysql-client.ts";
import { resolveVarchar32PrimaryKey } from "../ids/identifiable-varchar32.ts";
import type {
  VirtualExperimentRecord,
  CreateVirtualExperimentInput,
  UpdateVirtualExperimentInput,
  VirtualExperimentListQuery,
  VirtualExperimentListPage,
} from "../../domain/v2-virtual-experiment/v2-virtual-experiment-types.ts";

// ─── 行映射 ──────────────────────────────────────────────

function rowToVirtualExperiment(row: RowDataPacket): VirtualExperimentRecord {
  return {
    id: String(row.id),
    title: String(row.title ?? ""),
    description: row.description ? String(row.description) : null,
    sourceType: row.source_type as VirtualExperimentRecord["sourceType"],
    sourceUrl: row.source_url ? String(row.source_url) : null,
    fileStorageKey: row.file_storage_key ? String(row.file_storage_key) : null,
    fileName: row.file_name ? String(row.file_name) : null,
    fileSize: row.file_size != null ? Number(row.file_size) : null,
    coverUrl: row.cover_url ? String(row.cover_url) : null,
    viewCount: row.view_count != null ? Number(row.view_count) : 0,
    callCount: row.call_count != null ? Number(row.call_count) : 0,
    status: row.status as VirtualExperimentRecord["status"],
    reviewerId: row.reviewer_id ? String(row.reviewer_id) : null,
    reviewComment: row.review_comment ? String(row.review_comment) : null,
    reviewTime: row.review_time ? String(row.review_time) : null,
    sortOrder: row.sort_order != null ? Number(row.sort_order) : null,
    createUserId: row.create_user_id ? String(row.create_user_id) : null,
    createUserName: row.create_user_name ? String(row.create_user_name) : null,
    createTime: row.create_time ? String(row.create_time) : null,
    updateUserId: row.update_user_id ? String(row.update_user_id) : null,
    updateTime: row.update_time ? String(row.update_time) : null,
    isDeleted: row.is_deleted ? String(row.is_deleted) : "n",
  };
}

// ─── 公共 SQL 片段 ───────────────────────────────────────

const TABLE = "virtual_experiment";

function pickSqlDateTime(v: unknown): string | null {
  if (v == null) return null;
  if (v instanceof Date) {
    if (Number.isNaN(v.getTime())) return null;
    const y = v.getFullYear();
    const m = String(v.getMonth() + 1).padStart(2, "0");
    const d = String(v.getDate()).padStart(2, "0");
    const hh = String(v.getHours()).padStart(2, "0");
    const mm = String(v.getMinutes()).padStart(2, "0");
    const ss = String(v.getSeconds()).padStart(2, "0");
    return `${y}-${m}-${d} ${hh}:${mm}:${ss}`;
  }
  const s = String(v).trim();
  return s || null;
}

// ─── CRUD ────────────────────────────────────────────────

/** 根据 id 获取单条（含软删除） */
export async function getVirtualExperimentById(id: string): Promise<VirtualExperimentRecord | null> {
  const pool = getMysqlPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM ${TABLE} WHERE id = ?`,
    [id],
  );
  if (rows.length === 0) return null;
  return rowToVirtualExperiment(rows[0]!);
}

/** 获取未删除的单条 */
export async function getActiveVirtualExperimentById(id: string): Promise<VirtualExperimentRecord | null> {
  const pool = getMysqlPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM ${TABLE} WHERE id = ? AND is_deleted = 'n'`,
    [id],
  );
  if (rows.length === 0) return null;
  return rowToVirtualExperiment(rows[0]!);
}

/** 分页查询 */
export async function listVirtualExperiments(query: VirtualExperimentListQuery): Promise<VirtualExperimentListPage> {
  const pool = getMysqlPool();
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));
  const offset = (page - 1) * pageSize;

  const where: string[] = ["is_deleted = 'n'"];
  const params: unknown[] = [];

  if (!query.reviewMode) {
    // 默认仅返回当前用户创建的数据；reviewMode 时忽略此限制
    // 注：reviewMode 权限在路由层校验
    if (query.createUserId?.trim()) {
      where.push("create_user_id = ?");
      params.push(query.createUserId.trim());
    }
  }
  if (query.keyword?.trim()) {
    where.push("title LIKE ?");
    params.push(`%${query.keyword.trim()}%`);
  }
  if (query.sourceType) {
    where.push("source_type = ?");
    params.push(query.sourceType);
  }
  if (query.status) {
    where.push("status = ?");
    params.push(query.status);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const [countRows] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM ${TABLE} ${whereSql}`,
    params,
  );
  const total = Number((countRows[0] as RowDataPacket).total ?? 0);

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM ${TABLE} ${whereSql}
     ORDER BY IFNULL(sort_order, 999999) ASC, create_time DESC
     LIMIT ? OFFSET ?`,
    [...params, pageSize, offset],
  );

  return { items: rows.map(rowToVirtualExperiment), total, page, pageSize };
}

/** 插入一条虚拟实验记录，返回完整行 */
export async function insertVirtualExperiment(
  input: CreateVirtualExperimentInput,
): Promise<VirtualExperimentRecord> {
  const pool = getMysqlPool();
  const id = await resolveVarchar32PrimaryKey(pool, {
    table: TABLE,
    column: "id",
    label: input.title,
  });

  await pool.query<ResultSetHeader>(
    `INSERT INTO ${TABLE}
      (id, title, description, source_type, source_url, file_storage_key, file_name, file_size,
       cover_url, view_count, call_count, status, sort_order,
       create_user_id, create_user_name, create_time, update_user_id, update_time, is_deleted)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?,
             ?, 0, 0, 'draft', ?,
             ?, ?, NOW(), ?, NOW(), 'n')`,
    [
      id,
      input.title,
      input.description ?? null,
      input.sourceType,
      input.sourceUrl ?? null,
      input.fileStorageKey ?? null,
      input.fileName ?? null,
      input.fileSize ?? null,
      input.coverUrl ?? null,
      input.sortOrder ?? null,
      input.createUserId ?? null,
      input.createUserName ?? null,
      input.createUserId ?? null, // update_user_id 初始等于 create_user_id
    ],
  );

  const row = await getVirtualExperimentById(id);
  if (!row) throw new Error("VE_CREATE_FAILED");
  return row;
}

/** 更新字段（仅更新非 undefined 字段） */
export async function updateVirtualExperiment(
  id: string,
  input: UpdateVirtualExperimentInput,
  updateUserId: string,
): Promise<VirtualExperimentRecord | null> {
  const pool = getMysqlPool();
  const sets: string[] = [];
  const params: unknown[] = [];

  if (input.title !== undefined) { sets.push("title = ?"); params.push(input.title); }
  if (input.description !== undefined) { sets.push("description = ?"); params.push(input.description); }
  if (input.sourceUrl !== undefined) { sets.push("source_url = ?"); params.push(input.sourceUrl); }
  if (input.coverUrl !== undefined) { sets.push("cover_url = ?"); params.push(input.coverUrl); }
  if (input.sortOrder !== undefined) { sets.push("sort_order = ?"); params.push(input.sortOrder); }
  if (input.fileStorageKey !== undefined) { sets.push("file_storage_key = ?"); params.push(input.fileStorageKey); }
  if (input.fileName !== undefined) { sets.push("file_name = ?"); params.push(input.fileName); }
  if (input.fileSize !== undefined) { sets.push("file_size = ?"); params.push(input.fileSize); }

  if (sets.length === 0) return getActiveVirtualExperimentById(id);

  sets.push("update_user_id = ?"); params.push(updateUserId);
  sets.push("update_time = NOW()");

  params.push(id);
  await pool.query<ResultSetHeader>(
    `UPDATE ${TABLE} SET ${sets.join(", ")} WHERE id = ? AND is_deleted = 'n'`,
    params,
  );

  return getActiveVirtualExperimentById(id);
}

// ─── 审核相关 ────────────────────────────────────────────

/** 更新状态（状态机保护在 Service 层） */
export async function updateVirtualExperimentStatus(
  id: string,
  status: VirtualExperimentRecord["status"],
  updateUserId: string,
): Promise<void> {
  const pool = getMysqlPool();
  await pool.query<ResultSetHeader>(
    `UPDATE ${TABLE} SET status = ?, update_user_id = ?, update_time = NOW() WHERE id = ? AND is_deleted = 'n'`,
    [status, updateUserId, id],
  );
}

/** 提交审核：status → pending，清空审核元数据 */
export async function submitForReview(id: string, updateUserId: string): Promise<void> {
  const pool = getMysqlPool();
  await pool.query<ResultSetHeader>(
    `UPDATE ${TABLE}
     SET status = 'pending', reviewer_id = NULL, review_comment = NULL, review_time = NULL,
         update_user_id = ?, update_time = NOW()
     WHERE id = ? AND is_deleted = 'n'`,
    [updateUserId, id],
  );
}

/** 审核处理：写入审核结果 */
export async function processReview(
  id: string,
  status: VirtualExperimentRecord["status"],
  reviewerId: string,
  reviewComment: string | null,
): Promise<void> {
  const pool = getMysqlPool();
  await pool.query<ResultSetHeader>(
    `UPDATE ${TABLE}
     SET status = ?, reviewer_id = ?, review_comment = ?, review_time = NOW(),
         update_user_id = ?, update_time = NOW()
     WHERE id = ? AND is_deleted = 'n'`,
    [status, reviewerId, reviewComment, reviewerId, id],
  );
}

// ─── 计数 ────────────────────────────────────────────────

/** 访问计数 +1 */
export async function incrementViewCount(id: string): Promise<void> {
  const pool = getMysqlPool();
  await pool.query<ResultSetHeader>(
    `UPDATE ${TABLE} SET view_count = view_count + 1 WHERE id = ? AND is_deleted = 'n'`,
    [id],
  );
}

/** 调用计数 +1 */
export async function incrementCallCount(id: string): Promise<void> {
  const pool = getMysqlPool();
  await pool.query<ResultSetHeader>(
    `UPDATE ${TABLE} SET call_count = call_count + 1 WHERE id = ? AND is_deleted = 'n'`,
    [id],
  );
}

// ─── 删除 ────────────────────────────────────────────────

/** 软删除 */
export async function softDeleteVirtualExperiment(id: string, updateUserId: string): Promise<void> {
  const pool = getMysqlPool();
  await pool.query<ResultSetHeader>(
    `UPDATE ${TABLE} SET is_deleted = 'y', update_user_id = ?, update_time = NOW() WHERE id = ? AND is_deleted = 'n'`,
    [updateUserId, id],
  );
}
