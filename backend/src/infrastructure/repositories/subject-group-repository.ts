import type { ResultSetHeader, RowDataPacket, PoolConnection } from "mysql2/promise";
import { allocateUniqueMysqlVarchar32Id } from "../ids/identifiable-varchar32.ts";
import { getMysqlPool } from "../mysql/mysql-client.ts";
import { recalculateSubjectTags } from "../../services/SubjectTagService.ts";
import type {
  SubjectGroupStatus,
  SubjectGroupReviewStatus,
  SubjectGroupType,
  SubjectGroupRecord,
  SubjectGroupMemberRecord,
  SubjectGroupMembership,
  CreateSubjectGroupInput,
  PatchSubjectGroupInput,
  PatchSubjectGroupReviewInput,
  SubjectGroupManagerCheck,
} from "../../domain/v2-group/v2-group-types.ts";

// 向下兼容导出
export type { SubjectGroupStatus, SubjectGroupReviewStatus, SubjectGroupType, SubjectGroupRecord, SubjectGroupMemberRecord, SubjectGroupMembership, CreateSubjectGroupInput, PatchSubjectGroupInput, PatchSubjectGroupReviewInput, SubjectGroupManagerCheck };

function rowToGroup(row: RowDataPacket): SubjectGroupRecord {
  return {
    groupId: String(row.groupId),
    groupName: String(row.groupName ?? ""),
    comments: row.comments ? String(row.comments) : null,
    status: (String(row.status ?? "Y").toUpperCase() === "N" ? "N" : "Y") as SubjectGroupStatus,
    reviewStatus: (String(row.reviewStatus ?? "t") as SubjectGroupReviewStatus),
    reviewUserId: row.reviewUserId ? String(row.reviewUserId) : null,
    reviewTime: row.reviewTime ? String(row.reviewTime) : null,
    reviewComments: row.reviewComments ? String(row.reviewComments) : null,
    rejectReason: row.rejectReason ? String(row.rejectReason) : null,
    subjectId: row.subjectId ? String(row.subjectId) : null,
    ownerId: row.ownerId ? String(row.ownerId) : null,
    createUserId: row.createUserId ? String(row.createUserId) : null,
    createTime: row.createTime ? String(row.createTime) : null,
  };
}

function rowToMember(row: RowDataPacket): SubjectGroupMemberRecord {
  return {
    seqId: String(row.seqId),
    groupId: String(row.groupId),
    userId: String(row.userId),
    role: "MEMBER" as "ADMIN" | "MEMBER",
    status: (String(row.status ?? "Y").toUpperCase() === "N" ? "N" : "Y") as SubjectGroupStatus,
    createUserId: row.createUserId ? String(row.createUserId) : null,
    createTime: row.createTime ? String(row.createTime) : null,
  };
}

export async function listSubjectGroups(): Promise<SubjectGroupRecord[]> {
  const pool = getMysqlPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT group_id AS groupId, group_name AS groupName, comments, status,
            review_status AS reviewStatus, review_user_id AS reviewUserId,
            review_time AS reviewTime, review_comments AS reviewComments,
            reject_reason AS rejectReason, subject_id AS subjectId,
            owner_id AS ownerId, create_user_id AS createUserId, create_time AS createTime
     FROM subject_group
     ORDER BY create_time DESC`,
  );
  return rows.map(rowToGroup);
}

export async function getSubjectGroupById(groupId: string): Promise<SubjectGroupRecord | null> {
  const pool = getMysqlPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT group_id AS groupId, group_name AS groupName, comments, status,
            review_status AS reviewStatus, review_user_id AS reviewUserId,
            review_time AS reviewTime, review_comments AS reviewComments,
            reject_reason AS rejectReason, subject_id AS subjectId,
            owner_id AS ownerId, create_user_id AS createUserId, create_time AS createTime
     FROM subject_group WHERE group_id = ? LIMIT 1`,
    [groupId],
  );
  if (rows.length === 0) return null;
  return rowToGroup(rows[0]!);
}

