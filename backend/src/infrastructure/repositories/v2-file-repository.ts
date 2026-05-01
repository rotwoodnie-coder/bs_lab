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

/** 列表/单条/批量：文件行 + 字典类型（`data_file_type`）+ 用户/职称/组织信息 */
const FILE_SELECT_FROM = `FROM data_file df
  LEFT JOIN data_file_type dft ON df.file_type_id = dft.type_id
  LEFT JOIN sys_user owner ON owner.user_id = df.owner_user_id AND owner.is_deleted = 0
  LEFT JOIN data_pref_title t ON t.title_id = owner.pref_title_id
  LEFT JOIN sys_org org ON org.org_id = owner.user_org_id AND org.is_deleted = 0`;

/** 排除逻辑删除占位；NULL 安全（避免 `NULL != 'deleted'` 误过滤整表） */
const WHERE_NOT_LOGICAL_DELETED = "NOT (df.status <=> 'deleted')";

/**
 * 仅主文件：排除封面子行（parent_file_id 和 relation_type 均为 NULL 的表才行）。
 * 用于列表/批量查询，避免封面行污染素材库列表。
 */
const WHERE_MAIN_FILE_ONLY = "df.parent_file_id IS NULL AND df.relation_type IS NULL";

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

  // 取 resolved_cover_file_id：优先直接列，否则子查询回填
  const resolvedCoverId =
    row.resolved_cover_file_id != null && String(row.resolved_cover_file_id).trim() !== ""
      ? String(row.resolved_cover_file_id).trim()
      : row.cover_file_id != null && String(row.cover_file_id).trim() !== ""
        ? String(row.cover_file_id).trim()
        : null;

  // 异步修复 coverFileId（如果通过子查询获取到且有差异时触发）
  // 仅当 SELECT 中包含 resolved_cover_file_id 列时执行
  if (resolvedCoverId && row.cover_file_id !== resolvedCoverId) {
    const fid = String(row.file_id);
    void (async () => {
      try {
        const pool = getMysqlPool();
        await pool.query("UPDATE data_file SET cover_file_id = ? WHERE file_id = ?", [resolvedCoverId, fid]);
        console.info("[v2-file-repo] async cover_file_id repair", { fileId: fid, resolvedCoverId, oldValue: row.cover_file_id });
      } catch (e) {
        console.error("[v2-file-repo] async cover_file_id repair failed", { fileId: fid, resolvedCoverId, error: e });
      }
    })();
  }

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
    ownerUserName: row.owner_user_name ? String(row.owner_user_name) : null,
    ownerAvatarUrl: row.owner_avatar_url ? String(row.owner_avatar_url) : null,
    ownerTitleName: row.owner_title_name ? String(row.owner_title_name) : null,
    ownerOrgName: row.owner_org_name ? String(row.owner_org_name) : null,
    logoUrl: row.logo_url ? String(row.logo_url) : null,
    fileSize: row.file_size != null ? Number(row.file_size) : null,
    fileExt: row.file_ext ? String(row.file_ext) : null,
    contentSha256: row.content_sha256 != null && String(row.content_sha256).trim() !== ""
      ? String(row.content_sha256).trim()
      : null,
    parentFileId: row.parent_file_id != null && String(row.parent_file_id).trim() !== ""
      ? String(row.parent_file_id).trim()
      : null,
    relationType: row.relation_type != null && String(row.relation_type).trim() !== ""
      ? String(row.relation_type).trim()
      : null,
    coverFileId: resolvedCoverId,
    createTime: pickSqlDateTime(row.create_time),
    updateTime: pickSqlDateTime(row.update_time),
  };
}

