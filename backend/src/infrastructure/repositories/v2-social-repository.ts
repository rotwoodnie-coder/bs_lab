/**
 * V2 社交互动 + 积分激励仓库
 * 对应表：social_like / social_notlike / social_collection / social_evaluate /
 *         scale_log / scale_title
 */
import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import { allocateUniqueMysqlVarchar32Id } from "../ids/identifiable-varchar32.ts";
import { getMysqlPool } from "../mysql/mysql-client.ts";
import type {
  SocialLikeRecord,
  SocialCollectionRecord,
  SocialEvaluateRecord,
  WriteEvaluateInput,
  ExpSocialStats,
  WriteScaleLogInput,
  ScaleLogRecord,
} from "../../domain/v2-social/v2-social-types.ts";

function nowStr(): string {
  return new Date().toISOString().replace("T", " ").slice(0, 19);
}

// ─── 点赞 ────────────────────────────────────────────────

export async function toggleLike(expId: string, userId: string): Promise<{ liked: boolean }> {
  const pool = getMysqlPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT seq_id FROM social_like WHERE exp_id = ? AND user_id = ?`,
    [expId, userId],
  );
  if (rows.length > 0) {
    await pool.query(`DELETE FROM social_like WHERE exp_id = ? AND user_id = ?`, [expId, userId]);
    await pool.query(
      `UPDATE exp_msg SET like_num = GREATEST(0, like_num - 1) WHERE exp_id = ?`, [expId],
    );
    return { liked: false };
  }
  const seqId = await allocateUniqueMysqlVarchar32Id(pool, {
    table: "social_like",
    column: "seq_id",
    label: `like_${expId}_${userId}`,
  });
  await pool.query(
    `INSERT INTO social_like (seq_id, exp_id, user_id, create_time) VALUES (?, ?, ?, ?)`,
    [seqId, expId, userId, nowStr()],
  );
  await pool.query(
    `UPDATE exp_msg SET like_num = like_num + 1 WHERE exp_id = ?`, [expId],
  );
  return { liked: true };
}

export async function toggleNotlike(expId: string, userId: string): Promise<{ notliked: boolean }> {
  const pool = getMysqlPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT seq_id FROM social_notlike WHERE exp_id = ? AND user_id = ?`,
    [expId, userId],
  );
  if (rows.length > 0) {
    await pool.query(`DELETE FROM social_notlike WHERE exp_id = ? AND user_id = ?`, [expId, userId]);
    await pool.query(
      `UPDATE exp_msg SET notlike_num = GREATEST(0, notlike_num - 1) WHERE exp_id = ?`, [expId],
    );
    return { notliked: false };
  }
  const seqId = await allocateUniqueMysqlVarchar32Id(pool, {
    table: "social_notlike",
    column: "seq_id",
    label: `notlike_${expId}_${userId}`,
  });
  await pool.query(
    `INSERT INTO social_notlike (seq_id, exp_id, user_id, create_time) VALUES (?, ?, ?, ?)`,
    [seqId, expId, userId, nowStr()],
  );
  await pool.query(
    `UPDATE exp_msg SET notlike_num = notlike_num + 1 WHERE exp_id = ?`, [expId],
  );
  return { notliked: true };
}

// ─── 收藏 ────────────────────────────────────────────────

