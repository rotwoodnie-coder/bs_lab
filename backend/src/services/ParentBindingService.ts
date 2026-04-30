import type { Pool, RowDataPacket } from "mysql2/promise";
import { getMysqlPool } from "../infrastructure/mysql/mysql-client.ts";
import { allocateUniqueMysqlVarchar32Id } from "../infrastructure/ids/identifiable-varchar32.ts";
import { V2_ORG_TYPE_IDS } from "../domain/v2-sys/v2-org-type-constants.ts";
import {
  listAllPendingBindings,
  listBindingsForParent,
  listPendingBindingsForSchool,
  updateBindingAudit,
  updateBindingAuditAsSuperAdmin,
  upsertParentStudentApply,
} from "../infrastructure/repositories/v2-parent-student-rel-repository.ts";

export type OrgItemLite = { orgId: string; orgName: string };

export type SchoolTreeRow = { orgId: string; orgName: string; parentOrgId: string | null; orgTypeId: string };

export type VerifyStudentCandidate = {
  studentUserId: string;
  studentUserName: string;
  maskedLoginName: string | null;
};

function maskLoginName(loginName: string | null | undefined): string | null {
  const s = String(loginName ?? "").trim();
  if (!s) return null;
  if (s.length <= 2) return `${s[0]}*`;
  const tail = s.slice(-2);
  return `${s.slice(0, 2)}****${tail}`;
}

async function listChildOrgs(pool: Pool, parentOrgId: string, orgTypeId: string): Promise<OrgItemLite[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT org_id AS orgId, org_name AS orgName
     FROM sys_org
     WHERE parent_org_id = ?
       AND org_type_id = ?
       AND is_deleted = 0
       AND COALESCE(status, 'y') = 'y'
     ORDER BY COALESCE(sort_order, 999999) ASC, org_name ASC`,
    [parentOrgId, orgTypeId],
  );
  return rows.map((r) => ({ orgId: String((r as any).orgId), orgName: String((r as any).orgName ?? "") }));
}

export async function listSchoolTree(): Promise<SchoolTreeRow[]> {
  const pool = getMysqlPool();
  const keepSet: Set<string> = new Set([V2_ORG_TYPE_IDS.manage, V2_ORG_TYPE_IDS.school, V2_ORG_TYPE_IDS.campus]);
  // 先查出所有活跃节点中保留类型的节点
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT org_id, org_name, parent_org_id, org_type_id
     FROM sys_org
     WHERE is_deleted = 0
       AND COALESCE(status, 'y') = 'y'
     ORDER BY COALESCE(sort_order, 999999) ASC, org_name ASC`,
  );
  const allRows = rows as RowDataPacket[];
  const keptIds = new Set<string>();
  const keptNodes: RowDataPacket[] = [];
  for (const r of allRows) {
    if (keepSet.has(String(r.org_type_id ?? ""))) {
      keptIds.add(String(r.org_id));
      keptNodes.push(r);
    }
  }
  // 收集所有保留节点的祖先链，确保树形结构完整
  const ancestorIds = new Set<string>();
  const idToParent = new Map<string, string | null>();
  for (const r of allRows) {
    idToParent.set(String(r.org_id), r.parent_org_id ? String(r.parent_org_id) : null);
  }
  for (const id of keptIds) {
    let cur = idToParent.get(id) ?? null;
    while (cur) {
      if (ancestorIds.has(cur)) break;
      ancestorIds.add(cur);
      cur = idToParent.get(cur) ?? null;
    }
  }
  // 返回保留节点 + 祖先节点
  return keptNodes
    .concat(allRows.filter((r) => ancestorIds.has(String(r.org_id)) && !keptIds.has(String(r.org_id))))
    .map((r) => ({
      orgId: String(r.org_id),
      orgName: String(r.org_name ?? ""),
      parentOrgId: r.parent_org_id ? String(r.parent_org_id) : null,
      orgTypeId: String(r.org_type_id ?? ""),
    }));
}