export async function listFiles(query: FileListQuery): Promise<FileListPage> {
  const pool = getMysqlPool();
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));
  const offset = (page - 1) * pageSize;
  const where: string[] = [WHERE_NOT_LOGICAL_DELETED, WHERE_MAIN_FILE_ONLY];
  const params: unknown[] = [];

  // 默认仅展示媒体库资源（有正确 file_type_id）；includePrivate=true 时不过滤
  if (!query.includePrivate) {
    where.push("df.file_type_id IS NOT NULL");
  }

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
            df.logo_url, df.file_size, df.file_ext, df.content_sha256,
            df.parent_file_id, df.relation_type, df.cover_file_id,
            COALESCE(df.cover_file_id, (SELECT child.file_id FROM data_file child WHERE child.parent_file_id = df.file_id AND child.relation_type = 'logo' LIMIT 1)) AS resolved_cover_file_id,
            df.create_time, df.update_time,
            dft.type_name AS file_type_name, dft.logo_class AS file_type_logo_class,
            COALESCE(owner.user_nick_name, owner.user_name) AS owner_user_name,
            owner.user_logo AS owner_avatar_url,
            t.title_name AS owner_title_name,
            org.org_name AS owner_org_name
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
 * 全库范围按 contentSha256 查找是否有启用行（用于上传去重，不限 owner）。
 */
export async function findActiveFileByContentSha(
  contentSha256: string,
): Promise<DataFileRecord | null> {
  const sha = contentSha256.trim().toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(sha)) return null;
  const pool = getMysqlPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT df.file_id, df.file_name, df.file_url, df.file_type_id, df.status, df.owner_user_id,
            df.logo_url, df.file_size, df.file_ext, df.content_sha256,
            df.parent_file_id, df.relation_type, df.cover_file_id,
            COALESCE(df.cover_file_id, (SELECT child.file_id FROM data_file child WHERE child.parent_file_id = df.file_id AND child.relation_type = 'logo' LIMIT 1)) AS resolved_cover_file_id,
            df.create_time, df.update_time,
            dft.type_name AS file_type_name, dft.logo_class AS file_type_logo_class,
            COALESCE(owner.user_nick_name, owner.user_name) AS owner_user_name,
            owner.user_logo AS owner_avatar_url,
            t.title_name AS owner_title_name,
            org.org_name AS owner_org_name
     ${FILE_SELECT_FROM}
     WHERE df.content_sha256 = ? AND ${ACTIVE_STATUS_SQL}
       AND ${WHERE_NOT_LOGICAL_DELETED}
       AND ${WHERE_MAIN_FILE_ONLY}
     ORDER BY df.file_id DESC
     LIMIT 1`,
    [sha],
  );
  if (rows.length === 0) return null;
  return rowToFile(rows[0]!);
}

/**
 * 统计全库中同一 contentSha256 的启用行数（用于判断是否还有引用）。
 */
export async function countActiveFilesByContentSha(contentSha256: string): Promise<number> {
  const sha = contentSha256.trim().toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(sha)) return 0;
  const pool = getMysqlPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS cnt FROM data_file df
     WHERE df.content_sha256 = ? AND ${ACTIVE_STATUS_SQL}
       AND ${WHERE_NOT_LOGICAL_DELETED}
       AND ${WHERE_MAIN_FILE_ONLY}`,
    [sha],
  );
  return Number((rows[0] as RowDataPacket).cnt ?? 0);
}

