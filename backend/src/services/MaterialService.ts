import type { PoolConnection, RowDataPacket, ResultSetHeader } from "mysql2/promise";
import { randomBytes } from "node:crypto";
import { getMysqlPool } from "../infrastructure/mysql/mysql-client.ts";
import { resolveVarchar32PrimaryKey } from "../infrastructure/ids/identifiable-varchar32.ts";
import { sanitizeAndNormalizeRichText } from "../utils/text.ts";
import type {
  MaterialMsgRecord,
  MaterialPicRecord,
  MaterialSecurityRecord,
  MaterialListQuery,
  MaterialListPage,
  SaveMaterialInput,
} from "../domain/v2-material/v2-material-types.ts";

export type MaterialServiceErrorCode = "MATERIAL_NAME_EMPTY" | "CONTENT_TOO_LONG" | "NOT_FOUND" | "INTERNAL_ERROR";

export class MaterialServiceError extends Error {
  code: MaterialServiceErrorCode;
  constructor(code: MaterialServiceErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

export function makeVarchar32Uuid(): string {
  return randomBytes(16).toString("hex");
}

function normalizeText(input: unknown, maxLen: number, code: MaterialServiceErrorCode, message: string): string | null {
  const text = sanitizeAndNormalizeRichText(input, maxLen);
  if (text === null) return null;
  if (text.length > maxLen) throw new MaterialServiceError(code, message);
  return text;
}

function rowToMaterial(row: RowDataPacket): MaterialMsgRecord {
  return {
    materialId: String(row.material_id),
    materialName: String(row.material_name ?? ""),
    materialPropId: row.material_prop_id ? String(row.material_prop_id) : null,
    materialTypeId: row.material_type_id ? String(row.material_type_id) : null,
    materialTypeName: row.material_type_name != null ? String(row.material_type_name) : null,
    materialUnitId: null,
    materialUnitName: null,
    materialNum: row.material_num ?? null,
    mainPicUrl: row.main_pic_url ? String(row.main_pic_url) : null,
    expPurpose: row.exp_purpose ? String(row.exp_purpose) : null,
    additionalComments: row.additional_comments ? String(row.additional_comments) : null,
    comments: row.comments ? String(row.comments) : null,
    status: row.status ? String(row.status) : null,
    // material_msg 基线无 owner_user_id：以 create_user_id 视为归属人
    ownerUserId: row.create_user_id ? String(row.create_user_id) : null,
    createUserId: row.create_user_id ? String(row.create_user_id) : null,
    createTime: row.create_time ? String(row.create_time) : null,
    updateUserId: row.update_user_id ? String(row.update_user_id) : null,
    updateTime: row.update_time ? String(row.update_time) : null,
    isDeleted: Number(row.is_deleted ?? 0) as 0 | 1,
  };
}

async function getMaterialDetail(connOrPool: ReturnType<typeof getMysqlPool> | PoolConnection, materialId: string): Promise<MaterialMsgRecord | null> {
  const runner = "query" in connOrPool ? connOrPool : getMysqlPool();
  const [rows] = await runner.query<RowDataPacket[]>(
    `SELECT
       m.*,
       t.type_name AS material_type_name,
       su.user_name AS owner_user_name
     FROM material_msg m
     LEFT JOIN data_material_type t ON t.type_id = m.material_type_id
     LEFT JOIN sys_user su ON su.user_id = m.create_user_id
     WHERE m.material_id = ? AND m.is_deleted = 0
     LIMIT 1`,
    [materialId],
  );
  if (rows.length === 0) return null;
  const base = rowToMaterial(rows[0]!);
  const [pics] = await runner.query<RowDataPacket[]>(
    `SELECT * FROM material_pic WHERE material_id = ? ORDER BY sort_order ASC, seq_id ASC`,
    [materialId],
  );
  const [secs] = await runner.query<RowDataPacket[]>(
    `SELECT * FROM material_security WHERE material_id = ? ORDER BY sort_order ASC, seq_id ASC`,
    [materialId],
  );
  return {
    ...base,
    pics: (pics as RowDataPacket[]).map((r) => ({
      seqId: String(r.seq_id),
      materialId: String(r.material_id),
      materialUrl: r.material_url ? String(r.material_url) : null,
      sortOrder: r.sort_order != null ? Number(r.sort_order) : null,
      createTime: r.create_time ? String(r.create_time) : null,
    } as MaterialPicRecord)),
    securities: (secs as RowDataPacket[]).map((r) => ({
      seqId: String(r.seq_id),
      materialId: String(r.material_id),
      securityId: String(r.security_id),
      sortOrder: r.sort_order != null ? Number(r.sort_order) : null,
      createTime: r.create_time ? String(r.create_time) : null,
    } as MaterialSecurityRecord)),
  };
}

export async function getMaterialList(query: MaterialListQuery): Promise<MaterialListPage> {
  const pool = getMysqlPool();
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));
  const offset = (page - 1) * pageSize;
  const where = ["m.is_deleted = 0"];
  const params: unknown[] = [];

