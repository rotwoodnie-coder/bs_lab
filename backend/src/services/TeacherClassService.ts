/**
 * 教师授课班级关系：`Teacher_Class` 专用表（teacher_id + class_org_id + subject_id 三元组唯一）。
 * 不再经过 `sys_user_role` + `data_role` 的间接映射。
 */
import type { PoolConnection, RowDataPacket } from "mysql2/promise";

import { V2_ORG_TYPE_IDS } from "../domain/v2-sys/v2-org-type-constants.ts";
import {
  assertOrgIsActiveClass,
  assertSubjectInDictionary,
  assertUserExists,
} from "../domain/v2-sys/teaching-user-role-bind.ts";
import { allocateUniqueMysqlVarchar32Id } from "../infrastructure/ids/identifiable-varchar32.ts";

export type TeacherRelationInput = {
  classOrgId: string;
  subjectId: string;
};

export type BindTeacherClassRoleInput = {
  userId: string;
  orgId: string;
  subjectId: string;
};

/** 单条写入 Teacher_Class（幂等：同一 teacher/class/subject 已存在则跳过） */
export async function bindTeacherClassRole(conn: PoolConnection, input: BindTeacherClassRoleInput): Promise<void> {
  await assertUserExists(conn, input.userId);
  await assertOrgIsActiveClass(conn, input.orgId, V2_ORG_TYPE_IDS.class);
  await assertSubjectInDictionary(conn, input.subjectId);

  const [dup] = await conn.query<RowDataPacket[]>(
    `SELECT seq_id FROM Teacher_Class WHERE teacher_id = ? AND class_org_id = ? AND subject_id = ? LIMIT 1 FOR UPDATE`,
    [input.userId, input.orgId, input.subjectId],
  );
  if (dup.length > 0) return;

  const seqId = await allocateUniqueMysqlVarchar32Id(conn, {
    table: "Teacher_Class",
    column: "seq_id",
    label: `tc_${input.userId}_${input.orgId}_${input.subjectId}`,
  });
  await conn.query(
    `INSERT INTO Teacher_Class (seq_id, teacher_id, class_org_id, subject_id, status, create_time)
     VALUES (?, ?, ?, ?, 'y', NOW())`,
    [seqId, input.userId, input.orgId, input.subjectId],
  );
}

/** 整包替换教师的全部授课关系（删除 + 批量插入） */
export async function syncTeacherRelations(
  conn: PoolConnection,
  teacherId: string,
  newRelations: TeacherRelationInput[],
): Promise<void> {
  await assertUserExists(conn, teacherId);

  await conn.query(
    `DELETE FROM Teacher_Class WHERE teacher_id = ?`,
    [teacherId],
  );

  const seen = new Set<string>();
  for (const rel of newRelations) {
    const k = `${rel.classOrgId}\t${rel.subjectId}`;
    if (seen.has(k)) continue;
    seen.add(k);
    await assertOrgIsActiveClass(conn, rel.classOrgId, V2_ORG_TYPE_IDS.class);
    await assertSubjectInDictionary(conn, rel.subjectId);
    const seqId = await allocateUniqueMysqlVarchar32Id(conn, {
      table: "Teacher_Class",
      column: "seq_id",
      label: `tcs_${teacherId}_${rel.classOrgId}_${rel.subjectId}`,
    });
    await conn.query(
      `INSERT INTO Teacher_Class (seq_id, teacher_id, class_org_id, subject_id, status, create_time)
       VALUES (?, ?, ?, ?, 'y', NOW())`,
      [seqId, teacherId, rel.classOrgId, rel.subjectId],
    );
  }
}