export async function createSubjectGroup(input: CreateSubjectGroupInput, actorId?: string): Promise<SubjectGroupRecord> {
  const pool = getMysqlPool();
  const groupId = await allocateUniqueMysqlVarchar32Id(pool, { table: "subject_group", column: "group_id", label: input.groupName });
  const ownerId = input.ownerId ?? actorId ?? null;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 插入教研组主记录
    await conn.query<ResultSetHeader>(
      `INSERT INTO subject_group
        (group_id, group_name, comments, status, subject_id, owner_id, create_user_id, create_time)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [groupId, input.groupName, input.comments ?? null, input.status ?? "Y", input.subjectId ?? null, ownerId, actorId ?? null],
    );

    // 自动将 owner 加入 member 表
    if (ownerId) {
      const [dup] = await conn.query<RowDataPacket[]>(
        `SELECT seq_id FROM subject_group_member WHERE group_id = ? AND user_id = ? LIMIT 1`,
        [groupId, ownerId],
      );
      if (dup.length === 0) {
        const memberSeqId = await allocateUniqueMysqlVarchar32Id(conn, { table: "subject_group_member", column: "seq_id", label: `${groupId}_${ownerId}` });
        await conn.query<ResultSetHeader>(
          `INSERT INTO subject_group_member (seq_id, group_id, user_id, status, create_user_id, create_time)
           VALUES (?, ?, ?, 'Y', ?, NOW())`,
          [memberSeqId, groupId, ownerId, actorId ?? null],
        );
      }
    }

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }

  const row = await getSubjectGroupById(groupId);
  if (!row) throw new Error("SUBJECT_GROUP_CREATE_FAILED");
  return row;
}

/**
 * 更新教研组属性。
 * 若 subjectId 发生变化，异步触发当前所有组员的学科标签重算（子业务域自动同步）。
 */
export async function patchSubjectGroup(groupId: string, input: PatchSubjectGroupInput, actorId?: string): Promise<SubjectGroupRecord> {
  const pool = getMysqlPool();

  // 先查旧记录，判断 subjectId 是否需要重算标签
  const oldGroup = await getSubjectGroupById(groupId);
  if (!oldGroup) throw new Error("SUBJECT_GROUP_NOT_FOUND");
  const subjectChanged = input.subjectId !== undefined && input.subjectId !== oldGroup.subjectId;

  const sets: string[] = [];
  const params: unknown[] = [];
  if (input.groupName !== undefined) { sets.push("group_name = ?"); params.push(input.groupName); }
  if (input.comments !== undefined) { sets.push("comments = ?"); params.push(input.comments); }
  if (input.status !== undefined) { sets.push("status = ?"); params.push(input.status); }
  if (input.subjectId !== undefined) { sets.push("subject_id = ?"); params.push(input.subjectId); }
  if (input.ownerId !== undefined) { sets.push("owner_id = ?"); params.push(input.ownerId); }
  if (sets.length > 0) {
    await pool.query<ResultSetHeader>(`UPDATE subject_group SET ${sets.join(", ")} WHERE group_id = ?`, [...params, groupId]);
  }

  // 学科变更：异步触发所有组员标签重算
  if (subjectChanged) {
    triggerAsyncSubjectTagRecalc(groupId);
  }

  const row = await getSubjectGroupById(groupId);
  if (!row) throw new Error("SUBJECT_GROUP_NOT_FOUND");
  return row;
}

/** 异步触发组员学科标签重算，不阻塞 PATCH 响应 */
function triggerAsyncSubjectTagRecalc(groupId: string): void {
  process.nextTick(async () => {
    try {
      const members = await listSubjectGroupMembers(groupId);
      if (members.length === 0) return;
      const pool = getMysqlPool();
      const conn = await pool.getConnection();
      try {
        for (const m of members) {
          await recalculateSubjectTags(conn, m.userId);
        }
      } finally {
        conn.release();
      }
    } catch (err) {
      console.error(`[subject-group] async tag recalc failed for group ${groupId}:`, err);
    }
  });
}

export async function listSubjectGroupMembers(groupId: string): Promise<SubjectGroupMemberRecord[]> {
  const pool = getMysqlPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT m.seq_id AS seqId, m.group_id AS groupId, m.user_id AS userId, m.status,
            m.create_user_id AS createUserId, m.create_time AS createTime,
            r.role_name AS roleName
     FROM subject_group_member m
     LEFT JOIN sys_user u ON u.user_id = m.user_id
     LEFT JOIN data_role r ON r.role_id = u.user_role_id
     WHERE m.group_id = ? ORDER BY m.create_time ASC`,
    [groupId],
  );
  return rows.map((r) => {
    const row = r as RowDataPacket;
    const roleName = row.roleName ? String(row.roleName).trim().toLowerCase() : "";
    // 若系统身份为教研员（role_name 含"教研"），则组内角色为 ADMIN，否则为 MEMBER
    const isResearcher = roleName.includes("教研") || roleName.includes("researcher");
    return {
      seqId: String(row.seqId),
      groupId: String(row.groupId),
      userId: String(row.userId),
      role: isResearcher ? "ADMIN" : ("MEMBER" as "ADMIN" | "MEMBER"),
      status: (String(row.status ?? "Y").toUpperCase() === "N" ? "N" : "Y") as SubjectGroupStatus,
      createUserId: row.createUserId ? String(row.createUserId) : null,
      createTime: row.createTime ? String(row.createTime) : null,
    };
  });
}

