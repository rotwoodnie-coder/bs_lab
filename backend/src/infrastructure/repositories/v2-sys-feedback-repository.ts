/**
 * V2 用户反馈 MySQL 仓库
 * 对应表：sys_feedback
 */
import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import { getMysqlPool } from "../mysql/mysql-client.ts";
import { allocateUniqueMysqlVarchar32Id } from "../ids/identifiable-varchar32.ts";
import { coerceAuditorIdForMysql32 } from "./v2-sys-user-repository.ts";

// ─── 类型定义 ──────────────────────────────────────────────

export interface SysFeedbackReporter {
  userId: string;
  name: string;
  role: string;
  orgId: string;
  orgName: string;
}

export interface SysFeedbackEnv {
  url?: string;
  ua?: string;
  browser?: string;
  resolution?: string;
  pathname?: string;
  errorStack?: string;
  error_stack_brief?: string;
}

export type FeedbackType = "BUG" | "FEATURE" | "OPTIMIZE" | "INQUIRY";
export type FeedbackStatus = "TODO" | "DOING" | "DONE" | "REJECT" | "AUTO_TRIAGED";

export interface SysFeedbackRecord {
  feedbackId: string;
  type: FeedbackType;
  title: string;
  content: string | null;
  status: FeedbackStatus;
  reporter: SysFeedbackReporter | null;
  env: SysFeedbackEnv | null;
  issueFingerprint: string | null;
  reply: string | null;
  replierId: string | null;
  replyTime: string | null;
  createUserId: string | null;
  createTime: string | null;
  updateUserId: string | null;
  updateTime: string | null;
  isDeleted: number;
}

export interface SysFeedbackListQuery {
  type?: FeedbackType;
  status?: FeedbackStatus;
  keyword?: string;
  page?: number;
  pageSize?: number;
}

export interface SysFeedbackListPage {
  items: SysFeedbackRecord[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateSysFeedbackInput {
  type: FeedbackType;
  title: string;
  content?: string;
  reporter: SysFeedbackReporter;
  env?: SysFeedbackEnv;
  issueFingerprint?: string | null;
}

export interface UpdateSysFeedbackInput {
  status?: FeedbackStatus;
  reply?: string;
  replierId?: string;
  issueFingerprint?: string | null;
}

// ─── 行转换 ────────────────────────────────────────────────

function rowToSysFeedback(row: RowDataPacket): SysFeedbackRecord {
  let reporter: SysFeedbackReporter | null = null;
  let env: SysFeedbackEnv | null = null;
  try {
    if (row.reporter) reporter = typeof row.reporter === "string" ? JSON.parse(row.reporter) : row.reporter;
  } catch { /* ignore */ }
  try {
    if (row.env) env = typeof row.env === "string" ? JSON.parse(row.env) : row.env;
  } catch { /* ignore */ }

  return {
    feedbackId: String(row.feedback_id),
    type: row.type as FeedbackType,
    title: String(row.title ?? ""),
    content: row.content ? String(row.content) : null,
    status: (row.status as FeedbackStatus) ?? "TODO",
    reporter,
    env,
    issueFingerprint: row.issue_fingerprint ? String(row.issue_fingerprint) : null,
    reply: row.reply ? String(row.reply) : null,
    replierId: row.replier_id ? String(row.replier_id) : null,
    replyTime: row.reply_time ? String(row.reply_time) : null,
    createUserId: row.create_user_id ? String(row.create_user_id) : null,
    createTime: row.create_time ? String(row.create_time) : null,
    updateUserId: row.update_user_id ? String(row.update_user_id) : null,
    updateTime: row.update_time ? String(row.update_time) : null,
    isDeleted: Number(row.is_deleted ?? 0) as 0 | 1,
  };
}

// ─── CRUD ──────────────────────────────────────────────────

export async function listSysFeedback(query: SysFeedbackListQuery = {}): Promise<SysFeedbackListPage> {
  const pool = getMysqlPool();
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));
  const offset = (page - 1) * pageSize;

