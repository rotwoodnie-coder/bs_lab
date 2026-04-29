import type { Pool, RowDataPacket, ResultSetHeader } from "mysql2/promise";

export type ParentStudentRelRow = {
  seqId: string;
  parentUserId: string;
  studentUserId: string;
  schoolOrgId: string;
  createTime: string;
  auditStatus: "T" | "Y" | "N";
  auditUserId: string | null;
  auditComments: string | null;
  auditTime: string | null;
};

function rowToRel(r: RowDataPacket): ParentStudentRelRow {
  const statusRaw = String(r.auditStatus ?? r.audit_status ?? "T").trim().toUpperCase();
  const auditStatus = (statusRaw === "Y" ? "Y" : statusRaw === "N" ? "N" : "T") as "T" | "Y" | "N";
  return {
    seqId: String(r.seqId ?? r.seq_id ?? ""),
    parentUserId: String(r.parentUserId ?? r.parent_user_id ?? ""),
    studentUserId: String(r.studentUserId ?? r.student_user_id ?? ""),
    schoolOrgId: String(r.schoolOrgId ?? r.school_org_id ?? ""),
    createTime: String(r.createTime ?? r.create_time ?? ""),
    auditStatus,
    auditUserId: r.auditUserId != null || r.audit_user_id != null ? String(r.auditUserId ?? r.audit_user_id) : null,
    auditComments: r.auditComments != null || r.audit_comments != null ? String(r.auditComments ?? r.audit_comments) : null,
    auditTime: r.auditTime != null || r.audit_time != null ? String(r.auditTime ?? r.audit_time) : null,
  };
}

export async function countApprovedBindingsForParent(pool: Pool, parentUserId: string): Promise<number> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS c
     FROM sys_parent_student_rel
     WHERE parent_user_id = ?
       AND audit_status = 'Y'`,
    [parentUserId],
  );
  const c = rows[0]?.c ?? (rows[0] as any)?.["COUNT(*)"];
  return Number(c ?? 0);
}

export async function listBindingsForParent(pool: Pool, parentUserId: string) {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT r.seq_id AS seqId,
            r.parent_user_id AS parentUserId,
            r.student_user_id AS studentUserId,
            r.school_org_id AS schoolOrgId,
            r.create_time AS createTime,
            r.audit_status AS auditStatus,
            r.audit_user_id AS auditUserId,
            r.audit_comments AS auditComments,
            r.audit_time AS auditTime,
            su.user_name AS studentUserName,
            co.org_id AS classOrgId,
            co.org_name AS classOrgName,
            go.org_id AS gradeOrgId,
            go.org_name AS gradeOrgName,
            so.org_id AS schoolOrgIdResolved,
            so.org_name AS schoolOrgName
     FROM sys_parent_student_rel r
     LEFT JOIN sys_user su ON su.user_id = r.student_user_id AND su.is_deleted = 0
     LEFT JOIN sys_org co ON co.org_id = su.user_org_id AND co.is_deleted = 0
     LEFT JOIN sys_org go ON go.org_id = co.parent_org_id AND go.is_deleted = 0
     LEFT JOIN sys_org so ON so.org_id = go.parent_org_id AND so.is_deleted = 0
     WHERE r.parent_user_id = ?
     ORDER BY r.create_time DESC`,
    [parentUserId],
  );
  return rows.map((r) => ({
    ...rowToRel(r as RowDataPacket),
    studentUserName: (r as any).studentUserName != null ? String((r as any).studentUserName) : null,
    classOrgId: (r as any).classOrgId != null ? String((r as any).classOrgId) : null,
    classOrgName: (r as any).classOrgName != null ? String((r as any).classOrgName) : null,
    gradeOrgId: (r as any).gradeOrgId != null ? String((r as any).gradeOrgId) : null,
    gradeOrgName: (r as any).gradeOrgName != null ? String((r as any).gradeOrgName) : null,
    schoolOrgIdResolved: (r as any).schoolOrgIdResolved != null ? String((r as any).schoolOrgIdResolved) : null,
    schoolOrgName: (r as any).schoolOrgName != null ? String((r as any).schoolOrgName) : null,
  }));
}

export async function upsertParentStudentApply(
  pool: Pool,
  input: {
    seqIdForInsert: string;
    parentUserId: string;
    studentUserId: string;
    schoolOrgId: string;
  },
): Promise<void> {
  const { seqIdForInsert, parentUserId, studentUserId, schoolOrgId } = input;
  await pool.query<ResultSetHeader>(
    `
      INSERT INTO sys_parent_student_rel
        (seq_id, parent_user_id, student_user_id, school_org_id,
         create_time, audit_status, audit_user_id, audit_comments, audit_time)
      VALUES
        (?, ?, ?, ?, NOW(), 'T', NULL, NULL, NULL)
      ON DUPLICATE KEY UPDATE
        school_org_id = VALUES(school_org_id),
        create_time = NOW(),
        audit_status = 'T',
        audit_user_id = NULL,
        audit_comments = NULL,
        audit_time = NULL
    `,
    [seqIdForInsert, parentUserId, studentUserId, schoolOrgId],
  );
}

