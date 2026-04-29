import type { PoolConnection, RowDataPacket, ResultSetHeader } from "mysql2/promise";
import { getMysqlPool } from "../infrastructure/mysql/mysql-client.ts";
import { resolveVarchar32PrimaryKey } from "../infrastructure/ids/identifiable-varchar32.ts";
import { coerceAuditorIdForMysql32 } from "../infrastructure/repositories/v2-sys-user-repository.ts";
import type { SysOrgRecord } from "../domain/v2-sys/v2-sys-types.ts";
import { V2_ORG_TYPE_IDS, V2_ORG_TYPE_ID_SET } from "../domain/v2-sys/v2-org-type-constants.ts";

export type ClassServiceErrorCode =
  | "CLASS_NAME_DUPLICATED"
  | "CLASS_NOT_FOUND"
  | "PARENT_NOT_FOUND"
  | "PRIMARY_KEY_INVALID"
  | "ID_ALREADY_USED"
  | "INTERNAL_ERROR";

export class ClassServiceError extends Error {
  code: ClassServiceErrorCode;
  constructor(code: ClassServiceErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

export type SaveClassInput = {
  orgId?: string;
  orgName: string;
  parentOrgId?: string | null;
  orgTypeId?: string | null;
  gradeId?: string | null;
  status?: "y" | "n" | null;
  sortOrder?: number | null;
};

type SysOrgWithDisplay = SysOrgRecord & { displayOwnerName: string | null };

async function displayOwnerNameByUserId(userId: string | null | undefined): Promise<string | null> {
  const id = String(userId ?? "").trim();
  if (!id) return null;
  const pool = getMysqlPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT user_name AS userName FROM sys_user WHERE user_id = ? AND is_deleted = 0 LIMIT 1`,
    [id],
  );
  const name = rows[0]?.userName != null ? String(rows[0].userName) : "";
  return name.trim() || null;
}

function rowToSysOrg(row: RowDataPacket): SysOrgRecord {
  return {
    orgId: String(row.org_id),
    orgName: String(row.org_name ?? ""),
    orgTypeId: row.org_type_id ? String(row.org_type_id) : null,
    gradeId: row.grade_id ? String(row.grade_id) : null,
    schoolGradeIds: [],
    parentOrgId: row.parent_org_id ? String(row.parent_org_id) : null,
    orgPath: row.org_path ? String(row.org_path) : null,
    status: (row.status as SysOrgRecord["status"]) ?? null,
    sortOrder: row.sort_order != null ? Number(row.sort_order) : null,
    createUserId: row.create_user_id ? String(row.create_user_id) : null,
    createTime: row.create_time ? String(row.create_time) : null,
    updateUserId: row.update_user_id ? String(row.update_user_id) : null,
    updateTime: row.update_time ? String(row.update_time) : null,
    isDeleted: Number(row.is_deleted ?? 0) as 0 | 1,
  };
}

async function getClassById(orgId: string): Promise<SysOrgWithDisplay | null> {
  const pool = getMysqlPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM sys_org WHERE org_id = ? AND is_deleted = 0 LIMIT 1`,
    [orgId],
  );
  if (rows.length === 0) return null;
  const base = rowToSysOrg(rows[0]!);
  const displayOwnerName = await displayOwnerNameByUserId(base.createUserId);
  return { ...base, displayOwnerName };
}

async function assertNoSiblingNameDup(
  conn: Pick<PoolConnection, "query">,
  input: { orgName: string; parentOrgId: string | null; excludeOrgId?: string | null },
): Promise<void> {
  const name = input.orgName.trim();
  const parentId = input.parentOrgId && String(input.parentOrgId).trim() !== "" ? String(input.parentOrgId).trim() : null;
  const params: unknown[] = [name];
  let sql =
    `SELECT org_id AS orgId FROM sys_org WHERE is_deleted = 0 AND org_name = ? AND `;
  if (parentId) {
    sql += `parent_org_id = ?`;
    params.push(parentId);
  } else {
    sql += `parent_org_id IS NULL`;
  }
  if (input.excludeOrgId?.trim()) {
    sql += ` AND org_id <> ?`;
    params.push(input.excludeOrgId.trim());
  }
  sql += ` LIMIT 1`;
  const [rows] = await conn.query<RowDataPacket[]>(sql, params);
  if (rows.length > 0) throw new ClassServiceError("CLASS_NAME_DUPLICATED", "同级下已存在同名班级");
}

function orgPathFromParent(parentPath: string | null, parentId: string, childId: string): string {
  const base = parentPath && String(parentPath).trim() !== "" ? String(parentPath).replace(/\/+$/, "") : `/${parentId}`;
  return `${base}/${childId}`;
}

export async function saveClass(input: SaveClassInput, actorId?: string): Promise<SysOrgWithDisplay> {
  const pool = getMysqlPool();
  const orgName = input.orgName.trim();
  if (!orgName) throw new ClassServiceError("INTERNAL_ERROR", "班级名称不能为空");

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const orgId = await resolveVarchar32PrimaryKey(conn as unknown as Parameters<typeof resolveVarchar32PrimaryKey>[0], {
      table: "sys_org",
      column: "org_id",
      label: orgName,
      explicit: input.orgId,
    });

    const [existRows] = await conn.query<RowDataPacket[]>(
      `SELECT * FROM sys_org WHERE org_id = ? AND is_deleted = 0 LIMIT 1`,
      [orgId],
    );
    const isUpdate = existRows.length > 0;
    const parentOrgId =
      input.parentOrgId !== undefined
        ? (input.parentOrgId && String(input.parentOrgId).trim() !== "" ? String(input.parentOrgId).trim() : null)
        : (isUpdate ? (existRows[0]!.parent_org_id ? String(existRows[0]!.parent_org_id) : null) : null);

    await assertNoSiblingNameDup(conn, { orgName, parentOrgId, excludeOrgId: isUpdate ? orgId : null });

    let orgPath: string | null = null;
    if (parentOrgId) {
      const [pRows] = await conn.query<RowDataPacket[]>(
        `SELECT org_id AS orgId, org_path AS orgPath FROM sys_org WHERE org_id = ? AND is_deleted = 0 LIMIT 1`,
        [parentOrgId],
      );
      if (pRows.length === 0) throw new ClassServiceError("PARENT_NOT_FOUND", "父组织不存在");
      orgPath = orgPathFromParent(pRows[0]!.orgPath ? String(pRows[0]!.orgPath) : null, String(pRows[0]!.orgId), orgId);
    } else {
      orgPath = `/${orgId}`;
    }

    const auditId = coerceAuditorIdForMysql32(actorId);
    const now = new Date().toISOString().replace("T", " ").slice(0, 19);
    const rawOrgTypeId = input.orgTypeId != null ? String(input.orgTypeId).trim() : "";
    const normalizedOrgTypeId = (rawOrgTypeId && V2_ORG_TYPE_ID_SET.has(rawOrgTypeId)) ? rawOrgTypeId : V2_ORG_TYPE_IDS.class;
    if (!V2_ORG_TYPE_ID_SET.has(normalizedOrgTypeId)) {
      throw new ClassServiceError("INTERNAL_ERROR", "不支持的组织类型");
    }

    if (isUpdate) {
      await conn.query<ResultSetHeader>(
        `UPDATE sys_org SET
           org_name = ?,
           org_type_id = ?,
           grade_id = ?,
           parent_org_id = ?,
           org_path = ?,
           status = ?,
           sort_order = ?,
           update_user_id = ?,
           update_time = ?
         WHERE org_id = ? AND is_deleted = 0`,
        [
          orgName,
          normalizedOrgTypeId,
          input.gradeId ?? null,
          parentOrgId,
          orgPath,
          input.status ?? null,
          input.sortOrder ?? null,
          auditId,
          now,
          orgId,
        ],
      );
    } else {
      await conn.query<ResultSetHeader>(
        `INSERT INTO sys_org
           (org_id, org_name, org_type_id, grade_id, parent_org_id, org_path,
            status, sort_order, create_user_id, create_time, update_user_id, update_time, is_deleted)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
        [
          orgId,
          orgName,
          normalizedOrgTypeId,
          input.gradeId ?? null,
          parentOrgId,
          orgPath,
          input.status ?? "y",
          input.sortOrder ?? 0,
          auditId,
          now,
          auditId,
          now,
        ],
      );
    }

    await conn.commit();
    const row = await getClassById(orgId);
    if (!row) throw new ClassServiceError("CLASS_NOT_FOUND", "班级保存成功但读取失败");
    return row;
  } catch (err) {
    await conn.rollback();
    if (err instanceof ClassServiceError) throw err;
    if (err instanceof Error) {
      if (err.message === "PRIMARY_KEY_INVALID") throw new ClassServiceError("PRIMARY_KEY_INVALID", err.message);
      if (err.message === "ID_ALREADY_USED") throw new ClassServiceError("ID_ALREADY_USED", err.message);
    }
    throw new ClassServiceError("INTERNAL_ERROR", err instanceof Error ? err.message : String(err));
  } finally {
    conn.release();
  }
}

export async function fetchClassById(orgId: string): Promise<SysOrgWithDisplay | null> {
  return getClassById(orgId);
}

