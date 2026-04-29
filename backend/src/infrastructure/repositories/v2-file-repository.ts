/**
 * V2 文件资源 MySQL 仓库
 * 对应表：data_file
 */
import type { Pool, RowDataPacket, ResultSetHeader } from "mysql2/promise";
import { resolveVarchar32PrimaryKey } from "../ids/identifiable-varchar32.ts";
import { getMysqlPool } from "../mysql/mysql-client.ts";
import type {
  DataFileRecord,
  CreateFileInput,
  UpdateFileInput,
  FileListQuery,
  FileListPage,
} from "../../domain/v2-file/v2-file-types.ts";

/** 列表/单条/批量：文件行 + 字典类型（`data_file_type`） */
const FILE_SELECT_FROM = `FROM data_file df
  LEFT JOIN data_file_type dft ON df.file_type_id = dft.type_id`;

/** 排除逻辑删除占位；NULL 安全（避免 `NULL != 'deleted'` 误过滤整表） */
const WHERE_NOT_LOGICAL_DELETED = "NOT (df.status <=> 'deleted')";

/**
 * 宪法级：kind → FT_ 静态映射表。
 * 替代 MD5 生成逻辑，所有 ID 均为 FT_ 前缀的可读语义编码。
 * 严禁在此映射之外产生新的 data_file_type ID。
 */
export const FILE_KIND_MAP = {
  word: "FT_Document",
  ppt: "FT_Ppt",
  pdf: "FT_Pdf",
  image: "FT_Image",
  video: "FT_Video",
  audio: "FT_Audio",
  spreadsheet: "FT_Spreadsheet",
} as const;

export type FileKind = keyof typeof FILE_KIND_MAP;

/** 由 kind 直接返回宪法级 FT_ type_id，无需查库 */
export function teacherMaterialKindToDataFileTypeId(kind: string): string | null {
  const k = kind.trim().toLowerCase() as FileKind;
  return FILE_KIND_MAP[k] ?? null;
}

/** 将 teacherMaterialKind 解析为 data_file_type.type_id（纯静态映射） */
export function resolveDataFileTypeIdByTeacherMaterialKind(kind: string): Promise<string | null> {
  return Promise.resolve(teacherMaterialKindToDataFileTypeId(kind));
}

async function resolveFkSafeFileTypeId(
  pool: Pool,
  fileTypeId: string | null | undefined,
): Promise<string | null> {
  const id = fileTypeId?.trim();
  if (!id) return null;
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT 1 FROM data_file_type WHERE type_id = ? LIMIT 1",
    [id],
  );
  return rows.length ? id : null;
}

function pickSqlDateTime(v: unknown): string | null {
  if (v == null) return null;
  if (v instanceof Date) {
    if (Number.isNaN(v.getTime())) return null;
    const y = v.getFullYear();
    const m = String(v.getMonth() + 1).padStart(2, "0");
    const d = String(v.getDate()).padStart(2, "0");
    const hh = String(v.getHours()).padStart(2, "0");
    const mm = String(v.getMinutes()).padStart(2, "0");
    const ss = String(v.getSeconds()).padStart(2, "0");
    /** 与 MySQL DATETIME 展示一致，避免 `toISOString()` 的 UTC `Z` 与库内「本地日」错位 */
    return `${y}-${m}-${d} ${hh}:${mm}:${ss}`;
  }
  const s = String(v).trim();
  return s || null;
}

async function resolveFkSafeOwnerUserId(
  pool: Pool,
  ownerUserId: string | null | undefined,
): Promise<string | null> {
  const id = ownerUserId?.trim();
  if (!id) return null;
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT 1 FROM sys_user WHERE user_id = ? LIMIT 1",
    [id],
  );
  return rows.length ? id : null;
}

function rowToFile(row: RowDataPacket): DataFileRecord {
  const rawStatus = row.status;
  const statusStr =
    rawStatus === null || rawStatus === undefined ? null : String(rawStatus).trim() === "" ? null : String(rawStatus);
  return {
    fileId: String(row.file_id),
    fileName: String(row.file_name ?? ""),
    fileUrl: String(row.file_url ?? ""),
    fileTypeId: row.file_type_id ? String(row.file_type_id) : null,
    fileTypeName: row.file_type_name != null && String(row.file_type_name).trim() !== ""
      ? String(row.file_type_name).trim()
      : null,
    fileTypeLogoClass: row.file_type_logo_class != null && String(row.file_type_logo_class).trim() !== ""
      ? String(row.file_type_logo_class).trim()
      : null,
    status: statusStr,
    ownerUserId: row.owner_user_id ? String(row.owner_user_id) : null,
    logoUrl: row.logo_url ? String(row.logo_url) : null,
    fileSize: row.file_size != null ? Number(row.file_size) : null,
    fileExt: row.file_ext ? String(row.file_ext) : null,
    contentSha256: row.content_sha256 != null && String(row.content_sha256).trim() !== ""
      ? String(row.content_sha256).trim()
      : null,
    createTime: pickSqlDateTime(row.create_time),
    updateTime: pickSqlDateTime(row.update_time),
  };
}