  if (query.keyword?.trim()) {
    where.push("m.material_name LIKE ?");
    params.push(`%${query.keyword.trim()}%`);
  }
  if (query.materialTypeId?.trim()) {
    where.push("m.material_type_id = ?");
    params.push(query.materialTypeId.trim());
  }
  if (query.materialPropId?.trim()) {
    where.push("m.material_prop_id = ?");
    params.push(query.materialPropId.trim());
  }
  if (query.status?.trim()) {
    where.push("m.status = ?");
    params.push(query.status.trim());
  }

  const whereSql = where.join(" AND ");
  const [countRows] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM material_msg m WHERE ${whereSql}`,
    params,
  );
  const total = Number(countRows[0]?.total ?? 0);

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT
       m.*,
       t.type_name AS material_type_name,
       su.user_name AS owner_user_name
     FROM material_msg m
     LEFT JOIN data_material_type t ON t.type_id = m.material_type_id
     LEFT JOIN sys_user su ON su.user_id = m.create_user_id
     WHERE ${whereSql}
     ORDER BY m.create_time DESC, m.material_id DESC
     LIMIT ? OFFSET ?`,
    [...params, pageSize, offset],
  );

  return { items: rows.map(rowToMaterial), total, page, pageSize };
}

export async function saveMaterial(input: SaveMaterialInput, actorId?: string): Promise<MaterialMsgRecord> {
  const pool = getMysqlPool();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const materialName = normalizeText(input.materialName, 120, "MATERIAL_NAME_EMPTY", "物料名称不能为空");
    if (!materialName) throw new MaterialServiceError("MATERIAL_NAME_EMPTY", "物料名称不能为空");
    const materialId = await resolveVarchar32PrimaryKey(conn, {
      table: "material_msg",
      column: "material_id",
      label: materialName,
      explicit: input.materialId,
    });
    const ownerUserId = input.ownerUserId ?? actorId ?? null;

    const existing = await conn.query<RowDataPacket[]>(
      `SELECT material_id, create_user_id FROM material_msg WHERE material_id = ? AND is_deleted = 0 LIMIT 1`,
      [materialId],
    );
    const isUpdate = existing[0].length > 0;
    const existingOwnerUserId = isUpdate ? (existing[0][0]?.create_user_id ? String(existing[0][0].create_user_id) : null) : null;
    if (isUpdate && existingOwnerUserId && ownerUserId && existingOwnerUserId !== ownerUserId) {
      throw new MaterialServiceError("NOT_FOUND", "无权限修改其他用户的私有材料");
    }

    const materialNum = normalizeText(input.materialNum, 60, "CONTENT_TOO_LONG", "物料内容过长");

    if (isUpdate) {
      await conn.query<ResultSetHeader>(
        `UPDATE material_msg SET
           material_name = ?,
           material_prop_id = ?,
           material_type_id = ?,
           material_num = ?,
           main_pic_url = ?,
           exp_purpose = ?,
           additional_comments = ?,
           comments = ?,
           create_user_id = COALESCE(create_user_id, ?),
           update_user_id = ?,
           update_time = CURRENT_TIMESTAMP
         WHERE material_id = ? AND is_deleted = 0`,
        [
          materialName,
          input.materialPropId ?? null,
          input.materialTypeId ?? null,
          materialNum,
          input.mainPicUrl ?? null,
          input.expPurpose ?? null,
          input.additionalComments ?? null,
          input.comments ?? null,
          ownerUserId,
          ownerUserId,
          materialId,
        ],
      );
    } else {
      await conn.query<ResultSetHeader>(
        `INSERT INTO material_msg (
           material_id, material_name, material_prop_id, material_type_id, material_num,
           main_pic_url, exp_purpose, additional_comments, comments,
           create_user_id, create_time, update_user_id, update_time, is_deleted, status
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, CURRENT_TIMESTAMP, 0, 'y')`,
        [
          materialId,
          materialName,
          input.materialPropId ?? null,
          input.materialTypeId ?? null,
          materialNum,
          input.mainPicUrl ?? null,
          input.expPurpose ?? null,
          input.additionalComments ?? null,
          input.comments ?? null,
          ownerUserId,
          ownerUserId,
        ],
      );
    }

    await conn.commit();
    const detail = await getMaterialDetail(conn, materialId);
    if (!detail) throw new MaterialServiceError("NOT_FOUND", "未找到该物料");
    return detail;
  } catch (err) {
    await conn.rollback();
    if (err instanceof MaterialServiceError) throw err;
    throw new MaterialServiceError("INTERNAL_ERROR", err instanceof Error ? err.message : String(err));
  } finally {
    conn.release();
  }
}

export { getMaterialDetail };