  const where: string[] = ["is_deleted = 0"];
  const params: unknown[] = [];

  if (query.type) {
    where.push("`type` = ?");
    params.push(query.type);
  }
  if (query.status) {
    where.push("`status` = ?");
    params.push(query.status);
  }
  if (query.keyword) {
    where.push("(title LIKE ? OR content LIKE ?)");
    const kw = `%${query.keyword}%`;
    params.push(kw, kw);
  }

  const whereClause = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";

  const [countRows] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM sys_feedback ${whereClause}`,
    params,
  );
  const total = Number(countRows[0]?.total ?? 0);

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM sys_feedback ${whereClause} ORDER BY create_time DESC LIMIT ? OFFSET ?`,
    [...params, pageSize, offset],
  );

  return {
    items: rows.map(rowToSysFeedback),
    total,
    page,
    pageSize,
  };
}

export async function getSysFeedbackById(feedbackId: string): Promise<SysFeedbackRecord | null> {
  const pool = getMysqlPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT * FROM sys_feedback WHERE feedback_id = ? AND is_deleted = 0 LIMIT 1",
    [feedbackId],
  );
  return rows.length > 0 ? rowToSysFeedback(rows[0]!) : null;
}

export async function createSysFeedback(input: CreateSysFeedbackInput, actorId?: string): Promise<SysFeedbackRecord> {
  const pool = getMysqlPool();
  const reporterJson = input.reporter ? JSON.stringify(input.reporter) : null;
  const envJson = input.env ? JSON.stringify(input.env) : null;
  const auditorId = coerceAuditorIdForMysql32(actorId);
  const issueFingerprint = input.issueFingerprint ?? null;

  if (issueFingerprint) {
    const [existingRows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM sys_feedback
       WHERE is_deleted = 0
         AND issue_fingerprint = ?
         AND JSON_UNQUOTE(JSON_EXTRACT(IFNULL(reporter, '{}'), '$.orgId')) = ?
         AND UPPER(IFNULL(status, '')) IN ('TODO', 'DOING', 'AUTO_TRIAGED')
       ORDER BY create_time DESC
       LIMIT 1`,
      [issueFingerprint, input.reporter?.orgId ?? ""],
    );
    if (existingRows.length > 0) {
      return rowToSysFeedback(existingRows[0]!);
    }
  }

  const feedbackId = await allocateUniqueMysqlVarchar32Id(pool, {
    table: "sys_feedback",
    column: "feedback_id",
    label: input.title,
  });

  await pool.query<ResultSetHeader>(
    `INSERT INTO sys_feedback (feedback_id, type, title, content, status, reporter, env, issue_fingerprint, create_user_id)
     VALUES (?, ?, ?, ?, 'TODO', ?, ?, ?, ?)`,
    [feedbackId, input.type, input.title, input.content ?? null, reporterJson, envJson, issueFingerprint, auditorId],
  );

  const record = await getSysFeedbackById(feedbackId);
  if (!record) throw new Error("FEEDBACK_CREATE_FAILED");
  return record;
}

export async function updateSysFeedback(
  feedbackId: string,
  input: UpdateSysFeedbackInput,
  actorId?: string,
): Promise<SysFeedbackRecord | null> {
  const pool = getMysqlPool();

  const sets: string[] = [];
  const params: unknown[] = [];

  if (input.status !== undefined) {
    sets.push("`status` = ?");
    params.push(input.status);

    if (input.status === "DONE" || input.status === "REJECT") {
      // 终结态时记录回复人及时戳
      const replierId = input.replierId || actorId;
      if (replierId) {
        sets.push("replier_id = ?");
        params.push(coerceAuditorIdForMysql32(replierId));
      }
      sets.push("reply_time = NOW()");
    }
  }

  if (input.reply !== undefined) {
    sets.push("reply = ?");
    params.push(input.reply);
  }

  if (input.issueFingerprint !== undefined) {
    sets.push("issue_fingerprint = ?");
    params.push(input.issueFingerprint);
  }

  if (sets.length === 0) return getSysFeedbackById(feedbackId);

  sets.push("update_user_id = ?");
  params.push(coerceAuditorIdForMysql32(actorId));

  params.push(feedbackId);

  await pool.query<ResultSetHeader>(
    `UPDATE sys_feedback SET ${sets.join(", ")} WHERE feedback_id = ? AND is_deleted = 0`,
    params,
  );

  return getSysFeedbackById(feedbackId);
}

export async function softDeleteSysFeedback(feedbackId: string, actorId?: string): Promise<boolean> {
  const pool = getMysqlPool();
  const [res] = await pool.query<ResultSetHeader>(
    "UPDATE sys_feedback SET is_deleted = 1, update_user_id = ? WHERE feedback_id = ? AND is_deleted = 0",
    [coerceAuditorIdForMysql32(actorId), feedbackId],
  );
  return res.affectedRows > 0;
}

export async function markAsAutoTriaged(feedbackId: string, auditUrl: string, issueFingerprint?: string | null): Promise<boolean> {
  const pool = getMysqlPool();
  const [res] = await pool.query<ResultSetHeader>(
    `UPDATE sys_feedback
     SET status = 'AUTO_TRIAGED',
         reply = CONCAT(IFNULL(reply, ''), '\n[AI 分诊] 关联审计报告 ID: ', ?, '\n[AI 分诊] 审计链接: ', ?),
         issue_fingerprint = COALESCE(issue_fingerprint, ?),
         update_time = NOW()
     WHERE feedback_id = ?
       AND is_deleted = 0
       AND status = 'TODO'`,
    [issueFingerprint ?? '', auditUrl, issueFingerprint ?? '', feedbackId],
  );
  return res.affectedRows > 0;
}

export function generateFeedbackFingerprint(input: {
  title?: string;
  content?: string;
  url?: string;
  ua?: string;
  role?: string;
  errorStack?: string;
}): string {
  const raw = [input.title ?? '', input.content ?? '', input.url ?? '', input.ua ?? '', input.role ?? '', input.errorStack ?? ''].join('|');
  let h1 = 0x811c9dc5;
  for (let i = 0; i < raw.length; i += 1) {
    h1 ^= raw.charCodeAt(i);
    h1 = Math.imul(h1, 0x01000193);
  }
  return (`0000000${(h1 >>> 0).toString(16)}`).slice(-8);
}

export async function getGovernanceStats(): Promise<{
  totalNew: number;
  totalAutoTriaged: number;
  topFingerprints: Array<{ issueFingerprint: string; count: number }>;
}> {
  const pool = getMysqlPool();
  // 治理统计为全量视图，不做组织隔离（与 listSysFeedback 行为一致）
  const [countRows] = await pool.query<RowDataPacket[]>(
    `SELECT
       SUM(CASE WHEN UPPER(IFNULL(status, '')) = 'TODO' THEN 1 ELSE 0 END) AS totalNew,
       SUM(CASE WHEN UPPER(IFNULL(status, '')) = 'AUTO_TRIAGED' THEN 1 ELSE 0 END) AS totalAutoTriaged
     FROM sys_feedback
     WHERE is_deleted = 0`,
  );

  const [fingerprintRows] = await pool.query<RowDataPacket[]>(
    `SELECT
       issue_fingerprint AS issueFingerprint,
       COUNT(*) AS count
     FROM sys_feedback
     WHERE is_deleted = 0
       AND UPPER(IFNULL(status, '')) = 'AUTO_TRIAGED'
       AND issue_fingerprint IS NOT NULL
       AND issue_fingerprint <> ''
     GROUP BY issue_fingerprint
     ORDER BY count DESC, issue_fingerprint ASC
     LIMIT 5`,
  );

  return {
    totalNew: Number(countRows[0]?.totalNew ?? 0),
    totalAutoTriaged: Number(countRows[0]?.totalAutoTriaged ?? 0),
    topFingerprints: fingerprintRows.map((r) => ({ issueFingerprint: String(r.issueFingerprint), count: Number(r.count ?? 0) })),
  };
}