export async function listFiles(query: FileListQuery): Promise<FileListPage> {
  const pool = getMysqlPool();
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));
  const offset = (page - 1) * pageSize;
  const where: string[] = [WHERE_NOT_LOGICAL_DELETED];
  const params: unknown[] = [];

  if (query.keyword?.trim()) {
    where.push("df.file_name LIKE ?");
    params.push(`%${query.keyword.trim()}%`);
  }
  if (query.fileTypeId) { where.push("df.file_type_id = ?"); params.push(query.fileTypeId); }
  if (query.ownerUserId) { where.push("df.owner_user_id = ?"); params.push(query.ownerUserId); }
  if (query.status?.trim()) {
    const s = query.status.trim().toLowerCase();
    // 与真实库并存：部分历史/导入数据用 t 表示启用；筛选「y」时一并包含 y/t
    if (s === "y") {
      where.push("(LOWER(IFNULL(df.status,'')) IN ('y','t'))");
    } else if (s === "t") {
      where.push("(LOWER(IFNULL(df.status,'')) = 't')");
    } else if (s === "n") {
      where.push("(LOWER(IFNULL(df.status,'')) = 'n')");
    } else {
      where.push("df.status = ?");
      params.push(query.status.trim());
    }
  }

  const whereSql = where.join(" AND ");
  const [countRows] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM data_file df WHERE ${whereSql}`,
    params,
  );
  const total = Number((countRows[0] as RowDataPacket).total ?? 0);

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT df.file_id, df.file_name, df.file_url, df.file_type_id, df.status, df.owner_user_id,
            df.logo_url, df.file_size, df.file_ext, df.content_sha256, df.create_time, df.update_time,
            dft.type_name AS file_type_name, dft.logo_class AS file_type_logo_class
     ${FILE_SELECT_FROM}
     WHERE ${whereSql}
     ORDER BY IFNULL(df.update_time, df.create_time) DESC, df.file_id DESC
     LIMIT ? OFFSET ?`,
    [...params, pageSize, offset],
  );

  return { items: rows.map(rowToFile), total, page, pageSize };
}

const ACTIVE_STATUS_SQL = "(LOWER(IFNULL(df.status,'')) IN ('y','t'))";

/**
 * 同归属下是否已有相同字节指纹的启用行（用于上传去重；不含 status=n 停用）。
 */
export async function findActiveFileByOwnerAndContentSha(
  ownerUserId: string | null | undefined,
  contentSha256: string,
): Promise<DataFileRecord | null> {
  const sha = contentSha256.trim().toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(sha)) return null;
  const pool = getMysqlPool();
  /** 与 `createFileRecord` 一致：非法/不存在用户则落库为 NULL，去重键须相同 */
  const owner = await resolveFkSafeOwnerUserId(pool, ownerUserId?.trim() || undefined);
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT df.file_id, df.file_name, df.file_url, df.file_type_id, df.status, df.owner_user_id,
            df.logo_url, df.file_size, df.file_ext, df.content_sha256, df.create_time, df.update_time
     ${FILE_SELECT_FROM}
     WHERE (df.owner_user_id <=> ?) AND df.content_sha256 = ? AND ${ACTIVE_STATUS_SQL}
       AND ${WHERE_NOT_LOGICAL_DELETED}
     ORDER BY df.file_id DESC
     LIMIT 1`,
    [owner, sha],
  );
  if (rows.length === 0) return null;
  return rowToFile(rows[0]!);
}

export async function getFileById(fileId: string): Promise<DataFileRecord | null> {
  const pool = getMysqlPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT df.file_id, df.file_name, df.file_url, df.file_type_id, df.status, df.owner_user_id,
            df.logo_url, df.file_size, df.file_ext, df.content_sha256, df.create_time, df.update_time,
            dft.type_name AS file_type_name, dft.logo_class AS file_type_logo_class
     ${FILE_SELECT_FROM}
     WHERE df.file_id = ? LIMIT 1`,
    [fileId],
  );
  if (rows.length === 0) return null;
  return rowToFile(rows[0]!);
}