export async function toggleCollection(
  expId: string,
  userId: string,
): Promise<{ collected: boolean }> {
  const pool = getMysqlPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT seq_id FROM social_collection WHERE exp_id = ? AND user_id = ?`,
    [expId, userId],
  );
  if (rows.length > 0) {
    await pool.query(
      `DELETE FROM social_collection WHERE exp_id = ? AND user_id = ?`, [expId, userId],
    );
    await pool.query(
      `UPDATE exp_msg SET collection_num = GREATEST(0, collection_num - 1) WHERE exp_id = ?`,
      [expId],
    );
    return { collected: false };
  }
  const seqId = await allocateUniqueMysqlVarchar32Id(pool, {
    table: "social_collection",
    column: "seq_id",
    label: `collect_${expId}_${userId}`,
  });
  await pool.query(
    `INSERT INTO social_collection (seq_id, exp_id, user_id, create_time) VALUES (?, ?, ?, ?)`,
    [seqId, expId, userId, nowStr()],
  );
  await pool.query(
    `UPDATE exp_msg SET collection_num = collection_num + 1 WHERE exp_id = ?`, [expId],
  );
  return { collected: true };
}

// ─── 评价 ────────────────────────────────────────────────

export async function addEvaluate(input: WriteEvaluateInput): Promise<SocialEvaluateRecord> {
  const pool = getMysqlPool();
  const seqId = await allocateUniqueMysqlVarchar32Id(pool, {
    table: "social_evaluate",
    column: "seq_id",
    label: `eval_${input.expId}_${input.userId}_${(input.evaluateContent ?? "").slice(0, 40)}`,
  });
  await pool.query<ResultSetHeader>(
    `INSERT INTO social_evaluate (seq_id, exp_id, user_id, evaluate_content, evaluate_url, create_time)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [seqId, input.expId, input.userId, input.evaluateContent ?? null, input.evaluateUrl ?? null, nowStr()],
  );
  await pool.query(
    `UPDATE exp_msg SET evaluate_num = evaluate_num + 1 WHERE exp_id = ?`, [input.expId],
  );
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM social_evaluate WHERE seq_id = ?`, [seqId],
  );
  const r = rows[0]! as RowDataPacket;
  return {
    seqId: String(r.seq_id), expId: String(r.exp_id), userId: String(r.user_id),
    evaluateContent: r.evaluate_content ? String(r.evaluate_content) : null,
    evaluateUrl: r.evaluate_url ? String(r.evaluate_url) : null,
    createTime: r.create_time ? String(r.create_time) : null,
  };
}

export async function listEvaluates(expId: string): Promise<SocialEvaluateRecord[]> {
  const pool = getMysqlPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM social_evaluate WHERE exp_id = ? ORDER BY create_time DESC`, [expId],
  );
  return (rows as RowDataPacket[]).map((r) => ({
    seqId: String(r.seq_id), expId: String(r.exp_id), userId: String(r.user_id),
    evaluateContent: r.evaluate_content ? String(r.evaluate_content) : null,
    evaluateUrl: r.evaluate_url ? String(r.evaluate_url) : null,
    createTime: r.create_time ? String(r.create_time) : null,
  }));
}

export async function getSocialStats(expId: string, userId?: string): Promise<ExpSocialStats> {
  const pool = getMysqlPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT like_num, notlike_num, collection_num, evaluate_num FROM exp_msg WHERE exp_id = ?`,
    [expId],
  );
  const base = (rows[0] as RowDataPacket) ?? { like_num: 0, notlike_num: 0, collection_num: 0, evaluate_num: 0 };
  let likedByMe: boolean | undefined;
  let collectedByMe: boolean | undefined;
  if (userId) {
    const [lr] = await pool.query<RowDataPacket[]>(
      `SELECT 1 FROM social_like WHERE exp_id = ? AND user_id = ? LIMIT 1`, [expId, userId],
    );
    const [cr] = await pool.query<RowDataPacket[]>(
      `SELECT 1 FROM social_collection WHERE exp_id = ? AND user_id = ? LIMIT 1`, [expId, userId],
    );
    likedByMe = lr.length > 0;
    collectedByMe = cr.length > 0;
  }
  return {
    expId,
    likeCount: Number(base.like_num ?? 0),
    notlikeCount: Number(base.notlike_num ?? 0),
    collectionCount: Number(base.collection_num ?? 0),
    evaluateCount: Number(base.evaluate_num ?? 0),
    likedByMe,
    collectedByMe,
  };
}

// ─── 积分 ────────────────────────────────────────────────

export async function writeScaleLog(input: WriteScaleLogInput): Promise<ScaleLogRecord> {
  const pool = getMysqlPool();
  const seqId = await allocateUniqueMysqlVarchar32Id(pool, {
    table: "scale_log",
    column: "seq_id",
    label: `scale_${input.userId}_${input.scaleSource}_${input.scaleNum}`,
  });
  await pool.query<ResultSetHeader>(
    `INSERT INTO scale_log (seq_id, user_id, scale_source, scale_num, create_time)
     VALUES (?, ?, ?, ?, ?)`,
    [seqId, input.userId, input.scaleSource, input.scaleNum, nowStr()],
  );
  await pool.query(
    `UPDATE sys_user SET per_score = per_score + ? WHERE user_id = ?`,
    [input.scaleNum, input.userId],
  );
  return { seqId, userId: input.userId, scaleSource: input.scaleSource, scaleNum: input.scaleNum, createTime: nowStr() };
}

export async function listScaleLogs(userId: string): Promise<ScaleLogRecord[]> {
  const pool = getMysqlPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM scale_log WHERE user_id = ? ORDER BY create_time DESC LIMIT 100`, [userId],
  );
  return (rows as RowDataPacket[]).map((r) => ({
    seqId: String(r.seq_id), userId: String(r.user_id),
    scaleSource: r.scale_source ? String(r.scale_source) : null,
    scaleNum: Number(r.scale_num ?? 0),
    createTime: r.create_time ? String(r.create_time) : null,
  }));
}