export async function getFileById(fileId: string): Promise<DataFileRecord | null> {
  const pool = getMysqlPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT df.file_id, df.file_name, df.file_url, df.file_type_id, df.status, df.owner_user_id,
            df.logo_url, df.file_size, df.file_ext, df.content_sha256,
            df.parent_file_id, df.relation_type, df.cover_file_id,
            COALESCE(df.cover_file_id, (SELECT child.file_id FROM data_file child WHERE child.parent_file_id = df.file_id AND child.relation_type = 'logo' LIMIT 1)) AS resolved_cover_file_id,
            df.create_time, df.update_time,
            dft.type_name AS file_type_name, dft.logo_class AS file_type_logo_class,
            COALESCE(owner.user_nick_name, owner.user_name) AS owner_user_name,
            owner.user_logo AS owner_avatar_url,
            t.title_name AS owner_title_name,
            org.org_name AS owner_org_name
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
            df.logo_url, df.file_size, df.file_ext, df.content_sha256,
            df.parent_file_id, df.relation_type, df.cover_file_id,
            COALESCE(df.cover_file_id, (SELECT child.file_id FROM data_file child WHERE child.parent_file_id = df.file_id AND child.relation_type = 'logo' LIMIT 1)) AS resolved_cover_file_id,
            df.create_time, df.update_time,
            dft.type_name AS file_type_name, dft.logo_class AS file_type_logo_class,
            COALESCE(owner.user_nick_name, owner.user_name) AS owner_user_name,
            owner.user_logo AS owner_avatar_url,
            t.title_name AS owner_title_name,
            org.org_name AS owner_org_name
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
      (file_id, file_name, file_url, file_type_id, status, owner_user_id, logo_url, file_size, file_ext, content_sha256,
       parent_file_id, relation_type)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
             ?, ?)`,
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
      input.parentFileId ?? null,
      input.relationType ?? null,
    ],
  );
  const row = await getFileById(fileId);
  if (!row) throw new Error("FILE_CREATE_FAILED");
  return row;
}

function isMysqlDuplicateKey(err: unknown): boolean {
  return typeof err === "object" && err !== null && "errno" in err && (err as { errno: number }).errno === 1062;
}

/**
 * 查找已存在的封面行（按 parent_file_id + relation_type='logo'）。
 */
export async function findCoverChildByParentId(parentFileId: string): Promise<DataFileRecord | null> {
  const pool = getMysqlPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT df.file_id, df.file_name, df.file_url, df.file_type_id, df.status, df.owner_user_id,
            df.logo_url, df.file_size, df.file_ext, df.content_sha256,
            df.parent_file_id, df.relation_type, df.cover_file_id,
            COALESCE(df.cover_file_id, (SELECT child.file_id FROM data_file child WHERE child.parent_file_id = df.file_id AND child.relation_type = 'logo' LIMIT 1)) AS resolved_cover_file_id,
            df.create_time, df.update_time,
            dft.type_name AS file_type_name, dft.logo_class AS file_type_logo_class,
            COALESCE(owner.user_nick_name, owner.user_name) AS owner_user_name,
            owner.user_logo AS owner_avatar_url,
            t.title_name AS owner_title_name,
            org.org_name AS owner_org_name
     ${FILE_SELECT_FROM}
     WHERE df.parent_file_id = ? AND df.relation_type = 'logo' AND ${ACTIVE_STATUS_SQL}
     LIMIT 1`,
    [parentFileId],
  );
  if (rows.length === 0) return null;
  return rowToFile(rows[0]!);
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

/**
 * 按父文件ID获取所有子行（封面子行等）。
 */