/**
 * 查询用户所属或负责的教研组。
 * 修正为同时匹配 member 关系和 owner 关系，确保 owner 不在 member 表中时也被包含。
 */
export async function listSubjectGroupsByMember(userId: string): Promise<SubjectGroupMembership[]> {
  const pool = getMysqlPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT g.group_id AS groupId, g.group_name AS groupName, g.status AS status,
            g.review_status AS reviewStatus, g.review_user_id AS reviewUserId,
            g.review_time AS reviewTime, g.review_comments AS reviewComments,
            g.reject_reason AS rejectReason,
            g.owner_id AS ownerId, g.subject_id AS subjectId, g.comments,
            g.create_time AS createTime,
            ou.user_name AS ownerUserName
     FROM subject_group g
     LEFT JOIN subject_group_member m ON m.group_id = g.group_id AND m.user_id = ?
     LEFT JOIN sys_user ou ON ou.user_id = g.owner_id AND ou.is_deleted = 0
     WHERE m.user_id = ? OR g.owner_id = ?
     ORDER BY g.create_time DESC`,
    [userId, userId, userId],
  );
  return rows.map((r) => {
    const row = r as RowDataPacket;
    const ownerRaw = row.ownerUserName ?? row.owner_user_name;
    return {
      groupId: String(row.groupId),
      groupName: String(row.groupName ?? ""),
      comments: row.comments ? String(row.comments) : null,
      status: (String(row.status ?? "Y").toUpperCase() === "N" ? "N" : "Y") as SubjectGroupStatus,
      reviewStatus: (String(row.reviewStatus ?? "t") as SubjectGroupReviewStatus),
      reviewUserId: row.reviewUserId ? String(row.reviewUserId) : null,
      reviewTime: row.reviewTime ? String(row.reviewTime) : null,
      reviewComments: row.reviewComments ? String(row.reviewComments) : null,
      rejectReason: row.rejectReason ? String(row.rejectReason) : null,
      ownerId: row.ownerId ? String(row.ownerId) : null,
      ownerName: ownerRaw != null ? String(ownerRaw).trim() || null : null,
      subjectId: row.subjectId ? String(row.subjectId) : null,
      createTime: row.createTime ? String(row.createTime) : null,
    };
  });
}

/**
 * 查询用户未加入的教研组（用于"可加入的教研组"列表）。
 */
export async function listSubjectGroupsNotJoined(userId: string): Promise<SubjectGroupMembership[]> {
  const pool = getMysqlPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT g.group_id AS groupId, g.group_name AS groupName, g.status AS status,
            g.review_status AS reviewStatus, g.review_user_id AS reviewUserId,
            g.review_time AS reviewTime, g.review_comments AS reviewComments,
            g.reject_reason AS rejectReason,
            g.owner_id AS ownerId, g.subject_id AS subjectId, g.comments,
            g.create_time AS createTime,
            ou.user_name AS ownerUserName
     FROM subject_group g
     LEFT JOIN subject_group_member m ON m.group_id = g.group_id AND m.user_id = ?
     LEFT JOIN sys_user ou ON ou.user_id = g.owner_id AND ou.is_deleted = 0
     WHERE m.user_id IS NULL AND g.owner_id != ?
       AND g.status = 'Y'
     ORDER BY g.create_time DESC`,
    [userId, userId],
  );
  return rows.map((r) => {
    const row = r as RowDataPacket;
    const ownerRaw = row.ownerUserName ?? row.owner_user_name;
    return {
      groupId: String(row.groupId),
      groupName: String(row.groupName ?? ""),
      comments: row.comments ? String(row.comments) : null,
      status: (String(row.status ?? "Y").toUpperCase() === "N" ? "N" : "Y") as SubjectGroupStatus,
      reviewStatus: (String(row.reviewStatus ?? "t") as SubjectGroupReviewStatus),
      reviewUserId: row.reviewUserId ? String(row.reviewUserId) : null,
      reviewTime: row.reviewTime ? String(row.reviewTime) : null,
      reviewComments: row.reviewComments ? String(row.reviewComments) : null,
      rejectReason: row.rejectReason ? String(row.rejectReason) : null,
      ownerId: row.ownerId ? String(row.ownerId) : null,
      ownerName: ownerRaw != null ? String(ownerRaw).trim() || null : null,
      subjectId: row.subjectId ? String(row.subjectId) : null,
      createTime: row.createTime ? String(row.createTime) : null,
    };
  });
}

