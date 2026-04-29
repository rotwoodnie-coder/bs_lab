/**
 * 消息推送服务
 *
 * 核心原则：
 *   1. 推送按 role_id（含 Subj_* 学科影子角色）路由，禁止硬编码 UID 循环。
 *   2. 消息系统是 data_role 的"纯消费者"——只读查询，禁止任何 INSERT/UPDATE data_role。
 *   3. 职称（pref_title）不是推送路由依据。
 *
 * 支持三种推送范围模式：
 *   ByRole    — 按 role_id 匹配 sys_user_role（Subj_% 前缀自动识别为学科路由）
 *   ByUserIds — 精确用户列表
 *   ByOrg     — 按组织树查找用户（仅班级级，不递归）
 */
import type { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { allocateUniqueMysqlVarchar32Id } from "../infrastructure/ids/identifiable-varchar32.ts";
import { getMysqlPool } from "../infrastructure/mysql/mysql-client.ts";
import { MSG_TYPE, type MsgType, type PushTarget } from "../domain/v2-sys/v2-msg-constants.ts";

/** 单条消息推送入参 */
export type PushMessageInput = {
  msgType: MsgType;
  bizType?: string | null;
  msgContent: string;
  senderUserId?: string | null;
  target: PushTarget;
};

/** 推送结果 */
export type PushMessageResult = {
  sentCount: number;
  msgIds: string[];
};

/**
 * 批量推送消息。
 * 基于 Role 标签广播机制，绝不循环逐条 INSERT。
 */
export async function pushMessage(input: PushMessageInput): Promise<PushMessageResult> {
  const pool = getMysqlPool();
  const receiverUserIds = await resolveReceiverUserIds(input.target);

  if (receiverUserIds.length === 0) {
    return { sentCount: 0, msgIds: [] };
  }

  const msgIds: string[] = [];
  const now = new Date();

  // 批量 INSERT（逐条，但避免循环中 SELECT 分配 ID 的额外开销）
  for (const userId of receiverUserIds) {
    const msgId = await allocateUniqueMysqlVarchar32Id(pool, {
      table: "sys_msg",
      column: "msg_id",
      label: `msg_${input.msgType}_${userId.slice(0, 16)}`,
    });
    msgIds.push(msgId);
  }

  // 批量写入（VALUES 多行）
  const valuesSql = msgIds
    .map((_, i) => `(?, ?, ?, ?, ?, '0', NOW())`)
    .join(", ");
  const flatParams: unknown[] = [];
  for (let i = 0; i < receiverUserIds.length; i++) {
    flatParams.push(
      msgIds[i],
      receiverUserIds[i],
      input.senderUserId ?? null,
      input.msgType,
      input.bizType ?? null,
      input.msgContent,
    );
  }

  await pool.query<ResultSetHeader>(
    `INSERT INTO sys_msg (msg_id, receiver_user_id, sender_user_id, msg_type_id, biz_type, msg_content, read_tag, send_time)
     VALUES ${valuesSql}`,
    flatParams,
  );

  return { sentCount: receiverUserIds.length, msgIds };
}

/**
 * 解析推送目标为用户 ID 列表。
 *
 * ByRole 模式：
 *   - role_id 以 Subj_ 开头的，视为学科影子角色 → 查 sys_user_role
 *   - role_id 以 Role_ 开头的，视为宪法身份 → 查 sys_user_role
 *   - 不限于 Role_/Subj_ 前缀（兼容扩展）
 *
 * ByUserIds 模式：直接返回。
 * ByOrg 模式：查班级组织下的用户。
 */
async function resolveReceiverUserIds(target: PushTarget): Promise<string[]> {
  const pool = getMysqlPool();

  if (target.mode === "ByUserIds") {
    return target.userIds;
  }

  if (target.mode === "ByRole") {
    const rid = target.roleId.trim();
    if (!rid) return [];

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT DISTINCT user_id FROM sys_user_role WHERE role_id = ?`,
      [rid],
    );
    return rows.map((r) => String((r as RowDataPacket).user_id ?? ""));
  }

  if (target.mode === "ByOrg") {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT user_id FROM sys_user WHERE user_org_id = ? AND is_deleted = 0`,
      [target.orgId],
    );
    return rows.map((r) => String((r as RowDataPacket).user_id ?? ""));
  }

  return [];
}