export async function getChildFilesByParentId(parentFileId: string): Promise<DataFileRecord[]> {
  const pool = getMysqlPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT df.file_id, df.file_name, df.file_url, df.file_type_id, df.status, df.owner_user_id,
            df.logo_url, df.file_size, df.file_ext, df.content_sha256,
            df.parent_file_id, df.relation_type, df.cover_file_id,
            COALESCE(df.cover_file_id, (SELECT child.file_id FROM data_file child WHERE child.parent_file_id = df.file_id AND child.relation_type = 'logo' LIMIT 1)) AS resolved_cover_file_id,
            df.create_time, df.update_time,
            dft.type_name AS file_type_name, dft.logo_class AS file_type_logo_class,
            COALESCE(owner.user_nick_name, owner.user_name) AS owner_user_name,
            owner.user_logo AS owner_avatar_url,
            t.title_name AS owner_title_name,
            org.org_name AS owner_org_name
     ${FILE_SELECT_FROM}
     WHERE df.parent_file_id = ?`,
    [parentFileId],
  );
  return (rows as RowDataPacket[]).map(rowToFile);
}

/**
 * 更新主文件的 cover_file_id 列（冗余加速）。
 * 使用乐观锁防止并发覆盖：仅当当前 cover_file_id 与传入的 expectedCoverFileId 一致时才更新。
 * 失败时仅 log 不阻止流程；调用方若期望旧值传入 null。
 */
export async function updateMainFileCover(
  mainFileId: string,
  coverFileId: string | null,
  expectedCoverFileId?: string | null,
): Promise<boolean> {
  const pool = getMysqlPool();
  try {
    const [result] = await pool.query<ResultSetHeader>(
      "UPDATE data_file SET cover_file_id = ? WHERE file_id = ? AND (cover_file_id <=> ?)",
      [coverFileId, mainFileId, expectedCoverFileId ?? null],
    );
    const updated = (result as ResultSetHeader).affectedRows > 0;
    if (!updated) {
      console.warn("[v2-file-repo] updateMainFileCover optimistic lock miss", {
        mainFileId,
        coverFileId,
        expectedCoverFileId: expectedCoverFileId ?? null,
      });
    }
    return updated;
  } catch (e) {
    console.error("[v2-file-repo] updateMainFileCover failed", { mainFileId, coverFileId, error: e });
    return false;
  }
}

/**
 * 校验 parentFileId 指向的父行是主文件（无 parentFileId 且无 relationType）。
 * 若不是则抛异常。
 */
export async function validateParentIsMainFile(parentFileId: string): Promise<void> {
  const parent = await getFileById(parentFileId);
  if (!parent) throw new Error("PARENT_NOT_FOUND");
  if (parent.parentFileId || parent.relationType) {
    throw new Error("LOGO_CAN_ONLY_ATTACH_TO_MAIN_FILE");
  }
}

/**
 * 事务性软删主文件及其子行，返回需要清理 S3 的文件列表。
 * 先软删所有行后提交事务，外部再异步清理 S3 对象。
 * 这避免了「子行 S3 已删、主行记录仍在」的不一致窗口。
 */
export type SoftDeleteResult = {
  /** 本次软删的主文件 fileId */
  mainFileId: string;
  /** 需要清理 S3 的子文件列表（引用归零或 content_sha256 为空） */
  childrenToCleanS3: Array<{ fileId: string; fileUrl: string; contentSha256: string | null }>;
  /** 主文件是否需要清理 S3 */
  mainFileSha: string | null;
  mainFileUrl: string;
  /** 子行数量（仅用于计数） */
  childrenCount: number;
};

export async function softDeleteFileWithChildrenInTx(
  fileId: string,
): Promise<SoftDeleteResult> {
  const pool = getMysqlPool();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1. 软删子行：直接用条件 UPDATE，无需先 SELECT。
    //    即使并发插入新封面行，新行的 status 也是 'y'（活跃），
    //    不会被本次 UPDATE 影响。下次删除时会处理。
    //    UPDATE 影响的行数通过 ROW_COUNT() 取不到，改用子查询收集。
    const [childRows] = await conn.query<RowDataPacket[]>(
      `SELECT df.file_id, df.file_url, df.content_sha256
       FROM data_file df
       WHERE df.parent_file_id = ? AND (LOWER(IFNULL(df.status,'')) IN ('y','t'))
       FOR UPDATE`,
      [fileId],
    );

    // 软删子行
    if ((childRows as RowDataPacket[]).length > 0) {
      await conn.query(
        `UPDATE data_file SET status = 'n'
         WHERE parent_file_id = ? AND (LOWER(IFNULL(status,'')) IN ('y','t'))`,
        [fileId],
      );
    }

    // 2. 软删主行前先取出主行信息（事务内 FOR UPDATE 锁行）
    const [mainRows] = await conn.query<RowDataPacket[]>(
      `SELECT file_id, file_url, content_sha256 FROM data_file
       WHERE file_id = ? AND (LOWER(IFNULL(status,'')) IN ('y','t'))
       FOR UPDATE`,
      [fileId],
    );
    if (mainRows.length === 0) {
      await conn.rollback();
      throw new Error("NOT_FOUND");
    }
    const mainRow = mainRows[0] as RowDataPacket;

    // 3. 软删主行
    await conn.query(
      "UPDATE data_file SET status = 'n' WHERE file_id = ?",
      [fileId],
    );

    await conn.commit();

    // 4. 构建 S3 清理列表
    const childrenToCleanS3 = (childRows as RowDataPacket[]).map((r: RowDataPacket) => ({
      fileId: String(r.file_id),
      fileUrl: String(r.file_url ?? ""),
      contentSha256: r.content_sha256 != null && String(r.content_sha256).trim() !== ""
        ? String(r.content_sha256).trim()
        : null,
    }));

    return {
      mainFileId: fileId,
      childrenToCleanS3,
      mainFileSha: mainRow.content_sha256 != null && String(mainRow.content_sha256).trim() !== ""
        ? String(mainRow.content_sha256).trim()
        : null,
      mainFileUrl: String(mainRow.file_url ?? ""),
      childrenCount: (childRows as RowDataPacket[]).length,
    };
  } catch (e) {
    await conn.rollback().catch(() => {});
    throw e;
  } finally {
    conn.release();
  }
}