/** 按主键批量取行（含 `data_file_type`），用于前端一次补全多条材料的 `file_url` */
export async function getFilesByIds(fileIds: string[]): Promise<DataFileRecord[]> {
  const ids = [...new Set(fileIds.map((id) => id.trim()).filter(Boolean))].slice(0, 80);
  if (ids.length === 0) return [];
  const pool = getMysqlPool();
  const placeholders = ids.map(() => "?").join(",");
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT df.file_id, df.file_name, df.file_url, df.file_type_id, df.status, df.owner_user_id,
            df.logo_url, df.file_size, df.file_ext, df.content_sha256, df.create_time, df.update_time,
            dft.type_name AS file_type_name, dft.logo_class AS file_type_logo_class
     ${FILE_SELECT_FROM}
     WHERE df.file_id IN (${placeholders})`,
    ids,
  );
  return (rows as RowDataPacket[]).map(rowToFile);
}

export async function createFileRecord(input: CreateFileInput): Promise<DataFileRecord> {
  const pool = getMysqlPool();
  const fileId = await resolveVarchar32PrimaryKey(pool, {
    table: "data_file",
    column: "file_id",
    label: input.fileName,
    explicit: input.fileId,
  });
  const fileTypeId = await resolveFkSafeFileTypeId(pool, input.fileTypeId);
  const ownerUserId = await resolveFkSafeOwnerUserId(pool, input.ownerUserId);
  const sha = input.contentSha256.trim().toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(sha)) throw new Error("INVALID_CONTENT_SHA256");

  await pool.query<ResultSetHeader>(
    `INSERT INTO data_file
      (file_id, file_name, file_url, file_type_id, status, owner_user_id, logo_url, file_size, file_ext, content_sha256)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      fileId,
      input.fileName,
      input.fileUrl,
      fileTypeId,
      "y",
      ownerUserId,
      input.logoUrl ?? null,
      input.fileSize ?? null,
      input.fileExt ?? null,
      sha,
    ],
  );
  const row = await getFileById(fileId);
  if (!row) throw new Error("FILE_CREATE_FAILED");
  return row;
}

export async function updateFileRecord(
  fileId: string,
  input: UpdateFileInput,
): Promise<DataFileRecord> {
  const pool = getMysqlPool();
  const sets: string[] = [];
  const params: unknown[] = [];

  if (input.fileName !== undefined) { sets.push("file_name = ?"); params.push(input.fileName); }
  if (input.logoUrl !== undefined) { sets.push("logo_url = ?"); params.push(input.logoUrl); }
  if (input.fileTypeId !== undefined) {
    const resolved = await resolveFkSafeFileTypeId(pool, input.fileTypeId);
    sets.push("file_type_id = ?");
    params.push(resolved);
  }
  if (input.status !== undefined) { sets.push("status = ?"); params.push(input.status); }

  if (sets.length > 0) {
    await pool.query<ResultSetHeader>(
      `UPDATE data_file SET ${sets.join(", ")} WHERE file_id = ?`,
      [...params, fileId],
    );
  }
  const row = await getFileById(fileId);
  if (!row) throw new Error("FILE_NOT_FOUND");
  return row;
}

export type DataFileRepairApplyResult = {
  contentSha256Updated: boolean;
  fileTypeIdUpdated: boolean;
};

/**
 * 仅在库内对应列为空时写入，避免覆盖已有哈希/类型。
 */
export async function repairDataFileEmptyMetadataFields(
  fileId: string,
  patch: { contentSha256?: string; fileTypeId?: string | null },
): Promise<DataFileRepairApplyResult> {
  const pool = getMysqlPool();
  let contentSha256Updated = false;
  let fileTypeIdUpdated = false;
  const sha = patch.contentSha256?.trim().toLowerCase() ?? "";
  if (sha && /^[a-f0-9]{64}$/.test(sha)) {
    const [r] = await pool.query<ResultSetHeader>(
      `UPDATE data_file SET content_sha256 = ? WHERE file_id = ? AND (content_sha256 IS NULL OR TRIM(content_sha256) = '')`,
      [sha, fileId],
    );
    contentSha256Updated = (r as ResultSetHeader).affectedRows > 0;
  }
  if (patch.fileTypeId) {
    const resolved = await resolveFkSafeFileTypeId(pool, patch.fileTypeId);
    if (resolved) {
      const [r] = await pool.query<ResultSetHeader>(
        `UPDATE data_file SET file_type_id = ? WHERE file_id = ? AND (file_type_id IS NULL OR TRIM(file_type_id) = '')`,
        [resolved, fileId],
      );
      fileTypeIdUpdated = (r as ResultSetHeader).affectedRows > 0;
    }
  }
  return { contentSha256Updated, fileTypeIdUpdated };
}

export async function softDeleteFile(fileId: string): Promise<void> {
  const pool = getMysqlPool();
  await pool.query(
    `UPDATE data_file SET status = 'n' WHERE file_id = ?`,
    [fileId],
  );
}