export async function listAllPendingBindings(pool: Pool) {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT r.seq_id AS seqId,
            r.parent_user_id AS parentUserId,
            r.student_user_id AS studentUserId,
            r.school_org_id AS schoolOrgId,
            r.create_time AS createTime,
            r.audit_status AS auditStatus,
            r.audit_user_id AS auditUserId,
            r.audit_comments AS auditComments,
            r.audit_time AS auditTime,
            pu.user_name AS parentUserName,
            pu.login_name AS parentLoginName,
            su.user_name AS studentUserName,
            co.org_name AS classOrgName,
            go.org_name AS gradeOrgName,
            so.org_name AS schoolOrgName
     FROM sys_parent_student_rel r
     LEFT JOIN sys_user pu ON pu.user_id = r.parent_user_id AND pu.is_deleted = 0
     LEFT JOIN sys_user su ON su.user_id = r.student_user_id AND su.is_deleted = 0
     LEFT JOIN sys_org co ON co.org_id = su.user_org_id AND co.is_deleted = 0
     LEFT JOIN sys_org go ON go.org_id = co.parent_org_id AND go.is_deleted = 0
     LEFT JOIN sys_org so ON so.org_id = r.school_org_id AND so.is_deleted = 0
     WHERE r.audit_status = 'T'
     ORDER BY r.create_time DESC`,
  );
  return rows.map((r) => ({
    ...rowToRel(r as RowDataPacket),
    parentUserName: (r as any).parentUserName != null ? String((r as any).parentUserName) : null,
    parentLoginName: (r as any).parentLoginName != null ? String((r as any).parentLoginName) : null,
    studentUserName: (r as any).studentUserName != null ? String((r as any).studentUserName) : null,
    classOrgName: (r as any).classOrgName != null ? String((r as any).classOrgName) : null,
    gradeOrgName: (r as any).gradeOrgName != null ? String((r as any).gradeOrgName) : null,
    schoolOrgName: (r as any).schoolOrgName != null ? String((r as any).schoolOrgName) : null,
  }));
}

export async function listPendingBindingsForSchool(pool: Pool, schoolOrgId: string) {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT r.seq_id AS seqId,
            r.parent_user_id AS parentUserId,
            r.student_user_id AS studentUserId,
            r.school_org_id AS schoolOrgId,
            r.create_time AS createTime,
            r.audit_status AS auditStatus,
            r.audit_user_id AS auditUserId,
            r.audit_comments AS auditComments,
            r.audit_time AS auditTime,
            pu.user_name AS parentUserName,
            pu.login_name AS parentLoginName,
            su.user_name AS studentUserName,
            co.org_name AS classOrgName,
            go.org_name AS gradeOrgName,
            so.org_name AS schoolOrgName
     FROM sys_parent_student_rel r
     LEFT JOIN sys_user pu ON pu.user_id = r.parent_user_id AND pu.is_deleted = 0
     LEFT JOIN sys_user su ON su.user_id = r.student_user_id AND su.is_deleted = 0
     LEFT JOIN sys_org co ON co.org_id = su.user_org_id AND co.is_deleted = 0
     LEFT JOIN sys_org go ON go.org_id = co.parent_org_id AND go.is_deleted = 0
     LEFT JOIN sys_org so ON so.org_id = r.school_org_id AND so.is_deleted = 0
     WHERE r.school_org_id = ?
       AND r.audit_status = 'T'
     ORDER BY r.create_time DESC`,
    [schoolOrgId],
  );
  return rows.map((r) => ({
    ...rowToRel(r as RowDataPacket),
    parentUserName: (r as any).parentUserName != null ? String((r as any).parentUserName) : null,
    parentLoginName: (r as any).parentLoginName != null ? String((r as any).parentLoginName) : null,
    studentUserName: (r as any).studentUserName != null ? String((r as any).studentUserName) : null,
    classOrgName: (r as any).classOrgName != null ? String((r as any).classOrgName) : null,
    gradeOrgName: (r as any).gradeOrgName != null ? String((r as any).gradeOrgName) : null,
    schoolOrgName: (r as any).schoolOrgName != null ? String((r as any).schoolOrgName) : null,
  }));
}

export async function updateBindingAudit(
  pool: Pool,
  input: {
    seqId: string;
    schoolOrgId: string;
    auditorUserId: string;
    status: "Y" | "N";
    comments: string | null;
  },
): Promise<void> {
  const [res] = await pool.query<ResultSetHeader>(
    `UPDATE sys_parent_student_rel
     SET audit_status = ?,
         audit_user_id = ?,
         audit_comments = ?,
         audit_time = NOW()
     WHERE seq_id = ?
       AND school_org_id = ?
       AND audit_status = 'T'`,
    [input.status, input.auditorUserId, input.comments, input.seqId, input.schoolOrgId],
  );
  if (res.affectedRows === 0) throw new Error("PARENT_BINDING_AUDIT_NOT_FOUND_OR_ALREADY_HANDLED");
}

export async function updateBindingAuditAsSuperAdmin(
  pool: Pool,
  input: {
    seqId: string;
    auditorUserId: string;
    status: "Y" | "N";
    comments: string | null;
  },
): Promise<void> {
  const [res] = await pool.query<ResultSetHeader>(
    `UPDATE sys_parent_student_rel
     SET audit_status = ?,
         audit_user_id = ?,
         audit_comments = ?,
         audit_time = NOW()
     WHERE seq_id = ?
       AND audit_status = 'T'`,
    [input.status, input.auditorUserId, input.comments, input.seqId],
  );
  if (res.affectedRows === 0) throw new Error("PARENT_BINDING_AUDIT_NOT_FOUND_OR_ALREADY_HANDLED");
}

