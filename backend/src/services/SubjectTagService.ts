/**
 * SubjectTagService：学科标签重算服务
 *
 * 负责计算用户在 sys_user_role 中的 Subj_* 学科标签。
 * 数据来源（UNION 并集，天然去重）：
 *   来源 A：Teacher_Class（授课关系）
 *   来源 B：subject_group_member → subject_group（课题组归属）
 *
 * 基于存在性证明：只要任一来源存在，标签就保留。
 * 退出课题组但仍在授课 → 标签保留。停止授课但仍在课题组 → 标签保留。
 * 两处都断开 → 标签随下一次重算自动移除。
 *
 * Subj_* 前缀约定：
 *   sys_user_role.role_id 中存储 Subj_{subjectId}，遵守三层身份架构。
 *   这些记录 org_id = NULL，不参与班级维度查询（INNER JOIN sys_org 自动过滤）。
 *   data_role 中必须有对应的种子条目（由 migration 0047 保证）。
 */
import type { PoolConnection, RowDataPacket } from "mysql2/promise";

// ─── 状态常量（消除硬编码，与 INSERT 中的实际值保持一致） ──
/** subject_group 状态：活跃 */
export const SG_STATUS_ACTIVE = "Y";
/** subject_group_member 状态：已加入 */
export const SGM_STATUS_JOINED = "Y";

// ─── Subj_ 前缀常量 ──
/** Subj_ 前缀：用于构建学科影子角色的 role_id */
export const SUBJ_PREFIX = "Subj_";

// ─── 错误码 ──
export type SubjectTagErrorCode =
  | "SUBJECT_TAG_CALC_FAILED"
  | "SUBJECT_TAG_DATA_SOURCE_ERROR";

export class SubjectTagServiceError extends Error {
  code: SubjectTagErrorCode;
  constructor(code: SubjectTagErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

/**
 * 构建 Subj_ 前缀的角色 ID
 * 示例：subjectId="de7f29a1" → roleId="Subj_de7f29a1"
 */
export function buildSubjectRoleId(subjectId: string): string {
  return `${SUBJ_PREFIX}${subjectId}`;
}

/**
 * 从 role_id 还原 subjectId
 * 示例：roleId="Subj_de7f29a1" → "de7f29a1"
 */
export function parseSubjectIdFromRoleId(roleId: string): string | null {
  if (!roleId.startsWith(SUBJ_PREFIX)) return null;
  return roleId.slice(SUBJ_PREFIX.length) || null;
}

/**
 * 重新计算用户在 sys_user_role 中的 Subj_* 学科标签。
 *
 * @param conn - 已有事务的数据库连接（调用方保证事务已 begin）
 * @param userId - 目标用户 ID
 * @throws SubjectTagServiceError
 *
 * 注：本函数应在调用方的事务中执行。调用方负责 beginTransaction / commit / rollback。
 */
export async function recalculateSubjectTags(
  conn: PoolConnection,
  userId: string,
): Promise<void> {
  // 1. 清除旧标签
  await conn.query(
    `DELETE FROM sys_user_role WHERE user_id = ? AND role_id LIKE ?`,
    [userId, `${SUBJ_PREFIX}%`],
  );

  // 2. 从 Teacher_Class 和 subject_group_member 计算学科并集
  //    注：sgm.status 与 INSERT 值一致（'Y'），而非幻影值 'JOINED'/'NORMAL'
  const [rows] = await conn.query<RowDataPacket[]>(
    `SELECT DISTINCT subject_id FROM (
      SELECT subject_id FROM Teacher_Class WHERE teacher_id = ?
      UNION
      SELECT sg.subject_id FROM subject_group_member sgm
      INNER JOIN subject_group sg ON sg.group_id = sgm.group_id
      WHERE sgm.user_id = ? AND sgm.status = ? AND sg.status = ?
    ) t WHERE subject_id IS NOT NULL AND subject_id != ''`,
    [userId, userId, SGM_STATUS_JOINED, SG_STATUS_ACTIVE],
  );

  // 3. 写入新标签（Subj_ 前缀）
  for (const row of rows) {
    const subjectId = String((row as RowDataPacket).subject_id ?? "").trim();
    if (!subjectId) continue;

    const roleId = buildSubjectRoleId(subjectId);
    const seqId = `${userId}-${roleId}`.slice(0, 32);
    await conn.query(
      `INSERT IGNORE INTO sys_user_role (seq_id, user_id, role_id, org_id, create_time)
       VALUES (?, ?, ?, NULL, NOW())`,
      [seqId, userId, roleId],
    );
  }
}