async function ensureNoDuplicateMember(conn: PoolConnection, groupId: string, userId: string): Promise<void> {
  const [rows] = await conn.query<RowDataPacket[]>(
    `SELECT seq_id AS seqId FROM subject_group_member WHERE group_id = ? AND user_id = ? LIMIT 1`,
    [groupId, userId],
  );
  if (rows.length > 0) throw new Error("SUBJECT_GROUP_MEMBER_EXISTS");
}

/**
 * 添加课题组成员（事务保护）。
 * 主写入与标签重算在同一个事务中，防止"长短脚"。
 */
export async function addSubjectGroupMember(groupId: string, userId: string, actorId?: string): Promise<SubjectGroupMemberRecord> {
  const pool = getMysqlPool();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await ensureNoDuplicateMember(conn, groupId, userId);

    // 查用户系统身份，判断是否为教研员
    const [userRows] = await conn.query<RowDataPacket[]>(
      `SELECT r.role_name AS roleName
       FROM sys_user u
       LEFT JOIN data_role r ON r.role_id = u.user_role_id
       WHERE u.user_id = ? AND u.is_deleted = 0
       LIMIT 1`,
      [userId],
    );
    const roleName = userRows.length > 0 && userRows[0]!.roleName
      ? String(userRows[0]!.roleName).trim().toLowerCase() : "";
    const isResearcher = roleName.includes("教研") || roleName.includes("researcher");

    const seqId = await allocateUniqueMysqlVarchar32Id(conn, { table: "subject_group_member", column: "seq_id", label: `${groupId}_${userId}` });
    await conn.query<ResultSetHeader>(
      `INSERT INTO subject_group_member
        (seq_id, group_id, user_id, status, create_user_id, create_time)
       VALUES (?, ?, ?, 'Y', ?, NOW())`,
      [seqId, groupId, userId, actorId ?? null],
    );

    // 标签冗余：重新计算该用户所有 Subj_* 标签（课题组维度）
    await recalculateSubjectTags(conn, userId);

    await conn.commit();
    return { seqId, groupId, userId, role: isResearcher ? "ADMIN" : "MEMBER" as "ADMIN" | "MEMBER", status: "Y", createUserId: actorId ?? null, createTime: new Date().toISOString() };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

/**
 * 移除课题组成员（事务保护）。
 * 删除与标签重算在同一个事务中，防止"长短脚"。
 */
export async function removeSubjectGroupMember(seqId: string): Promise<void> {
  const pool = getMysqlPool();

  // 先查 userId（删除后无法追溯），在事务外只读查询，安全
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT user_id FROM subject_group_member WHERE seq_id = ? LIMIT 1`,
    [seqId],
  );

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await conn.query(`DELETE FROM subject_group_member WHERE seq_id = ?`, [seqId]);

    if (rows.length > 0) {
      const userId = String((rows[0] as RowDataPacket).user_id ?? "");
      if (userId) {
        // 标签冗余：重新计算标签（存在性校验自动处理移除）
        await recalculateSubjectTags(conn, userId);
      }
    }

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

export async function transferSubjectGroupOwner(groupId: string, newOwnerId: string, actorId?: string): Promise<SubjectGroupRecord> {
  const pool = getMysqlPool();
  await pool.query(`UPDATE subject_group SET owner_id = ? WHERE group_id = ?`, [newOwnerId, groupId]);
  const row = await getSubjectGroupById(groupId);
  if (!row) throw new Error("SUBJECT_GROUP_NOT_FOUND");
  return row;
}

/**
 * 校验是否为教研组的管理员（owner 或 超管）。
 */
export async function isSubjectGroupManager(args: SubjectGroupManagerCheck): Promise<boolean> {
  const group = await getSubjectGroupById(args.groupId);
  if (!group) return false;
  return group.ownerId === args.userId || args.role === "SUPER_ADMIN";
}

/**
 * 校验是否有权删除教研组：(isOwner && isResearcher) || isSuperAdmin
 */
export async function canDeleteSubjectGroup(args: SubjectGroupManagerCheck): Promise<boolean> {
  const group = await getSubjectGroupById(args.groupId);
  if (!group) return false;
  if (args.role === "SUPER_ADMIN") return true;
  const normalizedRole = normalizeRoleKeyForDelete(args.role);
  return group.ownerId === args.userId && normalizedRole === "RESEARCHER";
}

function normalizeRoleKeyForDelete(role: string): string {
  const raw = String(role ?? "").trim().toLowerCase();
  if (!raw) return "";
  if (["teacher", "教师"].includes(raw)) return "TEACHER";
  if (["researcher", "教研员", "教研"].includes(raw)) return "RESEARCHER";
  if (["student", "学生"].includes(raw)) return "STUDENT";
  if (["super_admin", "system_admin", "系统管理员", "超级管理员"].includes(raw)) return "SUPER_ADMIN";
  if (["district_admin", "区管理员", "区级管理员"].includes(raw)) return "DISTRICT_ADMIN";
  if (["school_admin", "学校管理员", "管理员"].includes(raw)) return "SCHOOL_ADMIN";
  if (["parent", "家长"].includes(raw)) return "PARENT";
  return raw.toUpperCase();
}

/**
 * 删除教研组（级联删除成员记录）。
 * 事务内先删 member，再删 group。
 */
export async function deleteSubjectGroup(groupId: string): Promise<void> {
  const pool = getMysqlPool();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query(`DELETE FROM subject_group_member WHERE group_id = ?`, [groupId]);
    await conn.query(`DELETE FROM subject_group WHERE group_id = ?`, [groupId]);
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

export function canJoinSubjectGroup(args: { groupType: SubjectGroupType; userRole: string }): boolean {
  const role = args.userRole.trim().toUpperCase();
  if (args.groupType === "research_group") return role === "STUDENT" || role === "TEACHER" || role === "RESEARCHER";
  return role === "TEACHER" || role === "RESEARCHER";
}

/**
 * 教研审核：将 subject_group 的 review_status 由 t 更新为 y/n，并写入审核人、时间与驳回理由。
 */
export async function patchSubjectGroupForReview(
  groupId: string,
  input: PatchSubjectGroupReviewInput,
  actorId?: string,
): Promise<SubjectGroupRecord> {
  const pool = getMysqlPool();

  // 检查当前状态必须为待审核
  const cur = await getSubjectGroupById(groupId);
  if (!cur) throw new Error("NOT_FOUND");
  if (cur.reviewStatus !== "t") throw new Error("NOT_PENDING_REVIEW");

  if (input.reviewStatus === "n") {
    const raw = (input.rejectReason ?? "").trim();
    if (raw.length < 4) throw new Error("REJECT_REASON_TOO_SHORT");
    await pool.query(
      `UPDATE subject_group SET
         review_status = ?, review_user_id = ?, review_time = NOW(),
         reject_reason = ?, review_comments = ?,
         status = 'NORMAL'
       WHERE group_id = ?`,
      [input.reviewStatus, actorId ?? null, raw, raw, groupId],
    );
  } else {
    // 通过：只标记 review_status，status 保持 NORMAL
    await pool.query(
      `UPDATE subject_group SET
         review_status = ?, review_user_id = ?, review_time = NOW(),
         reject_reason = NULL, review_comments = NULL
       WHERE group_id = ?`,
      [input.reviewStatus, actorId ?? null, groupId],
    );
  }

  const row = await getSubjectGroupById(groupId);
  if (!row) throw new Error("NOT_FOUND");
  return row;
}

/**
 * 查询待审核/已通过/已驳回的课题组列表（审核工作台专用）。
 */
export async function listSubjectGroupsForReview(): Promise<SubjectGroupMembership[]> {
  const pool = getMysqlPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT g.group_id AS groupId, g.group_name AS groupName, g.status AS status,
            g.review_status AS reviewStatus, g.review_user_id AS reviewUserId,
            g.review_time AS reviewTime, g.review_comments AS reviewComments,
            g.reject_reason AS rejectReason,
            g.owner_id AS ownerId, g.subject_id AS subjectId, g.comments,
            g.create_time AS createTime,
            ou.user_name AS ownerUserName
     FROM subject_group g
     LEFT JOIN sys_user ou ON ou.user_id = g.owner_id AND ou.is_deleted = 0
     ORDER BY g.create_time DESC`,
  );
  return rows.map((r) => {
    const row = r as RowDataPacket;
    const ownerRaw = row.ownerUserName ?? row.owner_user_name;
    return {
      groupId: String(row.groupId),
      groupName: String(row.groupName ?? ""),
      comments: row.comments ? String(row.comments) : null,
      status: (String(row.status ?? "Y").toUpperCase() === "N" ? "N" : "Y") as SubjectGroupStatus,
      reviewStatus: (String(row.reviewStatus ?? "t") as SubjectGroupReviewStatus),
      reviewUserId: row.reviewUserId ? String(row.reviewUserId) : null,
      reviewTime: row.reviewTime ? String(row.reviewTime) : null,
      reviewComments: row.reviewComments ? String(row.reviewComments) : null,
      rejectReason: row.rejectReason ? String(row.rejectReason) : null,
      ownerId: row.ownerId ? String(row.ownerId) : null,
      ownerName: ownerRaw != null ? String(ownerRaw).trim() || null : null,
      subjectId: row.subjectId ? String(row.subjectId) : null,
      createTime: row.createTime ? String(row.createTime) : null,
    };
  });
}
