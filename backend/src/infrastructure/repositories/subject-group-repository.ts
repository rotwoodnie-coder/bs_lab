import type { ResultSetHeader, RowDataPacket, PoolConnection } from "mysql2/promise";
import { allocateUniqueMysqlVarchar32Id } from "../ids/identifiable-varchar32.ts";
import { getMysqlPool } from "../mysql/mysql-client.ts";
import { recalculateSubjectTags } from "../../services/SubjectTagService.ts";

export type SubjectGroupStatus = "Y" | "N";
export type SubjectGroupType = "research_group" | "subject_group";

export type SubjectGroupRecord = {
  groupId: string;
  groupName: string;
  comments: string | null;
  status: SubjectGroupStatus;
  subjectId: string | null;
  ownerId: string | null;
  createUserId: string | null;
  createTime: string | null;
};

export type SubjectGroupMemberRecord = {
  seqId: string;
  groupId: string;
  userId: string;
  status: SubjectGroupStatus;
  createUserId: string | null;
  createTime: string | null;
};

export type SubjectGroupMembership = {
  groupId: string;
  groupName: string;
  status: SubjectGroupStatus;
  ownerId: string | null;
  /** 负责人展示名（sys_user.user_name） */
  ownerName: string | null;
  subjectId: string | null;
};

function rowToGroup(row: RowDataPacket): SubjectGroupRecord {
  return {
    groupId: String(row.groupId),
    groupName: String(row.groupName ?? ""),
    comments: row.comments ? String(row.comments) : null,
    status: (String(row.status ?? "Y").toUpperCase() === "N" ? "N" : "Y") as SubjectGroupStatus,
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
    status: (String(row.status ?? "Y").toUpperCase() === "N" ? "N" : "Y") as SubjectGroupStatus,
    createUserId: row.createUserId ? String(row.createUserId) : null,
    createTime: row.createTime ? String(row.createTime) : null,
  };
}

export async function listSubjectGroups(): Promise<SubjectGroupRecord[]> {
  const pool = getMysqlPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT group_id AS groupId, group_name AS groupName, comments, status, subject_id AS subjectId,
            owner_id AS ownerId, create_user_id AS createUserId, create_time AS createTime
     FROM subject_group
     ORDER BY create_time DESC`,
  );
  return rows.map(rowToGroup);
}

export async function getSubjectGroupById(groupId: string): Promise<SubjectGroupRecord | null> {
  const pool = getMysqlPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT group_id AS groupId, group_name AS groupName, comments, status, subject_id AS subjectId,
            owner_id AS ownerId, create_user_id AS createUserId, create_time AS createTime
     FROM subject_group WHERE group_id = ? LIMIT 1`,
    [groupId],
  );
  if (rows.length === 0) return null;
  return rowToGroup(rows[0]!);
}

export async function createSubjectGroup(input: { groupName: string; comments?: string | null; status?: SubjectGroupStatus; subjectId?: string | null; ownerId?: string | null }, actorId?: string): Promise<SubjectGroupRecord> {
  const pool = getMysqlPool();
  const groupId = await allocateUniqueMysqlVarchar32Id(pool, { table: "subject_group", column: "group_id", label: input.groupName });
  await pool.query<ResultSetHeader>(
    `INSERT INTO subject_group
      (group_id, group_name, comments, status, subject_id, owner_id, create_user_id, create_time)
     VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
    [groupId, input.groupName, input.comments ?? null, input.status ?? "Y", input.subjectId ?? null, input.ownerId ?? actorId ?? null, actorId ?? null],
  );
  const row = await getSubjectGroupById(groupId);
  if (!row) throw new Error("SUBJECT_GROUP_CREATE_FAILED");
  return row;
}

export async function patchSubjectGroup(groupId: string, input: { groupName?: string; comments?: string | null; status?: SubjectGroupStatus; subjectId?: string | null; ownerId?: string | null }, actorId?: string): Promise<SubjectGroupRecord> {
  const pool = getMysqlPool();
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
  const row = await getSubjectGroupById(groupId);
  if (!row) throw new Error("SUBJECT_GROUP_NOT_FOUND");
  return row;
}

export async function listSubjectGroupMembers(groupId: string): Promise<SubjectGroupMemberRecord[]> {
  const pool = getMysqlPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT seq_id AS seqId, group_id AS groupId, user_id AS userId, status,
            create_user_id AS createUserId, create_time AS createTime
     FROM subject_group_member WHERE group_id = ? ORDER BY create_time ASC`,
    [groupId],
  );
  return rows.map(rowToMember);
}

export async function listSubjectGroupsByMember(userId: string): Promise<SubjectGroupMembership[]> {
  const pool = getMysqlPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT g.group_id AS groupId, g.group_name AS groupName, g.status AS status,
            g.owner_id AS ownerId, g.subject_id AS subjectId,
            ou.user_name AS ownerUserName
     FROM subject_group_member m
     INNER JOIN subject_group g ON g.group_id = m.group_id
     LEFT JOIN sys_user ou ON ou.user_id = g.owner_id AND ou.is_deleted = 0
     WHERE m.user_id = ?
     ORDER BY g.create_time DESC`,
    [userId],
  );
  return rows.map((r) => {
    const row = r as RowDataPacket;
    const ownerRaw = row.ownerUserName ?? row.owner_user_name;
    return {
      groupId: String(row.groupId),
      groupName: String(row.groupName ?? ""),
      status: (String(row.status ?? "Y").toUpperCase() === "N" ? "N" : "Y") as SubjectGroupStatus,
      ownerId: row.ownerId ? String(row.ownerId) : null,
      ownerName: ownerRaw != null ? String(ownerRaw).trim() || null : null,
      subjectId: row.subjectId ? String(row.subjectId) : null,
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
    return { seqId, groupId, userId, status: "Y", createUserId: actorId ?? null, createTime: new Date().toISOString() };
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

export async function isSubjectGroupManager(args: { userId: string; groupId: string; role: string }): Promise<boolean> {
  const group = await getSubjectGroupById(args.groupId);
  if (!group) return false;
  return group.ownerId === args.userId || args.role === "SUPER_ADMIN";
}

export function canJoinSubjectGroup(args: { groupType: SubjectGroupType; userRole: string }): boolean {
  const role = args.userRole.trim().toUpperCase();
  if (args.groupType === "research_group") return role === "STUDENT" || role === "TEACHER" || role === "RESEARCHER";
  return role === "TEACHER" || role === "RESEARCHER";
}
