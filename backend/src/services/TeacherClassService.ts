/**
 * 教师授课班级关系：`Teacher_Class` 专用表（teacher_id + class_org_id + subject_id 三元组唯一）。
 * 标签冗余：双源头自动打标 recalculateSubjectTags 保持 sys_user_role 中 Subj_* 标签活性。
 *
 * 标签来源：
 *   A. Teacher_Class（授课维度）
 *   B. subject_group_member → subject_group（课题组维度）
 *   UNION 并集，确保"存在性证明"：只要还有任一来源，标签就保留。
 */
import type { PoolConnection, RowDataPacket } from "mysql2/promise";

import { V2_ORG_TYPE_IDS } from "../domain/v2-sys/v2-org-type-constants.ts";
import {
  assertOrgIsActiveClass,
  assertSubjectInDictionary,
  assertUserExists,
} from "../domain/v2-sys/teaching-user-role-bind.ts";
import { allocateUniqueMysqlVarchar32Id } from "../infrastructure/ids/identifiable-varchar32.ts";
import { recalculateSubjectTags } from "./SubjectTagService.ts";

export type TeacherRelationInput = {
  classOrgId: string;
  subjectId: string;
};

export type BindTeacherClassRoleInput = {
  userId: string;
  orgId: string;
  subjectId: string;
};

/** 单条写入 Teacher_Class（幂等：同一 teacher/class/subject 已存在则跳过）
 *  尾部自动触发标签重算，同步 Subj_* 到 sys_user_role。 */
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

  // 标签冗余：同步 Subj_* 到 sys_user_role（授课维度）
  await recalculateSubjectTags(conn, input.userId);
}

/** 整包替换教师的全部授课关系（删除 + 批量插入）
 *  尾部自动触发标签重算，保持 sys_user_role 中 Subj_* 与授课关系一致。 */
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

  // 标签冗余：重新计算该教师所有 Subj_* 标签（授课维度）
  await recalculateSubjectTags(conn, teacherId);
}
