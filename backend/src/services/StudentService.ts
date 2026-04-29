import type { RowDataPacket } from "mysql2/promise";
import { getMysqlPool } from "../infrastructure/mysql/mysql-client.ts";
import {
  createSysUser,
  getSysUserById,
  updateSysUser,
  coerceAuditorIdForMysql32,
} from "../infrastructure/repositories/v2-sys-user-repository.ts";
import type { CreateSysUserInput, SysUserSafeRecord, UpdateSysUserInput } from "../domain/v2-sys/v2-sys-types.ts";

export type StudentServiceErrorCode =
  | "STUDENT_NOT_FOUND"
  | "PRIMARY_KEY_INVALID"
  | "ID_ALREADY_USED"
  | "INTERNAL_ERROR";

export class StudentServiceError extends Error {
  code: StudentServiceErrorCode;
  constructor(code: StudentServiceErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

export type StudentRecordWithDisplay = SysUserSafeRecord & {
  displayOwnerName: string | null;
};

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

async function attachDisplayOwnerName(row: SysUserSafeRecord): Promise<StudentRecordWithDisplay> {
  const displayOwnerName = await displayOwnerNameByUserId(row.createUserId);
  return { ...row, displayOwnerName };
}

export async function fetchStudentById(userId: string): Promise<StudentRecordWithDisplay | null> {
  const row = await getSysUserById(userId);
  if (!row) return null;
  return attachDisplayOwnerName(row);
}

export async function saveStudent(
  input: CreateSysUserInput & { userId?: string },
  actorId?: string,
): Promise<StudentRecordWithDisplay> {
  // 约束：所有查询必须 is_deleted=0 —— repository 已强制。
  // 审计字段：repository 内部会写入 create_user_id/update_user_id，并对 actorId 做 varchar(32) 兼容。
  const userId = input.userId?.trim();
  try {
    if (userId) {
      const existing = await getSysUserById(userId);
      if (existing) {
        const patch: UpdateSysUserInput = {
          userName: input.userName,
          loginName: input.loginName,
          loginPwd: input.loginPwd,
          userOrgId: input.userOrgId,
          userRoleId: input.userRoleId,
          userNickName: input.userNickName,
          userPhone: input.userPhone,
          userEmail: input.userEmail,
          expireDate: input.expireDate,
          prefTitleId: input.prefTitleId,
          status: input.status,
          comments: input.comments,
        };
        const updated = await updateSysUser(userId, patch, actorId);
        return attachDisplayOwnerName(updated);
      }
    }
    const created = await createSysUser(input, actorId);
    return attachDisplayOwnerName(created);
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "PRIMARY_KEY_INVALID") throw new StudentServiceError("PRIMARY_KEY_INVALID", err.message);
      if (err.message === "ID_ALREADY_USED") throw new StudentServiceError("ID_ALREADY_USED", err.message);
    }
    throw new StudentServiceError("INTERNAL_ERROR", err instanceof Error ? err.message : String(err));
  }
}

export function normalizeAuditActorId(actorId: string | null | undefined): string | null {
  return coerceAuditorIdForMysql32(actorId);
}