export async function listSchools(): Promise<OrgItemLite[]> {
  const pool = getMysqlPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT s.org_id AS orgId, s.org_name AS orgName
     FROM sys_org s
     LEFT JOIN sys_org p ON p.org_id = s.parent_org_id AND p.is_deleted = 0
     WHERE s.org_type_id = ?
       AND s.is_deleted = 0
       AND COALESCE(s.status, 'y') = 'y'
       -- 若学校下面还有 Org_School（如“小学部/初中部”），只展示最上层学校，避免只能选到“学部”。
       AND (s.parent_org_id IS NULL OR COALESCE(p.org_type_id, '') <> ?)
     ORDER BY COALESCE(s.sort_order, 999999) ASC, s.org_name ASC`,
    [V2_ORG_TYPE_IDS.school, V2_ORG_TYPE_IDS.school],
  );
  return rows.map((r) => ({ orgId: String((r as any).orgId), orgName: String((r as any).orgName ?? "") }));
}

export async function listGradesBySchool(schoolOrgId: string): Promise<OrgItemLite[]> {
  const pool = getMysqlPool();
  // 兼容：学校下可能存在“学部/小学部”等中间层（Org_Manage 或甚至 Org_School），年级不再保证为 school 的直接子节点。
  // 通过递归 CTE 遍历 school 子树，返回其中所有年级节点。
  const [rows] = await pool.query<RowDataPacket[]>(
    `
      WITH RECURSIVE org_tree AS (
        SELECT org_id, parent_org_id, org_type_id, org_name
        FROM sys_org
        WHERE org_id = ? AND is_deleted = 0
        UNION ALL
        SELECT c.org_id, c.parent_org_id, c.org_type_id, c.org_name
        FROM sys_org c
        JOIN org_tree t ON t.org_id = c.parent_org_id
        WHERE c.is_deleted = 0
      )
      SELECT org_id AS orgId, org_name AS orgName
      FROM org_tree
      WHERE org_type_id = ?
      ORDER BY orgName ASC
    `,
    [schoolOrgId, V2_ORG_TYPE_IDS.grade],
  );
  return rows.map((r) => ({ orgId: String((r as any).orgId), orgName: String((r as any).orgName ?? "") }));
}

export async function listClassesByGrade(gradeOrgId: string): Promise<OrgItemLite[]> {
  const pool = getMysqlPool();
  return listChildOrgs(pool, gradeOrgId, V2_ORG_TYPE_IDS.class);
}

export async function resolveSchoolOrgIdFromClassOrgId(pool: Pool, classOrgId: string): Promise<string> {
  // 兼容任意中间层：从 class 节点沿 parent_org_id 向上找到第一个 Org_School 作为 school_org_id
  // 备注：业务上 school_org_id 用于校管过滤，选择“最近的学校节点”即可（不依赖固定三层）。
  let curId = classOrgId;
  for (let i = 0; i < 12; i++) {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT org_id AS orgId, parent_org_id AS parentOrgId, org_type_id AS orgTypeId
       FROM sys_org
       WHERE org_id = ? AND is_deleted = 0
       LIMIT 1`,
      [curId],
    );
    if (rows.length === 0) break;
    const row = rows[0] as any;
    const typeId = String(row.orgTypeId ?? "");
    // 向上查找时，Org_School 和 Org_School_Campus 都视为学校节点
    if (typeId === V2_ORG_TYPE_IDS.school || typeId === V2_ORG_TYPE_IDS.campus) return String(row.orgId ?? "");
    const parent = row.parentOrgId != null ? String(row.parentOrgId) : "";
    if (!parent) break;
    curId = parent;
  }
  throw new Error("SCHOOL_ORG_RESOLVE_FAILED");
}

export async function verifyStudentsInClass(input: { classOrgId: string; studentName: string }): Promise<VerifyStudentCandidate[]> {
  const pool = getMysqlPool();
  const studentName = input.studentName.trim();
  if (!studentName) return [];
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT u.user_id AS studentUserId, u.user_name AS studentUserName, u.login_name AS loginName
     FROM sys_user u
     WHERE u.user_org_id = ?
       AND u.user_name = ?
       AND u.is_deleted = 0
       AND UPPER(COALESCE(u.status, 'Y')) = 'Y'
       AND (
         LOWER(COALESCE(u.user_role_id, '')) IN ('role_student','student')
         OR EXISTS (
           SELECT 1 FROM sys_user_role ur
           WHERE ur.user_id = u.user_id
             AND LOWER(COALESCE(ur.role_id, '')) IN ('role_student','student')
           LIMIT 1
         )
       )
     ORDER BY u.user_id ASC
     LIMIT 12`,
    [input.classOrgId, studentName],
  );
  return rows.map((r) => ({
    studentUserId: String((r as any).studentUserId ?? ""),
    studentUserName: String((r as any).studentUserName ?? ""),
    maskedLoginName: maskLoginName((r as any).loginName != null ? String((r as any).loginName) : null),
  })).filter((c) => c.studentUserId.length > 0);
}

export async function submitParentBindingApply(input: { parentUserId: string; studentUserId: string; classOrgId: string }): Promise<void> {
  const pool = getMysqlPool();
  const schoolOrgId = await resolveSchoolOrgIdFromClassOrgId(pool, input.classOrgId);
  const seqId = await allocateUniqueMysqlVarchar32Id(pool, {
    table: "sys_parent_student_rel",
    column: "seq_id",
    label: `${input.parentUserId} -> ${input.studentUserId}`,
  });
  await upsertParentStudentApply(pool, {
    seqIdForInsert: seqId,
    parentUserId: input.parentUserId,
    studentUserId: input.studentUserId,
    schoolOrgId,
  });
}

export async function listMyBindings(parentUserId: string) {
  const pool = getMysqlPool();
  return listBindingsForParent(pool, parentUserId);
}

export async function listSchoolPendingBindings(schoolOrgId: string) {
  const pool = getMysqlPool();
  return listPendingBindingsForSchool(pool, schoolOrgId);
}

export async function listAllSchoolPendingBindings() {
  const pool = getMysqlPool();
  return listAllPendingBindings(pool);
}

export async function auditBinding(input: { seqId: string; schoolOrgId: string; auditorUserId: string; status: "Y" | "N"; comments: string | null }) {
  const pool = getMysqlPool();
  await updateBindingAudit(pool, input);
}

export async function auditBindingAsSuperAdmin(input: { seqId: string; auditorUserId: string; status: "Y" | "N"; comments: string | null }) {
  const pool = getMysqlPool();
  await updateBindingAuditAsSuperAdmin(pool, input);
}

